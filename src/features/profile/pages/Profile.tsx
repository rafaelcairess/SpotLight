/**
 * Página da feature profile.
 */

import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  GamepadIcon,
  Heart,
  Trophy,
  BookOpen,
  Bell,
  Settings,
  RefreshCw,
  Download,
  List,
} from "lucide-react";
import Header from "@/components/Header";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useAuth } from "@/contexts/AuthContext";
import { useLanguage } from "@/contexts/LanguageContext";
import { useProfile } from "@/hooks/useProfile";
import { useUserGames } from "@/hooks/useUserGames";
import { useReviewsByUser } from "@/hooks/useReviews";
import { useFollowCounts, useFollowers, useFollowing } from "@/hooks/useFollows";
import { useSyncSteamPlaytime } from "@/hooks/useSteamPlaytime";
import { UserAvatar } from "@/features/profile/components/UserAvatar";
import { ProfileStats } from "@/features/profile/components/ProfileStats";
import { FollowListDialog } from "@/features/profile/components/FollowListDialog";
import { ProfileLibrarySections } from "@/features/profile/components/ProfileLibrarySections";
import { GameLibrary } from "@/features/profile/components/GameLibrary";
import { ProfileReviews } from "@/features/profile/components/ProfileReviews";
import { ProfileEditDialog } from "@/features/profile/components/ProfileEditDialog";
import { TrophyShowcase } from "@/features/profile/components/TrophyShowcase";
import { ProfileInsights } from "@/features/profile/components/ProfileInsights";
import { AchievementsBadges } from "@/features/profile/components/AchievementsBadges";
import { UserListsTab } from "@/features/profile/components/UserListsTab";
import { ProfileTopGames } from "@/features/profile/components/ProfileTopGames";
import { SectionErrorBoundary } from "@/components/SectionErrorBoundary";
import GameModal from "@/features/games/components/GameModal";
import { GameData } from "@/types/game";
import { useTranslation } from "react-i18next";
import { useToast } from "@/hooks/use-toast";

