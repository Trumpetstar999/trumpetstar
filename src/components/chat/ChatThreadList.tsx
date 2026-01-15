import { VideoChat } from '@/hooks/useVideoChat';
import { useAuth } from '@/hooks/useAuth';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';
import { formatDistanceToNow } from 'date-fns';
import { de } from 'date-fns/locale';
import { ChatFilter } from './ChatLayout';

interface ChatThreadListProps {
  chats: VideoChat[];
  selectedChat: VideoChat | null;
  onSelectChat: (chat: VideoChat) => void;
  filter: ChatFilter;
  onFilterChange: (filter: ChatFilter) => void;
  showTeacherInternal: boolean;
}

export function ChatThreadList({
  chats,
  selectedChat,
  onSelectChat,
  filter,
  onFilterChange,
  showTeacherInternal
}: ChatThreadListProps) {
  const { user } = useAuth();

  const getChatPartner = (chat: VideoChat) => {
    const partner = chat.participants?.find(p => p.user_id !== user?.id);
    return partner?.profile;
  };

  const getMessagePreview = (chat: VideoChat) => {
    if (!chat.last_message) return 'Noch keine Nachrichten';
    
    switch (chat.last_message.message_type) {
      case 'video':
        return '🎥 Video';
      case 'marker':
        return `📍 ${chat.last_message.content || 'Zeitmarker'}`;
      default:
        return chat.last_message.content || '';
    }
  };

  const formatTime = (date: string) => {
    return formatDistanceToNow(new Date(date), { addSuffix: true, locale: de });
  };

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="p-4 border-b border-border">
        <h2 className="text-lg font-semibold text-foreground mb-3">Chats</h2>
        <Tabs value={filter} onValueChange={(v) => onFilterChange(v as ChatFilter)}>
          <TabsList className="w-full grid grid-cols-2 lg:grid-cols-3">
            <TabsTrigger value="teacher" className="text-xs">
              Lehrer
            </TabsTrigger>
            <TabsTrigger value="admin" className="text-xs">
              Admin
            </TabsTrigger>
            {showTeacherInternal && (
              <TabsTrigger value="teacher_internal" className="text-xs col-span-2 lg:col-span-1">
                Lehrer intern
              </TabsTrigger>
            )}
          </TabsList>
        </Tabs>
      </div>

      {/* Chat List */}
      <ScrollArea className="flex-1">
        <div className="divide-y divide-border">
          {chats.length === 0 ? (
            <div className="p-4 text-center text-muted-foreground text-sm">
              Keine Chats in dieser Kategorie
            </div>
          ) : (
            chats.map((chat) => {
              const partner = getChatPartner(chat);
              const isSelected = selectedChat?.id === chat.id;
              const hasUnread = (chat.unread_count || 0) > 0;

              return (
                <button
                  key={chat.id}
                  onClick={() => onSelectChat(chat)}
                  className={cn(
                    'w-full p-3 text-left transition-colors hover:bg-muted/50',
                    'flex items-start gap-3 min-h-[72px]',
                    isSelected && 'bg-primary/5 border-l-2 border-l-primary'
                  )}
                >
                  <Avatar className="w-10 h-10 flex-shrink-0">
                    <AvatarImage src={partner?.avatar_url || undefined} />
                    <AvatarFallback className="bg-primary/10 text-primary text-sm">
                      {partner?.display_name?.charAt(0)?.toUpperCase() || '?'}
                    </AvatarFallback>
                  </Avatar>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2">
                      <span className={cn(
                        'font-medium text-sm truncate',
                        hasUnread && 'text-foreground',
                        !hasUnread && 'text-muted-foreground'
                      )}>
                        {partner?.display_name || 'Unbekannt'}
                      </span>
                      {chat.last_message && (
                        <span className="text-xs text-muted-foreground flex-shrink-0">
                          {formatTime(chat.last_message.created_at)}
                        </span>
                      )}
                    </div>

                    {chat.reference_video && (
                      <p className="text-xs text-primary/70 truncate mt-0.5">
                        {chat.reference_video.title || 'Video'}
                      </p>
                    )}

                    <div className="flex items-center justify-between gap-2 mt-1">
                      <p className={cn(
                        'text-xs truncate',
                        hasUnread ? 'text-foreground font-medium' : 'text-muted-foreground'
                      )}>
                        {getMessagePreview(chat)}
                      </p>
                      {hasUnread && (
                        <Badge 
                          variant="default" 
                          className="h-5 min-w-[20px] flex items-center justify-center text-xs bg-accent text-accent-foreground"
                        >
                          {chat.unread_count}
                        </Badge>
                      )}
                    </div>
                  </div>
                </button>
              );
            })
          )}
        </div>
      </ScrollArea>
    </div>
  );
}
