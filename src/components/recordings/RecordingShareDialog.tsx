import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { useVideoChat } from '@/hooks/useVideoChat';
import { Loader2, MessageSquare, Shield } from 'lucide-react';

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
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {isTeacherShare ? (
              <>
                <MessageSquare className="w-5 h-5 text-primary" />
                An meinen Lehrer senden
              </>
            ) : (
              <>
                <Shield className="w-5 h-5 text-primary" />
                Feedback an Admin senden
              </>
            )}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Video info */}
          <div className="p-3 bg-muted rounded-lg">
            <p className="text-sm text-muted-foreground">Video:</p>
            <p className="font-medium">{videoTitle}</p>
          </div>

          {/* Teacher info (for teacher share) */}
          {isTeacherShare && (
            <div className="p-3 bg-primary/5 rounded-lg border border-primary/20">
              {hasTeacher ? (
                <>
                  <p className="text-sm text-muted-foreground">Wird gesendet an:</p>
                  <p className="font-medium text-primary">
                    {teacherAssignment?.teacher_profile?.display_name || 'Dein Lehrer'}
                  </p>
                </>
              ) : (
                <p className="text-sm text-destructive">
                  Dir ist noch kein Lehrer zugewiesen. Bitte kontaktiere einen Admin.
                </p>
              )}
            </div>
          )}

          {/* Message input */}
          <div className="space-y-2">
            <Label htmlFor="message">
              {isTeacherShare ? 'Nachricht (optional)' : 'Wobei wünschst du dir Feedback?'}
            </Label>
            <Textarea
              id="message"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder={
                isTeacherShare
                  ? 'z.B. Kannst du dir mal mein neues Stück anhören?'
                  : 'z.B. Was ist dir schwer gefallen? Was möchtest du verbessern?'
              }
              rows={4}
            />
          </div>

          {/* Privacy note */}
          <p className="text-xs text-muted-foreground">
            🔒 Dein Video wird nur mit {isTeacherShare ? 'deinem Lehrer' : 'dem Admin'} geteilt 
            und kann nicht weitergeleitet werden.
          </p>

          {/* Actions */}
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Abbrechen
            </Button>
            <Button
              onClick={handleSubmit}
              disabled={sending || (isTeacherShare && !hasTeacher)}
              className="bg-accent hover:bg-accent/90"
            >
              {sending ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin mr-2" />
                  Wird gesendet...
                </>
              ) : (
                'Senden'
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
