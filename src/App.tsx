import { lazy, Suspense } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "@/hooks/useAuth";
import { VideoPlayerProvider } from "@/hooks/useVideoPlayer";
import { MembershipProvider } from "@/hooks/useMembership";
import { PdfViewerProvider } from "@/hooks/usePdfViewer";
import { LanguageProvider } from "@/hooks/useLanguage";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import { LanguageDetector } from "@/components/LanguageDetector";
import { TrumpetstarLoader } from "@/components/common/TrumpetstarLoader";
import { MobileRouteGuard } from "./components/mobile/MobileRouteGuard";

// Eagerly loaded — landing & auth are entry points and small
import LandingPage from "./pages/LandingPage";
import AuthPage from "./pages/AuthPage";
import NotFound from "./pages/NotFound";

// Lazy-loaded routes (code-split into separate chunks)
const Index = lazy(() => import("./pages/Index"));
const BlogPage = lazy(() => import("./pages/BlogPage"));
const TrompeteLernenErwachsene = lazy(() => import("./pages/blog/TrompeteLernenErwachsene"));
const ErsterTonTrompete = lazy(() => import("./pages/blog/ErsterTonTrompete"));
const TrompeteUebenRoutine = lazy(() => import("./pages/blog/TrompeteUebenRoutine"));
const TrompeteLernenKinder = lazy(() => import("./pages/blog/TrompeteLernenKinder"));
const TrompeteFluegelhorn = lazy(() => import("./pages/blog/TrompeteFluegelhorn"));
const TrompeteKinderKaufen = lazy(() => import("./pages/blog/TrompeteKinderKaufen"));
const BlaeserklasseEltern = lazy(() => import("./pages/blog/BlaeserklasseEltern"));
const AdminPage = lazy(() => import("./pages/AdminPage"));
const ChatsPage = lazy(() => import("./pages/ChatsPage").then(m => ({ default: m.ChatsPage })));
const ClassroomPage = lazy(() => import("./pages/ClassroomPage").then(m => ({ default: m.ClassroomPage })));
const MusicXMLPage = lazy(() => import("./pages/MusicXMLPage").then(m => ({ default: m.MusicXMLPage })));
const MusicXMLViewerPage = lazy(() => import("./pages/MusicXMLViewerPage").then(m => ({ default: m.MusicXMLViewerPage })));
const PricingPage = lazy(() => import("./pages/PricingPage"));
const GamePlayPage = lazy(() => import("./pages/GamePlayPage"));
const SessionBuilderPage = lazy(() => import("./pages/SessionBuilderPage"));
const PlaylistBuilderPage = lazy(() => import("./pages/PlaylistBuilderPage"));
const SessionListPage = lazy(() => import("./pages/SessionListPage"));
const SessionPlayerPage = lazy(() => import("./pages/SessionPlayerPage"));
const SharedSessionPage = lazy(() => import("./pages/SharedSessionPage"));
const TrompeteLernenPage = lazy(() => import("./pages/TrompeteLernenPage"));
const TrompeteLernenErwachsenePage = lazy(() => import("./pages/TrompeteLernenErwachsenePage"));
const TrompeteLernenKinderPage = lazy(() => import("./pages/TrompeteLernenKinderPage"));
const TrompeteAnsatzAtmungPage = lazy(() => import("./pages/TrompeteAnsatzAtmungPage"));
const TrompeteErsterTonPage = lazy(() => import("./pages/TrompeteErsterTonPage"));
const TrompeteTonumfangPage = lazy(() => import("./pages/TrompeteTonumfangPage"));
const HilfeKeinTonPage = lazy(() => import("./pages/HilfeKeinTonPage"));
const HelpCenterPage = lazy(() => import("./pages/HelpCenterPage"));
const QRRedirectPage = lazy(() => import("./pages/QRRedirectPage"));
const ResetPasswordPage = lazy(() => import("./pages/ResetPasswordPage"));
const ImpressumPage = lazy(() => import("./pages/ImpressumPage"));
const DatenschutzPage = lazy(() => import("./pages/DatenschutzPage"));

// Mobile Mini-Mode pages (lazy)
const MobileHomePage = lazy(() => import("./pages/mobile/MobileHomePage"));
const MobilePlanPage = lazy(() => import("./pages/mobile/MobilePlanPage"));
const MobileHelpPage = lazy(() => import("./pages/mobile/MobileHelpPage"));
const MobileProfilePage = lazy(() => import("./pages/mobile/MobileProfilePage"));
const MobileLockedPage = lazy(() => import("./pages/mobile/MobileLockedPage"));

const queryClient = new QueryClient();

const PageFallback = () => <TrumpetstarLoader />;

const App = () => (
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
                  <LanguageDetector />
                  <MobileRouteGuard>
                    <Suspense fallback={<PageFallback />}>
                      <Routes>
                        {/* Public Landing */}
                        <Route path="/" element={<LandingPage />} />
                        {/* Blog Routes */}
                        <Route path="/blog" element={<BlogPage />} />
                        <Route path="/blog/trompete-lernen-erwachsene" element={<TrompeteLernenErwachsene />} />
                        <Route path="/blog/erster-ton-trompete" element={<ErsterTonTrompete />} />
                        <Route path="/blog/trompete-ueben-routine" element={<TrompeteUebenRoutine />} />
                        <Route path="/blog/trompete-lernen-kinder" element={<TrompeteLernenKinder />} />
                        <Route path="/blog/trompete-fluegelhorn-kind" element={<TrompeteFluegelhorn />} />
                        <Route path="/blog/trompete-kinder-kaufen" element={<TrompeteKinderKaufen />} />
                        <Route path="/blog/blaeserklasse-trompete" element={<BlaeserklasseEltern />} />

                        {/* Auth Routes */}
                        <Route path="/auth" element={<AuthPage />} />
                        <Route path="/login" element={<AuthPage />} />
                        <Route path="/signup" element={<AuthPage />} />
                        <Route path="/reset-password" element={<ResetPasswordPage />} />

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
                        <Route path="/app/playlists/new" element={<ProtectedRoute><PlaylistBuilderPage /></ProtectedRoute>} />
                        <Route path="/app/playlists/:id/edit" element={<ProtectedRoute><PlaylistBuilderPage /></ProtectedRoute>} />
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
                        <Route path="/impressum" element={<ImpressumPage />} />
                        <Route path="/datenschutz" element={<DatenschutzPage />} />

                        {/* QR Code redirect */}
                        <Route path="/qr/:code" element={<QRRedirectPage />} />

                        {/* Common URL redirects */}
                        <Route path="/shop" element={<Navigate to="/pricing" replace />} />
                        <Route path="/levels" element={<Navigate to="/app" replace />} />
                        <Route path="/dashboard" element={<Navigate to="/app" replace />} />
                        <Route path="/register" element={<Navigate to="/signup" replace />} />

                        {/* Legacy redirect: old /musicxml/:id links */}
                        <Route path="/musicxml/:id" element={<ProtectedRoute><MusicXMLViewerPage /></ProtectedRoute>} />

                        {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
                        <Route path="*" element={<NotFound />} />
                      </Routes>
                    </Suspense>
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

export default App;
