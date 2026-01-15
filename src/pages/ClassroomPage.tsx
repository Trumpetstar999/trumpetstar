import { Users, Calendar, Video, Plus, Clock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

export function ClassroomPage() {
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
          
          <Button className="gap-2">
            <Plus className="w-4 h-4" />
            Raum starten
          </Button>
        </div>
        
        <TabsContent value="live" className="animate-fade-in">
          <div className="text-center py-16">
            <div className="w-20 h-20 rounded-full bg-muted flex items-center justify-center mx-auto mb-6">
              <Video className="w-10 h-10 text-muted-foreground" />
            </div>
            <h3 className="text-xl font-semibold text-foreground mb-2">Keine Live-Sessions</h3>
            <p className="text-muted-foreground mb-6 max-w-md mx-auto">
              Gerade ist niemand online. Starte einen Raum und lade Freunde ein!
            </p>
            <Button className="gap-2">
              <Plus className="w-4 h-4" />
              Jetzt starten
            </Button>
          </div>
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
          <div className="text-center py-16">
            <div className="w-20 h-20 rounded-full bg-muted flex items-center justify-center mx-auto mb-6">
              <Users className="w-10 h-10 text-muted-foreground" />
            </div>
            <h3 className="text-xl font-semibold text-foreground mb-2">Keine eigenen Räume</h3>
            <p className="text-muted-foreground max-w-md mx-auto">
              Erstelle deinen ersten Unterrichtsraum für bis zu 6 Teilnehmer.
            </p>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
