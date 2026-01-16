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
      <DialogContent className="sm:max-w-[480px] bg-white border-0 shadow-2xl rounded-2xl">
        <DialogHeader>
          <DialogTitle className="text-xl font-semibold text-gray-900">Neue Aufgabe</DialogTitle>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-5 pt-2">
          {/* Title */}
          <div className="space-y-2">
            <Label className="text-gray-700">Titel *</Label>
            <Input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Was möchtest du üben?"
              required
              className="rounded-lg bg-gray-50 border-gray-200 text-gray-900 placeholder:text-gray-400"
            />
          </div>

          {/* Notes */}
          <div className="space-y-2">
            <Label className="text-gray-700">Notizen (optional)</Label>
            <Textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Zusätzliche Details zur Aufgabe"
              rows={2}
              className="resize-none rounded-lg bg-gray-50 border-gray-200 text-gray-900 placeholder:text-gray-400"
            />
          </div>

          {/* Due Date */}
          <div className="space-y-2">
            <Label className="flex items-center gap-2 text-gray-700">
              <Calendar className="w-4 h-4 text-gray-500" />
              Fällig am (optional)
            </Label>
            <Input
              type="date"
              value={dueDate}
              onChange={(e) => setDueDate(e.target.value)}
              className="rounded-lg bg-gray-50 border-gray-200 text-gray-900"
            />
          </div>

          {/* Priority */}
          <div className="space-y-3">
            <Label className="flex items-center gap-2 text-gray-700">
              <Flag className="w-4 h-4 text-gray-500" />
              Priorität
            </Label>
            <div className="grid grid-cols-3 gap-2">
              {priorityOptions.map((option) => (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => setPriority(option.value)}
                  className={cn(
                    'flex items-center justify-center gap-2 px-4 py-3 rounded-lg border-2 transition-all font-medium',
                    priority === option.value
                      ? `border-blue-500 bg-blue-50 text-blue-700 shadow-sm`
                      : 'border-gray-200 bg-gray-50 hover:border-gray-300 text-gray-600'
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
              className="rounded-lg border-gray-300 text-gray-700 hover:bg-gray-100"
            >
              Abbrechen
            </Button>
            <Button type="submit" disabled={!title.trim()} className="rounded-lg px-6 bg-blue-600 hover:bg-blue-700 text-white">
              Speichern
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
