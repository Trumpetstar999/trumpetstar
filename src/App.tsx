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
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import Index from "./pages/Index";
import LandingPage from "./pages/LandingPage";
import BlogPage from "./pages/BlogPage";
import TrompeteLernenErwachsene from "./pages/blog/TrompeteLernenErwachsene";
import ErsterTonTrompete from "./pages/blog/ErsterTonTrompete";
import TrompeteUebenRoutine from "./pages/blog/TrompeteUebenRoutine";
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
import HelpCenterPage from "./pages/HelpCenterPage";
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
                        {/* Public Landing */}
                        <Route path="/" element={<LandingPage />} />
                        {/* Blog Routes */}
                        <Route path="/blog" element={<BlogPage />} />
                        <Route path="/blog/trompete-lernen-erwachsene" element={<TrompeteLernenErwachsene />} />
                        <Route path="/blog/erster-ton-trompete" element={<ErsterTonTrompete />} />
                        <Route path="/blog/trompete-ueben-routine" element={<TrompeteUebenRoutine />} />
                        
                        {/* Auth Routes */}
                        <Route path="/auth" element={<AuthPage />} />
                        <Route path="/login" element={<AuthPage />} />
                        <Route path="/signup" element={<AuthPage />} />
                        
                        {/* Mobile Mini-Mode Routes */}
                        <Route path="/mobile/home" element={<MobileHomePage />} />
                        <Route path="/mobile/plan" element={<MobilePlanPage />} />
                        <Route path="/mobile/help" element={<MobileHelpPage />} />
                        <Route path="/mobile/profile" element={<MobileProfilePage />} />
                        <Route path="/mobile/locked" element={<MobileLockedPage />} />
                        
                        {/* Protected App Routes */}
                        <Route path="/app" element={<ProtectedRoute><Index /></ProtectedRoute>} />
                        <Route path="/app/admin" element={<ProtectedRoute><AdminPage /></ProtectedRoute>} />
                        <Route path="/app/chats" element={<ProtectedRoute><ChatsPage /></ProtectedRoute>} />
                        <Route path="/app/classroom" element={<ProtectedRoute><ClassroomPage /></ProtectedRoute>} />
                        <Route path="/app/musicxml" element={<ProtectedRoute><MusicXMLPage /></ProtectedRoute>} />
                        <Route path="/app/musicxml/:id" element={<ProtectedRoute><MusicXMLViewerPage /></ProtectedRoute>} />
                        <Route path="/app/game/play" element={<ProtectedRoute><GamePlayPage /></ProtectedRoute>} />
                        <Route path="/app/practice/sessions" element={<ProtectedRoute><SessionListPage /></ProtectedRoute>} />
                        <Route path="/app/practice/sessions/new" element={<ProtectedRoute><SessionBuilderPage /></ProtectedRoute>} />
                        <Route path="/app/practice/sessions/:id/edit" element={<ProtectedRoute><SessionBuilderPage /></ProtectedRoute>} />
                        <Route path="/app/practice/sessions/:id/play" element={<ProtectedRoute><SessionPlayerPage /></ProtectedRoute>} />
                        <Route path="/app/hilfe" element={<ProtectedRoute><HelpCenterPage /></ProtectedRoute>} />
                        
                        {/* Public Routes */}
                        <Route path="/pricing" element={<PricingPage />} />
                        <Route path="/practice/sessions/share/:slug" element={<SharedSessionPage />} />
                        
                        {/* SEO Pillar Pages */}
                        <Route path="/trompete-lernen" element={<TrompeteLernenPage />} />
                        <Route path="/trompete-lernen-erwachsene" element={<TrompeteLernenErwachsenePage />} />
                        <Route path="/trompete-lernen-kinder" element={<TrompeteLernenKinderPage />} />
                        <Route path="/trompete-ansatz-atmung" element={<TrompeteAnsatzAtmungPage />} />
                        <Route path="/trompete-erster-ton" element={<TrompeteErsterTonPage />} />
                        <Route path="/trompete-tonumfang" element={<TrompeteTonumfangPage />} />
                        <Route path="/hilfe" element={<HelpCenterPage />} />
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
