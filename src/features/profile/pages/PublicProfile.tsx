/**
 * Página da feature profile.
 */

import { useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  GamepadIcon,
  Heart,
  Trophy,
  BookOpen,
  MessageSquare,
  Users,
  UserPlus,
  UserCheck,
  Clock3,
} from "lucide-react";
import Header from "@/components/Header";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useAuth } from "@/contexts/AuthContext";
import { useProfileByUsername } from "@/hooks/useProfile";
import { useUserGames } from "@/hooks/useUserGames";
import { useReviewsByUser } from "@/hooks/useReviews";
import {
  useFollowCounts,
  useFollowUser,
  useFollowing,
  useFollowers,
  useFollowingIds,
  useUnfollowUser,
} from "@/hooks/useFollows";
import { UserAvatar } from "@/features/profile/components/UserAvatar";
import { ProfileStats } from "@/features/profile/components/ProfileStats";
import { ProfileLibrarySections } from "@/features/profile/components/ProfileLibrarySections";
import { GameLibrary } from "@/features/profile/components/GameLibrary";
import { ProfileReviews } from "@/features/profile/components/ProfileReviews";
import { FollowListDialog } from "@/features/profile/components/FollowListDialog";
import { ProfileComments } from "@/features/profile/components/ProfileComments";
import { useAcceptFriendRequest, useFriends, useFriendship, useRemoveFriendship, useSendFriendRequest, getFriendshipState } from "@/hooks/useFriendships";
import { useProfileCounts } from "@/hooks/useProfileCounts";
import GameModal from "@/features/games/components/GameModal";
import { GameData } from "@/types/game";
import { useTranslation } from "react-i18next";
import NotFound from "@/pages/NotFound";
import { PresenceBadge } from "@/features/profile/components/PresenceBadge";
import { ProfileProgressCard } from "@/features/profile/components/ProfileProgress";
import { FavoriteGameShowcase } from "@/features/profile/components/FavoriteGameShowcase";

