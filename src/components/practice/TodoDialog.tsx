import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Todo } from '@/types';
import { cn } from '@/lib/utils';
import { Flag } from 'lucide-react';

interface TodoDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: (todo: Omit<Todo, 'id' | 'completed'>) => void;
}

const priorityOptions: { value: Todo['priority']; label: string; color: string }[] = [
  { value: 'high', label: 'Hoch', color: 'text-accent border-accent' },
  { value: 'medium', label: 'Mittel', color: 'text-gold border-gold' },
  { value: 'low', label: 'Niedrig', color: 'text-muted-foreground border-muted-foreground' },
];

export function TodoDialog({ open, onOpenChange, onSave }: TodoDialogProps) {
  const [title, setTitle] = useState('');
  const [notes, setNotes] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [priority, setPriority] = useState<Todo['priority']>('medium');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!title.trim()) return;

    onSave({
      title: title.trim(),
      notes: notes.trim() || undefined,
      dueDate: dueDate || undefined,
      priority,
    });

    // Reset form
    setTitle('');
    setNotes('');
    setDueDate('');
    setPriority('medium');
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Neue Aufgabe</DialogTitle>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-6 pt-4">
          <div className="space-y-2">
            <Label>Titel *</Label>
            <Input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Was möchtest du üben?"
              required
            />
          </div>

          <div className="space-y-2">
            <Label>Notizen (optional)</Label>
            <Textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Zusätzliche Details zur Aufgabe"
              rows={2}
            />
          </div>

          <div className="space-y-2">
            <Label>Fällig am (optional)</Label>
            <Input
              type="date"
              value={dueDate}
              onChange={(e) => setDueDate(e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label>Priorität</Label>
            <div className="flex gap-2">
              {priorityOptions.map((option) => (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => setPriority(option.value)}
                  className={cn(
                    'flex items-center gap-2 px-4 py-2 rounded-lg border-2 transition-all flex-1 justify-center',
                    priority === option.value
                      ? `${option.color} bg-primary/5`
                      : 'border-border hover:border-muted-foreground text-muted-foreground'
                  )}
                >
                  <Flag className="w-4 h-4" />
                  <span className="text-sm font-medium">{option.label}</span>
                </button>
              ))}
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Abbrechen
            </Button>
            <Button type="submit" disabled={!title.trim()}>
              Speichern
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
