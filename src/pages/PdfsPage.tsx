import { useState, useEffect, useCallback } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useMembership } from '@/hooks/useMembership';
import { usePdfCache } from '@/hooks/usePdfCache';
import { useLanguage, useLocalizedContent, Language } from '@/hooks/useLanguage';
import { PdfViewer } from '@/components/pdfs/PdfViewer';
import { PdfBookCard } from '@/components/pdfs/PdfBookCard';
import { LanguageTabs } from '@/components/common/LanguageTabs';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Loader2, FileText, Search, Music } from 'lucide-react';
import { PlanKey } from '@/types/plans';
import { toast } from 'sonner';
import { usePdfViewer } from '@/hooks/usePdfViewer';
import { ScrollArea } from '@/components/ui/scroll-area';

interface PdfDocument {
  id: string;
  title: string;
  title_en?: string | null;
  title_es?: string | null;
  description: string | null;
  description_en?: string | null;
  description_es?: string | null;
  pdf_file_url: string;
  page_count: number;
  plan_required: string;
  level_id: string | null;
  is_active: boolean;
  sort_index: number;
  language?: string | null;
}

interface AudioTrack {
  id: string;
  pdf_document_id: string;
  title: string;
  audio_url: string;
  page_number: number;
  duration: number | null;
}

