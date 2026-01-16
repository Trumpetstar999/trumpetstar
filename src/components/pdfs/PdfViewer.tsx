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
  Play,
  Pause,
  Volume2,
  SkipBack,
  SkipForward,
  X,
  ChevronDown,
  Music
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

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
  audioTracks: AudioTrack[];
  onClose: () => void;
}

export function PdfViewer({ pdf, currentPage, onPageChange, audioTracks, onClose }: PdfViewerProps) {
  const [isLoading, setIsLoading] = useState(true);
  const [pdfDoc, setPdfDoc] = useState<any>(null);
  const [zoom, setZoom] = useState(1);
  const [signedUrl, setSignedUrl] = useState<string | null>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  
  // Audio state
  const audioRef = useRef<HTMLAudioElement>(null);
  const [selectedTrack, setSelectedTrack] = useState<AudioTrack | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [audioProgress, setAudioProgress] = useState(0);
  const [audioDuration, setAudioDuration] = useState(0);
  const [audioSignedUrl, setAudioSignedUrl] = useState<string | null>(null);
  const [playbackRate, setPlaybackRate] = useState(100);

  // Get audio tracks for current page
  const currentPageTracks = audioTracks.filter(t => t.page_number === currentPage);
  const hasMultipleTracks = currentPageTracks.length > 1;

  // Auto-select first track when page changes
  useEffect(() => {
    if (currentPageTracks.length > 0) {
      setSelectedTrack(currentPageTracks[0]);
    } else {
      setSelectedTrack(null);
      setAudioSignedUrl(null);
      setIsPlaying(false);
    }
  }, [currentPage, audioTracks]);

  // Get signed URL for PDF
  useEffect(() => {
    const getSignedUrl = async () => {
      setIsLoading(true);
      
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

  // Load PDF document
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
        const container = containerRef.current;
        
        if (!canvas || !container) {
          setIsLoading(false);
          return;
        }

        const context = canvas.getContext('2d');
        if (!context) {
          setIsLoading(false);
          return;
        }

        // Calculate scale to fit container
        const containerWidth = container.clientWidth - 48;
        const containerHeight = container.clientHeight - 48;
        const viewport = page.getViewport({ scale: 1 });
        
        const scaleX = containerWidth / viewport.width;
        const scaleY = containerHeight / viewport.height;
        const baseScale = Math.min(scaleX, scaleY, 1.5);
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

  // Get signed URL for selected audio track
  useEffect(() => {
    if (!selectedTrack) {
      setAudioSignedUrl(null);
      return;
    }

    const getAudioUrl = async () => {
      const urlParts = selectedTrack.audio_url.split('/pdf-audio/');
      const filePath = urlParts[urlParts.length - 1];

      if (!filePath) return;

      const { data } = await supabase.storage
        .from('pdf-audio')
        .createSignedUrl(filePath, 3600);

      if (data?.signedUrl) {
        setAudioSignedUrl(data.signedUrl);
        setAudioProgress(0);
        setAudioDuration(0);
      }
    };

    getAudioUrl();
  }, [selectedTrack?.id]);

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
    audioRef.current.playbackRate = playbackRate / 100;
  }, [playbackRate]);

  const handleSeek = useCallback((value: number[]) => {
    if (!audioRef.current) return;
    audioRef.current.currentTime = value[0];
    setAudioProgress(value[0]);
  }, []);

  const skipSeconds = useCallback((seconds: number) => {
    if (!audioRef.current) return;
    audioRef.current.currentTime = Math.max(0, Math.min(audioRef.current.currentTime + seconds, audioDuration));
  }, [audioDuration]);

  const handleSpeedChange = useCallback((value: number[]) => {
    const speed = value[0];
    setPlaybackRate(speed);
    if (audioRef.current) {
      audioRef.current.playbackRate = speed / 100;
    }
  }, []);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  // Navigation
  const goToPreviousPage = useCallback(() => {
    if (currentPage > 1) {
      onPageChange(currentPage - 1);
    }
  }, [currentPage, onPageChange]);

  const goToNextPage = useCallback(() => {
    if (currentPage < pdf.page_count) {
      onPageChange(currentPage + 1);
    }
  }, [currentPage, pdf.page_count, onPageChange]);

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
      } else if (e.key === 'Escape') {
        onClose();
      } else if (e.key === ' ' && audioSignedUrl) {
        e.preventDefault();
        togglePlayPause();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [goToPreviousPage, goToNextPage, onClose, audioSignedUrl, togglePlayPause]);

  return (
    <div 
      className="fixed inset-0 z-[100] flex flex-col animate-fade-in"
      style={{ 
        background: 'linear-gradient(180deg, rgba(11, 46, 138, 0.98) 0%, rgba(0, 0, 0, 0.98) 100%)'
      }}
    >
      {/* Close button */}
      <button
        onClick={onClose}
        className="absolute top-4 right-4 z-[110] p-3 rounded-full glass hover:bg-white/20 text-white transition-all"
      >
        <X className="w-6 h-6" />
      </button>

      {/* Header with title */}
      <div className="shrink-0 glass px-6 py-3 safe-top">
        <h2 className="text-lg font-semibold text-white truncate text-center max-w-3xl mx-auto">
          {pdf.title}
        </h2>
      </div>

      {/* PDF Canvas Area */}
      <div 
        ref={containerRef}
        className="flex-1 min-h-0 flex items-center justify-center p-4 relative"
      >
        {/* Loading overlay */}
        {isLoading && (
          <div className="absolute inset-0 flex items-center justify-center z-10"
               style={{ background: 'linear-gradient(180deg, hsl(222 86% 29% / 0.8) 0%, hsl(0 0% 0% / 0.8) 100%)' }}>
            <div className="flex flex-col items-center gap-4">
              <div className="w-14 h-14 rounded-full border-4 border-reward-gold border-t-transparent animate-spin" />
              <span className="text-white/70">Seite wird geladen...</span>
            </div>
          </div>
        )}

        {/* Canvas */}
        <canvas
          ref={canvasRef}
          className={cn(
            "shadow-2xl rounded-lg transition-opacity duration-300 bg-white",
            isLoading ? "opacity-0" : "opacity-100"
          )}
          style={{
            maxWidth: '100%',
            maxHeight: '100%',
            boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5), 0 0 0 1px rgba(255, 255, 255, 0.1)'
          }}
        />

        {/* Page Navigation Arrows */}
        <button
          onClick={goToPreviousPage}
          disabled={currentPage <= 1}
          className={cn(
            "absolute left-4 top-1/2 -translate-y-1/2 p-3 rounded-full glass transition-all",
            currentPage <= 1 ? "opacity-30 cursor-not-allowed" : "hover:bg-white/20"
          )}
        >
          <ChevronLeft className="w-6 h-6 text-white" />
        </button>

        <button
          onClick={goToNextPage}
          disabled={currentPage >= pdf.page_count}
          className={cn(
            "absolute right-4 top-1/2 -translate-y-1/2 p-3 rounded-full glass transition-all",
            currentPage >= pdf.page_count ? "opacity-30 cursor-not-allowed" : "hover:bg-white/20"
          )}
        >
          <ChevronRight className="w-6 h-6 text-white" />
        </button>

        {/* Zoom Controls - Top Right */}
        <div className="absolute top-4 left-4 flex items-center gap-1 glass rounded-full px-2 py-1">
          <Button 
            variant="ghost" 
            size="icon" 
            onClick={handleZoomOut}
            className="h-8 w-8 text-white/70 hover:text-white hover:bg-white/10"
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
            className="h-8 w-8 text-white/70 hover:text-white hover:bg-white/10"
          >
            <ZoomIn className="w-4 h-4" />
          </Button>
          <Button 
            variant="ghost" 
            size="icon" 
            onClick={handleResetZoom}
            className="h-8 w-8 text-white/70 hover:text-white hover:bg-white/10"
          >
            <RotateCcw className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {/* Bottom Control Bar - VideoPlayer Style */}
      <div className="shrink-0 z-[105] glass px-6 py-4 safe-bottom">
        <div className="max-w-6xl mx-auto">
          {/* Audio Player - if tracks available */}
          {audioSignedUrl && selectedTrack ? (
            <>
              <audio
                ref={audioRef}
                src={audioSignedUrl}
                onTimeUpdate={handleTimeUpdate}
                onLoadedMetadata={handleLoadedMetadata}
                onEnded={() => setIsPlaying(false)}
              />
              
              <div className="flex items-center gap-4">
                {/* Play/Pause - Gold accent */}
                <button
                  onClick={togglePlayPause}
                  className="w-12 h-12 rounded-full bg-reward-gold hover:bg-reward-gold/90 text-black transition-all shrink-0 flex items-center justify-center glow-gold"
                >
                  {isPlaying ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5 ml-0.5" />}
                </button>
                
                {/* Skip back */}
                <button
                  onClick={() => skipSeconds(-10)}
                  className="p-2 rounded-full text-white/70 hover:text-white hover:bg-white/10 transition-all"
                >
                  <SkipBack className="w-5 h-5" />
                </button>
                
                {/* Current time */}
                <span className="text-white/80 text-sm font-mono w-12 text-right shrink-0">
                  {formatTime(audioProgress)}
                </span>
                
                {/* Timeline slider - Gold */}
                <Slider
                  value={[audioProgress]}
                  min={0}
                  max={audioDuration || 100}
                  step={0.1}
                  onValueChange={handleSeek}
                  className="flex-1 min-w-[120px]"
                />
                
                {/* Duration */}
                <span className="text-white/80 text-sm font-mono w-12 shrink-0">
                  {formatTime(audioDuration)}
                </span>
                
                {/* Skip forward */}
                <button
                  onClick={() => skipSeconds(10)}
                  className="p-2 rounded-full text-white/70 hover:text-white hover:bg-white/10 transition-all"
                >
                  <SkipForward className="w-5 h-5" />
                </button>

                {/* Track selector (if multiple) */}
                {hasMultipleTracks && (
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <button className="flex items-center gap-2 px-3 py-2 rounded-full glass hover:bg-white/20 text-white/80 text-sm transition-all">
                        <Music className="w-4 h-4" />
                        <span className="max-w-[100px] truncate">{selectedTrack.title}</span>
                        <ChevronDown className="w-4 h-4" />
                      </button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-56">
                      {currentPageTracks.map((track) => (
                        <DropdownMenuItem
                          key={track.id}
                          onClick={() => setSelectedTrack(track)}
                          className={cn(
                            "cursor-pointer",
                            track.id === selectedTrack.id && "bg-primary/10 text-primary"
                          )}
                        >
                          <Music className="w-4 h-4 mr-2" />
                          {track.title}
                        </DropdownMenuItem>
                      ))}
                    </DropdownMenuContent>
                  </DropdownMenu>
                )}

                {/* Speed control */}
                <div className="flex items-center gap-3 shrink-0 ml-2 pl-4 border-l border-white/20">
                  <span className="text-white/60 text-sm hidden md:block">Tempo</span>
                  <div className="flex items-center gap-2 w-24">
                    <Slider
                      value={[playbackRate]}
                      min={50}
                      max={150}
                      step={5}
                      onValueChange={handleSpeedChange}
                      className="flex-1"
                    />
                  </div>
                  <span className="text-reward-gold font-bold text-sm w-12 text-center bg-white/10 rounded-full px-2 py-1">
                    {playbackRate}%
                  </span>
                </div>

                {/* Page indicator */}
                <div className="flex items-center gap-2 pl-4 border-l border-white/20">
                  <span className="text-white/60 text-sm">
                    Seite {currentPage} / {pdf.page_count}
                  </span>
                </div>
              </div>
            </>
          ) : (
            /* No audio - show page navigation only */
            <div className="flex items-center justify-center gap-4">
              <button
                onClick={goToPreviousPage}
                disabled={currentPage <= 1}
                className={cn(
                  "p-3 rounded-full glass transition-all",
                  currentPage <= 1 ? "opacity-30 cursor-not-allowed" : "hover:bg-white/20"
                )}
              >
                <ChevronLeft className="w-5 h-5 text-white" />
              </button>
              
              <span className="text-white font-medium px-4">
                Seite {currentPage} von {pdf.page_count}
              </span>
              
              <button
                onClick={goToNextPage}
                disabled={currentPage >= pdf.page_count}
                className={cn(
                  "p-3 rounded-full glass transition-all",
                  currentPage >= pdf.page_count ? "opacity-30 cursor-not-allowed" : "hover:bg-white/20"
                )}
              >
                <ChevronRight className="w-5 h-5 text-white" />
              </button>
              
              <span className="text-white/40 text-sm ml-4">
                Kein Audio für diese Seite
              </span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
