import { Todo } from '@/types';
import { Checkbox } from '@/components/ui/checkbox';
import { Calendar, Flag, MoreVertical } from 'lucide-react';
import { cn } from '@/lib/utils';

interface TodoItemProps {
  todo: Todo;
  onToggle: () => void;
}

const priorityConfig: Record<Todo['priority'], { color: string; bgColor: string; label: string }> = {
  high: { color: 'text-accent', bgColor: 'bg-accent/10', label: 'Hoch' },
  medium: { color: 'text-gold', bgColor: 'bg-gold/10', label: 'Mittel' },
  low: { color: 'text-muted-foreground', bgColor: 'bg-muted/50', label: 'Niedrig' },
};

export function TodoItem({ todo, onToggle }: TodoItemProps) {
  const formatDate = (dateStr?: string) => {
    if (!dateStr) return null;
    const date = new Date(dateStr);
    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    
    if (date.toDateString() === today.toDateString()) {
      return 'Heute';
    } else if (date.toDateString() === tomorrow.toDateString()) {
      return 'Morgen';
    }
    
    return date.toLocaleDateString('de-DE', { day: 'numeric', month: 'short' });
  };

  const isOverdue = todo.dueDate && new Date(todo.dueDate) < new Date() && !todo.completed;
  const priority = priorityConfig[todo.priority];

  return (
    <div className={cn(
      'group flex items-start gap-3 p-3 rounded-xl bg-card/50 backdrop-blur-sm border border-border/50 transition-all duration-200',
      todo.completed ? 'opacity-60' : 'hover:border-primary/30 hover:shadow-md'
    )}>
      {/* Checkbox */}
      <div className="pt-0.5">
        <Checkbox
          checked={todo.completed}
          onCheckedChange={onToggle}
          className={cn(
            'w-5 h-5 rounded-md border-2 transition-all',
            todo.completed 
              ? 'bg-green-500 border-green-500' 
              : 'border-border hover:border-primary'
          )}
        />
      </div>
      
      {/* Content */}
      <div className="flex-1 min-w-0">
        <p className={cn(
          'font-medium text-foreground leading-tight',
          todo.completed && 'line-through text-muted-foreground'
        )}>
          {todo.title}
        </p>
        
        {todo.notes && (
          <p className="text-sm text-muted-foreground mt-0.5 line-clamp-1">
            {todo.notes}
          </p>
        )}
        
        {/* Meta Info */}
        <div className="flex items-center gap-3 mt-2">
          {todo.dueDate && (
            <div className={cn(
              'flex items-center gap-1 text-xs px-2 py-0.5 rounded-md',
              isOverdue 
                ? 'bg-accent/10 text-accent' 
                : 'bg-muted/50 text-muted-foreground'
            )}>
              <Calendar className="w-3 h-3" />
              <span>{formatDate(todo.dueDate)}</span>
            </div>
          )}
          
          <div className={cn(
            'flex items-center gap-1 text-xs px-2 py-0.5 rounded-md',
            priority.bgColor,
            priority.color
          )}>
            <Flag className="w-3 h-3" />
            <span>{priority.label}</span>
          </div>
        </div>
      </div>
      
      {/* Actions */}
      <button className="p-1.5 rounded-lg opacity-0 group-hover:opacity-100 hover:bg-muted text-muted-foreground transition-all">
        <MoreVertical className="w-4 h-4" />
      </button>
    </div>
  );
}
