import { useState } from 'react';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  TouchSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from '@dnd-kit/core';
import {
  SortableContext,
  sortableKeyboardCoordinates,
  rectSortingStrategy,
} from '@dnd-kit/sortable';
import { Button } from '@/components/ui/button';
import { GripVertical, RotateCcw, Pencil, X } from 'lucide-react';
import { useDashboardLayout, WidgetId } from '@/hooks/useDashboardLayout';
import { DashboardWidget } from '@/components/dashboard/DashboardWidget';
import { ProfileWidget } from '@/components/dashboard/widgets/ProfileWidget';
import { StarsProgressWidget } from '@/components/dashboard/widgets/StarsProgressWidget';
import { WeeklyStarsWidget } from '@/components/dashboard/widgets/WeeklyStarsWidget';
import { RecordingsWidget } from '@/components/dashboard/widgets/RecordingsWidget';
import { NotesTodosWidget } from '@/components/dashboard/widgets/NotesTodosWidget';
import { FeedbackChatWidget } from '@/components/dashboard/widgets/FeedbackChatWidget';
import { ClassroomWidget } from '@/components/dashboard/widgets/ClassroomWidget';
import { StatisticsWidget } from '@/components/dashboard/widgets/StatisticsWidget';

const WIDGET_TITLES: Record<WidgetId, string> = {
  'profile': 'Profil',
  'stars-progress': 'Sterne & Fortschritt',
  'calendar': 'Wochenübersicht',
  'recordings': 'Meine Aufnahmen',
  'notes-todo': 'Notizen & To-Do',
  'feedback-chat': 'Feedback & Chat',
  'classroom': 'Klassenzimmer',
  'statistics': 'Statistik',
  'recent-videos': 'Zuletzt gespielt',
  'weekly-goals': 'Wochenziele',
};

function WidgetContent({ id }: { id: WidgetId }) {
  switch (id) {
    case 'profile':
      return <ProfileWidget />;
    case 'stars-progress':
      return <StarsProgressWidget />;
    case 'calendar':
      return <WeeklyStarsWidget />;
    case 'recordings':
      return <RecordingsWidget />;
    case 'notes-todo':
      return <NotesTodosWidget />;
    case 'feedback-chat':
      return <FeedbackChatWidget />;
    case 'classroom':
      return <ClassroomWidget />;
    case 'statistics':
      return <StatisticsWidget />;
    default:
      return <div className="text-white/50 text-center py-8">Widget kommt bald...</div>;
  }
}

export function ProfilePage() {
  const {
    visibleWidgets,
    isEditing,
    setIsEditing,
    reorderWidgets,
    resetLayout,
  } = useDashboardLayout();

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        delay: 150,
        tolerance: 5,
      },
    }),
    useSensor(TouchSensor, {
      activationConstraint: {
        delay: 200,
        tolerance: 5,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    
    if (over && active.id !== over.id) {
      reorderWidgets(active.id as WidgetId, over.id as WidgetId);
    }
  };

  return (
    <div className="h-full overflow-auto px-4 py-6 lg:px-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-white">Dashboard</h1>
          <p className="text-white/60 text-sm">Dein persönlicher Überblick</p>
        </div>
        
        <div className="flex items-center gap-2">
          {isEditing && (
            <Button
              onClick={resetLayout}
              variant="ghost"
              size="sm"
              className="text-white/60 hover:text-white hover:bg-white/10"
            >
              <RotateCcw className="w-4 h-4 mr-2" />
              Zurücksetzen
            </Button>
          )}
          
          <Button
            onClick={() => setIsEditing(!isEditing)}
            variant={isEditing ? 'default' : 'ghost'}
            size="sm"
            className={isEditing 
              ? 'bg-accent-red hover:bg-accent-red/90 text-white' 
              : 'text-white/60 hover:text-white hover:bg-white/10'
            }
          >
            {isEditing ? (
              <>
                <X className="w-4 h-4 mr-2" />
                Fertig
              </>
            ) : (
              <>
                <Pencil className="w-4 h-4 mr-2" />
                Anordnen
              </>
            )}
          </Button>
        </div>
      </div>

      {/* Edit Mode Hint */}
      {isEditing && (
        <div className="mb-4 p-3 rounded-xl bg-white/5 border border-white/10 animate-fade-in">
          <div className="flex items-center gap-2 text-white/70 text-sm">
            <GripVertical className="w-4 h-4" />
            <span>Halte eine Kachel gedrückt und ziehe sie, um die Reihenfolge zu ändern</span>
          </div>
        </div>
      )}

      {/* Widget Grid */}
      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragEnd={handleDragEnd}
      >
        <SortableContext
          items={visibleWidgets.map(w => w.id)}
          strategy={rectSortingStrategy}
        >
          <div className="grid grid-cols-3 gap-4">
            {visibleWidgets.map((widget) => (
              <DashboardWidget
                key={widget.id}
                id={widget.id}
                title={WIDGET_TITLES[widget.id]}
                isEditing={isEditing}
                className={
                  widget.id === 'profile' 
                    ? 'md:row-span-1' 
                    : widget.id === 'calendar' 
                      ? 'lg:col-span-1' 
                      : ''
                }
              >
                <WidgetContent id={widget.id} />
              </DashboardWidget>
            ))}
          </div>
        </SortableContext>
      </DndContext>

      {/* Footer hint */}
      <p className="text-center text-white/40 text-xs mt-8">
        Du kannst jederzeit zu Premium wechseln – dein Fortschritt bleibt erhalten.
      </p>
    </div>
  );
}
