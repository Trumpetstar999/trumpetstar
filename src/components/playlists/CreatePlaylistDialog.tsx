import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ListMusic, Sparkles } from 'lucide-react';

interface Level {
  id: string;
  title: string;
}

interface CreatePlaylistDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  levels: Level[];
  defaultLevelId?: string;
  onCreate: (name: string, description?: string, levelId?: string) => Promise<any>;
}

export function CreatePlaylistDialog({ open, onOpenChange, levels, defaultLevelId, onCreate }: CreatePlaylistDialogProps) {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [levelId, setLevelId] = useState(defaultLevelId || '');
  const [isCreating, setIsCreating] = useState(false);

  const handleCreate = async () => {
    if (!name.trim()) return;
    setIsCreating(true);
    const result = await onCreate(name.trim(), description.trim() || undefined, levelId || undefined);
    setIsCreating(false);
    if (result) {
      setName('');
      setDescription('');
      setLevelId(defaultLevelId || '');
      onOpenChange(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md bg-card border-border">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-card-foreground">
            <ListMusic className="w-5 h-5 text-primary" />
            Neue Playlist
          </DialogTitle>
          <DialogDescription>
            Erstelle deinen persönlichen Übeplan
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 pt-2">
          <div>
            <label className="text-sm font-medium text-card-foreground mb-1.5 block">Name *</label>
            <Input
              placeholder="z.B. Meine Lieblingsstücke"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="bg-background border-border"
              autoFocus
            />
          </div>

          <div>
            <label className="text-sm font-medium text-card-foreground mb-1.5 block">Beschreibung</label>
            <Input
              placeholder="Optional: Worum geht's?"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="bg-background border-border"
            />
          </div>

          <div>
            <label className="text-sm font-medium text-card-foreground mb-1.5 block">Level-Zuordnung</label>
            <Select value={levelId} onValueChange={setLevelId}>
              <SelectTrigger className="bg-background border-border">
                <SelectValue placeholder="Keinem Level zuordnen" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">Kein Level</SelectItem>
                {levels.map(level => (
                  <SelectItem key={level.id} value={level.id}>{level.title}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <Button
            onClick={handleCreate}
            disabled={!name.trim() || isCreating}
            className="w-full bg-primary hover:bg-primary/90 text-primary-foreground gap-2"
          >
            <Sparkles className="w-4 h-4" />
            {isCreating ? 'Wird erstellt...' : 'Playlist erstellen'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
