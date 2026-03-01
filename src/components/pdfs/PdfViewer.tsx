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
  Music,
  Pencil,
  Highlighter,
  Eraser,
  Undo2,
  Trash2,
  RefreshCw,
  AlertTriangle,
  Save,
  Circle,
  Loader2,
  Printer
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';

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

// Brush colors
const BRUSH_COLORS = [
  { name: 'Schwarz', value: '#1a1a2e' },
  { name: 'Blau', value: '#2563eb' },
  { name: 'Rot', value: '#dc2626' },
  { name: 'Grün', value: '#16a34a' },
  { name: 'Orange', value: '#ea580c' },
  { name: 'Lila', value: '#9333ea' },
];

// Highlighter colors
const HIGHLIGHTER_COLORS = [
  { name: 'Gelb', value: 'rgba(255, 230, 0, 0.4)' },
  { name: 'Grün', value: 'rgba(34, 197, 94, 0.4)' },
  { name: 'Blau', value: 'rgba(59, 130, 246, 0.4)' },
  { name: 'Pink', value: 'rgba(236, 72, 153, 0.4)' },
  { name: 'Orange', value: 'rgba(249, 115, 22, 0.4)' },
];

// Brush sizes
const BRUSH_SIZES = [2, 4, 6, 8, 12];
const HIGHLIGHTER_SIZES = [12, 20, 28, 36];

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
  
  // Brush settings
  const [pencilColor, setPencilColor] = useState(BRUSH_COLORS[0].value);
  const [pencilSize, setPencilSize] = useState(4);
  const [highlighterColor, setHighlighterColor] = useState(HIGHLIGHTER_COLORS[0].value);
  const [highlighterSize, setHighlighterSize] = useState(20);
  const [eraserSize, setEraserSize] = useState(25);

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
        
        // Use local worker file for iOS/Safari compatibility (no external CDN)
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
          
          const drawCtx = drawingCanvas.getContext('2d');
          if (drawCtx) {
            // First try to restore from saved annotations (from database)
            const savedData = savedAnnotations.get(currentPage);
            if (savedData) {
              const img = new Image();
              img.onload = () => {
                drawCtx.drawImage(img, 0, 0, canvas.width, canvas.height);
              };
              img.src = savedData;
            } else {
              // Fall back to in-memory history
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

  // Print current page only – uses a hidden iframe so the dialog opens directly
  const handlePrintCurrentPage = useCallback(() => {
    const pdfCanvas = canvasRef.current;
    const drawingCanvas = drawingCanvasRef.current;

    if (!pdfCanvas) {
      toast.error('Seite konnte nicht gedruckt werden');
      return;
    }

    // Merge PDF canvas + annotation canvas
    const printCanvas = document.createElement('canvas');
    printCanvas.width = pdfCanvas.width;
    printCanvas.height = pdfCanvas.height;
    const ctx = printCanvas.getContext('2d');

    if (!ctx) {
      toast.error('Druckfehler');
      return;
    }

    ctx.drawImage(pdfCanvas, 0, 0);
    if (drawingCanvas) {
      ctx.drawImage(drawingCanvas, 0, 0);
    }

    const imageData = printCanvas.toDataURL('image/png', 1.0);

    // Build HTML for the iframe
    const html = `<!DOCTYPE html>
<html>
  <head>
    <style>
      * { margin: 0; padding: 0; box-sizing: border-box; }
      @page { size: A4 portrait; margin: 0; }
      html, body { width: 210mm; height: 297mm; background: white; }
      img { width: 210mm; height: 297mm; object-fit: contain; display: block; }
    </style>
  </head>
  <body>
    <img src="${imageData}" alt="Seite ${currentPage}" />
  </body>
</html>`;

    // Remove any existing print iframe
    const existing = document.getElementById('pdf-print-frame');
    if (existing) existing.remove();

    const iframe = document.createElement('iframe');
    iframe.id = 'pdf-print-frame';
    iframe.style.cssText = 'position:fixed;top:-9999px;left:-9999px;width:210mm;height:297mm;border:none;';
    document.body.appendChild(iframe);

    const iframeDoc = iframe.contentWindow?.document;
    if (!iframeDoc) {
      toast.error('Druckfehler');
      return;
    }

    iframeDoc.open();
    iframeDoc.write(html);
    iframeDoc.close();

    // Wait for image to load, then print
    iframe.onload = () => {
      setTimeout(() => {
        iframe.contentWindow?.focus();
        iframe.contentWindow?.print();
        // Clean up after print dialog closes
        setTimeout(() => iframe.remove(), 2000);
      }, 200);
    };
  }, [currentPage]);

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
      // Get all pages with drawings
      const pagesToSave = new Set(drawingHistory.keys());
      
      for (const pageNum of pagesToSave) {
        // Get the image data as base64
        const pageHistory = drawingHistory.get(pageNum);
        if (!pageHistory || pageHistory.length === 0) continue;

        // Create a temporary canvas to get the data URL
        const tempCanvas = document.createElement('canvas');
        const lastImageData = pageHistory[pageHistory.length - 1];
        tempCanvas.width = lastImageData.width;
        tempCanvas.height = lastImageData.height;
        const tempCtx = tempCanvas.getContext('2d');
        if (!tempCtx) continue;
        
        tempCtx.putImageData(lastImageData, 0, 0);
        const dataUrl = tempCanvas.toDataURL('image/png');

        // Upsert to database
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
      } else if ((e.metaKey || e.ctrlKey) && e.key === 's') {
        e.preventDefault();
        saveAnnotations();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [goToPreviousPage, goToNextPage, onClose, audioSignedUrl, togglePlayPause, saveAnnotations]);

  return (
    <div className="fixed inset-0 z-[100] flex flex-col animate-fade-in bg-white">
      {/* Minimal header bar */}
      <div className="shrink-0 flex items-center justify-between px-4 py-2 bg-gray-100 border-b border-gray-200">
        {/* Left: Zoom controls */}
        <div className="flex items-center gap-1">
          <Button 
            variant="ghost" 
            size="icon" 
            onClick={handleZoomOut}
            className="h-8 w-8 text-gray-600 hover:text-gray-900 hover:bg-gray-200"
          >
            <ZoomOut className="w-4 h-4" />
          </Button>
          <span className="text-xs font-medium text-gray-600 w-10 text-center">
            {Math.round(zoom * 100)}%
          </span>
          <Button 
            variant="ghost" 
            size="icon" 
            onClick={handleZoomIn}
            className="h-8 w-8 text-gray-600 hover:text-gray-900 hover:bg-gray-200"
          >
            <ZoomIn className="w-4 h-4" />
          </Button>
          <Button 
            variant="ghost" 
            size="icon" 
            onClick={handleResetZoom}
            className="h-8 w-8 text-gray-600 hover:text-gray-900 hover:bg-gray-200"
          >
            <RotateCcw className="w-4 h-4" />
          </Button>
        </div>

        {/* Center: Title */}
        <h2 className="text-sm font-medium text-gray-800 truncate max-w-md mx-4">
          {pdf.title}
        </h2>

        {/* Right: Drawing tools */}
        <div className="flex items-center gap-1">
          {/* Pencil with color/size picker */}
          <Popover>
            <PopoverTrigger asChild>
              <Button 
                variant="ghost" 
                size="icon" 
                onClick={() => activeTool !== 'pencil' && setActiveTool('pencil')}
                className={cn(
                  "h-8 w-8 transition-all relative",
                  activeTool === 'pencil' 
                    ? "bg-gray-900 text-white hover:bg-gray-800" 
                    : "text-gray-600 hover:text-gray-900 hover:bg-gray-200"
                )}
              >
                <Pencil className="w-4 h-4" />
                <span 
                  className="absolute bottom-1 right-1 w-2 h-2 rounded-full border border-white"
                  style={{ backgroundColor: pencilColor }}
                />
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-56 p-3" align="end">
              <div className="space-y-3">
                <div>
                  <span className="text-xs font-medium text-gray-500 mb-2 block">Farbe</span>
                  <div className="flex gap-1 flex-wrap">
                    {BRUSH_COLORS.map(color => (
                      <button
                        key={color.value}
                        onClick={() => { setPencilColor(color.value); setActiveTool('pencil'); }}
                        className={cn(
                          "w-7 h-7 rounded-full border-2 transition-all",
                          pencilColor === color.value ? "border-gray-900 scale-110" : "border-transparent hover:scale-105"
                        )}
                        style={{ backgroundColor: color.value }}
                        title={color.name}
                      />
                    ))}
                  </div>
                </div>
                <div>
                  <span className="text-xs font-medium text-gray-500 mb-2 block">Größe</span>
                  <div className="flex gap-2 items-center">
                    {BRUSH_SIZES.map(size => (
                      <button
                        key={size}
                        onClick={() => { setPencilSize(size); setActiveTool('pencil'); }}
                        className={cn(
                          "rounded-full transition-all flex items-center justify-center",
                          pencilSize === size ? "bg-gray-900" : "bg-gray-300 hover:bg-gray-400"
                        )}
                        style={{ width: size + 12, height: size + 12 }}
                      >
                        <Circle className="w-full h-full" style={{ width: size, height: size }} fill="currentColor" />
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </PopoverContent>
          </Popover>

          {/* Highlighter with color/size picker */}
          <Popover>
            <PopoverTrigger asChild>
              <Button 
                variant="ghost" 
                size="icon" 
                onClick={() => activeTool !== 'highlighter' && setActiveTool('highlighter')}
                className={cn(
                  "h-8 w-8 transition-all",
                  activeTool === 'highlighter' 
                    ? "bg-yellow-400 text-black hover:bg-yellow-500" 
                    : "text-gray-600 hover:text-gray-900 hover:bg-gray-200"
                )}
              >
                <Highlighter className="w-4 h-4" />
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-56 p-3" align="end">
              <div className="space-y-3">
                <div>
                  <span className="text-xs font-medium text-gray-500 mb-2 block">Farbe</span>
                  <div className="flex gap-1 flex-wrap">
                    {HIGHLIGHTER_COLORS.map(color => (
                      <button
                        key={color.value}
                        onClick={() => { setHighlighterColor(color.value); setActiveTool('highlighter'); }}
                        className={cn(
                          "w-7 h-7 rounded-full border-2 transition-all",
                          highlighterColor === color.value ? "border-gray-900 scale-110" : "border-transparent hover:scale-105"
                        )}
                        style={{ backgroundColor: color.value.replace('0.4', '0.8') }}
                        title={color.name}
                      />
                    ))}
                  </div>
                </div>
                <div>
                  <span className="text-xs font-medium text-gray-500 mb-2 block">Größe</span>
                  <div className="flex gap-2 items-center">
                    {HIGHLIGHTER_SIZES.map(size => (
                      <button
                        key={size}
                        onClick={() => { setHighlighterSize(size); setActiveTool('highlighter'); }}
                        className={cn(
                          "h-6 rounded transition-all",
                          highlighterSize === size ? "bg-yellow-400" : "bg-yellow-200 hover:bg-yellow-300"
                        )}
                        style={{ width: size }}
                      />
                    ))}
                  </div>
                </div>
              </div>
            </PopoverContent>
          </Popover>

          {/* Eraser */}
          <Popover>
            <PopoverTrigger asChild>
              <Button 
                variant="ghost" 
                size="icon" 
                onClick={() => activeTool !== 'eraser' && setActiveTool('eraser')}
                className={cn(
                  "h-8 w-8 transition-all",
                  activeTool === 'eraser' 
                    ? "bg-gray-200 text-gray-900" 
                    : "text-gray-600 hover:text-gray-900 hover:bg-gray-200"
                )}
              >
                <Eraser className="w-4 h-4" />
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-40 p-3" align="end">
              <div>
                <span className="text-xs font-medium text-gray-500 mb-2 block">Größe</span>
                <Slider
                  value={[eraserSize]}
                  min={10}
                  max={50}
                  step={5}
                  onValueChange={([val]) => { setEraserSize(val); setActiveTool('eraser'); }}
                  className="w-full"
                />
                <span className="text-xs text-gray-500 mt-1 block text-center">{eraserSize}px</span>
              </div>
            </PopoverContent>
          </Popover>

          <div className="w-px h-6 bg-gray-300 mx-1" />

          <Button 
            variant="ghost" 
            size="icon" 
            onClick={undoDrawing}
            className="h-8 w-8 text-gray-600 hover:text-gray-900 hover:bg-gray-200"
          >
            <Undo2 className="w-4 h-4" />
          </Button>
          <Button 
            variant="ghost" 
            size="icon" 
            onClick={clearDrawings}
            className="h-8 w-8 text-gray-600 hover:text-red-600 hover:bg-gray-200"
          >
            <Trash2 className="w-4 h-4" />
          </Button>

          <div className="w-px h-6 bg-gray-300 mx-1" />

          {/* Save button */}
          <Button 
            variant="ghost" 
            size="sm"
            onClick={saveAnnotations}
            disabled={isSaving || !hasUnsavedChanges}
            className={cn(
              "h-8 px-3 gap-1.5",
              hasUnsavedChanges 
                ? "text-green-600 hover:text-green-700 hover:bg-green-50" 
                : "text-gray-400"
            )}
          >
            {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            <span className="text-xs">Speichern</span>
          </Button>

          {/* Print current page button */}
          <Button 
            variant="ghost" 
            size="sm"
            onClick={handlePrintCurrentPage}
            disabled={isLoading || !!loadError}
            className="h-8 px-3 gap-1.5 text-gray-600 hover:text-gray-900 hover:bg-gray-200"
          >
            <Printer className="w-4 h-4" />
            <span className="text-xs">Drucken</span>
          </Button>

          <div className="w-px h-6 bg-gray-300 mx-1" />

          {/* Close button */}
          <Button 
            variant="ghost" 
            size="icon" 
            onClick={onClose}
            className="h-8 w-8 text-gray-600 hover:text-gray-900 hover:bg-gray-200"
          >
            <X className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {/* PDF Canvas Area - maximized */}
      <div 
        ref={containerRef}
        className="flex-1 min-h-0 flex items-center justify-center p-2 bg-gray-50 relative overflow-auto"
      >
        {/* Error overlay */}
        {loadError && (
          <div className="absolute inset-0 flex items-center justify-center z-20 bg-white">
            <div className="flex flex-col items-center gap-6 max-w-md text-center px-4">
              <div className="w-16 h-16 rounded-full bg-red-100 flex items-center justify-center">
                <AlertTriangle className="w-8 h-8 text-red-500" />
              </div>
              <div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">PDF konnte nicht geladen werden</h3>
                <p className="text-gray-600 text-sm mb-4">{loadError}</p>
              </div>
              <div className="flex gap-3">
                <Button onClick={handleRetry}>
                  <RefreshCw className="w-4 h-4 mr-2" />
                  Erneut versuchen
                </Button>
                <Button variant="outline" onClick={onClose}>
                  Schließen
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* Loading overlay */}
        {isLoading && !loadError && (
          <div className="absolute inset-0 flex items-center justify-center z-10 bg-white/80">
            <div className="flex flex-col items-center gap-4">
              <Loader2 className="w-10 h-10 animate-spin text-blue-600" />
              <span className="text-gray-600">Seite wird geladen...</span>
            </div>
          </div>
        )}

        {/* Canvas container for both PDF and drawing */}
        <div className="relative shadow-lg" style={{ maxWidth: '100%', maxHeight: '100%' }}>
          {/* PDF Canvas */}
          <canvas
            ref={canvasRef}
            className={cn(
              "transition-opacity duration-300 bg-white",
              isLoading ? "opacity-0" : "opacity-100"
            )}
            style={{
              maxWidth: '100%',
              maxHeight: '100%',
            }}
          />
          
          {/* Drawing Canvas (overlay) */}
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

        {/* Page Navigation Arrows - subtle */}
        <button
          onClick={goToPreviousPage}
          disabled={currentPage <= 1}
          className={cn(
            "absolute left-2 top-1/2 -translate-y-1/2 p-2 rounded-full bg-white shadow-md transition-all",
            currentPage <= 1 ? "opacity-30 cursor-not-allowed" : "hover:bg-gray-100"
          )}
        >
          <ChevronLeft className="w-5 h-5 text-gray-700" />
        </button>

        <button
          onClick={goToNextPage}
          disabled={currentPage >= pdf.page_count}
          className={cn(
            "absolute right-2 top-1/2 -translate-y-1/2 p-2 rounded-full bg-white shadow-md transition-all",
            currentPage >= pdf.page_count ? "opacity-30 cursor-not-allowed" : "hover:bg-gray-100"
          )}
        >
          <ChevronRight className="w-5 h-5 text-gray-700" />
        </button>
      </div>

      {/* Compact bottom bar */}
      <div className="shrink-0 z-[105] bg-gray-100 border-t border-gray-200 px-4 py-1.5">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          {/* Left: Page navigation */}
          <div className="flex items-center gap-2">
            <button
              onClick={goToPreviousPage}
              disabled={currentPage <= 1}
              className={cn(
                "p-1.5 rounded transition-all",
                currentPage <= 1 ? "opacity-30 cursor-not-allowed" : "hover:bg-gray-200"
              )}
            >
              <ChevronLeft className="w-4 h-4 text-gray-700" />
            </button>
            <span className="text-sm text-gray-700 font-medium min-w-[80px] text-center">
              {currentPage} / {pdf.page_count}
            </span>
            <button
              onClick={goToNextPage}
              disabled={currentPage >= pdf.page_count}
              className={cn(
                "p-1.5 rounded transition-all",
                currentPage >= pdf.page_count ? "opacity-30 cursor-not-allowed" : "hover:bg-gray-200"
              )}
            >
              <ChevronRight className="w-4 h-4 text-gray-700" />
            </button>
          </div>

          {/* Center: Audio Player (if tracks available) */}
          {audioSignedUrl && selectedTrack ? (
            <div className="flex items-center gap-3 flex-1 max-w-xl mx-4">
              <audio
                ref={audioRef}
                src={audioSignedUrl}
                onTimeUpdate={handleTimeUpdate}
                onLoadedMetadata={handleLoadedMetadata}
                onEnded={() => setIsPlaying(false)}
              />
              
              <button
                onClick={togglePlayPause}
                className="w-8 h-8 rounded-full bg-blue-600 hover:bg-blue-700 text-white transition-all shrink-0 flex items-center justify-center"
              >
                {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4 ml-0.5" />}
              </button>
              
              <button
                onClick={() => skipSeconds(-10)}
                className="p-1 rounded text-gray-600 hover:text-gray-900 hover:bg-gray-200 transition-all"
              >
                <SkipBack className="w-4 h-4" />
              </button>
              
              <span className="text-xs text-gray-600 font-mono w-10 text-right">
                {formatTime(audioProgress)}
              </span>
              
              <Slider
                value={[audioProgress]}
                min={0}
                max={audioDuration || 100}
                step={0.1}
                onValueChange={handleSeek}
                className="flex-1 min-w-[80px]"
              />
              
              <span className="text-xs text-gray-600 font-mono w-10">
                {formatTime(audioDuration)}
              </span>
              
              <button
                onClick={() => skipSeconds(10)}
                className="p-1 rounded text-gray-600 hover:text-gray-900 hover:bg-gray-200 transition-all"
              >
                <SkipForward className="w-4 h-4" />
              </button>

              {hasMultipleTracks && (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <button className="flex items-center gap-1 px-2 py-1 rounded text-xs text-gray-600 hover:bg-gray-200 transition-all">
                      <Music className="w-3 h-3" />
                      <ChevronDown className="w-3 h-3" />
                    </button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-48">
                    {currentPageTracks.map((track) => (
                      <DropdownMenuItem
                        key={track.id}
                        onClick={() => setSelectedTrack(track)}
                        className={cn(
                          "cursor-pointer text-sm",
                          track.id === selectedTrack.id && "bg-blue-50 text-blue-600"
                        )}
                      >
                        <Music className="w-3 h-3 mr-2" />
                        {track.title}
                      </DropdownMenuItem>
                    ))}
                  </DropdownMenuContent>
                </DropdownMenu>
              )}

              <div className="flex items-center gap-1 pl-2 border-l border-gray-300">
                <span className="text-xs text-gray-500">{playbackRate}%</span>
                <Slider
                  value={[playbackRate]}
                  min={50}
                  max={150}
                  step={5}
                  onValueChange={handleSpeedChange}
                  className="w-16"
                />
              </div>
            </div>
          ) : (
            <div className="flex-1 text-center">
              <span className="text-xs text-gray-400">Kein Audio für diese Seite</span>
            </div>
          )}

          {/* Right: Unsaved indicator */}
          <div className="flex items-center gap-2">
            {hasUnsavedChanges && (
              <span className="text-xs text-orange-600">Ungespeicherte Änderungen</span>
            )}
          </div>
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