export function PdfsPage() {
  const { user } = useAuth();
  const { canAccessLevel, isLoading: membershipLoading } = useMembership();
  const { setIsPdfViewerOpen } = usePdfViewer();
  const { getPdfUrl, downloadProgress, isCached } = usePdfCache();
  const { t } = useLanguage();
  const { getLocalizedField } = useLocalizedContent();
  
  const [selectedPdfId, setSelectedPdfId] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [pdfBlobUrl, setPdfBlobUrl] = useState<string | null>(null);
  const [cachedStatus, setCachedStatus] = useState<Map<string, boolean>>(new Map());
  const [searchQuery, setSearchQuery] = useState('');
  const [contentLanguage, setContentLanguage] = useState<Language>('de');
  // Fetch PDF documents
  const { data: pdfs = [], isLoading: pdfsLoading } = useQuery({
    queryKey: ['user-pdfs'],
    queryFn: async () => {
      // Using type assertion for pdf_documents table
      const query = supabase.from('pdf_documents');
      const { data, error } = await (query as any)
        .select('*')
        .eq('is_active', true)
        .order('sort_index', { ascending: true });

      if (error) throw error;
      return (data || []) as PdfDocument[];
    },
    enabled: !!user,
  });

  // Check cached status for all PDFs
  useEffect(() => {
    const checkCachedStatus = async () => {
      const status = new Map<string, boolean>();
      for (const pdf of pdfs) {
        const cached = await isCached(pdf.id);
        status.set(pdf.id, cached);
      }
      setCachedStatus(status);
    };
    
    if (pdfs.length > 0) {
      checkCachedStatus();
    }
  }, [pdfs, isCached]);

  // Fetch audio tracks for selected PDF
  const { data: audioTracks = [] } = useQuery({
    queryKey: ['pdf-audio-tracks', selectedPdfId],
    queryFn: async () => {
      if (!selectedPdfId) return [];
      
      // Using type assertion for pdf_audio_tracks table
      const query = supabase.from('pdf_audio_tracks');
      const { data, error } = await (query as any)
        .select('*')
        .eq('pdf_document_id', selectedPdfId)
        .order('page_number', { ascending: true });

      if (error) throw error;
      return (data || []) as AudioTrack[];
    },
    enabled: !!selectedPdfId,
  });

  const selectedPdf = pdfs.find(p => p.id === selectedPdfId);
  const canAccessSelectedPdf = selectedPdf 
    ? canAccessLevel(selectedPdf.plan_required as PlanKey)
    : true;

  // Update global state when PDF viewer opens/closes
  useEffect(() => {
    const isOpen = !!pdfBlobUrl && canAccessSelectedPdf;
    setIsPdfViewerOpen(isOpen);
    return () => setIsPdfViewerOpen(false);
  }, [pdfBlobUrl, canAccessSelectedPdf, setIsPdfViewerOpen]);

  const isLoading = pdfsLoading || membershipLoading;

  // Handle select with access check and download
  const handleSelectPdf = useCallback(async (id: string) => {
    const pdf = pdfs.find(p => p.id === id);
    if (!pdf) return;
    
    if (!canAccessLevel(pdf.plan_required as PlanKey)) {
      toast.error(`Upgrade auf ${pdf.plan_required} erforderlich`);
      return;
    }

    setSelectedPdfId(id);
    
    // Get PDF URL (from cache or download)
    const url = await getPdfUrl(id, pdf.pdf_file_url);
    
    if (url) {
      setPdfBlobUrl(url);
      setCurrentPage(1);
      // Update cached status
      setCachedStatus(prev => new Map(prev).set(id, true));
    } else {
      toast.error('PDF konnte nicht geladen werden');
      setSelectedPdfId(null);
    }
  }, [pdfs, canAccessLevel, getPdfUrl]);

  const handleClosePdf = useCallback(() => {
    setSelectedPdfId(null);
    if (pdfBlobUrl) {
      URL.revokeObjectURL(pdfBlobUrl);
      setPdfBlobUrl(null);
    }
  }, [pdfBlobUrl]);

  // Filter PDFs by search and content language
  const filteredPdfs = pdfs.filter(pdf => {
    const localizedTitle = getLocalizedField(pdf, 'title');
    const localizedDesc = getLocalizedField(pdf, 'description');
    
    const matchesSearch = localizedTitle.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (localizedDesc?.toLowerCase().includes(searchQuery.toLowerCase()) ?? false);
    
    // Content language filter - show all if DE, or filter by language field if available
    const matchesLanguage = contentLanguage === 'de' || 
      !pdf.language || 
      pdf.language === contentLanguage ||
      pdf.language === 'all';
    
    return matchesSearch && matchesLanguage;
  });


  if (isLoading) {
    return (
      <div className="flex h-[calc(100vh-140px)] items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (pdfs.length === 0) {
    return (
      <div className="flex h-[calc(100vh-140px)] items-center justify-center">
        <div className="text-center text-muted-foreground">
          <FileText className="w-16 h-16 mx-auto mb-4 opacity-50" />
          <p className="text-lg">{t('pdfs.noPdfs')}</p>
          <p className="text-sm">{t('pdfs.noPdfsDesc')}</p>
        </div>
      </div>
    );
  }


  return (
    <>
      <div className="h-[calc(100vh-140px)] flex flex-col">
        {/* Header */}
        <div className="shrink-0 px-6 py-4 border-b bg-card/50">
          <div className="flex items-center justify-between gap-4 max-w-6xl mx-auto flex-wrap">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                <Music className="w-5 h-5 text-primary" />
              </div>
              <div>
                <h1 className="text-xl font-bold">{t('pdfs.title')}</h1>
                <p className="text-sm text-muted-foreground">{t('pdfs.available', { count: pdfs.length })}</p>
              </div>
            </div>
            
            <div className="flex items-center gap-3">
              {/* Language Tabs */}
              <LanguageTabs
                selectedLanguage={contentLanguage}
                onLanguageChange={setContentLanguage}
                variant="compact"
                className="bg-muted/50 border border-border"
              />
              
              {/* Search */}
              <div className="relative w-64">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  placeholder={t('pdfs.searchPlaceholder')}
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9 h-9"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Book Grid */}
        <ScrollArea className="flex-1">
          <div className="p-6 max-w-6xl mx-auto">
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-6 md:gap-8 justify-items-center">
              {filteredPdfs.map((pdf) => {
                const hasAccess = canAccessLevel(pdf.plan_required as PlanKey);
                const isDownloading = downloadProgress?.pdfId === pdf.id && downloadProgress.isDownloading;
                const progress = downloadProgress?.pdfId === pdf.id ? downloadProgress.progress : 0;
                const cached = cachedStatus.get(pdf.id) || false;
                const localizedTitle = getLocalizedField(pdf, 'title');
                const localizedDesc = getLocalizedField(pdf, 'description');

                return (
                  <PdfBookCard
                    key={pdf.id}
                    id={pdf.id}
                    title={localizedTitle}
                    description={localizedDesc}
                    pageCount={pdf.page_count}
                    planRequired={pdf.plan_required as PlanKey}
                    hasAccess={hasAccess}
                    isDownloading={isDownloading}
                    downloadProgress={progress}
                    isCached={cached}
                    onClick={() => handleSelectPdf(pdf.id)}
                  />
                );
              })}
            </div>

            {filteredPdfs.length === 0 && (
              <div className="text-center py-16 text-muted-foreground">
                <FileText className="w-12 h-12 mx-auto mb-3 opacity-50" />
                <p>{t('pdfs.noPdfsFound')}</p>
              </div>
            )}
          </div>
        </ScrollArea>
      </div>

      {/* Fullscreen PDF Viewer */}
      {selectedPdf && pdfBlobUrl && canAccessSelectedPdf && (
        <PdfViewer
          pdf={selectedPdf}
          pdfBlobUrl={pdfBlobUrl}
          currentPage={currentPage}
          onPageChange={setCurrentPage}
          audioTracks={audioTracks}
          onClose={handleClosePdf}
        />
      )}

      {/* Lock Dialog for inaccessible PDFs */}
      {selectedPdf && !canAccessSelectedPdf && (
        <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4">
          <div className="bg-card rounded-xl p-6 max-w-sm text-center">
            <FileText className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
            <h3 className="font-semibold text-lg mb-2">{selectedPdf.title}</h3>
            <p className="text-muted-foreground text-sm mb-4">
              Dieses Notenheft erfordert den {selectedPdf.plan_required}-Plan.
            </p>
            <Button onClick={handleClosePdf}>
              Schließen
            </Button>
          </div>
        </div>
      )}
    </>
  );
}
