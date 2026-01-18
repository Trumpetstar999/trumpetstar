import { useState } from 'react';
import { MessageCircle, Users } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/hooks/useAuth';
import { useUserRole } from '@/hooks/useUserRole';
import { TeacherChatPanel } from './TeacherChatPanel';
import { TeacherStudentList } from './TeacherStudentList';
import { useTeacherChat, useTeacherStudentChats } from '@/hooks/useTeacherChat';

export function TeacherChatButton() {
  const { user } = useAuth();
  const { isTeacher, isAdmin } = useUserRole();
  const [isOpen, setIsOpen] = useState(false);

  // For students: use teacher chat
  const { chatInfo } = useTeacherChat();
  
  // For teachers: use student chats
  const { studentChats } = useTeacherStudentChats();

  if (!user) return null;

  // Calculate total unread for teachers
  const totalUnread = isTeacher 
    ? studentChats.reduce((sum, s) => sum + s.unreadCount, 0)
    : 0;

  return (
    <>
<Button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-6 right-4 z-40 h-14 w-14 rounded-full bg-[#25D366] hover:bg-[#1DAF5A] shadow-lg"
        size="icon"
      >
        {isTeacher ? (
          <Users className="h-6 w-6 text-white" />
        ) : (
          <MessageCircle className="h-6 w-6 text-white" />
        )}
        {totalUnread > 0 && (
          <Badge className="absolute -top-1 -right-1 h-5 min-w-[20px] bg-red-500 text-white text-xs">
            {totalUnread}
          </Badge>
        )}
      </Button>

      {isTeacher ? (
        <TeacherStudentList isOpen={isOpen} onClose={() => setIsOpen(false)} />
      ) : (
        <TeacherChatPanel isOpen={isOpen} onClose={() => setIsOpen(false)} />
      )}
    </>
  );
}
