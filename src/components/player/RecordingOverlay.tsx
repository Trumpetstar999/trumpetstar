import { Video, Square, AlertCircle, Settings } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface RecordingOverlayProps {
  isRecording: boolean;
  isStarting: boolean;
  isStopping: boolean;
  duration: number;
  error: string | null;
  onStart: () => void;
  onStop: () => void;
  onClearError: () => void;
}

export function RecordingOverlay({
  isRecording,
  isStarting,
  isStopping,
  duration,
  error,
  onStart,
  onStop,
  onClearError,
}: RecordingOverlayProps) {
  // Format duration as MM:SS
  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  // Open device settings (works on some mobile browsers)
  const openSettings = () => {
    // On iOS Safari, we can't programmatically open settings
    // But on Android Chrome, we can try
    if ('permissions' in navigator) {
      navigator.permissions.query({ name: 'camera' as PermissionName }).catch(() => {});
    }
    // Show a hint to the user
    alert('Bitte öffne die Browser-Einstellungen oder App-Einstellungen und erlaube den Kamera- und Mikrofonzugriff.');
  };

  // Error display
  if (error) {
    return (
      <div className="absolute top-16 left-4 right-4 md:left-auto md:right-4 md:w-80 z-[108]">
        <div className="bg-destructive/90 backdrop-blur-sm rounded-lg p-4 shadow-lg border border-destructive/50">
          <div className="flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-destructive-foreground shrink-0 mt-0.5" />
            <div className="flex-1">
              <p className="text-sm text-destructive-foreground">{error}</p>
              <div className="flex gap-2 mt-3">
                <Button
                  size="sm"
                  variant="secondary"
                  onClick={openSettings}
                  className="gap-1.5 text-xs"
                >
                  <Settings className="w-3.5 h-3.5" />
                  Einstellungen
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={onClearError}
                  className="text-xs text-destructive-foreground/80 hover:text-destructive-foreground"
                >
                  Schließen
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-3">
      {/* Recording indicator (only when recording) */}
      {isRecording && (
        <div className="flex items-center gap-2 bg-red-600/90 backdrop-blur-sm px-3 py-1.5 rounded-full animate-pulse">
          <div className="w-2.5 h-2.5 rounded-full bg-white animate-pulse" />
          <span className="text-white text-sm font-medium">REC</span>
          <span className="text-white/90 text-sm font-mono">{formatDuration(duration)}</span>
        </div>
      )}

      {/* Record/Stop button */}
      <Button
        onClick={isRecording ? onStop : onStart}
        disabled={isStarting || isStopping}
        className={cn(
          "gap-2 rounded-full transition-all",
          isRecording
            ? "bg-red-600 hover:bg-red-700 text-white"
            : "bg-white/20 hover:bg-white/30 text-white border border-white/30",
          (isStarting || isStopping) && "opacity-70 cursor-not-allowed"
        )}
        size="sm"
      >
        {isStarting ? (
          <>
            <div className="w-4 h-4 rounded-full border-2 border-white/30 border-t-white animate-spin" />
            <span className="hidden sm:inline">Starte...</span>
          </>
        ) : isStopping ? (
          <>
            <div className="w-4 h-4 rounded-full border-2 border-white/30 border-t-white animate-spin" />
            <span className="hidden sm:inline">Stoppe...</span>
          </>
        ) : isRecording ? (
          <>
            <Square className="w-4 h-4 fill-current" />
            <span className="hidden sm:inline">Stoppen</span>
          </>
        ) : (
          <>
            <Video className="w-4 h-4" />
            <span className="hidden sm:inline">Aufnahme</span>
          </>
        )}
      </Button>
    </div>
  );
}
