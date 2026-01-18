import { useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useUserRole } from '@/hooks/useUserRole';
import { useTeacherChat, useTeacherStudentChats } from '@/hooks/useTeacherChat';
import { TeacherChatPanel } from '@/components/chat/TeacherChatPanel';
import { TeacherStudentList } from '@/components/chat/TeacherStudentList';
import { PremiumFeatureLock } from '@/components/premium/PremiumFeatureLock';
import { useMembership } from '@/hooks/useMembership';
import { MessageCircle, Loader2 } from 'lucide-react';

export function ChatsPage() {
  const { user } = useAuth();
  const { isTeacher } = useUserRole();
  const { canAccessFeature } = useMembership();
  const { chatInfo, loading: studentLoading } = useTeacherChat();
  const { loading: teacherLoading } = useTeacherStudentChats();
  
  // Check if user has PREMIUM access for Chat
  const hasPremiumAccess = canAccessFeature('PREMIUM');

  // Show Premium Lock if user doesn't have access (only for non-teachers)
  if (!hasPremiumAccess && !isTeacher) {
    return <PremiumFeatureLock feature="feedback" />;
  }

  const loading = isTeacher ? teacherLoading : studentLoading;

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="flex items-center justify-center h-full">
        <p className="text-muted-foreground">Bitte einloggen</p>
      </div>
    );
  }

  // For students: show chat with their teacher
  // For teachers: show list of student chats
  return (
    <div className="h-full w-full flex flex-col">
      {isTeacher ? (
        <TeacherStudentListPage />
      ) : (
        <StudentChatPage hasTeacher={!!chatInfo.teacherId} />
      )}
    </div>
  );
}

// Teacher view - list of students
function TeacherStudentListPage() {
  const [selectedStudentId, setSelectedStudentId] = useState<string | null>(null);

  if (selectedStudentId) {
    return (
      <div className="h-full w-full flex flex-col flex-1">
        <TeacherChatPanel 
          isOpen={true} 
          onClose={() => setSelectedStudentId(null)} 
          embedded={true}
          studentId={selectedStudentId}
        />
      </div>
    );
  }

  return (
    <div className="h-full w-full flex flex-col flex-1">
      <TeacherStudentList 
        isOpen={true} 
        onClose={() => {}} 
        embedded={true}
        onSelectStudent={(id) => setSelectedStudentId(id)}
      />
    </div>
  );
}

// Student view - chat with teacher
function StudentChatPage({ hasTeacher }: { hasTeacher: boolean }) {
  if (!hasTeacher) {
    return (
      <div className="flex flex-col items-center justify-center h-full gap-4 p-8 animate-fade-in">
        <div className="w-20 h-20 rounded-full bg-muted flex items-center justify-center animate-[float_3s_ease-in-out_infinite]">
          <MessageCircle className="w-10 h-10 text-muted-foreground" />
        </div>
        <h3 className="text-xl font-semibold text-foreground">Kein Lehrer zugewiesen</h3>
        <p className="text-muted-foreground text-center max-w-md">
          Dir wurde noch kein Lehrer zugewiesen. Bitte wende dich an den Support.
        </p>
      </div>
    );
  }

  return (
    <div className="h-full w-full flex flex-col flex-1">
      <TeacherChatPanel isOpen={true} onClose={() => {}} embedded={true} />
    </div>
  );
}
