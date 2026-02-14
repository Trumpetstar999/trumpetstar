import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Switch } from '@/components/ui/switch';
import { Users, Lock, Link2, UserPlus } from 'lucide-react';
import { useLanguage } from '@/hooks/useLanguage';

interface CreateRoomDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCreateRoom: (room: {
    title: string;
    visibility: 'invite-only' | 'friends' | 'link-only';
    maxParticipants: number;
    isRecording: boolean;
  }) => void;
}

export function CreateRoomDialog({ open, onOpenChange, onCreateRoom }: CreateRoomDialogProps) {
  const { t } = useLanguage();
  const [title, setTitle] = useState('');
  const [visibility, setVisibility] = useState<'invite-only' | 'friends' | 'link-only'>('invite-only');
  const [isRecording, setIsRecording] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    onCreateRoom({
      title: title.trim() || t('classroom.roomNamePlaceholder'),
      visibility,
      maxParticipants: 6,
      isRecording,
    });

    setTitle('');
    setVisibility('invite-only');
    setIsRecording(false);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>{t('classroom.createRoom')}</DialogTitle>
          <DialogDescription>
            {t('classroom.createRoomDesc')}
          </DialogDescription>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-6 pt-4">
          <div className="space-y-2">
            <Label>{t('classroom.roomName')}</Label>
            <Input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder={t('classroom.roomNamePlaceholder')}
            />
          </div>

          <div className="space-y-3">
            <Label>{t('classroom.visibility')}</Label>
            <RadioGroup 
              value={visibility} 
              onValueChange={(v) => setVisibility(v as typeof visibility)}
              className="space-y-2"
            >
              <div className="flex items-center space-x-3 p-3 rounded-lg border border-border hover:bg-muted/50 cursor-pointer">
                <RadioGroupItem value="invite-only" id="invite-only" />
                <Label htmlFor="invite-only" className="flex items-center gap-2 cursor-pointer flex-1">
                  <Lock className="w-4 h-4 text-muted-foreground" />
                  <div>
                    <p className="font-medium">{t('classroom.inviteOnly')}</p>
                    <p className="text-sm text-muted-foreground">{t('classroom.inviteOnlyDesc')}</p>
                  </div>
                </Label>
              </div>
              
              <div className="flex items-center space-x-3 p-3 rounded-lg border border-border hover:bg-muted/50 cursor-pointer">
                <RadioGroupItem value="friends" id="friends" />
                <Label htmlFor="friends" className="flex items-center gap-2 cursor-pointer flex-1">
                  <UserPlus className="w-4 h-4 text-muted-foreground" />
                  <div>
                    <p className="font-medium">{t('classroom.friends')}</p>
                    <p className="text-sm text-muted-foreground">{t('classroom.friendsDesc')}</p>
                  </div>
                </Label>
              </div>
              
              <div className="flex items-center space-x-3 p-3 rounded-lg border border-border hover:bg-muted/50 cursor-pointer">
                <RadioGroupItem value="link-only" id="link-only" />
                <Label htmlFor="link-only" className="flex items-center gap-2 cursor-pointer flex-1">
                  <Link2 className="w-4 h-4 text-muted-foreground" />
                  <div>
                    <p className="font-medium">{t('classroom.withLink')}</p>
                    <p className="text-sm text-muted-foreground">{t('classroom.withLinkDesc')}</p>
                  </div>
                </Label>
              </div>
            </RadioGroup>
          </div>

          <div className="flex items-center justify-between p-3 rounded-lg border border-border">
            <div>
              <p className="font-medium">{t('classroom.enableRecording')}</p>
              <p className="text-sm text-muted-foreground">{t('classroom.autoRecord')}</p>
            </div>
            <Switch checked={isRecording} onCheckedChange={setIsRecording} />
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              {t('common.cancel')}
            </Button>
            <Button type="submit">
              {t('classroom.startRoom')}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
