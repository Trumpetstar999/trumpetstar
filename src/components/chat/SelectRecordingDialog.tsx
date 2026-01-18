import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useRecordings, Recording } from '@/hooks/useRecordings';
import { Loader2, Play, Clock, Check } from 'lucide-react';
import { format } from 'date-fns';

interface SelectRecordingDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSelect: (recording: Recording) => void;
}

function formatDuration(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs.toString().padStart(2, '0')}`;
}

export function SelectRecordingDialog({ open, onOpenChange, onSelect }: SelectRecordingDialogProps) {
  const { recordings, loading } = useRecordings();
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const handleConfirm = () => {
    const selected = recordings.find(r => r.id === selectedId);
    if (selected) {
      onSelect(selected);
      onOpenChange(false);
      setSelectedId(null);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px] max-h-[80vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>Aufnahme auswählen</DialogTitle>
        </DialogHeader>

        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
          </div>
        ) : recordings.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <p className="text-muted-foreground">Keine Aufnahmen vorhanden</p>
            <p className="text-sm text-muted-foreground/70 mt-1">
              Erstelle zuerst eine Aufnahme im Aufnahmen-Tab
            </p>
          </div>
        ) : (
          <>
            <ScrollArea className="flex-1 max-h-[400px] -mx-6 px-6">
              <div className="space-y-2 pb-4">
                {recordings.map((recording) => (
                  <button
                    key={recording.id}
                    onClick={() => setSelectedId(recording.id)}
                    className={`w-full flex items-center gap-3 p-3 rounded-lg border transition-all text-left ${
                      selectedId === recording.id
                        ? 'border-primary bg-primary/5 ring-2 ring-primary/20'
                        : 'border-border hover:bg-muted/50'
                    }`}
                  >
                    {/* Thumbnail / Play Icon */}
                    <div className="relative w-16 h-12 bg-muted rounded overflow-hidden flex-shrink-0">
                      {recording.url ? (
                        <video
                          src={recording.url}
                          className="w-full h-full object-cover"
                          muted
                          preload="metadata"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <Play className="w-5 h-5 text-muted-foreground" />
                        </div>
                      )}
                      <div className="absolute inset-0 bg-black/20 flex items-center justify-center">
                        <Play className="w-4 h-4 text-white" />
                      </div>
                    </div>

                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-sm truncate">{recording.title}</p>
                      <div className="flex items-center gap-3 text-xs text-muted-foreground mt-0.5">
                        <span className="flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          {formatDuration(recording.duration)}
                        </span>
                        <span>{format(new Date(recording.createdAt), 'dd.MM.yyyy')}</span>
                      </div>
                    </div>

                    {/* Selected Indicator */}
                    {selectedId === recording.id && (
                      <div className="w-6 h-6 rounded-full bg-primary flex items-center justify-center flex-shrink-0">
                        <Check className="w-4 h-4 text-primary-foreground" />
                      </div>
                    )}
                  </button>
                ))}
              </div>
            </ScrollArea>

            <div className="flex justify-end gap-2 pt-4 border-t">
              <Button variant="outline" onClick={() => onOpenChange(false)}>
                Abbrechen
              </Button>
              <Button onClick={handleConfirm} disabled={!selectedId}>
                Senden
              </Button>
            </div>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
