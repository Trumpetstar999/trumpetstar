import { Todo } from '@/types';
import { Checkbox } from '@/components/ui/checkbox';
import { Calendar, Flag } from 'lucide-react';
import { cn } from '@/lib/utils';

interface TodoItemProps {
  todo: Todo;
  onToggle: () => void;
}

const priorityColors: Record<Todo['priority'], string> = {
  high: 'text-accent',
  medium: 'text-gold',
  low: 'text-muted-foreground',
};

const priorityLabels: Record<Todo['priority'], string> = {
  high: 'Hoch',
  medium: 'Mittel',
  low: 'Niedrig',
};

export function TodoItem({ todo, onToggle }: TodoItemProps) {
  const formatDate = (dateStr?: string) => {
    if (!dateStr) return null;
    const date = new Date(dateStr);
    return date.toLocaleDateString('de-DE', { day: 'numeric', month: 'short' });
  };

  return (
    <div className={cn(
      'flex items-start gap-4 p-4 rounded-xl bg-card border border-border transition-all',
      todo.completed && 'opacity-60'
    )}>
      <Checkbox
        checked={todo.completed}
        onCheckedChange={onToggle}
        className="mt-1 w-6 h-6"
      />
      
      <div className="flex-1 min-w-0">
        <p className={cn(
          'font-medium text-foreground',
          todo.completed && 'line-through text-muted-foreground'
        )}>
          {todo.title}
        </p>
        
        {todo.notes && (
          <p className="text-sm text-muted-foreground mt-1">{todo.notes}</p>
        )}
        
        <div className="flex items-center gap-4 mt-2">
          {todo.dueDate && (
            <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
              <Calendar className="w-4 h-4" />
              {formatDate(todo.dueDate)}
            </div>
          )}
          
          <div className={cn('flex items-center gap-1.5 text-sm', priorityColors[todo.priority])}>
            <Flag className="w-4 h-4" />
            {priorityLabels[todo.priority]}
          </div>
        </div>
      </div>
    </div>
  );
}
