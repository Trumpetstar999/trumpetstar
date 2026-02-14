import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { usePracticeSessions } from '@/hooks/usePracticeSessions';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { SessionWithDetails } from '@/types/sessions';
import { ArrowLeft, Copy, Video, FileText, Timer, Clock, Music } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';

export default function SharedSessionPage() {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { fetchSessionBySlug, createSession } = usePracticeSessions();
  const [session, setSession] = useState<SessionWithDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [copying, setCopying] = useState(false);

  useEffect(() => {
    if (slug) {
      fetchSessionBySlug(slug).then(s => { setSession(s); setLoading(false); });
    }
  }, [slug, fetchSessionBySlug]);

  const handleCopy = async () => {
    if (!session || !user) {
      toast({ title: 'Bitte melde dich an, um die Session zu kopieren', variant: 'destructive' });
      return;
    }
    setCopying(true);
    try {
      await createSession.mutateAsync({
        name: `${session.name} (Kopie)`,
        break_enabled: session.break_enabled,
        break_seconds_default: session.break_seconds_default,
        sections: session.sections.map(sec => ({
          title: sec.title,
          section_key: sec.section_key,
          items: sec.items.map(it => ({
            order_index: it.order_index,
            item_type: it.item_type,
            ref_id: it.ref_id,
            title_cache: it.title_cache,
            duration_mode: it.duration_mode,
            duration_seconds: it.duration_seconds,
          })),
        })),
      });
      toast({ title: 'Session kopiert!' });
      navigate('/practice/sessions');
    } catch (e: any) {
      toast({ title: 'Fehler', description: e.message, variant: 'destructive' });
    } finally {
      setCopying(false);
    }
  };

  if (loading) return <div className="flex items-center justify-center h-full text-muted-foreground">Laden...</div>;
  if (!session) return (
    <div className="flex flex-col items-center justify-center h-full gap-4">
      <Music className="w-12 h-12 text-muted-foreground/50" />
      <p className="text-muted-foreground">Session nicht gefunden oder nicht öffentlich.</p>
      <Button variant="outline" onClick={() => navigate('/')}>Zurück</Button>
    </div>
  );

  const formatDuration = (s: number) => { const m = Math.floor(s / 60); return m < 60 ? `~${m} Min.` : `~${Math.floor(m / 60)}h ${m % 60}m`; };

  return (
    <div className="max-w-3xl mx-auto px-4 py-6 space-y-6">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
          <ArrowLeft className="w-5 h-5" />
        </Button>
        <div className="flex-1">
          <h1 className="text-xl font-bold">{session.name}</h1>
          <p className="text-sm text-muted-foreground flex items-center gap-2">
            <span>{session.itemCount} Items</span>
            <Clock className="w-3 h-3" /> {formatDuration(session.estimatedDuration)}
          </p>
        </div>
        <Button onClick={handleCopy} disabled={copying} className="gap-2">
          <Copy className="w-4 h-4" /> Kopie erstellen
        </Button>
      </div>

      {session.sections.map(sec => (
        <div key={sec.id}>
          <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-2">{sec.title}</h3>
          <div className="space-y-1">
            {sec.items.map(item => (
              <Card key={item.id}>
                <CardContent className="p-3 flex items-center gap-3">
                  {item.item_type === 'vimeo_video' && <Video className="w-4 h-4 text-primary" />}
                  {item.item_type === 'pdf' && <FileText className="w-4 h-4 text-gold" />}
                  {item.item_type === 'pause' && <Timer className="w-4 h-4 text-accent" />}
                  <span className="text-sm flex-1">{item.title_cache || item.item_type}</span>
                  {item.duration_seconds && <span className="text-xs text-muted-foreground">{item.duration_seconds}s</span>}
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
