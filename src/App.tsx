import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/hooks/useAuth";
import { VideoPlayerProvider } from "@/hooks/useVideoPlayer";
import { MembershipProvider } from "@/hooks/useMembership";

import { PdfViewerProvider } from "@/hooks/usePdfViewer";
import { LanguageProvider } from "@/hooks/useLanguage";
import Index from "./pages/Index";
import AuthPage from "./pages/AuthPage";
import AdminPage from "./pages/AdminPage";
import { ChatsPage } from "./pages/ChatsPage";
import { ClassroomPage } from "./pages/ClassroomPage";
import { MusicXMLPage } from "./pages/MusicXMLPage";
import { MusicXMLViewerPage } from "./pages/MusicXMLViewerPage";
import PricingPage from "./pages/PricingPage";

import GamePlayPage from "./pages/GamePlayPage";
import SessionBuilderPage from "./pages/SessionBuilderPage";
import SessionListPage from "./pages/SessionListPage";
import SessionPlayerPage from "./pages/SessionPlayerPage";
import SharedSessionPage from "./pages/SharedSessionPage";
import TrompeteLernenPage from "./pages/TrompeteLernenPage";
import TrompeteLernenErwachsenePage from "./pages/TrompeteLernenErwachsenePage";
import TrompeteLernenKinderPage from "./pages/TrompeteLernenKinderPage";
import TrompeteAnsatzAtmungPage from "./pages/TrompeteAnsatzAtmungPage";
import TrompeteErsterTonPage from "./pages/TrompeteErsterTonPage";
import TrompeteTonumfangPage from "./pages/TrompeteTonumfangPage";
import HilfeKeinTonPage from "./pages/HilfeKeinTonPage";
import NotFound from "./pages/NotFound";

// Mobile Mini-Mode pages
import MobileHomePage from "./pages/mobile/MobileHomePage";
import MobilePlanPage from "./pages/mobile/MobilePlanPage";
import MobileHelpPage from "./pages/mobile/MobileHelpPage";
import MobileProfilePage from "./pages/mobile/MobileProfilePage";
import MobileLockedPage from "./pages/mobile/MobileLockedPage";
import { MobileRouteGuard } from "./components/mobile/MobileRouteGuard";

const queryClient = new QueryClient();

console.log('[App.tsx] App component loading...');

const App = () => {
  console.log('[App.tsx] App component rendering...');
  return (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <AuthProvider>
        <LanguageProvider>
            <MembershipProvider>
              <VideoPlayerProvider>
                <PdfViewerProvider>
                  <Toaster />
                  <Sonner />
                  <BrowserRouter>
                    <MobileRouteGuard>
                      <Routes>
                        <Route path="/" element={<Index />} />
                        <Route path="/auth" element={<AuthPage />} />
                        
                        {/* Mobile Mini-Mode Routes */}
                        <Route path="/mobile/home" element={<MobileHomePage />} />
                        <Route path="/mobile/plan" element={<MobilePlanPage />} />
                        <Route path="/mobile/help" element={<MobileHelpPage />} />
                        <Route path="/mobile/profile" element={<MobileProfilePage />} />
                        <Route path="/mobile/locked" element={<MobileLockedPage />} />
                        
                        <Route path="/admin" element={<AdminPage />} />
                        <Route path="/chats" element={<ChatsPage />} />
                        <Route path="/classroom" element={<ClassroomPage />} />
                        <Route path="/pricing" element={<PricingPage />} />
                        <Route path="/musicxml" element={<MusicXMLPage />} />
                        <Route path="/musicxml/:id" element={<MusicXMLViewerPage />} />
                        <Route path="/game/play" element={<GamePlayPage />} />
                        <Route path="/practice/sessions" element={<SessionListPage />} />
                        <Route path="/practice/sessions/new" element={<SessionBuilderPage />} />
                        <Route path="/practice/sessions/:id/edit" element={<SessionBuilderPage />} />
                        <Route path="/practice/sessions/:id/play" element={<SessionPlayerPage />} />
                        <Route path="/practice/sessions/share/:slug" element={<SharedSessionPage />} />
                        
                        {/* SEO Pillar Pages */}
                        <Route path="/trompete-lernen" element={<TrompeteLernenPage />} />
                        <Route path="/trompete-lernen-erwachsene" element={<TrompeteLernenErwachsenePage />} />
                        <Route path="/trompete-lernen-kinder" element={<TrompeteLernenKinderPage />} />
                        <Route path="/trompete-ansatz-atmung" element={<TrompeteAnsatzAtmungPage />} />
                        <Route path="/trompete-erster-ton" element={<TrompeteErsterTonPage />} />
                        <Route path="/trompete-tonumfang" element={<TrompeteTonumfangPage />} />
                        <Route path="/hilfe/trompete-kein-ton" element={<HilfeKeinTonPage />} />
                        
                        {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
                        <Route path="*" element={<NotFound />} />
                      </Routes>
                    </MobileRouteGuard>
                  </BrowserRouter>
                </PdfViewerProvider>
              </VideoPlayerProvider>
            </MembershipProvider>
        </LanguageProvider>
      </AuthProvider>
    </TooltipProvider>
  </QueryClientProvider>
  );
};

export default App;
