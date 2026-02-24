import { useNavigate } from 'react-router-dom';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Music, Gamepad2, Sparkles } from 'lucide-react';

interface DailyLimitOverlayProps {
  open: boolean;
  type: 'video' | 'game';
  onClose: () => void;
}

export function DailyLimitOverlay({ open, type, onClose }: DailyLimitOverlayProps) {
  const navigate = useNavigate();

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
            Für heute ist dein Free-Kontingent aufgebraucht 🎺
          </DialogTitle>
          <DialogDescription className="text-center pt-2">
            {isVideo
              ? 'Du hast heute schon drei Videos gesehen! Morgen wartet ein neues Highlight auf dich – oder upgrade jetzt, um ohne Unterbrechung weiterzulernen.'
              : 'Du hast heute schon drei Game-Runs gespielt! Morgen geht dein Streak weiter – oder upgrade jetzt für unbegrenztes Spielen.'}
          </DialogDescription>
        </DialogHeader>

        <div className="flex items-center gap-2 mt-2 p-3 rounded-xl bg-[hsl(var(--reward-gold))]/10 border border-[hsl(var(--reward-gold))]/20">
          <Sparkles className="w-5 h-5 text-[hsl(var(--reward-gold))] flex-shrink-0" />
          <p className="text-sm text-muted-foreground">
            Mit dem Upgrade sicherst du dir ununterbrochenen Fortschritt: unbegrenzte Videos & unbegrenztes Game.
          </p>
        </div>

        <div className="flex flex-col gap-2 mt-4">
          <Button
            onClick={() => {
              onClose();
              navigate('/pricing');
            }}
            className="w-full bg-[hsl(var(--reward-gold))] hover:bg-[hsl(var(--reward-gold))]/90 text-[hsl(var(--gold-foreground))] font-bold"
          >
            Jetzt upgraden
          </Button>
          <Button variant="ghost" onClick={onClose} className="w-full">
            Morgen weitermachen
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