const Profile = () => {
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();
  const { locale } = useLanguage();
  const { data: profile, isLoading: profileLoading } = useProfile();
  const { data: userGames = [], isLoading: gamesLoading } = useUserGames();
  const { data: reviews = [], isLoading: reviewsLoading } = useReviewsByUser();
  const { data: followCounts } = useFollowCounts(profile?.user_id);
  const { data: followersList = [], isLoading: followersLoading } = useFollowers(profile?.user_id);
  const { data: followingList = [], isLoading: followingLoading } = useFollowing(profile?.user_id);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isFollowersOpen, setIsFollowersOpen] = useState(false);
  const [isFollowingOpen, setIsFollowingOpen] = useState(false);
  const [selectedGame, setSelectedGame] = useState<GameData | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const { t, i18n } = useTranslation();
  const { toast } = useToast();
  const syncSteamPlaytime = useSyncSteamPlaytime();
  const syncStatusLabel = useMemo(() => {
    if (!profile?.steam_id) return t("profile.syncSteamNotLinked");
    if (!profile?.steam_last_synced) return t("profile.syncSteamNever");
    const parsed = new Date(profile.steam_last_synced);
    if (Number.isNaN(parsed.getTime())) return t("profile.syncSteamNever");
    const formatted = new Intl.DateTimeFormat(i18n.language, {
      dateStyle: "medium",
      timeStyle: "short",
    }).format(parsed);
    return t("profile.syncSteamLast", { date: formatted });
  }, [profile?.steam_id, profile?.steam_last_synced, i18n.language, t]);

  const isSyncing = syncSteamPlaytime.isPending;
  const isUpdating = isSyncing && syncSteamPlaytime.variables?.mode === "update";
  const isImporting = isSyncing && syncSteamPlaytime.variables?.mode === "import";

  if (!authLoading && !user) {
    navigate("/auth");
    return null;
  }

  if (authLoading || profileLoading) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <main className="pt-24 container mx-auto px-4">
          <div className="animate-pulse space-y-6">
            <div className="flex items-center gap-6">
              <div className="w-24 h-24 rounded-full bg-secondary" />
              <div className="space-y-2">
                <div className="h-6 w-48 bg-secondary rounded" />
                <div className="h-4 w-32 bg-secondary rounded" />
              </div>
            </div>
          </div>
        </main>
      </div>
    );
  }

  const favoriteGames = userGames.filter((g) => g.is_favorite);
  const platinumGames = userGames.filter((g) => g.is_platinumed);

  const handleOpenGame = (game: GameData) => {
    setSelectedGame(game);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setSelectedGame(null);
  };
  const handleSyncSteam = async (mode: "update" | "import") => {
    if (!profile?.steam_id) {
      toast({ title: t("profile.syncSteamMissing"), variant: "destructive" });
      setIsEditOpen(true);
      return;
    }

    try {
      const result = await syncSteamPlaytime.mutateAsync({
        importAll: mode === "import",
        enrichDetails: mode === "import",
        language: locale,
        mode,
      });
      const total = (result?.updated ?? 0) + (result?.inserted ?? 0);
      toast({
        title:
          mode === "import"
            ? t("profile.syncSteamImportSuccess", { count: total })
            : t("profile.syncSteamUpdateSuccess", { count: total }),
      });
    } catch (error) {
      toast({ title: t("profile.syncSteamError"), variant: "destructive" });
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />

      <main className="pt-24 pb-12 container mx-auto px-4">
        <div className="flex flex-col md:flex-row items-start gap-6 mb-8">
          <div className="relative">
            <UserAvatar
              src={profile?.avatar_url}
              displayName={profile?.display_name}
              username={profile?.username}
              size="xl"
            />
          </div>

          <div className="flex-1">
            <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
              <div>
                <h1 className="text-2xl md:text-3xl font-bold">
                  {profile?.display_name || t("profile.defaultName")}
                </h1>
                <p className="text-muted-foreground">@{profile?.username}</p>
                {profile?.bio && <p className="mt-2 text-foreground/80 max-w-xl">{profile.bio}</p>}
              </div>
              <div className="flex flex-col items-start sm:items-end gap-2">
                <div className="flex flex-wrap items-center gap-2">
                  <Button variant="outline" size="sm" className="gap-2" onClick={() => navigate("/alerts")}
                  >
                    <Bell className="w-4 h-4" />
                    {t("profile.alerts")}
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    className="gap-2"
                    onClick={() => handleSyncSteam("update")}
                    disabled={isSyncing}
                  >
                    <RefreshCw className={isUpdating ? "w-4 h-4 animate-spin" : "w-4 h-4"} />
                    {isUpdating
                      ? t("profile.syncSteamUpdateLoading")
                      : t("profile.syncSteamUpdate")}
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    className="gap-2"
                    onClick={() => handleSyncSteam("import")}
                    disabled={isSyncing}
                  >
                    <Download className={isImporting ? "w-4 h-4 animate-spin" : "w-4 h-4"} />
                    {isImporting
                      ? t("profile.syncSteamImportLoading")
                      : t("profile.syncSteamImport")}
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    className="gap-2"
                    onClick={() => setIsEditOpen(true)}
                  >
                    <Settings className="w-4 h-4" />
                    {t("profile.settings")}
                  </Button>
                </div>
                <p className="text-xs text-muted-foreground">{syncStatusLabel}</p>
              </div>
            </div>

            <ProfileStats
              totalGames={userGames.length}
              favorites={favoriteGames.length}
              platinums={platinumGames.length}
              reviews={reviews.length}
              followers={followCounts?.followers ?? 0}
              following={followCounts?.following ?? 0}
              onFollowersClick={() => setIsFollowersOpen(true)}
              onFollowingClick={() => setIsFollowingOpen(true)}
            />
          </div>
        </div>

        <div className="mb-8">
          <SectionErrorBoundary code="TROPHY_SHOWCASE_ERROR">
            <TrophyShowcase games={platinumGames} isLoading={gamesLoading} />
          </SectionErrorBoundary>
        </div>
        <div className="mb-8">
          <SectionErrorBoundary code="PROFILE_INSIGHTS_ERROR">
            <ProfileInsights games={userGames} isLoading={gamesLoading} />
          </SectionErrorBoundary>
        </div>
        <div className="mb-8">
          <SectionErrorBoundary code="ACHIEVEMENTS_ERROR">
            <AchievementsBadges
              games={userGames}
              reviewsCount={reviews.length}
              followersCount={followCounts?.followers ?? 0}
              followingCount={followCounts?.following ?? 0}
            />
          </SectionErrorBoundary>
        </div>
        <div className="mb-8">
          <SectionErrorBoundary code="TOP_GAMES_ERROR">
            <ProfileTopGames games={userGames} isLoading={gamesLoading} onGameSelect={handleOpenGame} />
          </SectionErrorBoundary>
        </div>

        <Tabs defaultValue="library" className="w-full">
          <TabsList className="w-full justify-start border-b border-border/50 rounded-none bg-transparent h-auto p-0 mb-6 overflow-x-auto flex-nowrap">
            <TabsTrigger
              value="library"
              className="gap-2 rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent px-4 py-3"
            >
              <GamepadIcon className="w-4 h-4" />
              {t("profile.library")} ({userGames.length})
            </TabsTrigger>
            <TabsTrigger
              value="favorites"
              className="gap-2 rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent px-4 py-3"
            >
              <Heart className="w-4 h-4" />
              {t("profile.favorites")} ({favoriteGames.length})
            </TabsTrigger>
            <TabsTrigger
              value="platinum"
              className="gap-2 rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent px-4 py-3"
            >
              <Trophy className="w-4 h-4" />
              {t("profile.platinums")} ({platinumGames.length})
            </TabsTrigger>
            <TabsTrigger
              value="reviews"
              className="gap-2 rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent px-4 py-3"
            >
              <BookOpen className="w-4 h-4" />
              {t("profile.reviews")} ({reviews.length})
            </TabsTrigger>
            <TabsTrigger
              value="lists"
              className="gap-2 rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent px-4 py-3"
            >
              <List className="w-4 h-4" />
              Listas
            </TabsTrigger>
          </TabsList>

          <TabsContent value="library">
            <ProfileLibrarySections games={userGames} isLoading={gamesLoading} onGameSelect={handleOpenGame} />
          </TabsContent>

          <TabsContent value="favorites">
            <GameLibrary
              games={favoriteGames}
              isLoading={gamesLoading}
              emptyMessage={t("profile.emptyFavorites")}
              highlightPlatinum
              onGameSelect={handleOpenGame}
            />
          </TabsContent>

          <TabsContent value="platinum">
            <GameLibrary
              games={platinumGames}
              isLoading={gamesLoading}
              emptyMessage={t("profile.emptyPlatinums")}
              highlightPlatinum
              cardTone="completed"
              onGameSelect={handleOpenGame}
            />
          </TabsContent>

          <TabsContent value="reviews">
            <ProfileReviews reviews={reviews} isLoading={reviewsLoading} />
          </TabsContent>

          <TabsContent value="lists">
            <UserListsTab />
          </TabsContent>
        </Tabs>
      </main>

      <ProfileEditDialog open={isEditOpen} onOpenChange={setIsEditOpen} profile={profile} />

      <FollowListDialog
        open={isFollowersOpen}
        onOpenChange={setIsFollowersOpen}
        title={t("profile.followers")}
        profiles={followersList}
        isLoading={followersLoading}
        emptyMessage={t("profile.emptyFollowers")}
      />
      <FollowListDialog
        open={isFollowingOpen}
        onOpenChange={setIsFollowingOpen}
        title={t("profile.following")}
        profiles={followingList}
        isLoading={followingLoading}
        emptyMessage={t("profile.emptyFollowing")}
      />
      <GameModal game={selectedGame} isOpen={isModalOpen} onClose={handleCloseModal} />
    </div>
  );
};

export default Profile;
















