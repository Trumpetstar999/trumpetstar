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
  SkipForward,
  X,
  Minimize2
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
  onClose?: () => void;
}

export function PdfViewer({ pdf, currentPage, onPageChange, audioTrack, onClose }: PdfViewerProps) {
  const [isLoading, setIsLoading] = useState(true);
  const [signedUrl, setSignedUrl] = useState<string | null>(null);
  const [zoom, setZoom] = useState(1);
  const [pdfDoc, setPdfDoc] = useState<any>(null);
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

  // Load PDF document once
  useEffect(() => {
    if (!signedUrl) return;

    const loadPdf = async () => {
      try {
        const pdfjsLib = await import('pdfjs-dist');
        pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/4.0.379/pdf.worker.min.js`;

        const loadingTask = pdfjsLib.getDocument(signedUrl);
        const doc = await loadingTask.promise;
        setPdfDoc(doc);
      } catch (error) {
        console.error('Error loading PDF:', error);
        toast.error('PDF konnte nicht geladen werden');
        setIsLoading(false);
      }
    };

    loadPdf();
  }, [signedUrl]);

  // Render current page
  useEffect(() => {
    if (!pdfDoc) return;

    const renderPage = async () => {
      setIsLoading(true);
      
      try {
        const page = await pdfDoc.getPage(currentPage);

        const canvas = canvasRef.current;
        if (!canvas) return;

        const context = canvas.getContext('2d');
        if (!context) return;

        // Calculate scale based on container
        const containerWidth = containerRef.current?.clientWidth || 800;
        const containerHeight = containerRef.current?.clientHeight || 600;
        const viewport = page.getViewport({ scale: 1 });
        
        // Fit to container while maintaining aspect ratio
        const scaleX = (containerWidth - 48) / viewport.width;
        const scaleY = (containerHeight - 48) / viewport.height;
        const baseScale = Math.min(scaleX, scaleY);
        const scale = baseScale * zoom;
        
        const scaledViewport = page.getViewport({ scale });

        canvas.height = scaledViewport.height;
        canvas.width = scaledViewport.width;

        await page.render({
          canvasContext: context,
          viewport: scaledViewport,
        }).promise;

        setIsLoading(false);
      } catch (error) {
        console.error('Error rendering PDF page:', error);
        toast.error('Seite konnte nicht gerendert werden');
        setIsLoading(false);
      }
    };

    renderPage();
  }, [pdfDoc, currentPage, zoom]);

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

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowLeft') {
        goToPreviousPage();
      } else if (e.key === 'ArrowRight') {
        goToNextPage();
      } else if (e.key === 'Escape' && onClose) {
        onClose();
      } else if (e.key === ' ' && audioSignedUrl) {
        e.preventDefault();
        togglePlayPause();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [currentPage, pdf.page_count, audioSignedUrl, togglePlayPause]);

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-gradient-to-b from-slate-900 via-slate-800 to-slate-900">
      {/* Header Toolbar */}
      <div className="flex items-center justify-between px-4 py-3 bg-slate-900/80 backdrop-blur-lg border-b border-white/10">
        {/* Left: Close & Title */}
        <div className="flex items-center gap-3">
          {onClose && (
            <Button
              variant="ghost"
              size="icon"
              onClick={onClose}
              className="text-white/70 hover:text-white hover:bg-white/10"
            >
              <X className="w-5 h-5" />
            </Button>
          )}
          <div>
            <h3 className="font-semibold text-white text-sm md:text-base truncate max-w-[180px] md:max-w-[300px]">
              {pdf.title}
            </h3>
            <p className="text-xs text-white/50">
              Seite {currentPage} von {pdf.page_count}
            </p>
          </div>
        </div>

        {/* Center: Page Navigation */}
        <div className="flex items-center gap-1 md:gap-2">
          <Button
            variant="ghost"
            size="icon"
            onClick={goToPreviousPage}
            disabled={currentPage <= 1}
            className="text-white/70 hover:text-white hover:bg-white/10 disabled:opacity-30"
          >
            <ChevronLeft className="w-5 h-5" />
          </Button>
          
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/10">
            <span className="text-sm font-medium text-white min-w-[60px] text-center">
              {currentPage} / {pdf.page_count}
            </span>
          </div>
          
          <Button
            variant="ghost"
            size="icon"
            onClick={goToNextPage}
            disabled={currentPage >= pdf.page_count}
            className="text-white/70 hover:text-white hover:bg-white/10 disabled:opacity-30"
          >
            <ChevronRight className="w-5 h-5" />
          </Button>
        </div>

        {/* Right: Zoom Controls */}
        <div className="flex items-center gap-1">
          <Button 
            variant="ghost" 
            size="icon" 
            onClick={handleZoomOut}
            className="text-white/70 hover:text-white hover:bg-white/10"
          >
            <ZoomOut className="w-4 h-4" />
          </Button>
          <span className="text-xs font-medium text-white/70 w-10 text-center">
            {Math.round(zoom * 100)}%
          </span>
          <Button 
            variant="ghost" 
            size="icon" 
            onClick={handleZoomIn}
            className="text-white/70 hover:text-white hover:bg-white/10"
          >
            <ZoomIn className="w-4 h-4" />
          </Button>
          <Button 
            variant="ghost" 
            size="icon" 
            onClick={handleResetZoom}
            className="text-white/70 hover:text-white hover:bg-white/10"
          >
            <RotateCcw className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {/* PDF Canvas Area */}
      <div 
        ref={containerRef}
        className="flex-1 overflow-auto flex items-center justify-center p-4 md:p-6"
      >
        {isLoading && (
          <div className="absolute inset-0 flex items-center justify-center bg-slate-900/50 z-10">
            <div className="flex flex-col items-center gap-3">
              <Loader2 className="w-10 h-10 animate-spin text-primary" />
              <span className="text-sm text-white/70">Seite wird geladen...</span>
            </div>
          </div>
        )}
        <canvas
          ref={canvasRef}
          className={cn(
            "shadow-2xl rounded-lg transition-opacity duration-300",
            "bg-white max-w-full",
            isLoading && "opacity-0"
          )}
          style={{
            boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5), 0 0 0 1px rgba(255, 255, 255, 0.1)'
          }}
        />
      </div>

      {/* Audio Player Bar */}
      {audioSignedUrl && audioTrack ? (
        <div className="bg-slate-900/90 backdrop-blur-lg border-t border-white/10 px-4 py-3 safe-bottom">
          <audio
            ref={audioRef}
            src={audioSignedUrl}
            onTimeUpdate={handleTimeUpdate}
            onLoadedMetadata={handleLoadedMetadata}
            onEnded={() => setIsPlaying(false)}
          />
          
          <div className="flex items-center gap-3 md:gap-4 max-w-4xl mx-auto">
            {/* Audio icon */}
            <div className="w-10 h-10 rounded-lg bg-primary/20 flex items-center justify-center flex-shrink-0">
              <Volume2 className="w-5 h-5 text-primary" />
            </div>

            {/* Track info - hidden on small screens */}
            <div className="hidden md:block flex-shrink-0 min-w-0 w-32">
              <p className="text-sm font-medium text-white truncate">{audioTrack.title}</p>
              <p className="text-xs text-white/50">Seite {audioTrack.page_number}</p>
            </div>

            {/* Controls */}
            <div className="flex items-center gap-1">
              <Button 
                variant="ghost" 
                size="icon" 
                onClick={() => skipSeconds(-10)}
                className="text-white/70 hover:text-white hover:bg-white/10"
              >
                <SkipBack className="w-4 h-4" />
              </Button>
              
              <Button 
                size="icon" 
                onClick={togglePlayPause}
                className="w-11 h-11 rounded-full bg-primary hover:bg-primary/90"
              >
                {isPlaying ? (
                  <Pause className="w-5 h-5" />
                ) : (
                  <Play className="w-5 h-5 ml-0.5" />
                )}
              </Button>
              
              <Button 
                variant="ghost" 
                size="icon" 
                onClick={() => skipSeconds(10)}
                className="text-white/70 hover:text-white hover:bg-white/10"
              >
                <SkipForward className="w-4 h-4" />
              </Button>
            </div>

            {/* Progress */}
            <div className="flex-1 flex items-center gap-2 md:gap-3">
              <span className="text-xs text-white/50 w-9 text-right tabular-nums">
                {formatTime(audioProgress)}
              </span>
              <Slider
                value={[audioProgress]}
                max={audioDuration || 100}
                step={0.1}
                onValueChange={handleSeek}
                className="flex-1"
              />
              <span className="text-xs text-white/50 w-9 tabular-nums">
                {formatTime(audioDuration)}
              </span>
            </div>

            {/* Playback rate */}
            <Button 
              variant="outline" 
              size="sm"
              onClick={cyclePlaybackRate}
              className="w-14 text-xs border-white/20 text-white/70 hover:text-white hover:bg-white/10"
            >
              {playbackRate}x
            </Button>
          </div>
        </div>
      ) : (
        <div className="bg-slate-900/80 backdrop-blur-lg border-t border-white/10 px-4 py-3 text-center safe-bottom">
          <p className="text-sm text-white/40">
            Kein Audio für Seite {currentPage} verfügbar
          </p>
        </div>
      )}
    </div>
  );
}
