import { useState, useEffect } from 'react';
import { useVideoChat, VideoChat } from '@/hooks/useVideoChat';
import { useAuth } from '@/hooks/useAuth';
import { useUserRole } from '@/hooks/useUserRole';
import { ChatThreadList } from './ChatThreadList';
import { ChatVideoPanel } from './ChatVideoPanel';
import { ChatMessagePanel } from './ChatMessagePanel';
import { Loader2, MessageSquare, Menu } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { cn } from '@/lib/utils';

export type ChatFilter = 'teacher' | 'admin' | 'teacher_internal';

export function ChatLayout() {
  const { user } = useAuth();
  const { isAdmin, isTeacher } = useUserRole();
  const { chats, loading, teacherAssignment, fetchChats } = useVideoChat();
  const [selectedChat, setSelectedChat] = useState<VideoChat | null>(null);
  const [filter, setFilter] = useState<ChatFilter>('teacher');
  const [currentVideoTime, setCurrentVideoTime] = useState(0);
  const [mobileDrawerOpen, setMobileDrawerOpen] = useState(false);

  // Filter chats based on selected filter
  const filteredChats = chats.filter(chat => {
    if (filter === 'teacher') {
      return chat.context_type === 'user_video';
    } else if (filter === 'admin') {
      return chat.context_type === 'admin_feedback';
    } else if (filter === 'teacher_internal') {
      return chat.context_type === 'teacher_discussion';
    }
    return true;
  });

  // Auto-select first chat when available
  useEffect(() => {
    if (!selectedChat && filteredChats.length > 0) {
      setSelectedChat(filteredChats[0]);
    }
  }, [filteredChats, selectedChat]);

  if (!user) {
    return (
      <div className="flex items-center justify-center h-full">
        <p className="text-muted-foreground">Bitte einloggen</p>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  const hasTeacher = !!teacherAssignment;
  const showTeacherInternal = isTeacher || isAdmin;

  // Responsive: Check if we should show split view
  const ThreadListContent = (
    <ChatThreadList
      chats={filteredChats}
      selectedChat={selectedChat}
      onSelectChat={(chat) => {
        setSelectedChat(chat);
        setMobileDrawerOpen(false);
      }}
      filter={filter}
      onFilterChange={setFilter}
      showTeacherInternal={showTeacherInternal}
      onChatCreated={fetchChats}
    />
  );

  if (chats.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-full gap-4 p-8">
        <div className="w-20 h-20 rounded-full bg-muted flex items-center justify-center">
          <MessageSquare className="w-10 h-10 text-muted-foreground" />
        </div>
        <h3 className="text-xl font-semibold text-foreground">Noch keine Chats</h3>
        <p className="text-muted-foreground text-center max-w-md">
          {hasTeacher
            ? 'Teile ein Video mit deinem Lehrer oder sende Feedback an einen Admin, um einen Chat zu starten.'
            : 'Dir ist noch kein Lehrer zugewiesen. Sende Feedback an einen Admin, um Hilfe zu bekommen.'}
        </p>
      </div>
    );
  }

  return (
    <div className="flex h-full bg-background">
      {/* Mobile: Thread list as drawer */}
      <div className="lg:hidden">
        <Sheet open={mobileDrawerOpen} onOpenChange={setMobileDrawerOpen}>
          <SheetTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="fixed top-20 left-4 z-50 lg:hidden"
            >
              <Menu className="w-5 h-5" />
            </Button>
          </SheetTrigger>
          <SheetContent side="left" className="w-[300px] p-0">
            {ThreadListContent}
          </SheetContent>
        </Sheet>
      </div>

      {/* Desktop: Thread list panel */}
      <div className="hidden lg:block w-[280px] border-r border-border flex-shrink-0">
        {ThreadListContent}
      </div>

      {/* Main content area */}
      {selectedChat ? (
        <div className="flex-1 flex flex-col lg:flex-row min-w-0">
          {/* Video Panel */}
          <div className="lg:flex-1 lg:min-w-[400px] border-b lg:border-b-0 lg:border-r border-border">
            <ChatVideoPanel
              chat={selectedChat}
              onTimeUpdate={setCurrentVideoTime}
              currentTime={currentVideoTime}
            />
          </div>

          {/* Chat Panel */}
          <div className="flex-1 lg:w-[380px] lg:flex-shrink-0 min-h-0">
            <ChatMessagePanel
              chat={selectedChat}
              currentVideoTime={currentVideoTime}
              onSeekToTime={(time) => setCurrentVideoTime(time)}
            />
          </div>
        </div>
      ) : (
        <div className="flex-1 flex items-center justify-center">
          <p className="text-muted-foreground">Wähle einen Chat aus</p>
        </div>
      )}
    </div>
  );
}
