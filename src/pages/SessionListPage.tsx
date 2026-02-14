import { useNavigate } from 'react-router-dom';
import { usePracticeSessions } from '@/hooks/usePracticeSessions';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { ArrowLeft, Plus, Play, Edit, Copy, Trash2, Share2, Clock, Music } from 'lucide-react';
import { useState } from 'react';
import { ShareSessionDialog } from '@/components/sessions/ShareSessionDialog';

export default function SessionListPage() {
  const navigate = useNavigate();
  const { sessions, isLoading, deleteSession, duplicateSession } = usePracticeSessions();
  const [shareSessionId, setShareSessionId] = useState<string | null>(null);

  const formatDuration = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    return m < 60 ? `~${m} Min.` : `~${Math.floor(m / 60)}h ${m % 60}m`;
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-6 space-y-6">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
          <ArrowLeft className="w-5 h-5" />
        </Button>
        <h1 className="text-xl font-bold flex-1">Meine Übesessions</h1>
        <Button onClick={() => navigate('/practice/sessions/new')} className="gap-2">
          <Plus className="w-4 h-4" /> Neue Session
        </Button>
      </div>

      {isLoading && <p className="text-muted-foreground text-center py-8">Laden...</p>}

      {!isLoading && sessions.length === 0 && (
        <div className="text-center py-16">
          <Music className="w-12 h-12 text-muted-foreground/50 mx-auto mb-4" />
          <h3 className="font-semibold text-lg mb-2">Noch keine Sessions</h3>
          <p className="text-muted-foreground mb-6">Erstelle deine erste Übesession!</p>
          <Button onClick={() => navigate('/practice/sessions/new')} className="gap-2">
            <Plus className="w-4 h-4" /> Neue Übesession
          </Button>
        </div>
      )}

      <div className="grid gap-3">
        {sessions.map(session => (
          <Card key={session.id} className="hover:border-primary/30 transition-colors">
            <CardContent className="p-4 flex items-center gap-4">
              <div className="flex-1 min-w-0">
                <h3 className="font-semibold truncate">{session.name}</h3>
                <div className="flex items-center gap-3 text-sm text-muted-foreground mt-1">
                  <span>{session.itemCount} Items</span>
                  <span className="flex items-center gap-1"><Clock className="w-3 h-3" /> {formatDuration(session.estimatedDuration)}</span>
                  {session.last_used_at && (
                    <span>Zuletzt: {new Date(session.last_used_at).toLocaleDateString('de')}</span>
                  )}
                </div>
              </div>
              <div className="flex gap-1">
                <Button size="icon" variant="ghost" onClick={() => navigate(`/practice/sessions/${session.id}/play`)}>
                  <Play className="w-4 h-4" />
                </Button>
                <Button size="icon" variant="ghost" onClick={() => navigate(`/practice/sessions/${session.id}/edit`)}>
                  <Edit className="w-4 h-4" />
                </Button>
                <Button size="icon" variant="ghost" onClick={() => duplicateSession.mutate(session.id)}>
                  <Copy className="w-4 h-4" />
                </Button>
                <Button size="icon" variant="ghost" onClick={() => setShareSessionId(session.id)}>
                  <Share2 className="w-4 h-4" />
                </Button>
                <Button size="icon" variant="ghost" onClick={() => { if (confirm('Session löschen?')) deleteSession.mutate(session.id); }}>
                  <Trash2 className="w-4 h-4 text-destructive" />
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {shareSessionId && (
        <ShareSessionDialog
          sessionId={shareSessionId}
          onClose={() => setShareSessionId(null)}
        />
      )}
    </div>
  );
}
