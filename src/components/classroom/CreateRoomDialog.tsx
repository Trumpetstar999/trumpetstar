import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Switch } from '@/components/ui/switch';
import { Users, Lock, Link2, UserPlus } from 'lucide-react';

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
  const [title, setTitle] = useState('');
  const [visibility, setVisibility] = useState<'invite-only' | 'friends' | 'link-only'>('invite-only');
  const [isRecording, setIsRecording] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    onCreateRoom({
      title: title.trim() || 'Mein Übungsraum',
      visibility,
      maxParticipants: 6,
      isRecording,
    });

    // Reset form
    setTitle('');
    setVisibility('invite-only');
    setIsRecording(false);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Neuen Raum erstellen</DialogTitle>
          <DialogDescription>
            Erstelle einen Video-Übungsraum für bis zu 6 Teilnehmer.
          </DialogDescription>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-6 pt-4">
          <div className="space-y-2">
            <Label>Raumname (optional)</Label>
            <Input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Mein Übungsraum"
            />
          </div>

          <div className="space-y-3">
            <Label>Sichtbarkeit</Label>
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
                    <p className="font-medium">Nur auf Einladung</p>
                    <p className="text-sm text-muted-foreground">Nur eingeladene Nutzer können beitreten</p>
                  </div>
                </Label>
              </div>
              
              <div className="flex items-center space-x-3 p-3 rounded-lg border border-border hover:bg-muted/50 cursor-pointer">
                <RadioGroupItem value="friends" id="friends" />
                <Label htmlFor="friends" className="flex items-center gap-2 cursor-pointer flex-1">
                  <UserPlus className="w-4 h-4 text-muted-foreground" />
                  <div>
                    <p className="font-medium">Freunde</p>
                    <p className="text-sm text-muted-foreground">Alle deine Freunde können beitreten</p>
                  </div>
                </Label>
              </div>
              
              <div className="flex items-center space-x-3 p-3 rounded-lg border border-border hover:bg-muted/50 cursor-pointer">
                <RadioGroupItem value="link-only" id="link-only" />
                <Label htmlFor="link-only" className="flex items-center gap-2 cursor-pointer flex-1">
                  <Link2 className="w-4 h-4 text-muted-foreground" />
                  <div>
                    <p className="font-medium">Mit Link</p>
                    <p className="text-sm text-muted-foreground">Jeder mit dem Link kann beitreten</p>
                  </div>
                </Label>
              </div>
            </RadioGroup>
          </div>

          <div className="flex items-center justify-between p-3 rounded-lg border border-border">
            <div>
              <p className="font-medium">Aufnahme aktivieren</p>
              <p className="text-sm text-muted-foreground">Session wird automatisch aufgenommen</p>
            </div>
            <Switch checked={isRecording} onCheckedChange={setIsRecording} />
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Abbrechen
            </Button>
            <Button type="submit">
              Raum starten
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
