import { useState } from 'react';
import { Users, Calendar, Video, Plus, Clock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { CreateRoomDialog } from '@/components/classroom/CreateRoomDialog';
import { LiveRoom } from '@/components/classroom/LiveRoom';
import { RoomCard } from '@/components/classroom/RoomCard';
import { PremiumFeatureLock } from '@/components/premium/PremiumFeatureLock';
import { useMembership } from '@/hooks/useMembership';
import { toast } from 'sonner';

interface Room {
  id: string;
  title: string;
  visibility: 'invite-only' | 'friends' | 'link-only';
  isLive: boolean;
  isRecording: boolean;
  participantCount: number;
  maxParticipants: number;
  scheduledAt?: string;
  createdAt: string;
}

export function ClassroomPage() {
  const { canAccessFeature } = useMembership();
  const [rooms, setRooms] = useState<Room[]>([]);
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [activeRoom, setActiveRoom] = useState<Room | null>(null);

  // Check if user has PREMIUM access for Classroom
  const hasPremiumAccess = canAccessFeature('PREMIUM');

  const handleCreateRoom = (roomData: {
    title: string;
    visibility: 'invite-only' | 'friends' | 'link-only';
    maxParticipants: number;
    isRecording: boolean;
  }) => {
    const newRoom: Room = {
      id: `room-${Date.now()}`,
      ...roomData,
      isLive: true,
      participantCount: 1,
      createdAt: new Date().toISOString(),
    };
    
    setRooms(prev => [newRoom, ...prev]);
    setActiveRoom(newRoom);
    toast.success('Raum erstellt!');
  };

  const handleJoinRoom = (room: Room) => {
    setActiveRoom(room);
  };

  const handleLeaveRoom = () => {
    if (activeRoom) {
      setRooms(prev => prev.map(r => 
        r.id === activeRoom.id ? { ...r, isLive: false } : r
      ));
    }
    setActiveRoom(null);
  };

  // Show Premium Lock if user doesn't have access
  if (!hasPremiumAccess) {
    return <PremiumFeatureLock feature="classroom" />;
  }

  const liveRooms = rooms.filter(r => r.isLive);
  const myRooms = rooms;

  return (
    <div className="max-w-5xl mx-auto px-6 py-6">
      <Tabs defaultValue="live" className="w-full">
        <div className="flex items-center justify-between mb-6">
          <TabsList className="bg-muted p-1">
            <TabsTrigger value="live" className="gap-2 px-5">
              <Video className="w-4 h-4" />
              Live jetzt
            </TabsTrigger>
            <TabsTrigger value="scheduled" className="gap-2 px-5">
              <Calendar className="w-4 h-4" />
              Geplant
            </TabsTrigger>
            <TabsTrigger value="my" className="gap-2 px-5">
              <Users className="w-4 h-4" />
              Meine Räume
            </TabsTrigger>
          </TabsList>
          
          <Button className="gap-2" onClick={() => setCreateDialogOpen(true)}>
            <Plus className="w-4 h-4" />
            Raum starten
          </Button>
        </div>
        
        <TabsContent value="live" className="animate-fade-in">
          {liveRooms.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {liveRooms.map((room) => (
                <RoomCard
                  key={room.id}
                  room={room}
                  onJoin={() => handleJoinRoom(room)}
                />
              ))}
            </div>
          ) : (
            <div className="text-center py-16">
              <div className="w-20 h-20 rounded-full bg-muted flex items-center justify-center mx-auto mb-6">
                <Video className="w-10 h-10 text-muted-foreground" />
              </div>
              <h3 className="text-xl font-semibold text-foreground mb-2">Keine Live-Sessions</h3>
              <p className="text-muted-foreground mb-6 max-w-md mx-auto">
                Gerade ist niemand online. Starte einen Raum und lade Freunde ein!
              </p>
              <Button className="gap-2" onClick={() => setCreateDialogOpen(true)}>
                <Plus className="w-4 h-4" />
                Jetzt starten
              </Button>
            </div>
          )}
        </TabsContent>
        
        <TabsContent value="scheduled" className="animate-fade-in">
          <div className="text-center py-16">
            <div className="w-20 h-20 rounded-full bg-muted flex items-center justify-center mx-auto mb-6">
              <Clock className="w-10 h-10 text-muted-foreground" />
            </div>
            <h3 className="text-xl font-semibold text-foreground mb-2">Keine geplanten Sessions</h3>
            <p className="text-muted-foreground mb-6 max-w-md mx-auto">
              Plane eine Session mit deinem Lehrer oder Freunden.
            </p>
            <Button variant="outline" className="gap-2">
              <Calendar className="w-4 h-4" />
              Session planen
            </Button>
          </div>
        </TabsContent>
        
        <TabsContent value="my" className="animate-fade-in">
          {myRooms.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {myRooms.map((room) => (
                <RoomCard
                  key={room.id}
                  room={room}
                  onJoin={() => handleJoinRoom(room)}
                />
              ))}
            </div>
          ) : (
            <div className="text-center py-16">
              <div className="w-20 h-20 rounded-full bg-muted flex items-center justify-center mx-auto mb-6">
                <Users className="w-10 h-10 text-muted-foreground" />
              </div>
              <h3 className="text-xl font-semibold text-foreground mb-2">Keine eigenen Räume</h3>
              <p className="text-muted-foreground max-w-md mx-auto">
                Erstelle deinen ersten Unterrichtsraum für bis zu 6 Teilnehmer.
              </p>
            </div>
          )}
        </TabsContent>
      </Tabs>

      <CreateRoomDialog
        open={createDialogOpen}
        onOpenChange={setCreateDialogOpen}
        onCreateRoom={handleCreateRoom}
      />

      {activeRoom && (
        <LiveRoom
          open={!!activeRoom}
          onClose={handleLeaveRoom}
          room={activeRoom}
        />
      )}
    </div>
  );
}
