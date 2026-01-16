import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useMembership } from '@/hooks/useMembership';
import { PdfSidebar } from '@/components/pdfs/PdfSidebar';
import { PdfViewer } from '@/components/pdfs/PdfViewer';
import { PremiumLockOverlay } from '@/components/premium/PremiumLockOverlay';
import { Loader2, FileText } from 'lucide-react';
import { PlanKey } from '@/types/plans';

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

  return (
    <div className="flex h-[calc(100vh-140px)]">
      {/* Sidebar */}
      <PdfSidebar
        pdfs={pdfs}
        selectedPdfId={selectedPdfId}
        onSelectPdf={(id) => {
          setSelectedPdfId(id);
          setCurrentPage(1);
        }}
        canAccessLevel={canAccessLevel}
      />

      {/* Main Content */}
      <div className="flex-1 relative overflow-hidden bg-muted/30">
        {selectedPdf ? (
          <>
            {/* Lock Overlay if user can't access */}
            {!canAccessSelectedPdf && (
              <PremiumLockOverlay
                requiredPlanKey={selectedPdf.plan_required as PlanKey}
                title={selectedPdf.title}
              />
            )}

            {/* PDF Viewer */}
            {canAccessSelectedPdf && (
              <PdfViewer
                pdf={selectedPdf}
                currentPage={currentPage}
                onPageChange={setCurrentPage}
                audioTrack={currentAudioTrack}
              />
            )}
          </>
        ) : (
          <div className="flex h-full items-center justify-center text-muted-foreground">
            <div className="text-center">
              <FileText className="w-16 h-16 mx-auto mb-4 opacity-50" />
              <p className="text-lg">Wähle ein PDF aus der Liste</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}