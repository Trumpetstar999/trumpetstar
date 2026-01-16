import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { FileText, CheckSquare, Plus, Circle, CheckCircle } from 'lucide-react';
import { mockJournalEntries, mockTodos } from '@/data/mockData';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useNavigate } from 'react-router-dom';

export function NotesTodosWidget() {
  const navigate = useNavigate();
  const entries = mockJournalEntries.slice(0, 2);
  const todos = mockTodos.filter(t => !t.completed).slice(0, 3);

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('de-DE', {
      day: 'numeric',
      month: 'short',
    });
  };

  const getMoodEmoji = (mood: string) => {
    const moods: Record<string, string> = {
      great: '😊',
      good: '🙂',
      neutral: '😐',
      tired: '😴',
      frustrated: '😤',
    };
    return moods[mood] || '😐';
  };

  const getPriorityColor = (priority: string) => {
    const colors: Record<string, string> = {
      high: 'text-accent-red',
      medium: 'text-reward-gold',
      low: 'text-white/40',
    };
    return colors[priority] || 'text-white/40';
  };

  return (
    <div>
      <Tabs defaultValue="notes" className="w-full">
        <TabsList className="w-full bg-white/5 mb-4">
          <TabsTrigger 
            value="notes" 
            className="flex-1 data-[state=active]:bg-white/10 data-[state=active]:text-white text-white/60"
          >
            <FileText className="w-4 h-4 mr-2" />
            Notizen
          </TabsTrigger>
          <TabsTrigger 
            value="todos"
            className="flex-1 data-[state=active]:bg-white/10 data-[state=active]:text-white text-white/60"
          >
            <CheckSquare className="w-4 h-4 mr-2" />
            To-Do
          </TabsTrigger>
        </TabsList>

        <TabsContent value="notes" className="mt-0">
          {entries.length > 0 ? (
            <div className="space-y-2">
              {entries.map(entry => (
                <div
                  key={entry.id}
                  className="p-3 bg-white/5 rounded-xl hover:bg-white/10 transition-colors cursor-pointer"
                  onClick={() => navigate('/practice')}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-white/50 text-xs">{formatDate(entry.date)}</span>
                    <span className="text-lg">{getMoodEmoji(entry.mood)}</span>
                  </div>
                  <p className="text-white text-sm line-clamp-2">{entry.notes}</p>
                  <div className="flex gap-1 mt-2">
                    {entry.tags.slice(0, 2).map(tag => (
                      <span
                        key={tag}
                        className="px-2 py-0.5 bg-brand-blue-start/20 text-brand-blue-start text-xs rounded-full"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="py-6 text-center">
              <FileText className="w-8 h-8 mx-auto mb-2 text-white/20" />
              <p className="text-white/50 text-sm">Keine Notizen vorhanden</p>
            </div>
          )}
        </TabsContent>

        <TabsContent value="todos" className="mt-0">
          {todos.length > 0 ? (
            <div className="space-y-2">
              {todos.map(todo => (
                <div
                  key={todo.id}
                  className="flex items-start gap-3 p-3 bg-white/5 rounded-xl hover:bg-white/10 transition-colors cursor-pointer"
                  onClick={() => navigate('/practice')}
                >
                  <Circle className={`w-5 h-5 mt-0.5 ${getPriorityColor(todo.priority)}`} />
                  <div className="flex-1 min-w-0">
                    <p className="text-white text-sm">{todo.title}</p>
                    {todo.dueDate && (
                      <p className="text-white/40 text-xs mt-1">
                        Fällig: {formatDate(todo.dueDate)}
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="py-6 text-center">
              <CheckSquare className="w-8 h-8 mx-auto mb-2 text-white/20" />
              <p className="text-white/50 text-sm">Alles erledigt! 🎉</p>
            </div>
          )}
        </TabsContent>
      </Tabs>

      <Button
        onClick={() => navigate('/practice')}
        variant="ghost"
        size="sm"
        className="w-full mt-4 text-white/80 hover:text-white hover:bg-white/10"
      >
        <Plus className="w-4 h-4 mr-2" />
        Neue Notiz
      </Button>
    </div>
  );
}
