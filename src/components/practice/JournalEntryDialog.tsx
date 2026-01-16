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
      <DialogContent className="sm:max-w-[480px] bg-white border-0 shadow-2xl rounded-2xl">
        <DialogHeader>
          <DialogTitle className="text-xl font-semibold text-gray-900">Neuer Journal-Eintrag</DialogTitle>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-5 pt-2">
          {/* Duration */}
          <div className="space-y-3">
            <Label className="flex items-center gap-2 text-gray-700">
              <Clock className="w-4 h-4 text-gray-500" />
              Übungszeit (Minuten)
            </Label>
            <div className="flex gap-2 flex-wrap">
              {quickMinuteOptions.map((mins) => (
                <button
                  key={mins}
                  type="button"
                  onClick={() => setMinutes(String(mins))}
                  className={cn(
                    'px-4 py-2 rounded-lg font-medium text-sm transition-all',
                    parseInt(minutes) === mins
                      ? 'bg-blue-600 text-white shadow-md'
                      : 'bg-gray-100 hover:bg-gray-200 text-gray-700'
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
                className="w-24 text-center rounded-lg bg-gray-50 border-gray-200 text-gray-900"
              />
            </div>
          </div>

          {/* Mood */}
          <div className="space-y-3">
            <Label className="text-gray-700">Wie war deine Übung?</Label>
            <div className="grid grid-cols-5 gap-2">
              {moodOptions.map((option) => (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => setMood(option.value)}
                  className={cn(
                    'flex flex-col items-center gap-1.5 p-3 rounded-xl border-2 transition-all',
                    mood === option.value
                      ? 'border-blue-500 bg-blue-50 shadow-sm'
                      : 'border-gray-200 bg-gray-50 hover:border-gray-300'
                  )}
                >
                  <span className="text-2xl">{option.emoji}</span>
                  <span className="text-xs text-gray-600 font-medium">{option.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Notes */}
          <div className="space-y-2">
            <Label className="text-gray-700">Notizen (optional)</Label>
            <Textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Was hast du heute geübt? Was lief gut, was nicht?"
              rows={3}
              className="resize-none rounded-lg bg-gray-50 border-gray-200 text-gray-900 placeholder:text-gray-400"
            />
          </div>

          {/* Tags */}
          <div className="space-y-2">
            <Label className="flex items-center gap-2 text-gray-700">
              <Tag className="w-4 h-4 text-gray-500" />
              Tags (optional, mit Komma trennen)
            </Label>
            <Input
              value={tagsInput}
              onChange={(e) => setTagsInput(e.target.value)}
              placeholder="z.B. Tonleitern, Warm-up, Fortschritt"
              className="rounded-lg bg-gray-50 border-gray-200 text-gray-900 placeholder:text-gray-400"
            />
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-3 pt-3">
            <Button 
              type="button" 
              variant="outline" 
              onClick={() => onOpenChange(false)}
              className="rounded-lg border-gray-300 text-gray-700 hover:bg-gray-100"
            >
              Abbrechen
            </Button>
            <Button type="submit" className="rounded-lg px-6 bg-blue-600 hover:bg-blue-700 text-white">
              Speichern
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
