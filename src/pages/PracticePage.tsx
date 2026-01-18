import { useState } from 'react';
import { JournalEntryCard } from '@/components/practice/JournalEntry';
import { TodoItem } from '@/components/practice/TodoItem';
import { JournalEntryDialog } from '@/components/practice/JournalEntryDialog';
import { TodoDialog } from '@/components/practice/TodoDialog';
import { mockJournalEntries, mockTodos } from '@/data/mockData';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Plus, BookOpen, CheckSquare, Clock, Target, TrendingUp, Calendar } from 'lucide-react';
import { JournalEntry, Todo } from '@/types';

export function PracticePage() {
  const [activeTab, setActiveTab] = useState('journal');
  const [journalEntries, setJournalEntries] = useState(mockJournalEntries);
  const [todos, setTodos] = useState(mockTodos);
  const [journalDialogOpen, setJournalDialogOpen] = useState(false);
  const [todoDialogOpen, setTodoDialogOpen] = useState(false);
  
  const toggleTodo = (id: string) => {
    setTodos(prev => prev.map(t => 
      t.id === id ? { ...t, completed: !t.completed } : t
    ));
  };

  const handleAddJournalEntry = (entry: Omit<JournalEntry, 'id'>) => {
    const newEntry: JournalEntry = {
      ...entry,
      id: `journal-${Date.now()}`,
    };
    setJournalEntries(prev => [newEntry, ...prev]);
  };

  const handleAddTodo = (todo: Omit<Todo, 'id' | 'completed'>) => {
    const newTodo: Todo = {
      ...todo,
      id: `todo-${Date.now()}`,
      completed: false,
    };
    setTodos(prev => [newTodo, ...prev]);
  };

  const handleNewEntry = () => {
    if (activeTab === 'journal') {
      setJournalDialogOpen(true);
    } else {
      setTodoDialogOpen(true);
    }
  };

  const activeTodos = todos.filter(t => !t.completed);
  const completedTodos = todos.filter(t => t.completed);

  // Calculate stats
  const totalMinutesThisWeek = journalEntries.reduce((acc, entry) => acc + entry.minutes, 0);
  const totalEntries = journalEntries.length;
  const completedTasksCount = completedTodos.length;
  const openTasksCount = activeTodos.length;

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 py-6 space-y-6">
      {/* Header Stats with staggered animations */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { icon: Clock, value: totalMinutesThisWeek, label: 'Minuten geübt', color: 'bg-primary/20', iconColor: 'text-primary' },
          { icon: BookOpen, value: totalEntries, label: 'Journal-Einträge', color: 'bg-gold/20', iconColor: 'text-gold' },
          { icon: Target, value: completedTasksCount, label: 'Erledigt', color: 'bg-green-500/20', iconColor: 'text-green-400' },
          { icon: TrendingUp, value: openTasksCount, label: 'Offen', color: 'bg-accent/20', iconColor: 'text-accent' },
        ].map((stat, index) => (
          <div 
            key={stat.label}
            className="glass rounded-2xl p-4 flex items-center gap-3 opacity-0 animate-fade-in hover:scale-[1.02] hover:bg-white/15 transition-all duration-300 cursor-default"
            style={{ animationDelay: `${index * 100}ms`, animationFillMode: 'forwards' }}
          >
            <div className={`w-10 h-10 rounded-xl ${stat.color} flex items-center justify-center transition-transform group-hover:scale-110`}>
              <stat.icon className={`w-5 h-5 ${stat.iconColor}`} />
            </div>
            <div>
              <p className="text-2xl font-bold text-foreground">{stat.value}</p>
              <p className="text-xs text-muted-foreground">{stat.label}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Main Content with entrance animation */}
      <div 
        className="glass rounded-2xl overflow-hidden opacity-0 animate-fade-in"
        style={{ animationDelay: '400ms', animationFillMode: 'forwards' }}
      >
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          {/* Tab Header */}
          <div className="flex items-center justify-between p-4 border-b border-border/50">
            <TabsList className="bg-secondary/50 p-1 rounded-xl">
              <TabsTrigger 
                value="journal" 
                className="gap-2 px-5 py-2.5 rounded-lg data-[state=active]:bg-primary data-[state=active]:text-primary-foreground transition-all duration-300 data-[state=active]:shadow-lg"
              >
                <BookOpen className="w-4 h-4" />
                <span className="font-medium">Journal</span>
              </TabsTrigger>
              <TabsTrigger 
                value="todos" 
                className="gap-2 px-5 py-2.5 rounded-lg data-[state=active]:bg-primary data-[state=active]:text-primary-foreground transition-all duration-300 data-[state=active]:shadow-lg"
              >
                <CheckSquare className="w-4 h-4" />
                <span className="font-medium">Aufgaben</span>
                {openTasksCount > 0 && (
                  <span className="ml-1 px-2 py-0.5 rounded-full bg-accent/20 text-accent text-xs font-bold animate-pulse">
                    {openTasksCount}
                  </span>
                )}
              </TabsTrigger>
            </TabsList>
            
            <Button 
              className="gap-2 rounded-xl shadow-lg hover:shadow-xl hover:scale-105 transition-all duration-300" 
              onClick={handleNewEntry}
            >
              <Plus className="w-4 h-4" />
              <span className="hidden sm:inline">
                {activeTab === 'journal' ? 'Neuer Eintrag' : 'Neue Aufgabe'}
              </span>
            </Button>
          </div>
          
          {/* Journal Tab */}
          <TabsContent value="journal" className="p-4 space-y-4 m-0">
            {journalEntries.length > 0 ? (
              journalEntries.map((entry, index) => (
                <div 
                  key={entry.id}
                  className="opacity-0 animate-fade-in"
                  style={{ animationDelay: `${index * 80}ms`, animationFillMode: 'forwards' }}
                >
                  <JournalEntryCard entry={entry} />
                </div>
              ))
            ) : (
              <EmptyState 
                icon={BookOpen}
                title="Noch keine Einträge"
                description="Starte dein Übungstagebuch und halte deinen Fortschritt fest!"
                actionLabel="Ersten Eintrag erstellen"
                onAction={() => setJournalDialogOpen(true)}
              />
            )}
          </TabsContent>
          
          {/* Todos Tab */}
          <TabsContent value="todos" className="p-4 m-0">
            {todos.length > 0 ? (
              <div className="space-y-6">
                {activeTodos.length > 0 && (
                  <div className="opacity-0 animate-fade-in" style={{ animationFillMode: 'forwards' }}>
                    <div className="flex items-center gap-2 mb-3">
                      <div className="w-2 h-2 rounded-full bg-accent animate-pulse" />
                      <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">
                        Offen ({activeTodos.length})
                      </h3>
                    </div>
                    <div className="space-y-2">
                      {activeTodos.map((todo, index) => (
                        <div 
                          key={todo.id}
                          className="opacity-0 animate-fade-in"
                          style={{ animationDelay: `${index * 60}ms`, animationFillMode: 'forwards' }}
                        >
                          <TodoItem
                            todo={todo}
                            onToggle={() => toggleTodo(todo.id)}
                          />
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                
                {completedTodos.length > 0 && (
                  <div 
                    className="opacity-0 animate-fade-in" 
                    style={{ animationDelay: `${activeTodos.length * 60 + 100}ms`, animationFillMode: 'forwards' }}
                  >
                    <div className="flex items-center gap-2 mb-3">
                      <div className="w-2 h-2 rounded-full bg-green-400" />
                      <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">
                        Erledigt ({completedTodos.length})
                      </h3>
                    </div>
                    <div className="space-y-2">
                      {completedTodos.map((todo, index) => (
                        <div 
                          key={todo.id}
                          className="opacity-0 animate-fade-in"
                          style={{ animationDelay: `${activeTodos.length * 60 + 150 + index * 60}ms`, animationFillMode: 'forwards' }}
                        >
                          <TodoItem
                            todo={todo}
                            onToggle={() => toggleTodo(todo.id)}
                          />
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <EmptyState 
                icon={CheckSquare}
                title="Keine Aufgaben"
                description="Erstelle Übungsaufgaben und behalte den Überblick!"
                actionLabel="Erste Aufgabe erstellen"
                onAction={() => setTodoDialogOpen(true)}
              />
            )}
          </TabsContent>
        </Tabs>
      </div>

      <JournalEntryDialog
        open={journalDialogOpen}
        onOpenChange={setJournalDialogOpen}
        onSave={handleAddJournalEntry}
      />

      <TodoDialog
        open={todoDialogOpen}
        onOpenChange={setTodoDialogOpen}
        onSave={handleAddTodo}
      />
    </div>
  );
}

// Empty State Component
interface EmptyStateProps {
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  description: string;
  actionLabel: string;
  onAction: () => void;
}

function EmptyState({ icon: Icon, title, description, actionLabel, onAction }: EmptyStateProps) {
  return (
    <div className="text-center py-16 opacity-0 animate-fade-in" style={{ animationFillMode: 'forwards' }}>
      <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-4 animate-float">
        <Icon className="w-8 h-8 text-primary" />
      </div>
      <h3 className="text-lg font-semibold text-foreground mb-2">{title}</h3>
      <p className="text-muted-foreground mb-6 max-w-sm mx-auto">{description}</p>
      <Button onClick={onAction} className="gap-2 rounded-xl hover:scale-105 transition-transform duration-200">
        <Plus className="w-4 h-4" />
        {actionLabel}
      </Button>
    </div>
  );
}
