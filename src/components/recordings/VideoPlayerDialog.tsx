import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';

interface VideoPlayerDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  video: {
    title: string;
    url: string;
  } | null;
}

export function VideoPlayerDialog({ open, onOpenChange, video }: VideoPlayerDialogProps) {
  if (!video) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[800px] p-0 overflow-hidden">
        <DialogHeader className="p-4 pb-0">
          <DialogTitle>{video.title}</DialogTitle>
        </DialogHeader>
        <div className="p-4 pt-2">
          <video
            src={video.url}
            controls
            autoPlay
            className="w-full aspect-video bg-black rounded-lg"
          />
        </div>
      </DialogContent>
    </Dialog>
  );
}
