import { useState, useEffect, useRef, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useUserRole } from '@/hooks/useUserRole';
import { useAuth } from '@/hooks/useAuth';
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
  SkipBack,
  SkipForward,
  X,
  ChevronDown,
  ChevronUp,
  Music,
  Pencil,
  Highlighter,
  Eraser,
  Undo2,
  Trash2,
  RefreshCw,
  AlertTriangle,
  Loader2
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

// Apple Books style color palette
const APPLE_PENCIL_COLORS = [
  { name: 'Schwarz', value: '#000000' },
  { name: 'Dunkelgrau', value: '#545456' },
  { name: 'Weiß', value: '#FFFFFF' },
  { name: 'Gelb', value: '#FFCC02' },
  { name: 'Orange', value: '#FF9500' },
  { name: 'Rot', value: '#FF3B30' },
  { name: 'Pink', value: '#FF2D55' },
  { name: 'Lila', value: '#AF52DE' },
  { name: 'Blau', value: '#007AFF' },
  { name: 'Cyan', value: '#5AC8FA' },
  { name: 'Grün', value: '#34C759' },
  { name: 'Dunkelgrün', value: '#00C7BE' },
];

const APPLE_HIGHLIGHTER_COLORS = [
  { name: 'Gelb', value: 'rgba(255, 204, 2, 0.45)' },
  { name: 'Grün', value: 'rgba(52, 199, 89, 0.45)' },
  { name: 'Blau', value: 'rgba(0, 122, 255, 0.45)' },
  { name: 'Pink', value: 'rgba(255, 45, 85, 0.45)' },
  { name: 'Lila', value: 'rgba(175, 82, 222, 0.45)' },
];

