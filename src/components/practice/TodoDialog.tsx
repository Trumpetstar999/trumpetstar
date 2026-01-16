import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Todo } from '@/types';
import { cn } from '@/lib/utils';
import { Flag, Calendar } from 'lucide-react';

interface TodoDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: (todo: Omit<Todo, 'id' | 'completed'>) => void;
}

const priorityOptions: { value: Todo['priority']; label: string; icon: string; color: string; bgColor: string }[] = [
  { value: 'high', label: 'Hoch', icon: '🔥', color: 'text-accent border-accent', bgColor: 'bg-accent/10' },
  { value: 'medium', label: 'Mittel', icon: '⚡', color: 'text-gold border-gold', bgColor: 'bg-gold/10' },
  { value: 'low', label: 'Niedrig', icon: '💡', color: 'text-muted-foreground border-border', bgColor: 'bg-muted/30' },
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
      <DialogContent className="sm:max-w-[480px] bg-card border-border/50">
        <DialogHeader>
          <DialogTitle className="text-xl font-semibold">Neue Aufgabe</DialogTitle>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-5 pt-2">
          {/* Title */}
          <div className="space-y-2">
            <Label>Titel *</Label>
            <Input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Was möchtest du üben?"
              required
              className="rounded-xl bg-secondary/30"
            />
          </div>

          {/* Notes */}
          <div className="space-y-2">
            <Label>Notizen (optional)</Label>
            <Textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Zusätzliche Details zur Aufgabe"
              rows={2}
              className="resize-none rounded-xl bg-secondary/30"
            />
          </div>

          {/* Due Date */}
          <div className="space-y-2">
            <Label className="flex items-center gap-2">
              <Calendar className="w-4 h-4 text-muted-foreground" />
              Fällig am (optional)
            </Label>
            <Input
              type="date"
              value={dueDate}
              onChange={(e) => setDueDate(e.target.value)}
              className="rounded-xl bg-secondary/30"
            />
          </div>

          {/* Priority */}
          <div className="space-y-3">
            <Label className="flex items-center gap-2">
              <Flag className="w-4 h-4 text-muted-foreground" />
              Priorität
            </Label>
            <div className="grid grid-cols-3 gap-2">
              {priorityOptions.map((option) => (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => setPriority(option.value)}
                  className={cn(
                    'flex items-center justify-center gap-2 px-4 py-3 rounded-xl border-2 transition-all font-medium',
                    priority === option.value
                      ? `${option.color} ${option.bgColor} shadow-lg`
                      : 'border-border/50 bg-secondary/30 hover:border-muted-foreground text-muted-foreground'
                  )}
                >
                  <span>{option.icon}</span>
                  <span className="text-sm">{option.label}</span>
                </button>
              ))}
            </div>
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
            <Button type="submit" disabled={!title.trim()} className="rounded-xl px-6">
              Speichern
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
