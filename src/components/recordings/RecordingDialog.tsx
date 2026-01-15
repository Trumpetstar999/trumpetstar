import { useState, useRef, useCallback, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Video, Square, Circle, Download, RotateCcw, Save } from 'lucide-react';
import { cn } from '@/lib/utils';

interface RecordingDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: (recording: { title: string; blob: Blob; duration: number }) => void;
}

type RecordingState = 'idle' | 'recording' | 'recorded';

export function RecordingDialog({ open, onOpenChange, onSave }: RecordingDialogProps) {
  const [recordingState, setRecordingState] = useState<RecordingState>('idle');
  const [recordedBlob, setRecordedBlob] = useState<Blob | null>(null);
  const [recordedUrl, setRecordedUrl] = useState<string | null>(null);
  const [title, setTitle] = useState('');
  const [duration, setDuration] = useState(0);
  const [error, setError] = useState<string | null>(null);
  
  const videoRef = useRef<HTMLVideoElement>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const stopStream = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  const startCamera = useCallback(async () => {
    try {
      setError(null);
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'user', width: { ideal: 1280 }, height: { ideal: 720 } },
        audio: true,
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
    } catch (err) {
      console.error('Camera access error:', err);
      setError('Kamera-Zugriff nicht möglich. Bitte erlaube den Zugriff in deinem Browser.');
    }
  }, []);

  const startRecording = useCallback(() => {
    if (!streamRef.current) return;

    chunksRef.current = [];
    setDuration(0);
    
    // Check for supported mimeTypes
    const mimeTypes = [
      'video/webm;codecs=vp9,opus',
      'video/webm;codecs=vp8,opus',
      'video/webm;codecs=vp9',
      'video/webm;codecs=vp8',
      'video/webm',
      'video/mp4',
    ];
    
    let selectedMimeType = '';
    for (const mimeType of mimeTypes) {
      if (MediaRecorder.isTypeSupported(mimeType)) {
        selectedMimeType = mimeType;
        break;
      }
    }
    
    if (!selectedMimeType) {
      setError('Dein Browser unterstützt keine Videoaufnahme.');
      return;
    }
    
    try {
      const mediaRecorder = new MediaRecorder(streamRef.current, {
        mimeType: selectedMimeType,
      });
      
      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) {
          chunksRef.current.push(e.data);
        }
      };
      
      mediaRecorder.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: selectedMimeType.split(';')[0] });
        setRecordedBlob(blob);
        setRecordedUrl(URL.createObjectURL(blob));
        setRecordingState('recorded');
        stopStream();
      };
      
      mediaRecorderRef.current = mediaRecorder;
      mediaRecorder.start(1000);
      setRecordingState('recording');
      
      timerRef.current = setInterval(() => {
        setDuration(prev => prev + 1);
      }, 1000);
    } catch (err) {
      console.error('MediaRecorder error:', err);
      setError('Fehler beim Starten der Aufnahme.');
    }
  }, [stopStream]);

  const stopRecording = useCallback(() => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop();
    }
  }, []);

  const resetRecording = useCallback(() => {
    if (recordedUrl) {
      URL.revokeObjectURL(recordedUrl);
    }
    setRecordedBlob(null);
    setRecordedUrl(null);
    setRecordingState('idle');
    setDuration(0);
    startCamera();
  }, [recordedUrl, startCamera]);

  const handleSave = useCallback(() => {
    if (!recordedBlob) return;
    
    const finalTitle = title.trim() || `Aufnahme vom ${new Date().toLocaleDateString('de-DE')}`;
    onSave({ title: finalTitle, blob: recordedBlob, duration });
    
    // Reset state
    if (recordedUrl) {
      URL.revokeObjectURL(recordedUrl);
    }
    setRecordedBlob(null);
    setRecordedUrl(null);
    setRecordingState('idle');
    setTitle('');
    setDuration(0);
    onOpenChange(false);
  }, [recordedBlob, recordedUrl, title, duration, onSave, onOpenChange]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  useEffect(() => {
    if (open && recordingState === 'idle' && !recordedBlob) {
      startCamera();
    }
    
    return () => {
      if (!open) {
        stopStream();
        if (recordedUrl) {
          URL.revokeObjectURL(recordedUrl);
        }
      }
    };
  }, [open, recordingState, recordedBlob, startCamera, stopStream, recordedUrl]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      stopStream();
      if (recordedUrl) {
        URL.revokeObjectURL(recordedUrl);
      }
    };
  }, [stopStream, recordedUrl]);

  return (
    <Dialog open={open} onOpenChange={(isOpen) => {
      if (!isOpen) {
        stopStream();
        stopRecording();
      }
      onOpenChange(isOpen);
    }}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>Video aufnehmen</DialogTitle>
          <DialogDescription>
            Nimm dein Spiel auf und speichere es in deiner Bibliothek.
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4 pt-2">
          {error ? (
            <div className="aspect-video bg-muted rounded-lg flex items-center justify-center">
              <div className="text-center p-6">
                <Video className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-sm text-muted-foreground">{error}</p>
                <Button variant="outline" className="mt-4" onClick={startCamera}>
                  Erneut versuchen
                </Button>
              </div>
            </div>
          ) : recordingState === 'recorded' && recordedUrl ? (
            <video
              src={recordedUrl}
              controls
              className="w-full aspect-video bg-black rounded-lg"
            />
          ) : (
            <div className="relative">
              <video
                ref={videoRef}
                autoPlay
                muted
                playsInline
                className="w-full aspect-video bg-black rounded-lg mirror"
              />
              {recordingState === 'recording' && (
                <div className="absolute top-4 left-4 flex items-center gap-2 px-3 py-1.5 rounded-full bg-red-500 text-white text-sm font-medium">
                  <Circle className="w-3 h-3 fill-current animate-pulse" />
                  {formatTime(duration)}
                </div>
              )}
            </div>
          )}

          {recordingState === 'recorded' && (
            <div className="space-y-2">
              <Label>Titel (optional)</Label>
              <Input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder={`Aufnahme vom ${new Date().toLocaleDateString('de-DE')}`}
              />
            </div>
          )}

          <div className="flex justify-center gap-3 pt-2">
            {recordingState === 'idle' && (
              <Button 
                onClick={startRecording} 
                className="gap-2 bg-accent hover:bg-accent/90"
                disabled={!!error}
              >
                <Circle className="w-4 h-4" />
                Aufnahme starten
              </Button>
            )}
            
            {recordingState === 'recording' && (
              <Button 
                onClick={stopRecording} 
                variant="destructive"
                className="gap-2"
              >
                <Square className="w-4 h-4" />
                Aufnahme beenden
              </Button>
            )}
            
            {recordingState === 'recorded' && (
              <>
                <Button 
                  onClick={resetRecording} 
                  variant="outline"
                  className="gap-2"
                >
                  <RotateCcw className="w-4 h-4" />
                  Neu aufnehmen
                </Button>
                <Button 
                  onClick={handleSave} 
                  className="gap-2"
                >
                  <Save className="w-4 h-4" />
                  Speichern
                </Button>
              </>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
