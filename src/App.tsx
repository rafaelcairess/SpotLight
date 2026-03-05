import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import Explore from "@/features/explore/pages/Explore";
import Collections from "@/features/collections/pages/Collections";
import CollectionDetail from "@/features/collections/pages/CollectionDetail";
import Search from "@/features/search/pages/Search";
import Auth from "@/features/auth/pages/Auth";
import Profile from "@/features/profile/pages/Profile";
import Promotions from "@/features/promotions/pages/Promotions";
import Community from "@/features/community/pages/Community";
import PublicProfile from "@/features/profile/pages/PublicProfile";
import TopGames from "@/features/top/pages/TopGames";
import MostPlayed from "@/features/most-played/pages/MostPlayed";
import Feedback from "@/features/feedback/pages/Feedback";
import Alerts from "@/features/alerts/pages/Alerts";
import NotFound from "@/pages/NotFound";
import OnboardingModal from "@/features/onboarding/components/OnboardingModal";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
          <Routes>
            <Route path="/" element={<Explore />} />
            <Route path="/auth" element={<Auth />} />
            <Route path="/profile" element={<Profile />} />
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
            {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
            <Route path="*" element={<NotFound />} />
          </Routes>
          <OnboardingModal />
        </BrowserRouter>
      </TooltipProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
