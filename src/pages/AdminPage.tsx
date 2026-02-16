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
import { AssistantContentManager } from '@/components/admin/AssistantContentManager';
import { AssistantRepertoireManager } from '@/components/admin/AssistantRepertoireManager';
import { AssistantFeedbackManager } from '@/components/admin/AssistantFeedbackManager';
import { PdfDocumentManager } from '@/components/admin/PdfDocumentManager';
import { PdfAudioManager } from '@/components/admin/PdfAudioManager';
import { MusicXMLManager } from '@/components/admin/MusicXMLManager';
import { MusicXMLAudioManager } from '@/components/admin/MusicXMLAudioManager';
import { FeatureFlagManager } from '@/components/admin/FeatureFlagManager';
import { Digistore24Manager } from '@/components/admin/Digistore24Manager';
import { DrumBeatManager } from '@/components/admin/DrumBeatManager';
import { EmailTemplateManager } from '@/components/admin/EmailTemplateManager';
import { supabase } from '@/integrations/supabase/client';
import { ArrowLeft, RefreshCw, Loader2, Download, Settings, Server, Package, Users, Zap, Database, Cloud, FileText, Music } from 'lucide-react';
import { toast } from 'sonner';
import '@/styles/admin.css';

type View = 'levels' | 'sections' | 'videos';
type AdminTab = 'dashboard' | 'users' | 'levels' | 'pdfs' | 'musicxml' | 'products' | 'digistore24' | 'beats' | 'assistant' | 'classrooms' | 'feedback' | 'features' | 'emails' | 'system';
type AssistantSubTab = 'content' | 'repertoire' | 'feedback';
type PdfSubTab = 'documents' | 'audio';

interface SelectedContext {
  levelId: string;
  levelTitle: string;
  sectionId?: string;
  sectionTitle?: string;
}

interface PdfAudioContext {
  pdfId: string;
  pdfTitle: string;
  pageCount: number;
}

