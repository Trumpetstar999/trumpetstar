import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useMembership } from '@/hooks/useMembership';
import { PdfSidebar } from '@/components/pdfs/PdfSidebar';
import { PdfViewer } from '@/components/pdfs/PdfViewer';
import { Button } from '@/components/ui/button';
import { Loader2, FileText } from 'lucide-react';
import { PlanKey } from '@/types/plans';
import { toast } from 'sonner';

interface PdfDocument {
  id: string;
  title: string;
  description: string | null;
  pdf_file_url: string;
  page_count: number;
  plan_required: string;
  level_id: string | null;
  is_active: boolean;
  sort_index: number;
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
  const [selectedPdfId, setSelectedPdfId] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);

  // Fetch PDF documents
  const { data: pdfs = [], isLoading: pdfsLoading } = useQuery({
    queryKey: ['user-pdfs'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('pdf_documents')
        .select('*')
        .eq('is_active', true)
        .order('sort_index', { ascending: true });

      if (error) throw error;
      return data as PdfDocument[];
    },
    enabled: !!user,
  });

  // Fetch audio tracks for selected PDF
  const { data: audioTracks = [] } = useQuery({
    queryKey: ['pdf-audio-tracks', selectedPdfId],
    queryFn: async () => {
      if (!selectedPdfId) return [];
      
      const { data, error } = await supabase
        .from('pdf_audio_tracks')
        .select('*')
        .eq('pdf_document_id', selectedPdfId)
        .order('page_number', { ascending: true });

      if (error) throw error;
      return data as AudioTrack[];
    },
    enabled: !!selectedPdfId,
  });

  const selectedPdf = pdfs.find(p => p.id === selectedPdfId);
  const canAccessSelectedPdf = selectedPdf 
    ? canAccessLevel(selectedPdf.plan_required as PlanKey)
    : true;

  // Get audio track for current page
  const currentAudioTrack = audioTracks.find(t => t.page_number === currentPage);

  const isLoading = pdfsLoading || membershipLoading;

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
          <p className="text-lg">Keine PDFs verfügbar</p>
          <p className="text-sm">Es wurden noch keine Notenhefte hochgeladen.</p>
        </div>
      </div>
    );
  }

  // Handle select with access check
  const handleSelectPdf = (id: string) => {
    const pdf = pdfs.find(p => p.id === id);
    if (pdf && canAccessLevel(pdf.plan_required as PlanKey)) {
      setSelectedPdfId(id);
      setCurrentPage(1);
    } else if (pdf) {
      toast.error(`Upgrade auf ${pdf.plan_required} erforderlich`);
    }
  };

  return (
    <>
      <div className="flex h-[calc(100vh-140px)]">
        {/* Sidebar */}
        <PdfSidebar
          pdfs={pdfs}
          selectedPdfId={selectedPdfId}
          onSelectPdf={handleSelectPdf}
          canAccessLevel={canAccessLevel}
        />

        {/* Main Content - shows selection prompt */}
        <div className="flex-1 relative overflow-hidden bg-muted/30">
          <div className="flex h-full items-center justify-center">
            <div className="text-center text-white/60">
              <FileText className="w-20 h-20 mx-auto mb-4 opacity-40" />
              <p className="text-lg font-medium">Wähle ein Notenheft</p>
              <p className="text-sm opacity-70 mt-1">aus der Liste links</p>
            </div>
          </div>
        </div>
      </div>

      {/* Fullscreen PDF Viewer */}
      {selectedPdf && canAccessSelectedPdf && (
        <PdfViewer
          pdf={selectedPdf}
          currentPage={currentPage}
          onPageChange={setCurrentPage}
          audioTrack={currentAudioTrack}
          onClose={() => setSelectedPdfId(null)}
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
            <Button onClick={() => setSelectedPdfId(null)}>
              Schließen
            </Button>
          </div>
        </div>
      )}
    </>
  );
}