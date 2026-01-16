import { forwardRef, ReactNode } from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { GripVertical } from 'lucide-react';
import { cn } from '@/lib/utils';
import { WidgetId } from '@/hooks/useDashboardLayout';

interface DashboardWidgetProps {
  id: WidgetId;
  title?: string;
  children: ReactNode;
  className?: string;
  isEditing?: boolean;
  noPadding?: boolean;
}

export const DashboardWidget = forwardRef<HTMLDivElement, DashboardWidgetProps>(
  ({ id, title, children, className, isEditing, noPadding }, ref) => {
    const {
      attributes,
      listeners,
      setNodeRef,
      transform,
      transition,
      isDragging,
    } = useSortable({ 
      id,
      disabled: !isEditing,
    });

    const style = {
      transform: CSS.Transform.toString(transform),
      transition,
    };

    return (
      <div
        ref={setNodeRef}
        style={style}
        className={cn(
          "card-glass rounded-[var(--card-radius)] overflow-hidden transition-all duration-200",
          isDragging && "opacity-50 scale-[1.02] shadow-2xl z-50",
          isEditing && "ring-2 ring-white/20 cursor-grab active:cursor-grabbing",
          className
        )}
      >
        {isEditing && (
          <div
            {...attributes}
            {...listeners}
            className="flex items-center justify-center gap-2 py-2 bg-white/5 border-b border-white/10 cursor-grab active:cursor-grabbing"
          >
            <GripVertical className="w-4 h-4 text-white/50" />
            <span className="text-xs text-white/50 font-medium uppercase tracking-wide">
              {title || id}
            </span>
            <GripVertical className="w-4 h-4 text-white/50" />
          </div>
        )}
        <div className={cn(!noPadding && "p-5")}>
          {children}
        </div>
      </div>
    );
  }
);

DashboardWidget.displayName = 'DashboardWidget';
