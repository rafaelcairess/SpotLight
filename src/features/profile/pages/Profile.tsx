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
  EyeOff,
  MessageSquare,
  Users,
} from "lucide-react";
import Header from "@/components/Header";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useAuth } from "@/contexts/AuthContext";
import { useLanguage } from "@/contexts/LanguageContext";
import { useProfile } from "@/hooks/useProfile";
import { useUserGames, useHiddenGames } from "@/hooks/useUserGames";
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
import { UserListsTab } from "@/features/profile/components/UserListsTab";
import { ProfileComments } from "@/features/profile/components/ProfileComments";
import { useFriends } from "@/hooks/useFriendships";
import { useProfileCounts } from "@/hooks/useProfileCounts";
import GameModal from "@/features/games/components/GameModal";
import { GameData } from "@/types/game";
import { useTranslation } from "react-i18next";
import { useToast } from "@/hooks/use-toast";

const Profile = () => {
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();
  const { locale } = useLanguage();
  const { data: profile, isLoading: profileLoading } = useProfile();
  const [activeTab, setActiveTab] = useState("overview");
  const shouldLoadGames = ["library", "favorites", "platinum"].includes(activeTab);
  const { data: userGames = [], isLoading: gamesLoading } = useUserGames(undefined, true, shouldLoadGames);
  const { data: hiddenGames = [], isLoading: hiddenLoading } = useHiddenGames(activeTab === "hidden");
  const { data: reviews = [], isLoading: reviewsLoading } = useReviewsByUser(undefined, true, activeTab === "reviews");
  const { data: followCounts } = useFollowCounts(profile?.user_id);
  const { data: followersList = [], isLoading: followersLoading } = useFollowers(profile?.user_id);
  const { data: followingList = [], isLoading: followingLoading } = useFollowing(profile?.user_id);
  const { data: friends = [], isLoading: friendsLoading } = useFriends(profile?.user_id);
  const { data: contentCounts } = useProfileCounts(profile?.user_id, true, true);
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
              totalGames={contentCounts?.games ?? 0}
              favorites={contentCounts?.favorites ?? 0}
              platinums={contentCounts?.platinums ?? 0}
              reviews={contentCounts?.reviews ?? 0}
              followers={followCounts?.followers ?? 0}
              following={followCounts?.following ?? 0}
              onFollowersClick={() => setIsFollowersOpen(true)}
              onFollowingClick={() => setIsFollowingOpen(true)}
            />
          </div>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="w-full justify-start border-b border-border/50 rounded-none bg-transparent h-auto p-0 mb-6 overflow-x-auto flex-nowrap">
            <TabsTrigger value="overview" className="gap-2 rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent px-4 py-3">
              Visão geral
            </TabsTrigger>
            <TabsTrigger
              value="library"
              className="gap-2 rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent px-4 py-3"
            >
              <GamepadIcon className="w-4 h-4" />
              {t("profile.library")} ({contentCounts?.games ?? 0})
            </TabsTrigger>
            <TabsTrigger
              value="favorites"
              className="gap-2 rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent px-4 py-3"
            >
              <Heart className="w-4 h-4" />
              {t("profile.favorites")} ({contentCounts?.favorites ?? 0})
            </TabsTrigger>
            <TabsTrigger
              value="platinum"
              className="gap-2 rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent px-4 py-3"
            >
              <Trophy className="w-4 h-4" />
              {t("profile.platinums")} ({contentCounts?.platinums ?? 0})
            </TabsTrigger>
            <TabsTrigger
              value="reviews"
              className="gap-2 rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent px-4 py-3"
            >
              <BookOpen className="w-4 h-4" />
              {t("profile.reviews")} ({contentCounts?.reviews ?? 0})
            </TabsTrigger>
            <TabsTrigger
              value="lists"
              className="gap-2 rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent px-4 py-3"
            >
              <List className="w-4 h-4" />
              Listas
            </TabsTrigger>
            <TabsTrigger
              value="hidden"
              className="gap-2 rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent px-4 py-3"
            >
              <EyeOff className="w-4 h-4" />
              {t("profile.hiddenTab")} ({hiddenGames.length})
            </TabsTrigger>
            <TabsTrigger value="friends" className="gap-2 rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent px-4 py-3">
              <Users className="w-4 h-4" /> Amigos ({friends.length})
            </TabsTrigger>
            <TabsTrigger value="comments" className="gap-2 rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent px-4 py-3">
              <MessageSquare className="w-4 h-4" /> Comentários
            </TabsTrigger>
          </TabsList>

          <TabsContent value="overview">
            <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_320px]">
              <div className="rounded-2xl border border-border/50 bg-gradient-to-br from-card to-card/50 p-6">
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-primary">Seu perfil</p>
                <h2 className="mt-3 text-xl font-semibold">Uma vitrine, não uma planilha de jogos.</h2>
                <p className="mt-2 text-sm text-muted-foreground">Sua biblioteca só é carregada quando alguém abre a aba Jogos. Use os favoritos e listas para escolher o que merece destaque.</p>
                <Button variant="outline" size="sm" className="mt-5" onClick={() => setIsEditOpen(true)}>Personalizar perfil</Button>
              </div>
              <div className="rounded-2xl border border-border/50 bg-card/70 p-5">
                <div className="mb-4 flex items-center justify-between"><h2 className="font-semibold">Amigos</h2><button className="text-xs text-primary hover:underline" onClick={() => setActiveTab("friends")}>Ver todos</button></div>
                <div className="grid grid-cols-4 gap-3">{friends.slice(0, 8).map((friend) => <button key={friend.user_id} onClick={() => navigate(`/u/${friend.username}`)}><UserAvatar src={friend.avatar_url} displayName={friend.display_name} username={friend.username} size="sm" /><p className="mt-1 truncate text-[11px] text-muted-foreground">{friend.display_name || friend.username}</p></button>)}</div>
                {!friends.length && <p className="text-sm text-muted-foreground">Você ainda não adicionou amigos.</p>}
              </div>
            </div>
          </TabsContent>

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

          <TabsContent value="hidden">
            <GameLibrary
              games={hiddenGames}
              isLoading={hiddenLoading}
              emptyMessage={t("profile.hiddenEmpty")}
              showHidden
              onGameSelect={handleOpenGame}
            />
          </TabsContent>

          <TabsContent value="friends">
            {friendsLoading ? <div className="py-12 text-center text-muted-foreground">Carregando amigos...</div> : friends.length ? (
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">{friends.map((friend) => <button key={friend.user_id} onClick={() => navigate(`/u/${friend.username}`)} className="flex items-center gap-3 rounded-xl border border-border/40 bg-card/70 p-4 text-left transition-colors hover:border-primary/40"><UserAvatar src={friend.avatar_url} displayName={friend.display_name} username={friend.username} size="md" /><div className="min-w-0"><p className="truncate font-medium">{friend.display_name || friend.username}</p><p className="truncate text-xs text-muted-foreground">@{friend.username}</p></div></button>)}</div>
            ) : <div className="py-12 text-center text-muted-foreground">Nenhum amigo para mostrar.</div>}
          </TabsContent>

          <TabsContent value="comments">
            {profile?.user_id && <ProfileComments profileUserId={profile.user_id} permission={profile.comments_permission || "public"} isFriend={false} isOwner />}
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
















