import { useState, useRef, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Video, Square, Circle, Loader2, RotateCcw } from 'lucide-react';

interface VideoRecordDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: (data: { blob: Blob; duration: number; title: string }) => Promise<void>;
}

export function VideoRecordDialog({ open, onOpenChange, onSave }: VideoRecordDialogProps) {
  const [recordingState, setRecordingState] = useState<'idle' | 'recording' | 'recorded'>('idle');
  const [recordedBlob, setRecordedBlob] = useState<Blob | null>(null);
  const [recordedUrl, setRecordedUrl] = useState<string | null>(null);
  const [title, setTitle] = useState('');
  const [duration, setDuration] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const videoRef = useRef<HTMLVideoElement>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  const startCamera = async () => {
    try {
      setError(null);
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'user', width: { ideal: 1280 }, height: { ideal: 720 } },
        audio: true
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
      setRecordingState('idle');
    } catch (err) {
      console.error('Camera error:', err);
      setError('Kamera konnte nicht gestartet werden. Bitte erlaube den Zugriff.');
    }
  };

  const startRecording = () => {
    if (!streamRef.current) return;

    chunksRef.current = [];
    const mimeType = MediaRecorder.isTypeSupported('video/webm;codecs=vp9,opus')
      ? 'video/webm;codecs=vp9,opus'
      : MediaRecorder.isTypeSupported('video/webm;codecs=vp8,opus')
        ? 'video/webm;codecs=vp8,opus'
        : 'video/webm';

    const mediaRecorder = new MediaRecorder(streamRef.current, { mimeType });
    mediaRecorderRef.current = mediaRecorder;

    mediaRecorder.ondataavailable = (e) => {
      if (e.data.size > 0) {
        chunksRef.current.push(e.data);
      }
    };

    mediaRecorder.onstop = () => {
      const blob = new Blob(chunksRef.current, { type: mimeType });
      setRecordedBlob(blob);
      const url = URL.createObjectURL(blob);
      setRecordedUrl(url);
      setRecordingState('recorded');
    };

    mediaRecorder.start(1000);
    setRecordingState('recording');
    setDuration(0);

    timerRef.current = setInterval(() => {
      setDuration(d => d + 1);
    }, 1000);
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop();
    }
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
  };

  const resetRecording = () => {
    if (recordedUrl) {
      URL.revokeObjectURL(recordedUrl);
    }
    setRecordedBlob(null);
    setRecordedUrl(null);
    setRecordingState('idle');
    setDuration(0);
    startCamera();
  };

  const handleSave = async () => {
    if (!recordedBlob) return;
    
    setSaving(true);
    try {
      await onSave({
        blob: recordedBlob,
        duration,
        title: title || 'Antwort-Video'
      });
      onOpenChange(false);
    } catch (err) {
      console.error('Save error:', err);
      setError('Video konnte nicht gespeichert werden.');
    } finally {
      setSaving(false);
    }
  };

  useEffect(() => {
    if (open) {
      setTitle('');
      setError(null);
      startCamera();
    } else {
      stopRecording();
      if (recordedUrl) {
        URL.revokeObjectURL(recordedUrl);
      }
      setRecordedBlob(null);
      setRecordedUrl(null);
      setRecordingState('idle');
      setDuration(0);
    }

    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
      }
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, [open]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Video className="w-5 h-5" />
            Antwort-Video aufnehmen
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {error && (
            <div className="p-3 bg-destructive/10 text-destructive text-sm rounded-lg">
              {error}
            </div>
          )}

          <div className="relative aspect-video bg-black rounded-lg overflow-hidden">
            {recordingState === 'recorded' && recordedUrl ? (
              <video
                src={recordedUrl}
                controls
                playsInline
                className="w-full h-full object-contain"
              />
            ) : (
              <video
                ref={videoRef}
                autoPlay
                muted
                playsInline
                className="w-full h-full object-cover mirror"
              />
            )}

            {recordingState === 'recording' && (
              <div className="absolute top-3 left-3 flex items-center gap-2 px-3 py-1.5 bg-destructive text-destructive-foreground rounded-full text-sm font-medium">
                <Circle className="w-3 h-3 fill-current animate-pulse" />
                {formatTime(duration)}
              </div>
            )}
          </div>

          {recordingState === 'recorded' && (
            <Input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Titel (optional)"
            />
          )}

          <div className="flex justify-center gap-3">
            {recordingState === 'idle' && (
              <Button
                onClick={startRecording}
                className="gap-2 bg-destructive hover:bg-destructive/90"
                size="lg"
              >
                <Circle className="w-5 h-5 fill-current" />
                Aufnahme starten
              </Button>
            )}

            {recordingState === 'recording' && (
              <Button
                onClick={stopRecording}
                variant="destructive"
                size="lg"
                className="gap-2"
              >
                <Square className="w-5 h-5 fill-current" />
                Stoppen
              </Button>
            )}

            {recordingState === 'recorded' && (
              <>
                <Button
                  variant="outline"
                  onClick={resetRecording}
                  className="gap-2"
                >
                  <RotateCcw className="w-4 h-4" />
                  Neu aufnehmen
                </Button>
                <Button
                  onClick={handleSave}
                  disabled={saving}
                  className="gap-2 bg-accent hover:bg-accent/90"
                >
                  {saving ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Video className="w-4 h-4" />
                  )}
                  Senden
                </Button>
              </>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
