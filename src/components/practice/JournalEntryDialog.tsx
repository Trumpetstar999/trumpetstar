import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { JournalEntry } from '@/types';
import { cn } from '@/lib/utils';
import { Clock, Tag } from 'lucide-react';

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

const quickMinuteOptions = [15, 30, 45, 60, 90];

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
      <DialogContent className="sm:max-w-[480px] bg-card border-border/50">
        <DialogHeader>
          <DialogTitle className="text-xl font-semibold">Neuer Journal-Eintrag</DialogTitle>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-5 pt-2">
          {/* Duration */}
          <div className="space-y-3">
            <Label className="flex items-center gap-2">
              <Clock className="w-4 h-4 text-primary" />
              Übungszeit (Minuten)
            </Label>
            <div className="flex gap-2 flex-wrap">
              {quickMinuteOptions.map((mins) => (
                <button
                  key={mins}
                  type="button"
                  onClick={() => setMinutes(String(mins))}
                  className={cn(
                    'px-4 py-2 rounded-xl font-medium text-sm transition-all',
                    parseInt(minutes) === mins
                      ? 'bg-primary text-primary-foreground shadow-lg'
                      : 'bg-secondary hover:bg-secondary/80 text-secondary-foreground'
                  )}
                >
                  {mins}
                </button>
              ))}
              <Input
                type="number"
                min="1"
                value={minutes}
                onChange={(e) => setMinutes(e.target.value)}
                placeholder="Andere"
                className="w-24 text-center rounded-xl"
              />
            </div>
          </div>

          {/* Mood */}
          <div className="space-y-3">
            <Label>Wie war deine Übung?</Label>
            <div className="grid grid-cols-5 gap-2">
              {moodOptions.map((option) => (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => setMood(option.value)}
                  className={cn(
                    'flex flex-col items-center gap-1.5 p-3 rounded-xl border-2 transition-all',
                    mood === option.value
                      ? 'border-primary bg-primary/10 shadow-lg'
                      : 'border-border/50 bg-secondary/30 hover:border-primary/50'
                  )}
                >
                  <span className="text-2xl">{option.emoji}</span>
                  <span className="text-xs text-muted-foreground font-medium">{option.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Notes */}
          <div className="space-y-2">
            <Label>Notizen (optional)</Label>
            <Textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Was hast du heute geübt? Was lief gut, was nicht?"
              rows={3}
              className="resize-none rounded-xl bg-secondary/30"
            />
          </div>

          {/* Tags */}
          <div className="space-y-2">
            <Label className="flex items-center gap-2">
              <Tag className="w-4 h-4 text-muted-foreground" />
              Tags (optional, mit Komma trennen)
            </Label>
            <Input
              value={tagsInput}
              onChange={(e) => setTagsInput(e.target.value)}
              placeholder="z.B. Tonleitern, Warm-up, Fortschritt"
              className="rounded-xl bg-secondary/30"
            />
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-3 pt-3">
            <Button 
              type="button" 
              variant="outline" 
              onClick={() => onOpenChange(false)}
              className="rounded-xl"
            >
              Abbrechen
            </Button>
            <Button type="submit" className="rounded-xl px-6">
              Speichern
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
