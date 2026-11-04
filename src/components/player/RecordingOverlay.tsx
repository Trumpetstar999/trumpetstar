import { Video, Square, AlertCircle, Settings } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { useLanguage } from '@/hooks/useLanguage';

interface RecordingOverlayProps {
  isRecording: boolean;
  isStarting: boolean;
  isStopping: boolean;
  duration: number;
  error: string | null;
  onStart: () => void;
  onStop: () => void;
  onClearError: () => void;
  light?: boolean;
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
  light = false,
}: RecordingOverlayProps) {
  const { language } = useLanguage();
  const copy = {
    de: { record: 'Aufnahme', stop: 'Stoppen', start: 'Starte …', stopping: 'Stoppe …', settings: 'Einstellungen', close: 'Schließen', permission: 'Bitte erlaube Kamera und Mikrofon in den Browser-Einstellungen.' },
    en: { record: 'Record', stop: 'Stop', start: 'Starting …', stopping: 'Stopping …', settings: 'Settings', close: 'Close', permission: 'Please allow camera and microphone access in your browser settings.' },
    es: { record: 'Grabar', stop: 'Parar', start: 'Iniciando …', stopping: 'Deteniendo …', settings: 'Ajustes', close: 'Cerrar', permission: 'Permite el acceso a la cámara y al micrófono en los ajustes del navegador.' },
    sl: { record: 'Snemanje', stop: 'Ustavi', start: 'Zaganjanje …', stopping: 'Ustavljanje …', settings: 'Nastavitve', close: 'Zapri', permission: 'V nastavitvah brskalnika dovoli dostop do kamere in mikrofona.' },
  }[language];
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
    alert(copy.permission);
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
                  {copy.settings}
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={onClearError}
                  className="text-xs text-destructive-foreground/80 hover:text-destructive-foreground"
                >
                  {copy.close}
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
        aria-label={isRecording ? copy.stop : copy.record}
        title={isRecording ? copy.stop : copy.record}
        className={cn(
          "gap-2 rounded-full transition-all",
          light ? (isRecording ? 'bg-destructive text-destructive-foreground hover:bg-destructive/90' : 'border border-border bg-secondary text-secondary-foreground hover:bg-accent') : isRecording
            ? "bg-red-600 hover:bg-red-700 text-white"
            : "bg-white/20 hover:bg-white/30 text-white border border-white/30",
          (isStarting || isStopping) && "opacity-70 cursor-not-allowed"
        )}
        size="sm"
      >
        {isStarting ? (
          <>
            <div className="w-4 h-4 rounded-full border-2 border-white/30 border-t-white animate-spin" />
            <span className="hidden sm:inline">{copy.start}</span>
          </>
        ) : isStopping ? (
          <>
            <div className="w-4 h-4 rounded-full border-2 border-white/30 border-t-white animate-spin" />
            <span className="hidden sm:inline">{copy.stopping}</span>
          </>
        ) : isRecording ? (
          <>
            <Square className="w-4 h-4 fill-current" />
            <span className="hidden sm:inline">{copy.stop}</span>
          </>
        ) : (
          <>
            <Video className="w-4 h-4" />
            <span className="hidden sm:inline">{copy.record}</span>
          </>
        )}
      </Button>
    </div>
  );
}
