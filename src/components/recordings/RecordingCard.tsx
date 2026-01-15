import { useState } from 'react';
import { Play, MoreVertical, Trash2, Share2, Download } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import type { Recording } from '@/hooks/useRecordings';

interface RecordingCardProps {
  recording: Recording;
  onDelete: (id: string) => void;
  onPlay: (recording: Recording) => void;
}

export function RecordingCard({ recording, onDelete, onPlay }: RecordingCardProps) {
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('de-DE', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
  };

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const handleDownload = () => {
    const a = document.createElement('a');
    a.href = recording.url;
    a.download = `${recording.title}.webm`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  return (
    <>
      <div className="group relative bg-card rounded-xl overflow-hidden border border-border hover:border-primary/50 transition-all">
        <div 
          className="aspect-video bg-muted relative cursor-pointer"
          onClick={() => onPlay(recording)}
        >
          {recording.thumbnail ? (
            <img 
              src={recording.thumbnail} 
              alt={recording.title}
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-muted to-muted/50">
              <Play className="w-12 h-12 text-muted-foreground" />
            </div>
          )}
          
          <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors flex items-center justify-center">
            <div className="w-14 h-14 rounded-full bg-primary/90 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
              <Play className="w-6 h-6 text-primary-foreground ml-1" />
            </div>
          </div>
          
          <div className="absolute bottom-2 right-2 px-2 py-1 rounded bg-black/70 text-white text-xs font-medium">
            {formatDuration(recording.duration)}
          </div>
        </div>
        
        <div className="p-4">
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0 flex-1">
              <h3 className="font-medium text-foreground truncate">{recording.title}</h3>
              <p className="text-sm text-muted-foreground">{formatDate(recording.createdAt)}</p>
            </div>
            
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="h-8 w-8">
                  <MoreVertical className="w-4 h-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={handleDownload}>
                  <Download className="w-4 h-4 mr-2" />
                  Herunterladen
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setDeleteDialogOpen(true)} className="text-destructive">
                  <Trash2 className="w-4 h-4 mr-2" />
                  Löschen
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </div>

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Aufnahme löschen?</AlertDialogTitle>
            <AlertDialogDescription>
              Diese Aktion kann nicht rückgängig gemacht werden. Die Aufnahme "{recording.title}" wird dauerhaft gelöscht.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Abbrechen</AlertDialogCancel>
            <AlertDialogAction onClick={() => onDelete(recording.id)} className="bg-destructive hover:bg-destructive/90">
              Löschen
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
