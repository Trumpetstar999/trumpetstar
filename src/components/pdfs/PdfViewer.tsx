import { useState, useEffect, useRef, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { 
  ChevronLeft, 
  ChevronRight, 
  ZoomIn, 
  ZoomOut, 
  RotateCcw,
  Loader2,
  Play,
  Pause,
  Volume2,
  SkipBack,
  SkipForward
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

interface PdfDocument {
  id: string;
  title: string;
  pdf_file_url: string;
  page_count: number;
}

interface AudioTrack {
  id: string;
  title: string;
  audio_url: string;
  page_number: number;
  duration: number | null;
}

interface PdfViewerProps {
  pdf: PdfDocument;
  currentPage: number;
  onPageChange: (page: number) => void;
  audioTrack?: AudioTrack;
}

export function PdfViewer({ pdf, currentPage, onPageChange, audioTrack }: PdfViewerProps) {
  const [isLoading, setIsLoading] = useState(true);
  const [signedUrl, setSignedUrl] = useState<string | null>(null);
  const [zoom, setZoom] = useState(1);
  const [canvasUrl, setCanvasUrl] = useState<string | null>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  
  // Audio state
  const audioRef = useRef<HTMLAudioElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [audioProgress, setAudioProgress] = useState(0);
  const [audioDuration, setAudioDuration] = useState(0);
  const [audioSignedUrl, setAudioSignedUrl] = useState<string | null>(null);
  const [playbackRate, setPlaybackRate] = useState(1);

  // Get signed URL for PDF
  useEffect(() => {
    const getSignedUrl = async () => {
      setIsLoading(true);
      
      // Extract file path from URL
      const urlParts = pdf.pdf_file_url.split('/pdf-documents/');
      const filePath = urlParts[urlParts.length - 1];
      
      if (!filePath) {
        toast.error('PDF-Pfad konnte nicht ermittelt werden');
        setIsLoading(false);
        return;
      }

      const { data, error } = await supabase.storage
        .from('pdf-documents')
        .createSignedUrl(filePath, 3600);

      if (error || !data?.signedUrl) {
        console.error('Failed to get signed URL:', error);
        toast.error('PDF konnte nicht geladen werden');
        setIsLoading(false);
        return;
      }

      setSignedUrl(data.signedUrl);
    };

    getSignedUrl();
  }, [pdf.pdf_file_url]);

  // Render PDF page using pdf.js
  useEffect(() => {
    if (!signedUrl) return;

    const renderPage = async () => {
      setIsLoading(true);
      
      try {
        const pdfjsLib = await import('pdfjs-dist');
        pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/4.0.379/pdf.worker.min.js`;

        const loadingTask = pdfjsLib.getDocument(signedUrl);
        const pdfDoc = await loadingTask.promise;
        const page = await pdfDoc.getPage(currentPage);

        const canvas = canvasRef.current;
        if (!canvas) return;

        const context = canvas.getContext('2d');
        if (!context) return;

        // Calculate scale based on container width
        const containerWidth = containerRef.current?.clientWidth || 800;
        const viewport = page.getViewport({ scale: 1 });
        const baseScale = (containerWidth - 48) / viewport.width;
        const scale = baseScale * zoom;
        
        const scaledViewport = page.getViewport({ scale });

        canvas.height = scaledViewport.height;
        canvas.width = scaledViewport.width;

        await page.render({
          canvasContext: context,
          viewport: scaledViewport,
        }).promise;

        setCanvasUrl(canvas.toDataURL());
        setIsLoading(false);
      } catch (error) {
        console.error('Error rendering PDF:', error);
        toast.error('Seite konnte nicht gerendert werden');
        setIsLoading(false);
      }
    };

    renderPage();
  }, [signedUrl, currentPage, zoom]);

  // Get signed URL for audio
  useEffect(() => {
    if (!audioTrack) {
      setAudioSignedUrl(null);
      setIsPlaying(false);
      return;
    }

    const getAudioUrl = async () => {
      const urlParts = audioTrack.audio_url.split('/pdf-audio/');
      const filePath = urlParts[urlParts.length - 1];

      if (!filePath) return;

      const { data, error } = await supabase.storage
        .from('pdf-audio')
        .createSignedUrl(filePath, 3600);

      if (data?.signedUrl) {
        setAudioSignedUrl(data.signedUrl);
      }
    };

    getAudioUrl();
  }, [audioTrack?.id]);

  // Audio controls
  const togglePlayPause = useCallback(() => {
    if (!audioRef.current) return;
    
    if (isPlaying) {
      audioRef.current.pause();
    } else {
      audioRef.current.play();
    }
    setIsPlaying(!isPlaying);
  }, [isPlaying]);

  const handleTimeUpdate = useCallback(() => {
    if (!audioRef.current) return;
    setAudioProgress(audioRef.current.currentTime);
  }, []);

  const handleLoadedMetadata = useCallback(() => {
    if (!audioRef.current) return;
    setAudioDuration(audioRef.current.duration);
  }, []);

  const handleSeek = useCallback((value: number[]) => {
    if (!audioRef.current) return;
    audioRef.current.currentTime = value[0];
    setAudioProgress(value[0]);
  }, []);

  const skipSeconds = useCallback((seconds: number) => {
    if (!audioRef.current) return;
    audioRef.current.currentTime = Math.max(0, Math.min(audioRef.current.currentTime + seconds, audioDuration));
  }, [audioDuration]);

  const cyclePlaybackRate = useCallback(() => {
    const rates = [0.75, 1, 1.25, 1.5];
    const currentIndex = rates.indexOf(playbackRate);
    const nextRate = rates[(currentIndex + 1) % rates.length];
    setPlaybackRate(nextRate);
    if (audioRef.current) {
      audioRef.current.playbackRate = nextRate;
    }
  }, [playbackRate]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  // Navigation
  const goToPreviousPage = () => {
    if (currentPage > 1) {
      onPageChange(currentPage - 1);
    }
  };

  const goToNextPage = () => {
    if (currentPage < pdf.page_count) {
      onPageChange(currentPage + 1);
    }
  };

  const handleZoomIn = () => setZoom(z => Math.min(z + 0.25, 3));
  const handleZoomOut = () => setZoom(z => Math.max(z - 0.25, 0.5));
  const handleResetZoom = () => setZoom(1);

  return (
    <div className="flex flex-col h-full">
      {/* Toolbar */}
      <div className="flex items-center justify-between p-3 border-b bg-card">
        <div className="flex items-center gap-2">
          <h3 className="font-semibold text-sm truncate max-w-[200px]">
            {pdf.title}
          </h3>
        </div>

        {/* Page Navigation */}
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="icon"
            onClick={goToPreviousPage}
            disabled={currentPage <= 1}
          >
            <ChevronLeft className="w-4 h-4" />
          </Button>
          
          <span className="text-sm font-medium min-w-[80px] text-center">
            {currentPage} / {pdf.page_count}
          </span>
          
          <Button
            variant="outline"
            size="icon"
            onClick={goToNextPage}
            disabled={currentPage >= pdf.page_count}
          >
            <ChevronRight className="w-4 h-4" />
          </Button>
        </div>

        {/* Zoom Controls */}
        <div className="flex items-center gap-1">
          <Button variant="ghost" size="icon" onClick={handleZoomOut}>
            <ZoomOut className="w-4 h-4" />
          </Button>
          <span className="text-xs font-medium w-12 text-center">
            {Math.round(zoom * 100)}%
          </span>
          <Button variant="ghost" size="icon" onClick={handleZoomIn}>
            <ZoomIn className="w-4 h-4" />
          </Button>
          <Button variant="ghost" size="icon" onClick={handleResetZoom}>
            <RotateCcw className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {/* PDF Canvas */}
      <div 
        ref={containerRef}
        className="flex-1 overflow-auto p-6 flex justify-center bg-muted/50"
      >
        {isLoading ? (
          <div className="flex items-center justify-center h-full">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
          </div>
        ) : (
          <canvas
            ref={canvasRef}
            className="shadow-xl rounded-lg bg-white max-w-full"
          />
        )}
      </div>

      {/* Audio Player */}
      {audioSignedUrl && audioTrack && (
        <div className="border-t bg-card p-4">
          <audio
            ref={audioRef}
            src={audioSignedUrl}
            onTimeUpdate={handleTimeUpdate}
            onLoadedMetadata={handleLoadedMetadata}
            onEnded={() => setIsPlaying(false)}
          />
          
          <div className="flex items-center gap-4">
            {/* Audio icon */}
            <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
              <Volume2 className="w-5 h-5 text-primary" />
            </div>

            {/* Track info */}
            <div className="flex-shrink-0 min-w-0 w-32">
              <p className="text-sm font-medium truncate">{audioTrack.title}</p>
              <p className="text-xs text-muted-foreground">Seite {audioTrack.page_number}</p>
            </div>

            {/* Controls */}
            <div className="flex items-center gap-2">
              <Button variant="ghost" size="icon" onClick={() => skipSeconds(-10)}>
                <SkipBack className="w-4 h-4" />
              </Button>
              
              <Button 
                size="icon" 
                onClick={togglePlayPause}
                className="w-10 h-10"
              >
                {isPlaying ? (
                  <Pause className="w-5 h-5" />
                ) : (
                  <Play className="w-5 h-5 ml-0.5" />
                )}
              </Button>
              
              <Button variant="ghost" size="icon" onClick={() => skipSeconds(10)}>
                <SkipForward className="w-4 h-4" />
              </Button>
            </div>

            {/* Progress */}
            <div className="flex-1 flex items-center gap-3">
              <span className="text-xs text-muted-foreground w-10 text-right">
                {formatTime(audioProgress)}
              </span>
              <Slider
                value={[audioProgress]}
                max={audioDuration || 100}
                step={1}
                onValueChange={handleSeek}
                className="flex-1"
              />
              <span className="text-xs text-muted-foreground w-10">
                {formatTime(audioDuration)}
              </span>
            </div>

            {/* Playback rate */}
            <Button 
              variant="outline" 
              size="sm"
              onClick={cyclePlaybackRate}
              className="w-14 text-xs"
            >
              {playbackRate}x
            </Button>
          </div>
        </div>
      )}

      {/* No audio indicator */}
      {!audioTrack && (
        <div className="border-t bg-card/50 p-3 text-center">
          <p className="text-sm text-muted-foreground">
            Kein Audio für diese Seite verfügbar
          </p>
        </div>
      )}
    </div>
  );
}