import { Users, Video, Calendar, MoreVertical } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface RoomCardProps {
  room: {
    id: string;
    title: string;
    isLive: boolean;
    participantCount: number;
    maxParticipants: number;
    scheduledAt?: string;
  };
  onJoin: () => void;
}

export function RoomCard({ room, onJoin }: RoomCardProps) {
  const formatScheduledTime = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('de-DE', {
      weekday: 'short',
      day: 'numeric',
      month: 'short',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <div className="bg-card rounded-xl p-4 border border-border hover:border-primary/50 transition-all">
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-2">
          {room.isLive ? (
            <span className="flex items-center gap-1.5 px-2 py-1 rounded-full bg-green-500/10 text-green-600 text-xs font-medium">
              <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
              Live
            </span>
          ) : room.scheduledAt ? (
            <span className="flex items-center gap-1.5 px-2 py-1 rounded-full bg-primary/10 text-primary text-xs font-medium">
              <Calendar className="w-3 h-3" />
              Geplant
            </span>
          ) : null}
        </div>
      </div>
      
      <h3 className="font-semibold text-foreground mb-2">{room.title}</h3>
      
      <div className="flex items-center gap-4 text-sm text-muted-foreground mb-4">
        <span className="flex items-center gap-1.5">
          <Users className="w-4 h-4" />
          {room.participantCount}/{room.maxParticipants}
        </span>
        {room.scheduledAt && (
          <span className="flex items-center gap-1.5">
            <Calendar className="w-4 h-4" />
            {formatScheduledTime(room.scheduledAt)}
          </span>
        )}
      </div>
      
      <Button 
        className="w-full gap-2" 
        variant={room.isLive ? 'default' : 'outline'}
        onClick={onJoin}
      >
        <Video className="w-4 h-4" />
        {room.isLive ? 'Beitreten' : 'Starten'}
      </Button>
    </div>
  );
}
