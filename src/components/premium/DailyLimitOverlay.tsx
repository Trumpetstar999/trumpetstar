import { useNavigate } from 'react-router-dom';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Music, Gamepad2 } from 'lucide-react';
import { useLanguage } from '@/hooks/useLanguage';
import { accessCopy } from '@/i18n/access';

interface DailyLimitOverlayProps {
  open: boolean;
  type: 'video' | 'game';
  onClose: () => void;
}

export function DailyLimitOverlay({ open, type, onClose }: DailyLimitOverlayProps) {
  const navigate = useNavigate();
  const { language } = useLanguage();
  const copy = accessCopy[language];

  const isVideo = type === 'video';

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <div className="flex justify-center mb-3">
            <div className="w-14 h-14 rounded-full bg-[hsl(var(--reward-gold))]/20 flex items-center justify-center">
              {isVideo ? (
                <Music className="w-7 h-7 text-[hsl(var(--reward-gold))]" />
              ) : (
                <Gamepad2 className="w-7 h-7 text-[hsl(var(--reward-gold))]" />
              )}
            </div>
          </div>
          <DialogTitle className="text-center text-lg">
            {copy.limit}
          </DialogTitle>
          <DialogDescription className="text-center pt-2">
            {isVideo ? copy.video : copy.game}
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-col gap-2 mt-4">
          <Button
            onClick={() => {
              onClose();
              navigate('/pricing');
            }}
            className="w-full bg-[hsl(var(--reward-gold))] hover:bg-[hsl(var(--reward-gold))]/90 text-[hsl(var(--gold-foreground))] font-bold"
          >
            {copy.upgrade}
          </Button>
          <Button variant="ghost" onClick={onClose} className="w-full">
            {copy.later}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
