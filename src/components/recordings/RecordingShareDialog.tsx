import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { useVideoChat } from '@/hooks/useVideoChat';
import { Loader2, Send, Music, UserCheck, AlertCircle } from 'lucide-react';

interface RecordingShareDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  videoId: string;
  videoTitle: string;
  shareType: 'admin' | 'teacher';
  onSuccess?: (chatId: string) => void;
}

export function RecordingShareDialog({
  open,
  onOpenChange,
  videoId,
  videoTitle,
  shareType,
  onSuccess
}: RecordingShareDialogProps) {
  const { sendFeedbackToAdmin, sendToTeacher, teacherAssignment } = useVideoChat();
  const [message, setMessage] = useState('');
  const [sending, setSending] = useState(false);

  const handleSubmit = async () => {
    setSending(true);
    
    let chatId: string | null = null;
    if (shareType === 'admin') {
      chatId = await sendFeedbackToAdmin(videoId, message);
    } else {
      chatId = await sendToTeacher(videoId, message);
    }

    setSending(false);
    
    if (chatId) {
      onOpenChange(false);
      setMessage('');
      onSuccess?.(chatId);
    }
  };

  const isTeacherShare = shareType === 'teacher';
  const hasTeacher = !!teacherAssignment;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[440px] p-0 gap-0 overflow-hidden border-border/50 bg-card">
        {/* Header */}
        <DialogHeader className="px-6 pt-6 pb-4">
          <DialogTitle className="text-lg font-semibold text-foreground">
            {isTeacherShare ? 'An meinen Lehrer senden' : 'Feedback an Admin senden'}
          </DialogTitle>
        </DialogHeader>

        <div className="px-6 pb-6 space-y-5">
          {/* Video info */}
          <div className="flex items-start gap-3 p-3.5 rounded-lg bg-muted/50 border border-border/40">
            <Music className="w-4 h-4 text-muted-foreground mt-0.5 flex-shrink-0" />
            <div className="min-w-0">
              <p className="text-xs text-muted-foreground mb-0.5">Video</p>
              <p className="text-sm font-medium text-foreground leading-snug">{videoTitle}</p>
            </div>
          </div>

          {/* Teacher info */}
          {isTeacherShare && (
            hasTeacher ? (
              <div className="flex items-center gap-3 p-3.5 rounded-lg bg-primary/5 border border-primary/15">
                <UserCheck className="w-4 h-4 text-primary flex-shrink-0" />
                <div>
                  <p className="text-xs text-muted-foreground mb-0.5">Empfänger</p>
                  <p className="text-sm font-medium text-foreground">
                    {teacherAssignment?.teacher_profile?.display_name || 'Dein Lehrer'}
                  </p>
                </div>
              </div>
            ) : (
              <div className="flex items-center gap-3 p-3.5 rounded-lg bg-destructive/5 border border-destructive/20">
                <AlertCircle className="w-4 h-4 text-destructive flex-shrink-0" />
                <p className="text-sm text-destructive">
                  Dir ist noch kein Lehrer zugewiesen. Bitte kontaktiere einen Admin.
                </p>
              </div>
            )
          )}

          {/* Message input */}
          <div className="space-y-2">
            <label htmlFor="share-message" className="text-sm font-medium text-foreground">
              {isTeacherShare ? 'Nachricht (optional)' : 'Wobei wünschst du dir Feedback?'}
            </label>
            <Textarea
              id="share-message"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder={
                isTeacherShare
                  ? 'z.B. Kannst du dir mal mein neues Stück anhören?'
                  : 'z.B. Was ist dir schwer gefallen? Was möchtest du verbessern?'
              }
              rows={3}
              className="resize-none bg-background border-border/60 focus-visible:ring-primary/30"
            />
          </div>

          {/* Privacy note */}
          <p className="text-xs text-muted-foreground/70 flex items-center gap-1.5">
            <span>🔒</span>
            Dein Video wird nur mit {isTeacherShare ? 'deinem Lehrer' : 'dem Admin'} geteilt.
          </p>

          {/* Actions */}
          <div className="flex justify-end gap-2.5 pt-1">
            <Button
              variant="ghost"
              onClick={() => onOpenChange(false)}
              className="text-muted-foreground hover:text-foreground"
            >
              Abbrechen
            </Button>
            <Button
              onClick={handleSubmit}
              disabled={sending || (isTeacherShare && !hasTeacher)}
              className="gap-2"
            >
              {sending ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Senden…
                </>
              ) : (
                <>
                  <Send className="w-4 h-4" />
                  Senden
                </>
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
