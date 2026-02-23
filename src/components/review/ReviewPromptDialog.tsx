import { useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Star, ExternalLink } from 'lucide-react';
import { useReviewPrompt } from '@/hooks/useReviewPrompt';
import { useLanguage } from '@/hooks/useLanguage';

interface ReviewPromptDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function ReviewPromptDialog({ open, onOpenChange }: ReviewPromptDialogProps) {
  const { settings, markCtaClicked, markOptOut, dismissPrompt } = useReviewPrompt();
  const { t } = useLanguage();

  useEffect(() => {
    if (open) {
      // Track shown event handled by parent
    }
  }, [open]);

  const handleReview = async () => {
    await markCtaClicked();
    if (settings?.google_review_url) {
      window.open(settings.google_review_url, '_blank', 'noopener');
    }
    onOpenChange(false);
  };

  const handleLater = async () => {
    await dismissPrompt();
    onOpenChange(false);
  };

  const handleOptOut = async () => {
    await markOptOut();
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <div className="flex justify-center mb-2">
            <div className="w-14 h-14 rounded-2xl bg-amber-100 flex items-center justify-center">
              <Star className="w-7 h-7 text-amber-500" />
            </div>
          </div>
          <DialogTitle className="text-center">{t('review.promptTitle')}</DialogTitle>
        </DialogHeader>

        <p className="text-center text-sm text-muted-foreground">
          {t('review.promptDescription')}
        </p>

        <div className="flex flex-col gap-2 mt-2">
          <Button onClick={handleReview} className="gap-2">
            <ExternalLink className="w-4 h-4" />
            {t('review.ctaButton')}
          </Button>
          <Button variant="outline" onClick={handleLater}>
            {t('review.later')}
          </Button>
          <button
            onClick={handleOptOut}
            className="text-xs text-muted-foreground hover:text-foreground transition-colors py-1"
          >
            {t('review.optout')}
          </button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
