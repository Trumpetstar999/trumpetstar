import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { useEffect, useRef, useState } from 'react';
import { AlertCircle, Loader2, Download } from 'lucide-react';

interface VideoPlayerDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  video: {
    title: string;
    url: string;
  } | null;
}

export function VideoPlayerDialog({ open, onOpenChange, video }: VideoPlayerDialogProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (open && video) {
      setLoading(true);
      setError(null);
    }
  }, [open, video]);

  useEffect(() => {
    // Stop video when dialog closes
    if (!open && videoRef.current) {
      videoRef.current.pause();
      videoRef.current.currentTime = 0;
    }
  }, [open]);

  if (!video) return null;

  const handleLoadedData = () => {
    setLoading(false);
    setError(null);
  };

  const handleError = () => {
    setLoading(false);
    setError('Video konnte nicht geladen werden. Das Format wird möglicherweise nicht unterstützt.');
  };

  const handleCanPlay = () => {
    setLoading(false);
  };

  const handleDownload = async () => {
    try {
      const response = await fetch(video.url);
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${video.title}.webm`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
    } catch (err) {
      console.error('Download failed:', err);
      // Fallback: open in new tab
      window.open(video.url, '_blank');
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[800px] p-0 overflow-hidden">
        <DialogHeader className="p-4 pb-0 flex flex-row items-center justify-between">
          <DialogTitle>{video.title}</DialogTitle>
          <Button
            variant="outline"
            size="sm"
            onClick={handleDownload}
            className="gap-2"
          >
            <Download className="w-4 h-4" />
            Herunterladen
          </Button>
        </DialogHeader>
        <div className="p-4 pt-2">
          <div className="relative w-full aspect-video bg-black rounded-lg overflow-hidden">
            {loading && !error && (
              <div className="absolute inset-0 flex items-center justify-center bg-black/50">
                <Loader2 className="h-8 w-8 animate-spin text-white" />
              </div>
            )}
            {error && (
              <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 text-white bg-black">
                <AlertCircle className="h-8 w-8 text-destructive" />
                <p className="text-sm text-center px-4">{error}</p>
                <a
                  href={video.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm text-primary underline"
                >
                  Video direkt öffnen
                </a>
              </div>
            )}
            <video
              ref={videoRef}
              src={video.url}
              controls
              autoPlay
              playsInline
              className="w-full h-full"
              onLoadedData={handleLoadedData}
              onCanPlay={handleCanPlay}
              onError={handleError}
            >
              Dein Browser unterstützt das Video-Format nicht.
            </video>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}