export function PdfViewer({ pdf, pdfBlobUrl, currentPage, onPageChange, audioTracks, onClose }: PdfViewerProps) {
  const [searchParams] = useSearchParams();
  const { isAdmin } = useUserRole();
  const { user } = useAuth();
  const { runDiagnostics, diagnostics } = usePdfCache();
  
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [pdfDoc, setPdfDoc] = useState<any>(null);
  const [zoom, setZoom] = useState(1);
  const [isDiagnosing, setIsDiagnosing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [showToolbar, setShowToolbar] = useState(false);
  const [showAudioPlayer, setShowAudioPlayer] = useState(true);
  
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

  // Enhanced drawing state
  type DrawingTool = 'none' | 'pencil' | 'highlighter' | 'eraser';
  const [activeTool, setActiveTool] = useState<DrawingTool>('none');
  const [isDrawing, setIsDrawing] = useState(false);
  const [drawingHistory, setDrawingHistory] = useState<Map<number, ImageData[]>>(new Map());
  const [savedAnnotations, setSavedAnnotations] = useState<Map<number, string>>(new Map());
  const lastPointRef = useRef<{ x: number; y: number } | null>(null);
  
  // Apple style brush settings
  const [pencilColor, setPencilColor] = useState(APPLE_PENCIL_COLORS[0].value);
  const [pencilSize, setPencilSize] = useState(3);
  const [highlighterColor, setHighlighterColor] = useState(APPLE_HIGHLIGHTER_COLORS[0].value);
  const [highlighterSize, setHighlighterSize] = useState(20);
  const [eraserSize, setEraserSize] = useState(20);

  // Get audio tracks for current page
  const currentPageTracks = audioTracks.filter(t => t.page_number === currentPage);
  const hasMultipleTracks = currentPageTracks.length > 1;
  const hasAudio = currentPageTracks.length > 0;

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

  // Load saved annotations when page changes
  useEffect(() => {
    if (!user || !pdf.id) return;
    
    const loadAnnotations = async () => {
      const { data, error } = await supabase
        .from('pdf_user_annotations')
        .select('annotations_json')
        .eq('pdf_document_id', pdf.id)
        .eq('user_id', user.id)
        .eq('page_number', currentPage)
        .maybeSingle();
      
      if (data?.annotations_json) {
        const annotationData = data.annotations_json as { imageData?: string };
        if (annotationData.imageData) {
          setSavedAnnotations(prev => {
            const newMap = new Map(prev);
            newMap.set(currentPage, annotationData.imageData as string);
            return newMap;
          });
        }
      }
    };
    
    loadAnnotations();
  }, [user, pdf.id, currentPage]);

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

    setPdfDoc(null);
    setIsLoading(true);
    setLoadError(null);

    const loadPdf = async () => {
      console.log('PdfViewer: Starting PDF load from blob URL:', pdfBlobUrl);
      
      try {
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
        
        const header = new Uint8Array(arrayBuffer.slice(0, 5));
        const headerStr = String.fromCharCode(...header);
        console.log('PdfViewer: PDF header check:', headerStr);
        
        if (!headerStr.startsWith('%PDF-')) {
          throw new Error(`Invalid PDF header: "${headerStr}" - File may be corrupted or not a PDF`);
        }
        
        const pdfjsLib = await import('pdfjs-dist');
        pdfjsLib.GlobalWorkerOptions.workerSrc = '/pdf.worker.min.mjs';

        console.log('PdfViewer: pdfjs-dist loaded, loading document from ArrayBuffer...');
        
        const loadingTask = pdfjsLib.getDocument({ 
          data: arrayBuffer,
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

  // Render current page - edge to edge
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
          setTimeout(() => setIsLoading(true), 100);
          return;
        }

        // Use full container dimensions for edge-to-edge display
        const containerWidth = container.clientWidth;
        const containerHeight = container.clientHeight;
        
        if (containerWidth <= 0 || containerHeight <= 0) {
          console.log('Container dimensions not ready, retrying...');
          setTimeout(() => {
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

        const viewport = page.getViewport({ scale: 1 });
        
        // Scale to fit container perfectly (edge to edge)
        const scaleX = containerWidth / viewport.width;
        const scaleY = containerHeight / viewport.height;
        const baseScale = Math.min(scaleX, scaleY);
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
          
          const drawCtx = drawingCanvas.getContext('2d');
          if (drawCtx) {
            const savedData = savedAnnotations.get(currentPage);
            if (savedData) {
              const img = new Image();
              img.onload = () => {
                drawCtx.drawImage(img, 0, 0, canvas.width, canvas.height);
              };
              img.src = savedData;
            } else {
              const pageHistory = drawingHistory.get(currentPage);
              if (pageHistory && pageHistory.length > 0) {
                drawCtx.putImageData(pageHistory[pageHistory.length - 1], 0, 0);
              }
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
  }, [pdfDoc, currentPage, zoom, drawingHistory, savedAnnotations]);

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
      ctx.strokeStyle = pencilColor;
      ctx.lineWidth = pencilSize;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      ctx.globalCompositeOperation = 'source-over';
    } else if (activeTool === 'highlighter') {
      ctx.strokeStyle = highlighterColor;
      ctx.lineWidth = highlighterSize;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      ctx.globalCompositeOperation = 'multiply';
    } else if (activeTool === 'eraser') {
      ctx.strokeStyle = 'rgba(0,0,0,1)';
      ctx.lineWidth = eraserSize;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      ctx.globalCompositeOperation = 'destination-out';
    }
    
    ctx.stroke();
    lastPointRef.current = point;
  }, [isDrawing, activeTool, getCanvasCoordinates, pencilColor, pencilSize, highlighterColor, highlighterSize, eraserSize]);

  const stopDrawing = useCallback(() => {
    if (!isDrawing) return;
    
    setIsDrawing(false);
    lastPointRef.current = null;
    setHasUnsavedChanges(true);
    
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
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      setDrawingHistory(prev => {
        const newHistory = new Map(prev);
        newHistory.delete(currentPage);
        return newHistory;
      });
      return;
    }
    
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
    setHasUnsavedChanges(true);
  }, [currentPage]);

  // Save annotations to database
  const saveAnnotations = useCallback(async () => {
    if (!user) {
      toast.error('Bitte melde dich an, um Notizen zu speichern');
      return;
    }

    const canvas = drawingCanvasRef.current;
    if (!canvas) return;

    setIsSaving(true);
    try {
      const pagesToSave = new Set(drawingHistory.keys());
      
      for (const pageNum of pagesToSave) {
        const pageHistory = drawingHistory.get(pageNum);
        if (!pageHistory || pageHistory.length === 0) continue;

        const tempCanvas = document.createElement('canvas');
        const lastImageData = pageHistory[pageHistory.length - 1];
        tempCanvas.width = lastImageData.width;
        tempCanvas.height = lastImageData.height;
        const tempCtx = tempCanvas.getContext('2d');
        if (!tempCtx) continue;
        
        tempCtx.putImageData(lastImageData, 0, 0);
        const dataUrl = tempCanvas.toDataURL('image/png');

        const { error } = await supabase
          .from('pdf_user_annotations')
          .upsert({
            pdf_document_id: pdf.id,
            user_id: user.id,
            page_number: pageNum,
            annotations_json: { imageData: dataUrl },
            updated_at: new Date().toISOString(),
          }, {
            onConflict: 'pdf_document_id,user_id,page_number'
          });

        if (error) throw error;
      }

      setHasUnsavedChanges(false);
      toast.success('Notizen gespeichert');
    } catch (error) {
      console.error('Error saving annotations:', error);
      toast.error('Fehler beim Speichern der Notizen');
    } finally {
      setIsSaving(false);
    }
  }, [user, pdf.id, drawingHistory]);

  // Toggle tool
  const selectTool = (tool: DrawingTool) => {
    if (activeTool === tool) {
      setActiveTool('none');
      setShowToolbar(false);
    } else {
      setActiveTool(tool);
      setShowToolbar(true);
    }
  };

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowLeft') {
        goToPreviousPage();
      } else if (e.key === 'ArrowRight') {
        goToNextPage();
      } else if (e.key === 'Escape') {
        if (showToolbar) {
          setShowToolbar(false);
          setActiveTool('none');
        } else {
          onClose();
        }
      } else if (e.key === ' ' && audioSignedUrl) {
        e.preventDefault();
        togglePlayPause();
      } else if ((e.metaKey || e.ctrlKey) && e.key === 's') {
        e.preventDefault();
        saveAnnotations();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [goToPreviousPage, goToNextPage, onClose, audioSignedUrl, togglePlayPause, saveAnnotations, showToolbar]);

  return (
    <div className="fixed inset-0 z-[100] flex flex-col bg-black">
      {/* Edge-to-edge PDF Canvas Area */}
      <div 
        ref={containerRef}
        className="flex-1 min-h-0 flex items-center justify-center relative overflow-auto bg-neutral-900"
      >
        {/* Error overlay */}
        {loadError && (
          <div className="absolute inset-0 flex items-center justify-center z-20 bg-neutral-900">
            <div className="flex flex-col items-center gap-6 max-w-md text-center px-4">
              <div className="w-16 h-16 rounded-full bg-red-500/20 flex items-center justify-center">
                <AlertTriangle className="w-8 h-8 text-red-400" />
              </div>
              <div>
                <h3 className="text-xl font-semibold text-white mb-2">PDF konnte nicht geladen werden</h3>
                <p className="text-neutral-400 text-sm mb-4">{loadError}</p>
              </div>
              <div className="flex gap-3">
                <Button onClick={handleRetry} className="bg-white text-black hover:bg-neutral-200">
                  <RefreshCw className="w-4 h-4 mr-2" />
                  Erneut versuchen
                </Button>
                <Button variant="outline" onClick={onClose} className="border-neutral-600 text-white hover:bg-neutral-800">
                  Schließen
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* Loading overlay */}
        {isLoading && !loadError && (
          <div className="absolute inset-0 flex items-center justify-center z-10 bg-neutral-900">
            <div className="flex flex-col items-center gap-4">
              <Loader2 className="w-10 h-10 animate-spin text-white" />
              <span className="text-neutral-400">Seite wird geladen...</span>
            </div>
          </div>
        )}

        {/* Canvas container - edge to edge */}
        <div className="relative" style={{ maxWidth: '100%', maxHeight: '100%' }}>
          <canvas
            ref={canvasRef}
            className={cn(
              "transition-opacity duration-300",
              isLoading ? "opacity-0" : "opacity-100"
            )}
            style={{
              maxWidth: '100%',
              maxHeight: '100%',
            }}
          />
          
          <canvas
            ref={drawingCanvasRef}
            className={cn(
              "absolute inset-0 transition-opacity duration-300",
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

        {/* Page Navigation - Apple style invisible tap zones */}
        <button
          onClick={goToPreviousPage}
          disabled={currentPage <= 1}
          className={cn(
            "absolute left-0 top-0 bottom-0 w-1/4 opacity-0 hover:opacity-100 transition-opacity",
            currentPage <= 1 && "cursor-not-allowed"
          )}
        >
          {currentPage > 1 && (
            <div className="absolute left-4 top-1/2 -translate-y-1/2 p-3 rounded-full bg-black/50 backdrop-blur-sm">
              <ChevronLeft className="w-6 h-6 text-white" />
            </div>
          )}
        </button>

        <button
          onClick={goToNextPage}
          disabled={currentPage >= pdf.page_count}
          className={cn(
            "absolute right-0 top-0 bottom-0 w-1/4 opacity-0 hover:opacity-100 transition-opacity",
            currentPage >= pdf.page_count && "cursor-not-allowed"
          )}
        >
          {currentPage < pdf.page_count && (
            <div className="absolute right-4 top-1/2 -translate-y-1/2 p-3 rounded-full bg-black/50 backdrop-blur-sm">
              <ChevronRight className="w-6 h-6 text-white" />
            </div>
          )}
        </button>

        {/* Top bar - Apple Books style floating overlay */}
        <div className="absolute top-0 left-0 right-0 flex items-center justify-between p-4 bg-gradient-to-b from-black/60 to-transparent pointer-events-none">
          <div className="pointer-events-auto flex items-center gap-2">
            <Button 
              variant="ghost" 
              size="icon" 
              onClick={onClose}
              className="h-10 w-10 rounded-full bg-black/40 text-white hover:bg-black/60 backdrop-blur-sm"
            >
              <X className="w-5 h-5" />
            </Button>
          </div>

          <h2 className="text-white text-sm font-medium truncate max-w-md px-4 text-shadow">
            {pdf.title}
          </h2>

          <div className="pointer-events-auto flex items-center gap-2">
            {/* Zoom controls */}
            <Button 
              variant="ghost" 
              size="icon" 
              onClick={handleZoomOut}
              className="h-10 w-10 rounded-full bg-black/40 text-white hover:bg-black/60 backdrop-blur-sm"
            >
              <ZoomOut className="w-5 h-5" />
            </Button>
            <span className="text-white text-xs font-medium w-12 text-center">
              {Math.round(zoom * 100)}%
            </span>
            <Button 
              variant="ghost" 
              size="icon" 
              onClick={handleZoomIn}
              className="h-10 w-10 rounded-full bg-black/40 text-white hover:bg-black/60 backdrop-blur-sm"
            >
              <ZoomIn className="w-5 h-5" />
            </Button>
            <Button 
              variant="ghost" 
              size="icon" 
              onClick={handleResetZoom}
              className="h-10 w-10 rounded-full bg-black/40 text-white hover:bg-black/60 backdrop-blur-sm"
            >
              <RotateCcw className="w-4 h-4" />
            </Button>
          </div>
        </div>

        {/* Right sidebar - Apple Books style tool palette */}
        <div className="absolute right-4 top-1/2 -translate-y-1/2 flex flex-col items-center gap-2">
          {/* Tool buttons */}
          <div className="flex flex-col gap-1 p-1.5 rounded-2xl bg-black/50 backdrop-blur-md">
            <button
              onClick={() => selectTool('pencil')}
              className={cn(
                "w-11 h-11 rounded-xl flex items-center justify-center transition-all",
                activeTool === 'pencil' 
                  ? "bg-white text-black" 
                  : "text-white hover:bg-white/20"
              )}
            >
              <Pencil className="w-5 h-5" />
            </button>
            <button
              onClick={() => selectTool('highlighter')}
              className={cn(
                "w-11 h-11 rounded-xl flex items-center justify-center transition-all",
                activeTool === 'highlighter' 
                  ? "bg-yellow-400 text-black" 
                  : "text-white hover:bg-white/20"
              )}
            >
              <Highlighter className="w-5 h-5" />
            </button>
            <button
              onClick={() => selectTool('eraser')}
              className={cn(
                "w-11 h-11 rounded-xl flex items-center justify-center transition-all",
                activeTool === 'eraser' 
                  ? "bg-white/80 text-black" 
                  : "text-white hover:bg-white/20"
              )}
            >
              <Eraser className="w-5 h-5" />
            </button>
            
            <div className="w-8 h-px bg-white/20 mx-auto my-1" />
            
            <button
              onClick={undoDrawing}
              className="w-11 h-11 rounded-xl flex items-center justify-center text-white hover:bg-white/20 transition-all"
            >
              <Undo2 className="w-5 h-5" />
            </button>
            <button
              onClick={clearDrawings}
              className="w-11 h-11 rounded-xl flex items-center justify-center text-white hover:bg-white/20 hover:text-red-400 transition-all"
            >
              <Trash2 className="w-5 h-5" />
            </button>
          </div>

          {/* Save indicator */}
          {hasUnsavedChanges && (
            <button
              onClick={saveAnnotations}
              disabled={isSaving}
              className="w-11 h-11 rounded-full bg-green-500 text-white flex items-center justify-center animate-pulse"
            >
              {isSaving ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <span className="text-xs font-bold">✓</span>
              )}
            </button>
          )}
        </div>

        {/* Tool options panel - slides from right */}
        {showToolbar && (
          <div className="absolute right-20 top-1/2 -translate-y-1/2 p-4 rounded-2xl bg-black/70 backdrop-blur-xl animate-fade-in">
            {activeTool === 'pencil' && (
              <div className="space-y-4">
                <div>
                  <span className="text-xs font-medium text-white/70 mb-3 block">Farbe</span>
                  <div className="grid grid-cols-4 gap-2">
                    {APPLE_PENCIL_COLORS.map(color => (
                      <button
                        key={color.value}
                        onClick={() => setPencilColor(color.value)}
                        className={cn(
                          "w-8 h-8 rounded-full transition-all border-2",
                          pencilColor === color.value 
                            ? "border-white scale-110 shadow-lg" 
                            : "border-transparent hover:scale-105",
                          color.value === '#FFFFFF' && "border border-white/30"
                        )}
                        style={{ backgroundColor: color.value }}
                        title={color.name}
                      />
                    ))}
                  </div>
                </div>
                <div>
                  <span className="text-xs font-medium text-white/70 mb-3 block">Größe</span>
                  <Slider
                    value={[pencilSize]}
                    min={1}
                    max={12}
                    step={1}
                    onValueChange={([val]) => setPencilSize(val)}
                    className="w-32"
                  />
                  <div className="flex justify-between text-xs text-white/50 mt-1">
                    <span>Fein</span>
                    <span>Dick</span>
                  </div>
                </div>
              </div>
            )}

            {activeTool === 'highlighter' && (
              <div className="space-y-4">
                <div>
                  <span className="text-xs font-medium text-white/70 mb-3 block">Farbe</span>
                  <div className="flex gap-2">
                    {APPLE_HIGHLIGHTER_COLORS.map(color => (
                      <button
                        key={color.value}
                        onClick={() => setHighlighterColor(color.value)}
                        className={cn(
                          "w-10 h-10 rounded-lg transition-all border-2",
                          highlighterColor === color.value 
                            ? "border-white scale-110 shadow-lg" 
                            : "border-transparent hover:scale-105"
                        )}
                        style={{ backgroundColor: color.value.replace('0.45', '0.8') }}
                        title={color.name}
                      />
                    ))}
                  </div>
                </div>
                <div>
                  <span className="text-xs font-medium text-white/70 mb-3 block">Größe</span>
                  <Slider
                    value={[highlighterSize]}
                    min={12}
                    max={40}
                    step={4}
                    onValueChange={([val]) => setHighlighterSize(val)}
                    className="w-32"
                  />
                </div>
              </div>
            )}

            {activeTool === 'eraser' && (
              <div>
                <span className="text-xs font-medium text-white/70 mb-3 block">Größe</span>
                <Slider
                  value={[eraserSize]}
                  min={10}
                  max={50}
                  step={5}
                  onValueChange={([val]) => setEraserSize(val)}
                  className="w-32"
                />
                <div className="flex justify-center mt-3">
                  <div 
                    className="rounded-full bg-white/30 border border-white/50"
                    style={{ width: eraserSize, height: eraserSize }}
                  />
                </div>
              </div>
            )}
          </div>
        )}

        {/* Page indicator - bottom center */}
        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 px-4 py-2 rounded-full bg-black/50 backdrop-blur-sm">
          <span className="text-white text-sm font-medium">
            {currentPage} / {pdf.page_count}
          </span>
        </div>
      </div>

      {/* Collapsible Audio Player - Apple style */}
      {hasAudio && (
        <div className={cn(
          "shrink-0 transition-all duration-300 bg-neutral-900/95 backdrop-blur-xl border-t border-white/10",
          showAudioPlayer ? "h-auto" : "h-12"
        )}>
          {/* Toggle bar */}
          <button
            onClick={() => setShowAudioPlayer(!showAudioPlayer)}
            className="w-full h-12 flex items-center justify-center gap-2 text-white/70 hover:text-white transition-colors"
          >
            <Music className="w-4 h-4" />
            <span className="text-sm font-medium">
              {selectedTrack?.title || 'Audio'}
            </span>
            {showAudioPlayer ? (
              <ChevronDown className="w-4 h-4" />
            ) : (
              <ChevronUp className="w-4 h-4" />
            )}
            {isPlaying && (
              <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
            )}
          </button>

          {/* Expanded player */}
          {showAudioPlayer && audioSignedUrl && selectedTrack && (
            <div className="px-6 pb-6 pt-2">
              <audio
                ref={audioRef}
                src={audioSignedUrl}
                onTimeUpdate={handleTimeUpdate}
                onLoadedMetadata={handleLoadedMetadata}
                onEnded={() => setIsPlaying(false)}
              />
              
              <div className="max-w-2xl mx-auto">
                {/* Progress bar */}
                <div className="flex items-center gap-3 mb-4">
                  <span className="text-xs text-white/60 font-mono w-12 text-right">
                    {formatTime(audioProgress)}
                  </span>
                  <Slider
                    value={[audioProgress]}
                    min={0}
                    max={audioDuration || 100}
                    step={0.1}
                    onValueChange={handleSeek}
                    className="flex-1"
                  />
                  <span className="text-xs text-white/60 font-mono w-12">
                    {formatTime(audioDuration)}
                  </span>
                </div>

                {/* Controls */}
                <div className="flex items-center justify-center gap-6">
                  <button
                    onClick={() => skipSeconds(-10)}
                    className="p-2 rounded-full text-white/70 hover:text-white hover:bg-white/10 transition-all"
                  >
                    <SkipBack className="w-5 h-5" />
                  </button>
                  
                  <button
                    onClick={togglePlayPause}
                    className="w-14 h-14 rounded-full bg-white text-black flex items-center justify-center hover:scale-105 transition-transform"
                  >
                    {isPlaying ? <Pause className="w-6 h-6" /> : <Play className="w-6 h-6 ml-1" />}
                  </button>
                  
                  <button
                    onClick={() => skipSeconds(10)}
                    className="p-2 rounded-full text-white/70 hover:text-white hover:bg-white/10 transition-all"
                  >
                    <SkipForward className="w-5 h-5" />
                  </button>
                </div>

                {/* Speed & Track selection */}
                <div className="flex items-center justify-center gap-6 mt-4">
                  {hasMultipleTracks && (
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <button className="flex items-center gap-2 px-3 py-1.5 rounded-full text-sm text-white/70 hover:text-white hover:bg-white/10 transition-all">
                          <Music className="w-4 h-4" />
                          Tracks
                          <ChevronDown className="w-3 h-3" />
                        </button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="center" className="w-56 bg-neutral-900 border-white/10">
                        {currentPageTracks.map((track) => (
                          <DropdownMenuItem
                            key={track.id}
                            onClick={() => setSelectedTrack(track)}
                            className={cn(
                              "cursor-pointer text-sm text-white/80 hover:text-white hover:bg-white/10",
                              track.id === selectedTrack.id && "bg-white/10 text-white"
                            )}
                          >
                            <Music className="w-3 h-3 mr-2" />
                            {track.title}
                          </DropdownMenuItem>
                        ))}
                      </DropdownMenuContent>
                    </DropdownMenu>
                  )}

                  <div className="flex items-center gap-2">
                    <span className="text-xs text-white/60">{playbackRate}%</span>
                    <Slider
                      value={[playbackRate]}
                      min={50}
                      max={150}
                      step={5}
                      onValueChange={handleSpeedChange}
                      className="w-24"
                    />
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Debug Panel */}
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
