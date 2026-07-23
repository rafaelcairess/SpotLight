/**
 * Roteamento principal e providers do app.
 */

import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import { lazy, Suspense } from "react";
import { PresenceHeartbeat } from "@/hooks/usePresence";

const loadWhenIdle = <T,>(loader: () => Promise<T>): Promise<T> =>
  new Promise((resolve, reject) => {
    const load = () => loader().then(resolve, reject);
    if ("requestIdleCallback" in window) {
      window.requestIdleCallback(load, { timeout: 1500 });
    } else {
      globalThis.setTimeout(load, 300);
    }
  });

const Explore = lazy(() => import("@/features/explore/pages/Explore"));
const Collections = lazy(() => import("@/features/collections/pages/Collections"));
const CollectionDetail = lazy(() => import("@/features/collections/pages/CollectionDetail"));
const Search = lazy(() => import("@/features/search/pages/Search"));
const Auth = lazy(() => import("@/features/auth/pages/Auth"));
const Profile = lazy(() => import("@/features/profile/pages/Profile"));
const Promotions = lazy(() => import("@/features/promotions/pages/Promotions"));
const Community = lazy(() => import("@/features/community/pages/Community"));
const PublicProfile = lazy(() => import("@/features/profile/pages/PublicProfile"));
const TopGames = lazy(() => import("@/features/top/pages/TopGames"));
const MostPlayed = lazy(() => import("@/features/most-played/pages/MostPlayed"));
const Feedback = lazy(() => import("@/features/feedback/pages/Feedback"));
const Alerts = lazy(() => import("@/features/alerts/pages/Alerts"));
const NotFound = lazy(() => import("@/pages/NotFound"));
const OnboardingModal = lazy(() =>
  loadWhenIdle(() => import("@/features/onboarding/components/OnboardingModal")),
);
const WhatsNewModal = lazy(() =>
  loadWhenIdle(() => import("@/features/onboarding/components/WhatsNewModal")),
);
const GamePage = lazy(() => import("@/features/games/pages/GamePage"));
const ListPage = lazy(() => import("@/features/lists/pages/ListPage"));
const Admin = lazy(() => import("@/features/admin/pages/Admin"));
const Friends = lazy(() => import("@/features/friends/pages/Friends"));
const ProfileEdit = lazy(() => import("@/features/profile/pages/ProfileEdit"));

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <>
        <PresenceHeartbeat />
        <Toaster />
        <Sonner />
        <BrowserRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
          <Suspense fallback={<div className="min-h-screen bg-background" aria-busy="true" />}>
            <Routes>
              <Route path="/" element={<Explore />} />
              <Route path="/auth" element={<Auth />} />
              <Route path="/profile" element={<Profile />} />
              <Route path="/profile/edit" element={<ProfileEdit />} />
              <Route path="/collections" element={<Collections />} />
              <Route path="/collections/:categoryId" element={<CollectionDetail />} />
              <Route path="/search" element={<Search />} />
              <Route path="/promocoes" element={<Promotions />} />
              <Route path="/comunidade" element={<Community />} />
              <Route path="/top" element={<TopGames />} />
              <Route path="/mais-jogados" element={<MostPlayed />} />
              <Route path="/feedback" element={<Feedback />} />
              <Route path="/alerts" element={<Alerts />} />
              <Route path="/u/:username" element={<PublicProfile />} />
              <Route path="/game/:appId" element={<GamePage />} />
              <Route path="/lists/:listId" element={<ListPage />} />
              <Route path="/admin" element={<Admin />} />
              <Route path="/friends" element={<Friends />} />
              {/* Adicione todas as rotas acima do catch-all "*" */}
              <Route path="*" element={<NotFound />} />
            </Routes>
            <OnboardingModal />
            <WhatsNewModal />
          </Suspense>
        </BrowserRouter>
      </>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
