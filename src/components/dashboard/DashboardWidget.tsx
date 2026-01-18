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
  index?: number;
}

export const DashboardWidget = forwardRef<HTMLDivElement, DashboardWidgetProps>(
  ({ id, title, children, className, isEditing, noPadding, index = 0 }, ref) => {
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
      animationDelay: `${index * 80}ms`,
    };

    return (
      <div
        ref={setNodeRef}
        style={style}
        className={cn(
          // Base styles
          "bg-white/10 backdrop-blur-md border border-white/20 rounded-2xl overflow-hidden shadow-lg",
          // Animation on mount
          "animate-fade-in opacity-0 [animation-fill-mode:forwards]",
          // Hover effects (when not editing)
          !isEditing && "hover:bg-white/[0.14] hover:border-white/30 hover:shadow-xl hover:scale-[1.01] hover:-translate-y-0.5",
          // Smooth transitions
          "transition-all duration-300 ease-out",
          // Dragging state
          isDragging && "opacity-50 scale-[1.02] shadow-2xl z-50 rotate-1",
          // Editing state
          isEditing && "ring-2 ring-white/30 cursor-grab active:cursor-grabbing animate-pulse-subtle",
          className
        )}
      >
        {isEditing && (
          <div
            {...attributes}
            {...listeners}
            className="flex items-center justify-center gap-2 py-2 bg-white/10 border-b border-white/20 cursor-grab active:cursor-grabbing transition-colors hover:bg-white/20"
          >
            <GripVertical className="w-4 h-4 text-white/70" />
            <span className="text-xs text-white/70 font-medium uppercase tracking-wide">
              {title || id}
            </span>
            <GripVertical className="w-4 h-4 text-white/70" />
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
