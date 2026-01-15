import { useState } from 'react';
import { useVideoChat } from '@/hooks/useVideoChat';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { MessageSquarePlus, Loader2, Search, GraduationCap } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface Teacher {
  id: string;
  display_name: string | null;
  avatar_url: string | null;
}

interface CreateTeacherChatDialogProps {
  onChatCreated?: (chatId: string) => void;
}

export function CreateTeacherChatDialog({ onChatCreated }: CreateTeacherChatDialogProps) {
  const { user } = useAuth();
  const { createChat, sendMessage } = useVideoChat();
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [loading, setLoading] = useState(false);
  const [creating, setCreating] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const fetchTeachers = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('id, display_name, avatar_url')
        .eq('is_teacher', true)
        .neq('id', user?.id); // Exclude self

      if (error) throw error;
      setTeachers(data || []);
    } catch (error) {
      console.error('Error fetching teachers:', error);
      toast({
        title: 'Fehler',
        description: 'Lehrer konnten nicht geladen werden.',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleOpenChange = (isOpen: boolean) => {
    setOpen(isOpen);
    if (isOpen) {
      fetchTeachers();
    }
  };

  const handleCreateChat = async (teacher: Teacher) => {
    if (!user) return;

    setCreating(true);
    try {
      const chatId = await createChat('teacher_discussion', null, [
        { id: user.id, role: 'teacher' },
        { id: teacher.id, role: 'teacher' }
      ]);

      if (chatId) {
        toast({
          title: 'Chat erstellt',
          description: `Neuer Chat mit ${teacher.display_name || 'Lehrer'} erstellt.`
        });
        setOpen(false);
        onChatCreated?.(chatId);
      }
    } catch (error) {
      console.error('Error creating chat:', error);
      toast({
        title: 'Fehler',
        description: 'Chat konnte nicht erstellt werden.',
        variant: 'destructive'
      });
    } finally {
      setCreating(false);
    }
  };

  const filteredTeachers = teachers.filter(t =>
    t.display_name?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="gap-2">
          <MessageSquarePlus className="w-4 h-4" />
          Neuer Lehrer-Chat
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[400px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <GraduationCap className="w-5 h-5" />
            Lehrer-Chat starten
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Lehrer suchen..."
              className="pl-9"
            />
          </div>

          {loading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
            </div>
          ) : filteredTeachers.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground text-sm">
              Keine anderen Lehrer gefunden
            </div>
          ) : (
            <ScrollArea className="h-[300px]">
              <div className="space-y-2">
                {filteredTeachers.map((teacher) => (
                  <button
                    key={teacher.id}
                    onClick={() => handleCreateChat(teacher)}
                    disabled={creating}
                    className="w-full flex items-center gap-3 p-3 rounded-lg hover:bg-muted transition-colors text-left disabled:opacity-50"
                  >
                    <Avatar>
                      <AvatarImage src={teacher.avatar_url || undefined} />
                      <AvatarFallback>
                        {teacher.display_name?.charAt(0)?.toUpperCase() || '?'}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium truncate">
                        {teacher.display_name || 'Unbenannt'}
                      </p>
                      <p className="text-sm text-muted-foreground">Lehrer</p>
                    </div>
                    <MessageSquarePlus className="w-5 h-5 text-muted-foreground" />
                  </button>
                ))}
              </div>
            </ScrollArea>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
