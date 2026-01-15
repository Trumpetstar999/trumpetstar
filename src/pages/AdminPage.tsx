import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { useUserRole } from '@/hooks/useUserRole';
import { LevelManager } from '@/components/admin/LevelManager';
import { SectionManager } from '@/components/admin/SectionManager';
import { VideoManager } from '@/components/admin/VideoManager';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { ArrowLeft, RefreshCw, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

type View = 'levels' | 'sections' | 'videos';

interface SelectedContext {
  levelId: string;
  levelTitle: string;
  sectionId?: string;
  sectionTitle?: string;
}

export default function AdminPage() {
  const { user, loading: authLoading } = useAuth();
  const { isAdmin, isLoading: roleLoading } = useUserRole();
  const navigate = useNavigate();

  const [view, setView] = useState<View>('levels');
  const [context, setContext] = useState<SelectedContext | null>(null);
  const [isSyncing, setIsSyncing] = useState(false);

  useEffect(() => {
    if (!authLoading && !user) {
      navigate('/auth');
    }
  }, [user, authLoading, navigate]);

  useEffect(() => {
    if (!roleLoading && !isAdmin) {
      navigate('/');
      toast.error('Zugriff verweigert');
    }
  }, [isAdmin, roleLoading, navigate]);

  async function handleSyncAll() {
    setIsSyncing(true);
    try {
      const { data: levels } = await supabase
        .from('levels')
        .select('id, vimeo_showcase_id')
        .eq('is_active', true);

      if (!levels || levels.length === 0) {
        toast.info('Keine aktiven Levels zum Synchronisieren');
        return;
      }

      for (const level of levels) {
        const response = await supabase.functions.invoke('vimeo-sync', {
          body: {
            action: 'sync',
            levelId: level.id,
            showcaseId: level.vimeo_showcase_id,
          },
        });

        if (response.error) {
          toast.error(`Fehler bei Level ${level.id}: ${response.error.message}`);
        }
      }

      toast.success('Synchronisation abgeschlossen');
    } catch (error) {
      console.error('Sync error:', error);
      toast.error('Fehler bei der Synchronisation');
    } finally {
      setIsSyncing(false);
    }
  }

  if (authLoading || roleLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!isAdmin) {
    return null;
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-20 bg-card border-b border-border">
        <div className="container mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" onClick={() => navigate('/')}>
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <h1 className="text-xl font-bold">Admin</h1>
          </div>
          <Button
            variant="outline"
            className="gap-2"
            onClick={handleSyncAll}
            disabled={isSyncing}
          >
            {isSyncing ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <RefreshCw className="w-4 h-4" />
            )}
            Alle Levels synchronisieren
          </Button>
        </div>
      </header>

      <main className="container mx-auto px-6 py-8">
        {view === 'levels' && (
          <LevelManager
            onSelectLevel={(levelId) => {
              supabase
                .from('levels')
                .select('id, title')
                .eq('id', levelId)
                .single()
                .then(({ data }) => {
                  if (data) {
                    setContext({ levelId: data.id, levelTitle: data.title });
                    setView('sections');
                  }
                });
            }}
          />
        )}

        {view === 'sections' && context && (
          <SectionManager
            levelId={context.levelId}
            levelTitle={context.levelTitle}
            onBack={() => {
              setView('levels');
              setContext(null);
            }}
            onSelectSection={(sectionId) => {
              supabase
                .from('sections')
                .select('id, title')
                .eq('id', sectionId)
                .single()
                .then(({ data }) => {
                  if (data) {
                    setContext({
                      ...context,
                      sectionId: data.id,
                      sectionTitle: data.title,
                    });
                    setView('videos');
                  }
                });
            }}
          />
        )}

        {view === 'videos' && context?.sectionId && (
          <VideoManager
            sectionId={context.sectionId}
            sectionTitle={context.sectionTitle || ''}
            levelId={context.levelId}
            onBack={() => {
              setContext({ levelId: context.levelId, levelTitle: context.levelTitle });
              setView('sections');
            }}
          />
        )}
      </main>
    </div>
  );
}
