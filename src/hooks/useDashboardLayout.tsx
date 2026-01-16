import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/hooks/useAuth';

export type WidgetId = 
  | 'profile'
  | 'stars-progress'
  | 'calendar'
  | 'recordings'
  | 'notes-todo'
  | 'feedback-chat'
  | 'classroom'
  | 'statistics'
  | 'recent-videos'
  | 'weekly-goals';

export interface WidgetConfig {
  id: WidgetId;
  visible: boolean;
  order: number;
  isPremium?: boolean;
  isOptional?: boolean;
}

const DEFAULT_WIDGETS: WidgetConfig[] = [
  { id: 'profile', visible: true, order: 0 },
  { id: 'stars-progress', visible: true, order: 1 },
  { id: 'calendar', visible: true, order: 2 },
  { id: 'recordings', visible: true, order: 3 },
  { id: 'notes-todo', visible: true, order: 4 },
  { id: 'feedback-chat', visible: true, order: 5, isPremium: true },
  { id: 'classroom', visible: true, order: 6, isPremium: true },
  { id: 'statistics', visible: true, order: 7, isOptional: true },
  { id: 'recent-videos', visible: false, order: 8, isOptional: true },
  { id: 'weekly-goals', visible: false, order: 9, isOptional: true },
];

const STORAGE_KEY = 'dashboard_layout';

export function useDashboardLayout() {
  const { user } = useAuth();
  const [widgets, setWidgets] = useState<WidgetConfig[]>(DEFAULT_WIDGETS);
  const [isEditing, setIsEditing] = useState(false);

  // Load layout from localStorage
  useEffect(() => {
    if (user) {
      const stored = localStorage.getItem(`${STORAGE_KEY}_${user.id}`);
      if (stored) {
        try {
          const parsed = JSON.parse(stored) as WidgetConfig[];
          // Merge with defaults to handle new widgets
          const merged = DEFAULT_WIDGETS.map(defaultWidget => {
            const stored = parsed.find(w => w.id === defaultWidget.id);
            return stored ? { ...defaultWidget, ...stored } : defaultWidget;
          });
          setWidgets(merged);
        } catch (e) {
          console.error('Failed to parse dashboard layout:', e);
        }
      }
    }
  }, [user?.id]);

  // Save layout to localStorage
  const saveLayout = useCallback((newWidgets: WidgetConfig[]) => {
    if (user) {
      localStorage.setItem(`${STORAGE_KEY}_${user.id}`, JSON.stringify(newWidgets));
    }
    setWidgets(newWidgets);
  }, [user?.id]);

  // Reorder widgets
  const reorderWidgets = useCallback((activeId: WidgetId, overId: WidgetId) => {
    const oldIndex = widgets.findIndex(w => w.id === activeId);
    const newIndex = widgets.findIndex(w => w.id === overId);
    
    if (oldIndex === -1 || newIndex === -1) return;
    
    const newWidgets = [...widgets];
    const [removed] = newWidgets.splice(oldIndex, 1);
    newWidgets.splice(newIndex, 0, removed);
    
    // Update order values
    const reordered = newWidgets.map((w, index) => ({ ...w, order: index }));
    saveLayout(reordered);
  }, [widgets, saveLayout]);

  // Toggle widget visibility
  const toggleWidget = useCallback((id: WidgetId, visible: boolean) => {
    const newWidgets = widgets.map(w => 
      w.id === id ? { ...w, visible } : w
    );
    saveLayout(newWidgets);
  }, [widgets, saveLayout]);

  // Reset to default layout
  const resetLayout = useCallback(() => {
    saveLayout(DEFAULT_WIDGETS);
  }, [saveLayout]);

  // Get visible widgets sorted by order
  const visibleWidgets = widgets
    .filter(w => w.visible)
    .sort((a, b) => a.order - b.order);

  // Get optional widgets for settings
  const optionalWidgets = widgets.filter(w => w.isOptional);

  return {
    widgets,
    visibleWidgets,
    optionalWidgets,
    isEditing,
    setIsEditing,
    reorderWidgets,
    toggleWidget,
    resetLayout,
  };
}
