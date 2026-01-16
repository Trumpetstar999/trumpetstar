import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { useUserRole } from '@/hooks/useUserRole';
import { AdminSidebar } from '@/components/admin/AdminSidebar';
import { AdminDashboard } from '@/components/admin/AdminDashboard';
import { UserList } from '@/components/admin/UserList';
import { LevelManager } from '@/components/admin/LevelManager';
import { SectionManager } from '@/components/admin/SectionManager';
import { VideoManager } from '@/components/admin/VideoManager';
import { ShowcaseImporter } from '@/components/admin/ShowcaseImporter';
import { AdminFeedbackPanel } from '@/components/admin/AdminFeedbackPanel';
import { ProductPlanManager } from '@/components/admin/ProductPlanManager';
import { MembershipDebugPanel } from '@/components/admin/MembershipDebugPanel';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowLeft, RefreshCw, Loader2, Download, Settings, CheckCircle, Server, Package, Users } from 'lucide-react';
import { toast } from 'sonner';

type View = 'levels' | 'sections' | 'videos';
type AdminTab = 'dashboard' | 'users' | 'levels' | 'products' | 'classrooms' | 'feedback' | 'system';

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

  const [activeTab, setActiveTab] = useState<AdminTab>('dashboard');
  const [levelsView, setLevelsView] = useState<View>('levels');
  const [context, setContext] = useState<SelectedContext | null>(null);
  const [isSyncing, setIsSyncing] = useState(false);
  const [levelsSubTab, setLevelsSubTab] = useState<'import' | 'manage'>('import');
  const [refreshKey, setRefreshKey] = useState(0);

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
    <div className="min-h-screen bg-background flex">
      {/* Sidebar */}
      <AdminSidebar activeTab={activeTab} onTabChange={(tab) => setActiveTab(tab as AdminTab)} />

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-h-screen overflow-hidden">
        {/* Header */}
        <header className="sticky top-0 z-20 bg-card border-b border-border">
          <div className="px-6 py-4 flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button variant="ghost" size="icon" onClick={() => navigate('/')}>
                <ArrowLeft className="w-5 h-5" />
              </Button>
              <h1 className="text-xl font-bold">Admin-Bereich</h1>
            </div>
            {activeTab === 'levels' && (
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
            )}
          </div>
        </header>

        {/* Content Area */}
        <main className="flex-1 overflow-y-auto p-6">
          {activeTab === 'dashboard' && <AdminDashboard />}

          {activeTab === 'users' && <UserList />}

          {activeTab === 'levels' && (
            <div className="space-y-6">
              <div>
                <h1 className="text-2xl font-bold text-foreground">Levels / Showcases</h1>
                <p className="text-muted-foreground mt-1">Videos aus Vimeo importieren und verwalten</p>
              </div>

              <Tabs value={levelsSubTab} onValueChange={(v) => setLevelsSubTab(v as 'import' | 'manage')} className="space-y-6">
                <TabsList className="grid w-full max-w-md grid-cols-2">
                  <TabsTrigger value="import" className="gap-2">
                    <Download className="w-4 h-4" />
                    Showcases importieren
                  </TabsTrigger>
                  <TabsTrigger value="manage" className="gap-2">
                    <Settings className="w-4 h-4" />
                    Levels verwalten
                  </TabsTrigger>
                </TabsList>

                <TabsContent value="import">
                  <ShowcaseImporter 
                    onImportComplete={() => setRefreshKey((k) => k + 1)} 
                  />
                </TabsContent>

                <TabsContent value="manage">
                  {levelsView === 'levels' && (
                    <LevelManager
                      key={refreshKey}
                      onSelectLevel={(levelId) => {
                        supabase
                          .from('levels')
                          .select('id, title')
                          .eq('id', levelId)
                          .single()
                          .then(({ data }) => {
                            if (data) {
                              setContext({ levelId: data.id, levelTitle: data.title });
                              setLevelsView('sections');
                            }
                          });
                      }}
                    />
                  )}

                  {levelsView === 'sections' && context && (
                    <SectionManager
                      levelId={context.levelId}
                      levelTitle={context.levelTitle}
                      onBack={() => {
                        setLevelsView('levels');
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
                              setLevelsView('videos');
                            }
                          });
                      }}
                    />
                  )}

                  {levelsView === 'videos' && context?.sectionId && (
                    <VideoManager
                      sectionId={context.sectionId}
                      sectionTitle={context.sectionTitle || ''}
                      levelId={context.levelId}
                      onBack={() => {
                        setContext({ levelId: context.levelId, levelTitle: context.levelTitle });
                        setLevelsView('sections');
                      }}
                    />
                  )}
                </TabsContent>
              </Tabs>
            </div>
          )}

          {activeTab === 'products' && (
            <div className="space-y-6">
              <div>
                <h1 className="text-2xl font-bold text-foreground">Produkte & Pläne</h1>
                <p className="text-muted-foreground mt-1">DigiMember-Produkte den App-Plänen zuweisen</p>
              </div>
              
              <Tabs defaultValue="products" className="space-y-6">
                <TabsList className="grid w-full max-w-md grid-cols-2">
                  <TabsTrigger value="products" className="gap-2">
                    <Package className="w-4 h-4" />
                    Produkte
                  </TabsTrigger>
                  <TabsTrigger value="debug" className="gap-2">
                    <Users className="w-4 h-4" />
                    Membership Debug
                  </TabsTrigger>
                </TabsList>

                <TabsContent value="products">
                  <ProductPlanManager />
                </TabsContent>

                <TabsContent value="debug">
                  <MembershipDebugPanel />
                </TabsContent>
              </Tabs>
            </div>
          )}

          {activeTab === 'classrooms' && (
            <div className="space-y-6">
              <div>
                <h1 className="text-2xl font-bold text-foreground">Klassenzimmer</h1>
                <p className="text-muted-foreground mt-1">Live-Sessions und Aufzeichnungen verwalten</p>
              </div>
              <Card>
                <CardContent className="py-12 text-center text-muted-foreground">
                  Klassenzimmer-Verwaltung kommt bald...
                </CardContent>
              </Card>
            </div>
          )}

          {activeTab === 'feedback' && <AdminFeedbackPanel />}

          {activeTab === 'system' && (
            <div className="space-y-6">
              <div>
                <h1 className="text-2xl font-bold text-foreground">Systemstatus</h1>
                <p className="text-muted-foreground mt-1">Übersicht über Systemkomponenten</p>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="flex items-center gap-2 text-base">
                      <Server className="w-4 h-4" />
                      Datenbank
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center gap-2 text-emerald-600">
                      <CheckCircle className="w-5 h-5" />
                      <span className="font-medium">Online</span>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="flex items-center gap-2 text-base">
                      <Server className="w-4 h-4" />
                      Vimeo API
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center gap-2 text-emerald-600">
                      <CheckCircle className="w-5 h-5" />
                      <span className="font-medium">Verbunden</span>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="flex items-center gap-2 text-base">
                      <Server className="w-4 h-4" />
                      Edge Functions
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center gap-2 text-emerald-600">
                      <CheckCircle className="w-5 h-5" />
                      <span className="font-medium">Aktiv</span>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
