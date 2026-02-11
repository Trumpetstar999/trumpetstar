import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/hooks/useAuth";
import { VideoPlayerProvider } from "@/hooks/useVideoPlayer";
import { MembershipProvider } from "@/hooks/useMembership";
import { WordPressMembershipProvider } from "@/hooks/useWordPressMembership";
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
import WordPressCallbackPage from "./pages/WordPressCallbackPage";
import GamePlayPage from "./pages/GamePlayPage";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

console.log('[App.tsx] App component loading...');

const App = () => {
  console.log('[App.tsx] App component rendering...');
  return (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <AuthProvider>
        <LanguageProvider>
          <WordPressMembershipProvider>
            <MembershipProvider>
              <VideoPlayerProvider>
                <PdfViewerProvider>
                  <Toaster />
                  <Sonner />
                  <BrowserRouter>
                    <Routes>
                      <Route path="/" element={<Index />} />
                      <Route path="/auth" element={<AuthPage />} />
                      <Route path="/auth/wordpress/callback" element={<WordPressCallbackPage />} />
                      <Route path="/admin" element={<AdminPage />} />
                      <Route path="/chats" element={<ChatsPage />} />
                      <Route path="/classroom" element={<ClassroomPage />} />
                      <Route path="/pricing" element={<PricingPage />} />
                      <Route path="/musicxml" element={<MusicXMLPage />} />
                      <Route path="/musicxml/:id" element={<MusicXMLViewerPage />} />
                      <Route path="/game/play" element={<GamePlayPage />} />
                      {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
                      <Route path="*" element={<NotFound />} />
                    </Routes>
                  </BrowserRouter>
                </PdfViewerProvider>
              </VideoPlayerProvider>
            </MembershipProvider>
          </WordPressMembershipProvider>
        </LanguageProvider>
      </AuthProvider>
    </TooltipProvider>
  </QueryClientProvider>
  );
};

export default App;
