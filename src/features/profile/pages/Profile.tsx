/**
 * Página da feature profile.
 */

import { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  GamepadIcon,
  Heart,
  Trophy,
  BookOpen,
  Settings,
  List,
  EyeOff,
  MessageSquare,
  Users,
} from "lucide-react";
import Header from "@/components/Header";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useAuth } from "@/contexts/AuthContext";
import { useProfile } from "@/hooks/useProfile";
import { useUserGames, useHiddenGames } from "@/hooks/useUserGames";
import { useReviewsByUser } from "@/hooks/useReviews";
import { useFollowCounts, useFollowers, useFollowing } from "@/hooks/useFollows";
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
import { PresenceSelector } from "@/features/profile/components/PresenceSelector";
import { ProfileProgressCard } from "@/features/profile/components/ProfileProgress";
import { FavoriteGameShowcase } from "@/features/profile/components/FavoriteGameShowcase";
import GameModal from "@/features/games/components/GameModal";
import { GameData } from "@/types/game";
import { useTranslation } from "react-i18next";

const Profile = () => {
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();
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
  const { t } = useTranslation();

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
                {profile && <div className="mt-2"><PresenceSelector value={profile.presence_status || "online"} lastSeenAt={profile.last_seen_at} /></div>}
                <div className="mt-3"><ProfileProgressCard userId={profile?.user_id} /></div>
                {profile?.bio && <p className="mt-2 text-foreground/80 max-w-xl">{profile.bio}</p>}
              </div>
              <div className="flex flex-col items-start sm:items-end gap-2">
                <div className="flex items-center">
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => setIsEditOpen(true)}
                    aria-label={t("profile.settings")}
                  >
                    <Settings className="w-4 h-4" />
                    <span className="sr-only">{t("profile.settings")}</span>
                  </Button>
                </div>
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
            <div className="mx-auto flex max-w-4xl flex-col gap-6">
              {profile?.favorite_game_app_id && <FavoriteGameShowcase userId={profile.user_id} appId={profile.favorite_game_app_id} />}
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
















