import { useState, useEffect, useRef, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useUserRole } from '@/hooks/useUserRole';
import { usePdfCache, PdfDiagnostics } from '@/hooks/usePdfCache';
import { PdfDebugPanel } from './PdfDebugPanel';
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
  Music,
  Pencil,
  Highlighter,
  Eraser,
  Undo2,
  Trash2,
  RefreshCw,
  AlertTriangle
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
  pdfBlobUrl: string;
  currentPage: number;
  onPageChange: (page: number) => void;
  audioTracks: AudioTrack[];
  onClose: () => void;
}

export function PdfViewer({ pdf, pdfBlobUrl, currentPage, onPageChange, audioTracks, onClose }: PdfViewerProps) {
  const [searchParams] = useSearchParams();
  const { isAdmin } = useUserRole();
  const { runDiagnostics, diagnostics } = usePdfCache();
  
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [pdfDoc, setPdfDoc] = useState<any>(null);
  const [zoom, setZoom] = useState(1);
  const [isDiagnosing, setIsDiagnosing] = useState(false);
  
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const drawingCanvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  
  // Show debug panel if ?debug=1 or admin
  const showDebug = searchParams.get('debug') === '1' || isAdmin;
  
  // Audio state
  const audioRef = useRef<HTMLAudioElement>(null);
  const [selectedTrack, setSelectedTrack] = useState<AudioTrack | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [audioProgress, setAudioProgress] = useState(0);
  const [audioDuration, setAudioDuration] = useState(0);
  const [audioSignedUrl, setAudioSignedUrl] = useState<string | null>(null);
  const [playbackRate, setPlaybackRate] = useState(100);

  // Drawing state
  type DrawingTool = 'none' | 'pencil' | 'highlighter' | 'eraser';
  const [activeTool, setActiveTool] = useState<DrawingTool>('none');
  const [isDrawing, setIsDrawing] = useState(false);
  const [drawingHistory, setDrawingHistory] = useState<Map<number, ImageData[]>>(new Map());
  const lastPointRef = useRef<{ x: number; y: number } | null>(null);

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

  // Handle diagnostics
  const handleRunDiagnostics = useCallback(async () => {
    setIsDiagnosing(true);
    try {
      await runDiagnostics(pdf.id, pdf.pdf_file_url);
    } finally {
      setIsDiagnosing(false);
    }
  }, [pdf.id, pdf.pdf_file_url, runDiagnostics]);

  // Handle retry
  const handleRetry = useCallback(() => {
    setLoadError(null);
    setIsLoading(true);
    setPdfDoc(null);
    // Trigger reload by resetting
    const reloadEvent = new CustomEvent('pdf-reload', { detail: pdf.id });
    window.dispatchEvent(reloadEvent);
    onClose();
  }, [pdf.id, onClose]);

  // Load PDF document from blob URL
  useEffect(() => {
    console.log('PdfViewer: pdfBlobUrl changed:', pdfBlobUrl ? 'exists' : 'null');
    
    if (!pdfBlobUrl) {
      console.log('PdfViewer: No blob URL provided');
      return;
    }

    // Reset state when URL changes
    setPdfDoc(null);
    setIsLoading(true);
    setLoadError(null);

    const loadPdf = async () => {
      console.log('PdfViewer: Starting PDF load from blob URL:', pdfBlobUrl);
      
      try {
        // First, fetch the blob to verify it's valid and get ArrayBuffer
        console.log('PdfViewer: Fetching blob...');
        const response = await fetch(pdfBlobUrl);
        
        if (!response.ok) {
          throw new Error(`Failed to fetch blob: HTTP ${response.status}`);
        }
        
        const arrayBuffer = await response.arrayBuffer();
        console.log('PdfViewer: Got ArrayBuffer, size:', arrayBuffer.byteLength);
        
        if (arrayBuffer.byteLength < 1000) {
          throw new Error(`File too small to be a valid PDF (${arrayBuffer.byteLength} bytes)`);
        }
        
        // Verify PDF header
        const header = new Uint8Array(arrayBuffer.slice(0, 5));
        const headerStr = String.fromCharCode(...header);
        console.log('PdfViewer: PDF header check:', headerStr);
        
        if (!headerStr.startsWith('%PDF-')) {
          throw new Error(`Invalid PDF header: "${headerStr}" - File may be corrupted or not a PDF`);
        }
        
        // Load PDF.js with explicit worker configuration
        const pdfjsLib = await import('pdfjs-dist');
        
        // Set worker source to locally hosted file for iPad Safari compatibility
        pdfjsLib.GlobalWorkerOptions.workerSrc = '/pdf.worker.min.mjs';

        console.log('PdfViewer: pdfjs-dist loaded, loading document from ArrayBuffer...');
        
        // Use ArrayBuffer directly - more reliable than blob URL
        const loadingTask = pdfjsLib.getDocument({ 
          data: arrayBuffer,
          // iPad Safari optimizations
          disableAutoFetch: false,
          disableStream: false,
        });
        
        loadingTask.onProgress = (progress: { loaded: number; total: number }) => {
          if (progress.total > 0) {
            console.log('PdfViewer: Loading progress:', Math.round((progress.loaded / progress.total) * 100) + '%');
          }
        };
        
        const doc = await loadingTask.promise;
        console.log('PdfViewer: PDF document loaded successfully, pages:', doc.numPages);
        setPdfDoc(doc);
        setLoadError(null);
      } catch (error) {
        console.error('Error loading PDF:', error);
        const errorMessage = error instanceof Error ? error.message : 'Unbekannter Fehler';
        setLoadError(errorMessage);
        toast.error('PDF konnte nicht geladen werden');
        setIsLoading(false);
      }
    };

    loadPdf();
  }, [pdfBlobUrl]);

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
          console.log('Canvas or container not ready');
          // Retry after a short delay
          setTimeout(() => setIsLoading(true), 100);
          return;
        }

        const containerWidth = container.clientWidth - 48;
        const containerHeight = container.clientHeight - 48;
        
        // Wait for container to have dimensions
        if (containerWidth <= 0 || containerHeight <= 0) {
          console.log('Container dimensions not ready, retrying...');
          setTimeout(() => {
            // Trigger re-render by toggling loading state
            setIsLoading(false);
            setTimeout(() => setIsLoading(true), 50);
          }, 100);
          return;
        }

        const context = canvas.getContext('2d');
        if (!context) {
          console.log('Could not get canvas context');
          setIsLoading(false);
          return;
        }

        // Calculate scale to fit container
        const viewport = page.getViewport({ scale: 1 });
        
        const scaleX = containerWidth / viewport.width;
        const scaleY = containerHeight / viewport.height;
        const baseScale = Math.min(scaleX, scaleY, 1.5);
        const scale = baseScale * zoom;
        
        const scaledViewport = page.getViewport({ scale });

        canvas.height = scaledViewport.height;
        canvas.width = scaledViewport.width;

        console.log('Rendering page', currentPage, 'at scale', scale, 'canvas size:', canvas.width, 'x', canvas.height);

        await page.render({
          canvasContext: context,
          viewport: scaledViewport,
        }).promise;

        console.log('Page rendered successfully');

        // Setup drawing canvas to match PDF canvas
        const drawingCanvas = drawingCanvasRef.current;
        if (drawingCanvas) {
          drawingCanvas.width = canvas.width;
          drawingCanvas.height = canvas.height;
          
          // Restore drawings for this page if any
          const pageHistory = drawingHistory.get(currentPage);
          if (pageHistory && pageHistory.length > 0) {
            const drawCtx = drawingCanvas.getContext('2d');
            if (drawCtx) {
              drawCtx.putImageData(pageHistory[pageHistory.length - 1], 0, 0);
            }
          }
        }

        setIsLoading(false);
      } catch (error) {
        console.error('Error rendering PDF page:', error);
        toast.error('Seite konnte nicht gerendert werden');
        setIsLoading(false);
      }
    };

    renderPage();
  }, [pdfDoc, currentPage, zoom, drawingHistory]);

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

  // Drawing functions
  const getCanvasCoordinates = useCallback((e: React.TouchEvent | React.MouseEvent) => {
    const canvas = drawingCanvasRef.current;
    if (!canvas) return null;
    
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    
    let clientX: number, clientY: number;
    
    if ('touches' in e) {
      if (e.touches.length === 0) return null;
      clientX = e.touches[0].clientX;
      clientY = e.touches[0].clientY;
    } else {
      clientX = e.clientX;
      clientY = e.clientY;
    }
    
    return {
      x: (clientX - rect.left) * scaleX,
      y: (clientY - rect.top) * scaleY
    };
  }, []);

  const startDrawing = useCallback((e: React.TouchEvent | React.MouseEvent) => {
    if (activeTool === 'none') return;
    e.preventDefault();
    
    const point = getCanvasCoordinates(e);
    if (!point) return;
    
    setIsDrawing(true);
    lastPointRef.current = point;
  }, [activeTool, getCanvasCoordinates]);

  const draw = useCallback((e: React.TouchEvent | React.MouseEvent) => {
    if (!isDrawing || activeTool === 'none') return;
    e.preventDefault();
    
    const canvas = drawingCanvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (!canvas || !ctx || !lastPointRef.current) return;
    
    const point = getCanvasCoordinates(e);
    if (!point) return;
    
    ctx.beginPath();
    ctx.moveTo(lastPointRef.current.x, lastPointRef.current.y);
    ctx.lineTo(point.x, point.y);
    
    if (activeTool === 'pencil') {
      ctx.strokeStyle = '#1a1a2e';
      ctx.lineWidth = 3;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      ctx.globalCompositeOperation = 'source-over';
    } else if (activeTool === 'highlighter') {
      ctx.strokeStyle = 'rgba(255, 230, 0, 0.4)';
      ctx.lineWidth = 20;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      ctx.globalCompositeOperation = 'multiply';
    } else if (activeTool === 'eraser') {
      ctx.strokeStyle = 'rgba(0,0,0,1)';
      ctx.lineWidth = 25;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      ctx.globalCompositeOperation = 'destination-out';
    }
    
    ctx.stroke();
    lastPointRef.current = point;
  }, [isDrawing, activeTool, getCanvasCoordinates]);

  const stopDrawing = useCallback(() => {
    if (!isDrawing) return;
    
    setIsDrawing(false);
    lastPointRef.current = null;
    
    // Save current state to history
    const canvas = drawingCanvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (canvas && ctx) {
      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      setDrawingHistory(prev => {
        const newHistory = new Map(prev);
        const pageHistory = newHistory.get(currentPage) || [];
        newHistory.set(currentPage, [...pageHistory, imageData]);
        return newHistory;
      });
    }
  }, [isDrawing, currentPage]);

  const undoDrawing = useCallback(() => {
    const canvas = drawingCanvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (!canvas || !ctx) return;
    
    const pageHistory = drawingHistory.get(currentPage) || [];
    if (pageHistory.length <= 1) {
      // Clear canvas if only one or no history
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      setDrawingHistory(prev => {
        const newHistory = new Map(prev);
        newHistory.delete(currentPage);
        return newHistory;
      });
      return;
    }
    
    // Remove last state and restore previous
    const newHistory = pageHistory.slice(0, -1);
    const previousState = newHistory[newHistory.length - 1];
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.putImageData(previousState, 0, 0);
    
    setDrawingHistory(prev => {
      const updated = new Map(prev);
      updated.set(currentPage, newHistory);
      return updated;
    });
  }, [currentPage, drawingHistory]);

  const clearDrawings = useCallback(() => {
    const canvas = drawingCanvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (!canvas || !ctx) return;
    
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    setDrawingHistory(prev => {
      const newHistory = new Map(prev);
      newHistory.delete(currentPage);
      return newHistory;
    });
  }, [currentPage]);

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
        {/* Error overlay */}
        {loadError && (
          <div className="absolute inset-0 flex items-center justify-center z-20"
               style={{ background: 'linear-gradient(180deg, hsl(222 86% 29% / 0.95) 0%, hsl(0 0% 0% / 0.95) 100%)' }}>
            <div className="flex flex-col items-center gap-6 max-w-md text-center px-4">
              <div className="w-16 h-16 rounded-full bg-red-500/20 flex items-center justify-center">
                <AlertTriangle className="w-8 h-8 text-red-400" />
              </div>
              <div>
                <h3 className="text-xl font-semibold text-white mb-2">PDF konnte nicht geladen werden</h3>
                <p className="text-white/70 text-sm mb-4">{loadError}</p>
              </div>
              <div className="flex gap-3">
                <Button 
                  onClick={handleRetry}
                  className="bg-reward-gold text-black hover:bg-reward-gold/90"
                >
                  <RefreshCw className="w-4 h-4 mr-2" />
                  Erneut versuchen
                </Button>
                <Button 
                  variant="outline" 
                  onClick={onClose}
                  className="border-white/30 text-white hover:bg-white/10"
                >
                  Schließen
                </Button>
              </div>
              {showDebug && (
                <Button 
                  variant="ghost" 
                  size="sm"
                  onClick={handleRunDiagnostics}
                  className="text-white/60 hover:text-white"
                >
                  Diagnose starten
                </Button>
              )}
            </div>
          </div>
        )}

        {/* Loading overlay */}
        {isLoading && !loadError && (
          <div className="absolute inset-0 flex items-center justify-center z-10"
               style={{ background: 'linear-gradient(180deg, hsl(222 86% 29% / 0.8) 0%, hsl(0 0% 0% / 0.8) 100%)' }}>
            <div className="flex flex-col items-center gap-4">
              <div className="w-14 h-14 rounded-full border-4 border-reward-gold border-t-transparent animate-spin" />
              <span className="text-white/70">Seite wird geladen...</span>
            </div>
          </div>
        )}

        {/* Canvas container for both PDF and drawing */}
        <div className="relative" style={{ maxWidth: '100%', maxHeight: '100%' }}>
          {/* PDF Canvas */}
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
          
          {/* Drawing Canvas (overlay) */}
          <canvas
            ref={drawingCanvasRef}
            className={cn(
              "absolute inset-0 rounded-lg transition-opacity duration-300",
              isLoading ? "opacity-0" : "opacity-100",
              activeTool !== 'none' ? "cursor-crosshair touch-none" : "pointer-events-none"
            )}
            style={{
              maxWidth: '100%',
              maxHeight: '100%',
            }}
            onMouseDown={startDrawing}
            onMouseMove={draw}
            onMouseUp={stopDrawing}
            onMouseLeave={stopDrawing}
            onTouchStart={startDrawing}
            onTouchMove={draw}
            onTouchEnd={stopDrawing}
            onTouchCancel={stopDrawing}
          />
        </div>

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

        {/* Zoom Controls - Top Left */}
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

        {/* Drawing Tools - Top Right (next to close button) */}
        <div className="absolute top-4 right-20 flex items-center gap-1 glass rounded-full px-2 py-1">
          <Button 
            variant="ghost" 
            size="icon" 
            onClick={() => setActiveTool(activeTool === 'pencil' ? 'none' : 'pencil')}
            className={cn(
              "h-8 w-8 transition-all",
              activeTool === 'pencil' 
                ? "bg-reward-gold text-black hover:bg-reward-gold/90" 
                : "text-white/70 hover:text-white hover:bg-white/10"
            )}
          >
            <Pencil className="w-4 h-4" />
          </Button>
          <Button 
            variant="ghost" 
            size="icon" 
            onClick={() => setActiveTool(activeTool === 'highlighter' ? 'none' : 'highlighter')}
            className={cn(
              "h-8 w-8 transition-all",
              activeTool === 'highlighter' 
                ? "bg-yellow-400 text-black hover:bg-yellow-400/90" 
                : "text-white/70 hover:text-white hover:bg-white/10"
            )}
          >
            <Highlighter className="w-4 h-4" />
          </Button>
          <Button 
            variant="ghost" 
            size="icon" 
            onClick={() => setActiveTool(activeTool === 'eraser' ? 'none' : 'eraser')}
            className={cn(
              "h-8 w-8 transition-all",
              activeTool === 'eraser' 
                ? "bg-white text-black hover:bg-white/90" 
                : "text-white/70 hover:text-white hover:bg-white/10"
            )}
          >
            <Eraser className="w-4 h-4" />
          </Button>
          <div className="w-px h-6 bg-white/20 mx-1" />
          <Button 
            variant="ghost" 
            size="icon" 
            onClick={undoDrawing}
            className="h-8 w-8 text-white/70 hover:text-white hover:bg-white/10"
          >
            <Undo2 className="w-4 h-4" />
          </Button>
          <Button 
            variant="ghost" 
            size="icon" 
            onClick={clearDrawings}
            className="h-8 w-8 text-white/70 hover:text-red-400 hover:bg-white/10"
          >
            <Trash2 className="w-4 h-4" />
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
                      step={1}
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

      {/* Debug Panel - only visible to admins or with ?debug=1 */}
      {showDebug && (
        <PdfDebugPanel
          diagnostics={diagnostics}
          onRunDiagnostics={handleRunDiagnostics}
          onRetry={handleRetry}
          isLoading={isDiagnosing}
        />
      )}
    </div>
  );
}