interface MusicXMLAudioContext {
  docId: string;
  docTitle: string;
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
  const [assistantSubTab, setAssistantSubTab] = useState<AssistantSubTab>('content');
  const [pdfSubTab, setPdfSubTab] = useState<PdfSubTab>('documents');
  const [pdfAudioContext, setPdfAudioContext] = useState<PdfAudioContext | null>(null);
  const [musicxmlAudioContext, setMusicxmlAudioContext] = useState<MusicXMLAudioContext | null>(null);
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
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
          <span className="text-sm text-slate-500">Lade Admin-Bereich...</span>
        </div>
      </div>
    );
  }

  if (!isAdmin) {
    return null;
  }

  const getPageTitle = () => {
    switch (activeTab) {
      case 'dashboard': return 'Dashboard';
      case 'users': return 'Nutzerverwaltung';
      case 'levels': return 'Levels & Showcases';
      case 'pdfs': return 'PDFs / Noten';
      case 'musicxml': return 'MusicXML';
      case 'products': return 'Produkte & Pläne';
      case 'digistore24': return 'Digistore24';
      case 'beats': return 'Drum Beats';
      case 'assistant': return 'KI-Assistent';
      case 'classrooms': return 'Klassenzimmer';
      case 'feedback': return 'Feedback & Chats';
      case 'features': return 'Feature Flags';
      case 'emails': return 'E-Mail Templates';
      case 'system': return 'Systemstatus';
      default: return 'Admin';
    }
  };

  const getPageDescription = () => {
    switch (activeTab) {
      case 'dashboard': return 'Übersicht aller wichtigen Kennzahlen';
      case 'users': return 'Nutzer verwalten und bearbeiten';
      case 'levels': return 'Vimeo Showcases importieren und verwalten';
      case 'pdfs': return 'PDF-Noten mit Audio-Begleitung verwalten';
      case 'musicxml': return 'MusicXML Dokumente mit Audio-Tracks verwalten';
      case 'products': return 'DigiMember Produkte und Plan-Zuordnungen';
      case 'digistore24': return 'IPN-Webhooks, Produkt-Mapping und Event-Logs';
      case 'beats': return 'Drum Beat Loops hochladen und verwalten';
      case 'assistant': return 'Wissensbasis, Repertoire und Feedback';
      case 'classrooms': return 'Live-Unterricht verwalten';
      case 'feedback': return 'Schüler-Feedback und Nachrichten';
      case 'features': return 'Menüpunkte und Features ein-/ausblenden';
      case 'emails': return 'E-Mail-Vorlagen bearbeiten und verwalten';
      case 'system': return 'Systemstatus und Einstellungen';
      default: return '';
    }
  };

  return (
    <div className="admin-layout min-h-screen flex" style={{ background: '#F8FAFC' }}>
      {/* Sidebar */}
      <AdminSidebar activeTab={activeTab} onTabChange={(tab) => setActiveTab(tab as AdminTab)} />

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-h-screen overflow-hidden">
        {/* Header */}
        <header className="sticky top-0 z-20 bg-white/80 backdrop-blur-xl border-b border-slate-200/80">
          <div className="px-8 py-5 flex items-center justify-between">
            <div className="flex items-center gap-5">
              <button 
                onClick={() => navigate('/')}
                className="p-2 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-all"
                title="Zurück zur App"
              >
                <ArrowLeft className="w-5 h-5" />
              </button>
              <div>
                <h1 className="text-xl font-semibold text-slate-900 tracking-tight">
                  {getPageTitle()}
                </h1>
                <p className="text-sm text-slate-500 mt-0.5">
                  {getPageDescription()}
                </p>
              </div>
            </div>
            
            {activeTab === 'levels' && (
              <button
                onClick={handleSyncAll}
                disabled={isSyncing}
                className="inline-flex items-center gap-2 px-4 py-2.5 text-sm font-medium rounded-lg bg-blue-500 text-white hover:bg-blue-600 disabled:opacity-50 transition-all shadow-sm shadow-blue-500/20"
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
        <main className="flex-1 overflow-y-auto p-8">
          {activeTab === 'dashboard' && <AdminDashboard />}

          {activeTab === 'users' && <UserList />}

          {activeTab === 'levels' && (
            <div className="space-y-6">
              {/* Sub-tabs */}
              <div className="admin-tabs">
                <button
                  onClick={() => setLevelsSubTab('import')}
                  className={`admin-tab ${levelsSubTab === 'import' ? 'admin-tab-active' : ''}`}
                >
                  <Download className="w-4 h-4" />
                  Showcases importieren
                </button>
                <button
                  onClick={() => setLevelsSubTab('manage')}
                  className={`admin-tab ${levelsSubTab === 'manage' ? 'admin-tab-active' : ''}`}
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

          {activeTab === 'pdfs' && (
            <div className="space-y-6">
              {pdfAudioContext ? (
                <PdfAudioManager
                  pdfId={pdfAudioContext.pdfId}
                  pdfTitle={pdfAudioContext.pdfTitle}
                  pageCount={pdfAudioContext.pageCount}
                  onBack={() => setPdfAudioContext(null)}
                />
              ) : (
                <>
                  {/* Sub-tabs */}
                  <div className="admin-tabs">
                    <button
                      onClick={() => setPdfSubTab('documents')}
                      className={`admin-tab ${pdfSubTab === 'documents' ? 'admin-tab-active' : ''}`}
                    >
                      <FileText className="w-4 h-4" />
                      PDFs verwalten
                    </button>
                  </div>

                  <PdfDocumentManager
                    onManageAudio={(pdfId, pdfTitle, pageCount) => {
                      setPdfAudioContext({ pdfId, pdfTitle, pageCount });
                    }}
                  />
                </>
              )}
            </div>
          )}

          {activeTab === 'musicxml' && (
            <div className="space-y-6">
              {musicxmlAudioContext ? (
                <MusicXMLAudioManager
                  docId={musicxmlAudioContext.docId}
                  docTitle={musicxmlAudioContext.docTitle}
                  onBack={() => setMusicxmlAudioContext(null)}
                />
              ) : (
                <MusicXMLManager
                  onManageAudio={(docId, docTitle) => {
                    setMusicxmlAudioContext({ docId, docTitle });
                  }}
                />
              )}
            </div>
          )}

          {activeTab === 'products' && (
            <div className="space-y-6">
              {/* Sub-tabs */}
              <div className="admin-tabs">
                <button className="admin-tab admin-tab-active">
                  <Package className="w-4 h-4" />
                  Produkte
                </button>
                <button className="admin-tab">
                  <Users className="w-4 h-4" />
                  Membership Debug
                </button>
              </div>

              <ProductPlanManager />
            </div>
          )}

          {activeTab === 'assistant' && (
            <div className="space-y-6">
              <div className="admin-tabs">
                <button
                  onClick={() => setAssistantSubTab('content')}
                  className={`admin-tab ${assistantSubTab === 'content' ? 'admin-tab-active' : ''}`}
                >
                  Inhalte
                </button>
                <button
                  onClick={() => setAssistantSubTab('repertoire')}
                  className={`admin-tab ${assistantSubTab === 'repertoire' ? 'admin-tab-active' : ''}`}
                >
                  Repertoire
                </button>
                <button
                  onClick={() => setAssistantSubTab('feedback')}
                  className={`admin-tab ${assistantSubTab === 'feedback' ? 'admin-tab-active' : ''}`}
                >
                  Feedback
                </button>
              </div>

              {assistantSubTab === 'content' && <AssistantContentManager />}
              {assistantSubTab === 'repertoire' && <AssistantRepertoireManager />}
              {assistantSubTab === 'feedback' && <AssistantFeedbackManager />}
            </div>
          )}

          {activeTab === 'classrooms' && (
            <div className="admin-card p-16 text-center">
              <div className="w-16 h-16 rounded-2xl bg-slate-100 flex items-center justify-center mx-auto mb-4">
                <Zap className="w-8 h-8 text-slate-400" />
              </div>
              <h3 className="text-lg font-semibold text-slate-900 mb-2">Klassenzimmer-Verwaltung</h3>
              <p className="text-slate-500 max-w-md mx-auto">
                Die Live-Klassenzimmer-Verwaltung wird in Kürze verfügbar sein.
              </p>
            </div>
          )}

          {activeTab === 'feedback' && <AdminFeedbackPanel />}

          {activeTab === 'digistore24' && <Digistore24Manager />}

          {activeTab === 'beats' && <DrumBeatManager />}

          {activeTab === 'features' && <FeatureFlagManager />}
          {activeTab === 'emails' && <EmailTemplateManager />}
          {activeTab === 'system' && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
              {/* Status Cards */}
              <div className="admin-card p-6">
                <div className="flex items-center gap-4 mb-4">
                  <div className="w-10 h-10 rounded-xl bg-emerald-100 flex items-center justify-center">
                    <Database className="w-5 h-5 text-emerald-600" />
                  </div>
                  <span className="font-medium text-slate-900">Datenbank</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                  <span className="text-sm text-emerald-600 font-medium">Online</span>
                </div>
              </div>

              <div className="admin-card p-6">
                <div className="flex items-center gap-4 mb-4">
                  <div className="w-10 h-10 rounded-xl bg-blue-100 flex items-center justify-center">
                    <Cloud className="w-5 h-5 text-blue-600" />
                  </div>
                  <span className="font-medium text-slate-900">Vimeo API</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                  <span className="text-sm text-emerald-600 font-medium">Verbunden</span>
                </div>
              </div>

              <div className="admin-card p-6">
                <div className="flex items-center gap-4 mb-4">
                  <div className="w-10 h-10 rounded-xl bg-purple-100 flex items-center justify-center">
                    <Zap className="w-5 h-5 text-purple-600" />
                  </div>
                  <span className="font-medium text-slate-900">Edge Functions</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                  <span className="text-sm text-emerald-600 font-medium">Aktiv</span>
                </div>
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
