import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, range',
  'Access-Control-Allow-Methods': 'GET, HEAD, OPTIONS',
  'Access-Control-Expose-Headers': 'Content-Length, Content-Range, Accept-Ranges',
};

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const url = new URL(req.url);
    const docId = url.searchParams.get('docId');
    const debug = url.searchParams.get('debug') === '1';

    if (!docId) {
      return new Response(
        JSON.stringify({ error: 'Missing docId parameter' }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    console.log('PDF Proxy: Fetching document:', docId);

    // Create Supabase client with service role for server-side access
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Get PDF document metadata
    const { data: pdfDoc, error: docError } = await supabase
      .from('pdf_documents')
      .select('id, title, pdf_file_url')
      .eq('id', docId)
      .single();

    if (docError || !pdfDoc) {
      console.error('PDF Proxy: Document not found:', docError);
      return new Response(
        JSON.stringify({ error: 'Document not found', details: docError?.message }),
        { 
          status: 404, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    console.log('PDF Proxy: Found document:', pdfDoc.title);

    // Extract file path from URL
    let filePath = '';
    const decodedUrl = decodeURIComponent(pdfDoc.pdf_file_url);
    
    if (decodedUrl.includes('/pdf-documents/')) {
      const urlParts = decodedUrl.split('/pdf-documents/');
      filePath = urlParts[urlParts.length - 1];
      // Remove any query params
      if (filePath.includes('?')) {
        filePath = filePath.split('?')[0];
      }
    }

    if (!filePath) {
      console.error('PDF Proxy: Could not extract file path from:', pdfDoc.pdf_file_url);
      return new Response(
        JSON.stringify({ error: 'Invalid file path in document' }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    console.log('PDF Proxy: File path:', filePath);

    // Download the PDF from storage using service key
    const { data: fileData, error: downloadError } = await supabase.storage
      .from('pdf-documents')
      .download(filePath);

    if (downloadError || !fileData) {
      console.error('PDF Proxy: Download failed:', downloadError);
      return new Response(
        JSON.stringify({ 
          error: 'Failed to download PDF', 
          details: downloadError?.message,
          filePath: filePath
        }),
        { 
          status: 500, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    console.log('PDF Proxy: Downloaded file, size:', fileData.size);

    // Verify it's a valid PDF
    const headerBytes = new Uint8Array(await fileData.slice(0, 5).arrayBuffer());
    const headerStr = new TextDecoder().decode(headerBytes);
    
    if (!headerStr.startsWith('%PDF-')) {
      console.error('PDF Proxy: Invalid PDF header:', headerStr);
      return new Response(
        JSON.stringify({ error: 'Downloaded file is not a valid PDF', header: headerStr }),
        { 
          status: 500, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    // If debug mode, return diagnostic info instead of the file
    if (debug) {
      return new Response(
        JSON.stringify({
          success: true,
          docId: docId,
          title: pdfDoc.title,
          filePath: filePath,
          fileSize: fileData.size,
          pdfHeader: headerStr,
          contentType: 'application/pdf',
        }),
        { 
          status: 200, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    // Return the PDF with proper headers
    const arrayBuffer = await fileData.arrayBuffer();
    
    return new Response(arrayBuffer, {
      status: 200,
      headers: {
        ...corsHeaders,
        'Content-Type': 'application/pdf',
        'Content-Disposition': 'inline',
        'Content-Length': fileData.size.toString(),
        'Accept-Ranges': 'bytes',
        'Cache-Control': 'public, max-age=3600',
      },
    });

  } catch (error) {
    console.error('PDF Proxy: Unexpected error:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error', details: String(error) }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});
