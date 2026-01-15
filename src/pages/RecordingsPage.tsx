import { useState } from 'react';
import { Video, Users, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { RecordingDialog } from '@/components/recordings/RecordingDialog';
import { RecordingCard } from '@/components/recordings/RecordingCard';
import { VideoPlayerDialog } from '@/components/recordings/VideoPlayerDialog';
import { toast } from 'sonner';

interface LocalRecording {
  id: string;
  title: string;
  url: string;
  thumbnail?: string;
  createdAt: string;
  duration: number;
}

export function RecordingsPage() {
  const [recordings, setRecordings] = useState<LocalRecording[]>([]);
  const [recordingDialogOpen, setRecordingDialogOpen] = useState(false);
  const [playingVideo, setPlayingVideo] = useState<LocalRecording | null>(null);

  const handleSaveRecording = async (recording: { title: string; blob: Blob; duration: number }) => {
    // Create a local URL for the recording
    const url = URL.createObjectURL(recording.blob);
    
    const newRecording: LocalRecording = {
      id: `recording-${Date.now()}`,
      title: recording.title,
      url,
      createdAt: new Date().toISOString(),
      duration: recording.duration,
    };
    
    setRecordings(prev => [newRecording, ...prev]);
    toast.success('Aufnahme gespeichert!');
  };

  const handleDeleteRecording = (id: string) => {
    const recording = recordings.find(r => r.id === id);
    if (recording) {
      URL.revokeObjectURL(recording.url);
    }
    setRecordings(prev => prev.filter(r => r.id !== id));
    toast.success('Aufnahme gelöscht');
  };

  const handlePlayRecording = (recording: LocalRecording) => {
    setPlayingVideo(recording);
  };

  return (
    <div className="max-w-5xl mx-auto px-6 py-6">
      <Tabs defaultValue="my" className="w-full">
        <div className="flex items-center justify-between mb-6">
          <TabsList className="bg-muted p-1">
            <TabsTrigger value="my" className="gap-2 px-6">
              <Video className="w-4 h-4" />
              Meine Aufnahmen
            </TabsTrigger>
            <TabsTrigger value="shared" className="gap-2 px-6">
              <Users className="w-4 h-4" />
              Geteilt mit mir
            </TabsTrigger>
          </TabsList>
          
          <Button 
            className="gap-2 bg-accent hover:bg-accent/90"
            onClick={() => setRecordingDialogOpen(true)}
          >
            <Plus className="w-4 h-4" />
            Neue Aufnahme
          </Button>
        </div>
        
        <TabsContent value="my" className="animate-fade-in">
          {recordings.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {recordings.map((recording) => (
                <RecordingCard
                  key={recording.id}
                  recording={recording}
                  onDelete={handleDeleteRecording}
                  onPlay={handlePlayRecording}
                />
              ))}
            </div>
          ) : (
            <div className="text-center py-16">
              <div className="w-20 h-20 rounded-full bg-muted flex items-center justify-center mx-auto mb-6">
                <Video className="w-10 h-10 text-muted-foreground" />
              </div>
              <h3 className="text-xl font-semibold text-foreground mb-2">Noch keine Aufnahmen</h3>
              <p className="text-muted-foreground mb-6 max-w-md mx-auto">
                Nimm dein Spiel auf und verfolge deinen Fortschritt. 
                Teile Videos mit Freunden oder deinem Lehrer.
              </p>
              <Button 
                className="gap-2 bg-accent hover:bg-accent/90"
                onClick={() => setRecordingDialogOpen(true)}
              >
                <Plus className="w-4 h-4" />
                Erste Aufnahme starten
              </Button>
            </div>
          )}
        </TabsContent>
        
        <TabsContent value="shared" className="animate-fade-in">
          <div className="text-center py-16">
            <div className="w-20 h-20 rounded-full bg-muted flex items-center justify-center mx-auto mb-6">
              <Users className="w-10 h-10 text-muted-foreground" />
            </div>
            <h3 className="text-xl font-semibold text-foreground mb-2">Keine geteilten Videos</h3>
            <p className="text-muted-foreground max-w-md mx-auto">
              Hier erscheinen Videos, die Freunde mit dir geteilt haben.
            </p>
          </div>
        </TabsContent>
      </Tabs>

      <RecordingDialog
        open={recordingDialogOpen}
        onOpenChange={setRecordingDialogOpen}
        onSave={handleSaveRecording}
      />

      <VideoPlayerDialog
        open={!!playingVideo}
        onOpenChange={(open) => !open && setPlayingVideo(null)}
        video={playingVideo}
      />
    </div>
  );
}
