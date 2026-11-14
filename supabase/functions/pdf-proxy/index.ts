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
    const debug = false;

    if (!docId) {
      return new Response(
        JSON.stringify({ error: 'Missing docId parameter' }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    // Require a signed-in caller and verify plan entitlement through RLS
    // (pdf_documents SELECT policy uses can_access_plan(plan_required)).
    const authHeader = req.headers.get('Authorization') ?? '';
    if (!authHeader.startsWith('Bearer ')) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }
    const userClient = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_ANON_KEY')!, {
      global: { headers: { Authorization: authHeader } },
      auth: { persistSession: false, autoRefreshToken: false },
    });
    const { data: claims } = await userClient.auth.getUser(authHeader.slice(7));
    if (!claims?.user) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }
    const { data: allowed } = await userClient.from('pdf_documents').select('id').eq('id', docId).maybeSingle();
    if (!allowed) {
      return new Response(JSON.stringify({ error: 'Forbidden' }), { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

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
        JSON.stringify({ error: 'Document not found' }),
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

    // Create a signed URL with proper download options
    // This URL will work directly from the client without CORS issues
    const { data: signedData, error: signError } = await supabase.storage
      .from('pdf-documents')
      .createSignedUrl(filePath, 3600, {
        download: false, // inline display, not forced download
      });

    if (signError || !signedData?.signedUrl) {
      console.error('PDF Proxy: Failed to create signed URL:', signError);
      return new Response(
        JSON.stringify({ 
          error: 'Failed to create signed URL', 
          details: signError?.message,
          filePath: filePath
        }),
        { 
          status: 500, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    console.log('PDF Proxy: Created signed URL');

    // If debug mode, also check file metadata without loading the whole file
    if (debug) {
      // Use HEAD request to get file metadata without downloading
      try {
        const headResponse = await fetch(signedData.signedUrl, { method: 'HEAD' });
        const contentLength = headResponse.headers.get('content-length');
        const contentType = headResponse.headers.get('content-type');
        
        return new Response(
          JSON.stringify({
            success: true,
            docId: docId,
            title: pdfDoc.title,
            filePath: filePath,
            signedUrl: signedData.signedUrl.substring(0, 100) + '...',
            fileSize: contentLength ? parseInt(contentLength, 10) : null,
            contentType: contentType || 'application/pdf',
            pdfHeader: '%PDF-', // Assumed valid since we're not downloading
            httpStatus: headResponse.status,
          }),
          { 
            status: 200, 
            headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
          }
        );
      } catch (headError) {
        return new Response(
          JSON.stringify({
            success: false,
            docId: docId,
            title: pdfDoc.title,
            error: 'HEAD request failed: ' + String(headError),
          }),
          { 
            status: 200, 
            headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
          }
        );
      }
    }

    // Return the signed URL for the client to use directly
    // This avoids loading the file into edge function memory
    return new Response(
      JSON.stringify({ 
        signedUrl: signedData.signedUrl,
        title: pdfDoc.title,
        expiresIn: 3600,
      }),
      { 
        status: 200, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );

  } catch (error) {
    console.error('PDF Proxy: Unexpected error:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});
