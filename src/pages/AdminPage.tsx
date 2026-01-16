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
import { ArrowLeft, RefreshCw, Loader2, Download, Settings, CheckCircle, Server, Package, Users } from 'lucide-react';
import { toast } from 'sonner';
import '@/styles/admin.css';

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
      <div className="min-h-screen bg-[#F5F7FA] flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-[#3B82F6]" />
      </div>
    );
  }

  if (!isAdmin) {
    return null;
  }

  return (
    <div className="admin-layout min-h-screen bg-[#F5F7FA] flex">
      {/* Sidebar */}
      <AdminSidebar activeTab={activeTab} onTabChange={(tab) => setActiveTab(tab as AdminTab)} />

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-h-screen overflow-hidden">
        {/* Header */}
        <header className="sticky top-0 z-20 bg-white border-b border-[#E5E7EB]">
          <div className="px-6 py-3 flex items-center justify-between">
            <div className="flex items-center gap-4">
              <button 
                onClick={() => navigate('/')}
                className="p-2 rounded-md text-[#6B7280] hover:bg-[#F5F7FA] hover:text-[#111827] transition-colors"
              >
                <ArrowLeft className="w-5 h-5" />
              </button>
              <div>
                <h1 className="text-lg font-semibold text-[#111827]">
                  {activeTab === 'dashboard' && 'Dashboard'}
                  {activeTab === 'users' && 'Nutzer'}
                  {activeTab === 'levels' && 'Levels / Showcases'}
                  {activeTab === 'products' && 'Produkte & Pläne'}
                  {activeTab === 'classrooms' && 'Klassenzimmer'}
                  {activeTab === 'feedback' && 'Feedback & Chats'}
                  {activeTab === 'system' && 'Systemstatus'}
                </h1>
              </div>
            </div>
            {activeTab === 'levels' && (
              <button
                onClick={handleSyncAll}
                disabled={isSyncing}
                className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-md border border-[#E5E7EB] bg-white text-[#111827] hover:bg-[#F5F7FA] disabled:opacity-50 transition-colors"
              >
                {isSyncing ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <RefreshCw className="w-4 h-4" />
                )}
                Alle synchronisieren
              </button>
            )}
          </div>
        </header>

        {/* Content Area */}
        <main className="flex-1 overflow-y-auto p-6">
          {activeTab === 'dashboard' && <AdminDashboard />}

          {activeTab === 'users' && <UserList />}

          {activeTab === 'levels' && (
            <div className="space-y-6">
              {/* Sub-tabs */}
              <div className="inline-flex bg-[#F5F7FA] rounded-lg p-1">
                <button
                  onClick={() => setLevelsSubTab('import')}
                  className={`inline-flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-md transition-all ${
                    levelsSubTab === 'import'
                      ? 'bg-white text-[#111827] shadow-sm'
                      : 'text-[#6B7280] hover:text-[#111827]'
                  }`}
                >
                  <Download className="w-4 h-4" />
                  Showcases importieren
                </button>
                <button
                  onClick={() => setLevelsSubTab('manage')}
                  className={`inline-flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-md transition-all ${
                    levelsSubTab === 'manage'
                      ? 'bg-white text-[#111827] shadow-sm'
                      : 'text-[#6B7280] hover:text-[#111827]'
                  }`}
                >
                  <Settings className="w-4 h-4" />
                  Levels verwalten
                </button>
              </div>

              {levelsSubTab === 'import' && (
                <ShowcaseImporter 
                  onImportComplete={() => setRefreshKey((k) => k + 1)} 
                />
              )}

              {levelsSubTab === 'manage' && (
                <>
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
                </>
              )}
            </div>
          )}

          {activeTab === 'products' && (
            <div className="space-y-6">
              {/* Sub-tabs */}
              <div className="inline-flex bg-[#F5F7FA] rounded-lg p-1">
                <button
                  className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-md bg-white text-[#111827] shadow-sm"
                >
                  <Package className="w-4 h-4" />
                  Produkte
                </button>
                <button
                  className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-md text-[#6B7280] hover:text-[#111827]"
                >
                  <Users className="w-4 h-4" />
                  Membership Debug
                </button>
              </div>

              <ProductPlanManager />
            </div>
          )}

          {activeTab === 'classrooms' && (
            <div className="bg-white border border-[#E5E7EB] rounded-lg p-12 text-center">
              <p className="text-[#6B7280]">Klassenzimmer-Verwaltung kommt bald...</p>
            </div>
          )}

          {activeTab === 'feedback' && <AdminFeedbackPanel />}

          {activeTab === 'system' && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Status Cards */}
              <div className="bg-white border border-[#E5E7EB] rounded-lg p-5">
                <div className="flex items-center gap-3 mb-3">
                  <Server className="w-5 h-5 text-[#6B7280]" />
                  <span className="font-medium text-[#111827]">Datenbank</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-[#10B981]" />
                  <span className="text-sm text-[#10B981] font-medium">Online</span>
                </div>
              </div>

              <div className="bg-white border border-[#E5E7EB] rounded-lg p-5">
                <div className="flex items-center gap-3 mb-3">
                  <Server className="w-5 h-5 text-[#6B7280]" />
                  <span className="font-medium text-[#111827]">Vimeo API</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-[#10B981]" />
                  <span className="text-sm text-[#10B981] font-medium">Verbunden</span>
                </div>
              </div>

              <div className="bg-white border border-[#E5E7EB] rounded-lg p-5">
                <div className="flex items-center gap-3 mb-3">
                  <Server className="w-5 h-5 text-[#6B7280]" />
                  <span className="font-medium text-[#111827]">Edge Functions</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-[#10B981]" />
                  <span className="text-sm text-[#10B981] font-medium">Aktiv</span>
                </div>
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
