import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { JournalEntry } from '@/types';
import { cn } from '@/lib/utils';

interface JournalEntryDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: (entry: Omit<JournalEntry, 'id'>) => void;
}

const moodOptions: { value: JournalEntry['mood']; emoji: string; label: string }[] = [
  { value: 'great', emoji: '🎉', label: 'Super' },
  { value: 'good', emoji: '😊', label: 'Gut' },
  { value: 'neutral', emoji: '😐', label: 'Okay' },
  { value: 'tired', emoji: '😴', label: 'Müde' },
  { value: 'frustrated', emoji: '😤', label: 'Frustriert' },
];

export function JournalEntryDialog({ open, onOpenChange, onSave }: JournalEntryDialogProps) {
  const [minutes, setMinutes] = useState('30');
  const [mood, setMood] = useState<JournalEntry['mood']>('good');
  const [notes, setNotes] = useState('');
  const [tagsInput, setTagsInput] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const tags = tagsInput
      .split(',')
      .map(t => t.trim())
      .filter(t => t.length > 0);

    onSave({
      date: new Date().toISOString().split('T')[0],
      minutes: parseInt(minutes) || 0,
      mood,
      notes,
      tags,
      linkedVideos: [],
    });

    // Reset form
    setMinutes('30');
    setMood('good');
    setNotes('');
    setTagsInput('');
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Neuer Journal-Eintrag</DialogTitle>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-6 pt-4">
          <div className="space-y-2">
            <Label>Übungszeit (Minuten)</Label>
            <Input
              type="number"
              min="1"
              value={minutes}
              onChange={(e) => setMinutes(e.target.value)}
              placeholder="30"
            />
          </div>

          <div className="space-y-2">
            <Label>Wie war deine Übung?</Label>
            <div className="flex gap-2">
              {moodOptions.map((option) => (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => setMood(option.value)}
                  className={cn(
                    'flex flex-col items-center gap-1 p-3 rounded-lg border-2 transition-all flex-1',
                    mood === option.value
                      ? 'border-primary bg-primary/10'
                      : 'border-border hover:border-muted-foreground'
                  )}
                >
                  <span className="text-2xl">{option.emoji}</span>
                  <span className="text-xs text-muted-foreground">{option.label}</span>
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-2">
            <Label>Notizen (optional)</Label>
            <Textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Was hast du heute geübt? Was lief gut, was nicht?"
              rows={3}
            />
          </div>

          <div className="space-y-2">
            <Label>Tags (optional, mit Komma trennen)</Label>
            <Input
              value={tagsInput}
              onChange={(e) => setTagsInput(e.target.value)}
              placeholder="z.B. Tonleitern, Warm-up, Fortschritt"
            />
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Abbrechen
            </Button>
            <Button type="submit">
              Speichern
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