const PublicProfile = () => {
  const { username } = useParams<{ username: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { t } = useTranslation();
  const { data: profile, isLoading: profileLoading, error } = useProfileByUsername(username);

  const userId = profile?.user_id;
  const { data: followCounts } = useFollowCounts(userId);
  const { data: followersList = [], isLoading: followersLoading } = useFollowers(userId);
  const { data: followingList = [], isLoading: followingLoading } = useFollowing(userId);

  const profileIds = useMemo(() => (userId ? [userId] : []), [userId]);
  const { data: followingIds = [] } = useFollowingIds(profileIds);
  const isFollowing = userId ? followingIds.includes(userId) : false;
  const isSelf = userId && user?.id === userId;
  const { data: friendship } = useFriendship(userId);
  const friendshipState = getFriendshipState(friendship, user?.id);
  const isFriend = friendshipState === "friends";
  const { data: friends = [], isLoading: friendsLoading } = useFriends(userId);
  const sendFriendRequest = useSendFriendRequest();
  const acceptFriendRequest = useAcceptFriendRequest();
  const removeFriendship = useRemoveFriendship();
  const [activeTab, setActiveTab] = useState("overview");

  const canView = (value?: string) => value === "public" || (value === "friends" && isFriend);

  const canViewProfile =
    !!profile && (isSelf || canView(profile.profile_visibility));

  const canViewLibrary =
    !!profile && (isSelf || canView(profile.library_visibility));

  const canViewReviews =
    !!profile && (isSelf || canView(profile.reviews_visibility));

  const shouldLoadGames = ["library", "favorites", "platinum"].includes(activeTab);
  const shouldLoadReviews = activeTab === "reviews";

  const { data: userGames = [], isLoading: gamesLoading } = useUserGames(
    canViewLibrary ? userId : undefined,
    false,
    shouldLoadGames
  );
  const { data: reviews = [], isLoading: reviewsLoading } = useReviewsByUser(
    canViewReviews ? userId : undefined,
    false,
    shouldLoadReviews
  );
  const { data: contentCounts } = useProfileCounts(userId, canViewLibrary, canViewReviews);

  const followUser = useFollowUser();
  const unfollowUser = useUnfollowUser();

  const [isFollowersOpen, setIsFollowersOpen] = useState(false);
  const [isFollowingOpen, setIsFollowingOpen] = useState(false);
  const [selectedGame, setSelectedGame] = useState<GameData | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const favoriteGames = userGames.filter((g) => g.is_favorite);
  const platinumGames = userGames.filter((g) => g.is_platinumed);

  if (profileLoading) {
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

  if (!profile || error) {
    const isPrivate = !!error && `${error?.message ?? ""}`.toLowerCase().includes("permission");
    return isPrivate ? (
      <div className="min-h-screen bg-background">
        <Header />
        <main className="pt-24 container mx-auto px-4">
          <div className="max-w-lg mx-auto text-center py-20">
            <h1 className="text-2xl font-bold mb-2">{t("profile.privateTitle")}</h1>
            <p className="text-muted-foreground">{t("profile.privateDescription")}</p>
          </div>
        </main>
      </div>
    ) : (
      <NotFound />
    );
  }

  if (!canViewProfile) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <main className="pt-24 container mx-auto px-4">
          <div className="max-w-lg mx-auto text-center py-20">
            <h1 className="text-2xl font-bold mb-2">{t("profile.privateTitle")}</h1>
            <p className="text-muted-foreground">{t("profile.privateDescription")}</p>
          </div>
        </main>
      </div>
    );
  }

  const handleToggleFollow = () => {
    if (!userId) return;
    if (!user) {
      navigate("/auth");
      return;
    }
    if (isFollowing) {
      unfollowUser.mutate(userId);
    } else {
      followUser.mutate(userId);
    }
  };

  const handleFriendAction = () => {
    if (!userId) return;
    if (!user) return navigate("/auth");
    if (friendshipState === "none") sendFriendRequest.mutate({ otherUserId: userId });
    if (friendshipState === "incoming") acceptFriendRequest.mutate({ otherUserId: userId, friendship });
    if (friendshipState === "outgoing" || friendshipState === "friends") removeFriendship.mutate({ otherUserId: userId, friendship });
  };

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
        {/* Cabecalho do perfil */}
        <div className="flex flex-col md:flex-row items-start gap-6 mb-8">
          <div className="relative">
            <UserAvatar
              src={profile.avatar_url}
              displayName={profile.display_name}
              username={profile.username}
              size="xl"
            />
          </div>

          <div className="flex-1">
            <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
              <div>
                <h1 className="text-2xl md:text-3xl font-bold">
                  {profile.display_name || t("profile.defaultName")}
                </h1>
                <p className="text-muted-foreground">@{profile.username}</p>
                <div className="mt-2"><PresenceBadge status={profile.presence_status} lastSeenAt={profile.last_seen_at} /></div>
                <div className="mt-3"><ProfileProgressCard userId={userId} /></div>
                {profile.bio && (
                  <p className="mt-2 text-foreground/80 max-w-xl">{profile.bio}</p>
                )}
              </div>
              {!isSelf && (
                <div className="flex flex-wrap gap-2">
                  <Button
                    variant={friendshipState === "friends" ? "secondary" : "outline"}
                    size="sm"
                    className="gap-2"
                    onClick={handleFriendAction}
                    disabled={sendFriendRequest.isPending || acceptFriendRequest.isPending || removeFriendship.isPending}
                  >
                    {friendshipState === "friends" ? <UserCheck className="w-4 h-4" /> : friendshipState === "outgoing" ? <Clock3 className="w-4 h-4" /> : <UserPlus className="w-4 h-4" />}
                    {friendshipState === "friends" ? "Amigos" : friendshipState === "incoming" ? "Aceitar amizade" : friendshipState === "outgoing" ? "Pedido enviado" : "Adicionar amigo"}
                  </Button>
                  <Button
                    variant={isFollowing ? "secondary" : "glow"}
                    size="sm"
                    className="gap-2"
                    onClick={handleToggleFollow}
                    disabled={followUser.isPending || unfollowUser.isPending}
                  >
                    <UserPlus className="w-4 h-4" />
                    {isFollowing ? t("community.following") : t("community.follow")}
                  </Button>




                </div>
              )}
            </div>

            {/* Estatisticas */}
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

        {/* Abas */}
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
            <TabsTrigger value="friends" className="gap-2 rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent px-4 py-3">
              <Users className="w-4 h-4" /> Amigos ({friends.length})
            </TabsTrigger>
            <TabsTrigger value="comments" className="gap-2 rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent px-4 py-3">
              <MessageSquare className="w-4 h-4" /> Comentários
            </TabsTrigger>
          </TabsList>

          <TabsContent value="overview">
            <div className="mx-auto flex max-w-4xl flex-col gap-6">
              <FavoriteGameShowcase userId={userId} appId={profile.favorite_game_app_id} />
              <div className="rounded-2xl border border-border/50 bg-gradient-to-br from-card to-card/50 p-6">
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-primary">Sobre</p>
                <p className="mt-3 whitespace-pre-wrap text-foreground/85">{profile.bio || "Este jogador ainda não escreveu uma apresentação."}</p>
                <div className="mt-6 flex flex-wrap gap-2 text-xs text-muted-foreground">
                  {profile.steam_id && <span className="rounded-full bg-secondary px-3 py-1.5">Steam conectada</span>}
                  {profile.xbox_id && <span className="rounded-full bg-secondary px-3 py-1.5">Xbox conectada</span>}
                  {profile.psn_id && <span className="rounded-full bg-secondary px-3 py-1.5">PlayStation conectada</span>}
                </div>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="library">
            {canViewLibrary ? (
              <ProfileLibrarySections
                games={userGames}
                isLoading={gamesLoading}
                readOnly
                onGameSelect={handleOpenGame}
              />
            ) : (
              <div className="text-center py-12 text-muted-foreground">
                {t("profile.privateLibrary")}
              </div>
            )}
          </TabsContent>

          <TabsContent value="favorites">
            {canViewLibrary ? (
              <GameLibrary
                games={favoriteGames}
                isLoading={gamesLoading}
                emptyMessage={t("profile.publicFavoritesEmpty")}
                readOnly
                highlightPlatinum
                onGameSelect={handleOpenGame}
              />
            ) : (
              <div className="text-center py-12 text-muted-foreground">
                {t("profile.privateFavorites")}
              </div>
            )}
          </TabsContent>

          <TabsContent value="platinum">
            {canViewLibrary ? (
              <GameLibrary
                games={platinumGames}
                isLoading={gamesLoading}
                emptyMessage={t("profile.publicPlatinumsEmpty")}
                readOnly
                highlightPlatinum
                cardTone="completed"
                onGameSelect={handleOpenGame}
              />
            ) : (
              <div className="text-center py-12 text-muted-foreground">
                {t("profile.privatePlatinums")}
              </div>
            )}
          </TabsContent>

          <TabsContent value="reviews">
            {canViewReviews ? (
              <ProfileReviews reviews={reviews} isLoading={reviewsLoading} />
            ) : (
              <div className="text-center py-12 text-muted-foreground">
                {t("profile.privateReviews")}
              </div>
            )}
          </TabsContent>

          <TabsContent value="friends">
            {friendsLoading ? (
              <div className="py-12 text-center text-muted-foreground">Carregando amigos...</div>
            ) : friends.length ? (
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {friends.map((friend) => (
                  <button key={friend.user_id} onClick={() => navigate(`/u/${friend.username}`)} className="flex items-center gap-3 rounded-xl border border-border/40 bg-card/70 p-4 text-left transition-colors hover:border-primary/40">
                    <UserAvatar src={friend.avatar_url} displayName={friend.display_name} username={friend.username} size="md" />
                    <div className="min-w-0"><p className="truncate font-medium">{friend.display_name || friend.username}</p><p className="truncate text-xs text-muted-foreground">@{friend.username}</p></div>
                  </button>
                ))}
              </div>
            ) : (
              <div className="py-12 text-center text-muted-foreground">Nenhum amigo para mostrar.</div>
            )}
          </TabsContent>

          <TabsContent value="comments">
            <ProfileComments profileUserId={userId!} permission={profile.comments_permission || "public"} isFriend={isFriend} isOwner={!!isSelf} />
          </TabsContent>
        </Tabs>
      </main>

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

export default PublicProfile;
