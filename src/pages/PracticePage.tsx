import { useState } from 'react';
import { JournalEntryCard } from '@/components/practice/JournalEntry';
import { TodoItem } from '@/components/practice/TodoItem';
import { JournalEntryDialog } from '@/components/practice/JournalEntryDialog';
import { TodoDialog } from '@/components/practice/TodoDialog';
import { mockJournalEntries, mockTodos } from '@/data/mockData';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Plus, BookOpen, CheckSquare } from 'lucide-react';
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

  return (
    <div className="max-w-4xl mx-auto px-6 py-6">
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <div className="flex items-center justify-between mb-6">
          <TabsList className="bg-muted p-1">
            <TabsTrigger value="journal" className="gap-2 px-6">
              <BookOpen className="w-4 h-4" />
              Journal
            </TabsTrigger>
            <TabsTrigger value="todos" className="gap-2 px-6">
              <CheckSquare className="w-4 h-4" />
              Aufgaben
            </TabsTrigger>
          </TabsList>
          
          <Button className="gap-2" onClick={handleNewEntry}>
            <Plus className="w-4 h-4" />
            {activeTab === 'journal' ? 'Neuer Eintrag' : 'Neue Aufgabe'}
          </Button>
        </div>
        
        <TabsContent value="journal" className="space-y-4 animate-fade-in">
          {journalEntries.map((entry) => (
            <JournalEntryCard key={entry.id} entry={entry} />
          ))}
          
          {journalEntries.length === 0 && (
            <div className="text-center py-12">
              <BookOpen className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-medium text-foreground mb-2">Noch keine Einträge</h3>
              <p className="text-muted-foreground">Starte dein erstes Übungstagebuch!</p>
            </div>
          )}
        </TabsContent>
        
        <TabsContent value="todos" className="animate-fade-in">
          {activeTodos.length > 0 && (
            <div className="mb-6">
              <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-3">
                Offen ({activeTodos.length})
              </h3>
              <div className="space-y-2">
                {activeTodos.map((todo) => (
                  <TodoItem
                    key={todo.id}
                    todo={todo}
                    onToggle={() => toggleTodo(todo.id)}
                  />
                ))}
              </div>
            </div>
          )}
          
          {completedTodos.length > 0 && (
            <div>
              <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-3">
                Erledigt ({completedTodos.length})
              </h3>
              <div className="space-y-2">
                {completedTodos.map((todo) => (
                  <TodoItem
                    key={todo.id}
                    todo={todo}
                    onToggle={() => toggleTodo(todo.id)}
                  />
                ))}
              </div>
            </div>
          )}
          
          {todos.length === 0 && (
            <div className="text-center py-12">
              <CheckSquare className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-medium text-foreground mb-2">Keine Aufgaben</h3>
              <p className="text-muted-foreground">Erstelle deine erste Übungsaufgabe!</p>
            </div>
          )}
        </TabsContent>
      </Tabs>

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
