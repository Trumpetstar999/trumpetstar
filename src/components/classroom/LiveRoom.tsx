import { useState, useRef, useEffect, useCallback } from 'react';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { 
  Mic, MicOff, Video, VideoOff, PhoneOff, Users, 
  Copy, Check, Settings, MoreVertical 
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

interface LiveRoomProps {
  open: boolean;
  onClose: () => void;
  room: {
    id: string;
    title: string;
    visibility: string;
    isRecording: boolean;
  };
}

export function LiveRoom({ open, onClose, room }: LiveRoomProps) {
  const [isMuted, setIsMuted] = useState(false);
  const [isVideoOff, setIsVideoOff] = useState(false);
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const startMedia = useCallback(async () => {
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
      console.error('Media access error:', err);
      setError('Kamera/Mikrofon-Zugriff nicht möglich. Bitte erlaube den Zugriff.');
    }
  }, []);

  const stopMedia = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
  }, []);

  const toggleMute = () => {
    if (streamRef.current) {
      streamRef.current.getAudioTracks().forEach(track => {
        track.enabled = isMuted;
      });
    }
    setIsMuted(!isMuted);
  };

  const toggleVideo = () => {
    if (streamRef.current) {
      streamRef.current.getVideoTracks().forEach(track => {
        track.enabled = isVideoOff;
      });
    }
    setIsVideoOff(!isVideoOff);
  };

  const handleLeave = () => {
    stopMedia();
    onClose();
    toast.success('Du hast den Raum verlassen');
  };

  const copyLink = async () => {
    const link = `${window.location.origin}/classroom/${room.id}`;
    await navigator.clipboard.writeText(link);
    setCopied(true);
    toast.success('Link kopiert!');
    setTimeout(() => setCopied(false), 2000);
  };

  useEffect(() => {
    if (open) {
      startMedia();
    }
    return () => {
      if (!open) {
        stopMedia();
      }
    };
  }, [open, startMedia, stopMedia]);

  useEffect(() => {
    return () => {
      stopMedia();
    };
  }, [stopMedia]);

  if (!open) return null;

  return (
    <Dialog open={open} onOpenChange={(isOpen) => !isOpen && handleLeave()}>
      <DialogContent className="max-w-6xl h-[85vh] p-0 gap-0">
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-border">
          <div className="flex items-center gap-3">
            <h2 className="font-semibold text-foreground">{room.title}</h2>
            {room.isRecording && (
              <span className="flex items-center gap-1.5 px-2 py-1 rounded-full bg-red-500/10 text-red-500 text-xs font-medium">
                <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
                Aufnahme
              </span>
            )}
          </div>
          
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={copyLink} className="gap-2">
              {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
              Link teilen
            </Button>
            <Button variant="ghost" size="icon">
              <Users className="w-5 h-5" />
            </Button>
          </div>
        </div>

        {/* Video Grid */}
        <div className="flex-1 p-4 bg-muted/30">
          <div className="h-full flex items-center justify-center">
            {error ? (
              <div className="text-center p-6">
                <Video className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground mb-4">{error}</p>
                <Button onClick={startMedia}>Erneut versuchen</Button>
              </div>
            ) : (
              <div className="relative w-full max-w-3xl aspect-video bg-black rounded-xl overflow-hidden">
                <video
                  ref={videoRef}
                  autoPlay
                  muted
                  playsInline
                  className={cn(
                    'w-full h-full object-cover mirror',
                    isVideoOff && 'hidden'
                  )}
                />
                {isVideoOff && (
                  <div className="absolute inset-0 flex items-center justify-center bg-muted">
                    <div className="w-24 h-24 rounded-full bg-primary flex items-center justify-center">
                      <span className="text-3xl font-bold text-primary-foreground">DU</span>
                    </div>
                  </div>
                )}
                
                {/* Name Badge */}
                <div className="absolute bottom-3 left-3 px-3 py-1.5 rounded-lg bg-black/60 text-white text-sm font-medium">
                  Du {isMuted && <MicOff className="w-3 h-3 inline ml-1" />}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Controls */}
        <div className="flex items-center justify-center gap-4 px-4 py-4 border-t border-border bg-card">
          <Button
            variant={isMuted ? 'destructive' : 'secondary'}
            size="lg"
            className="rounded-full w-14 h-14"
            onClick={toggleMute}
          >
            {isMuted ? <MicOff className="w-6 h-6" /> : <Mic className="w-6 h-6" />}
          </Button>
          
          <Button
            variant={isVideoOff ? 'destructive' : 'secondary'}
            size="lg"
            className="rounded-full w-14 h-14"
            onClick={toggleVideo}
          >
            {isVideoOff ? <VideoOff className="w-6 h-6" /> : <Video className="w-6 h-6" />}
          </Button>
          
          <Button
            variant="destructive"
            size="lg"
            className="rounded-full w-14 h-14"
            onClick={handleLeave}
          >
            <PhoneOff className="w-6 h-6" />
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
