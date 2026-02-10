import { useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  GamepadIcon,
  Heart,
  Trophy,
  BookOpen,
  UserPlus,
  Users,
  Check,
  X,
} from "lucide-react";
import Header from "@/components/Header";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useAuth } from "@/contexts/AuthContext";
import { useProfile, useProfileByUsername } from "@/hooks/useProfile";
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
import {
  useFriendStatus,
  useSendFriendRequest,
  useAcceptFriendRequest,
  useDeclineFriendRequest,
} from "@/hooks/useFriends";
import { UserAvatar } from "@/components/profile/UserAvatar";
import { ProfileStats } from "@/components/profile/ProfileStats";
import { ProfileLibrarySections } from "@/components/profile/ProfileLibrarySections";
import { GameLibrary } from "@/components/profile/GameLibrary";
import { ProfileReviews } from "@/components/profile/ProfileReviews";
import { FollowListDialog } from "@/components/profile/FollowListDialog";
import { TrophyShowcase } from "@/components/profile/TrophyShowcase";
import { ProfileInsights } from "@/components/profile/ProfileInsights";
import { PlayerBadges } from "@/components/profile/PlayerBadges";
import GameModal from "@/components/GameModal";
import { GameData } from "@/types/game";
import NotFound from "./NotFound";

const PublicProfile = () => {
  const { username } = useParams<{ username: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { data: currentProfile } = useProfile();
  const { data: profile, isLoading: profileLoading, error } = useProfileByUsername(username);

  const userId = profile?.user_id;
  const { data: followCounts } = useFollowCounts(userId);
  const { data: followersList = [], isLoading: followersLoading } = useFollowers(userId);
  const { data: followingList = [], isLoading: followingLoading } = useFollowing(userId);

  const profileIds = useMemo(() => (userId ? [userId] : []), [userId]);
  const { data: followingIds = [] } = useFollowingIds(profileIds);
  const isFollowing = userId ? followingIds.includes(userId) : false;
  const isSelf = userId && user?.id === userId;

  const { data: friendStatus } = useFriendStatus(userId);
  const isFriend = friendStatus?.status === "accepted";

  const canViewProfile =
    !!profile &&
    (isSelf ||
      profile.profile_visibility === "public" ||
      (profile.profile_visibility === "friends" && isFriend));

  const canViewLibrary =
    !!profile &&
    (isSelf ||
      profile.library_visibility === "public" ||
      (profile.library_visibility === "friends" && isFriend));

  const canViewReviews =
    !!profile &&
    (isSelf ||
      profile.reviews_visibility === "public" ||
      (profile.reviews_visibility === "friends" && isFriend));

  const { data: userGames = [], isLoading: gamesLoading } = useUserGames(
    canViewLibrary ? userId : undefined,
    false
  );
  const { data: reviews = [], isLoading: reviewsLoading } = useReviewsByUser(
    canViewReviews ? userId : undefined,
    false
  );

  const followUser = useFollowUser();
  const unfollowUser = useUnfollowUser();
  const sendFriendRequest = useSendFriendRequest();
  const acceptFriendRequest = useAcceptFriendRequest();
  const declineFriendRequest = useDeclineFriendRequest();

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
            <h1 className="text-2xl font-bold mb-2">Perfil privado</h1>
            <p className="text-muted-foreground">
              Este usuário restringiu o acesso ao perfil.
            </p>
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
            <h1 className="text-2xl font-bold mb-2">Perfil privado</h1>
            <p className="text-muted-foreground">
              Este usuário restringiu o acesso ao perfil.
            </p>
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

  const handleSendFriendRequest = () => {
    if (!userId) return;
    if (!user) {
      navigate("/auth");
      return;
    }
    const actorLabel = currentProfile?.display_name || currentProfile?.username || "Alguém";
    sendFriendRequest.mutate({
      addresseeId: userId,
      message: `${actorLabel} quer ser seu amigo.`,
      link: `/u/${currentProfile?.username ?? user.id}`,
    });
  };

  const handleAcceptFriendRequest = () => {
    if (!friendStatus?.request || !currentProfile) return;
    acceptFriendRequest.mutate({
      requestId: friendStatus.request.id,
      requesterId: friendStatus.request.requester_id,
      message: `${currentProfile.display_name || currentProfile.username} aceitou seu pedido de amizade.`,
      link: `/u/${currentProfile.username}`,
    });
  };

  const handleDeclineFriendRequest = () => {
    if (!friendStatus?.request) return;
    declineFriendRequest.mutate(friendStatus.request.id);
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
        {/* Profile Header */}
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
                  {profile.display_name || "Gamer"}
                </h1>
                <p className="text-muted-foreground">@{profile.username}</p>
                {profile.bio && (
                  <p className="mt-2 text-foreground/80 max-w-xl">{profile.bio}</p>
                )}
              </div>
              {!isSelf && (
                <div className="flex flex-wrap gap-2">
                  <Button
                    variant={isFollowing ? "secondary" : "glow"}
                    size="sm"
                    className="gap-2"
                    onClick={handleToggleFollow}
                    disabled={followUser.isPending || unfollowUser.isPending}
                  >
                    <UserPlus className="w-4 h-4" />
                    {isFollowing ? "Seguindo" : "Seguir"}
                  </Button>

                  {friendStatus?.status === "accepted" && (
                    <Button variant="outline" size="sm" className="gap-2" disabled>
                      <Users className="w-4 h-4" />
                      Amigos
                    </Button>
                  )}

                  {friendStatus?.status === "pending_outgoing" && (
                    <Button variant="outline" size="sm" disabled>
                      Solicitação enviada
                    </Button>
                  )}

                  {friendStatus?.status === "pending_incoming" && (
                    <div className="flex gap-2">
                      <Button size="sm" className="gap-2" onClick={handleAcceptFriendRequest}>
                        <Check className="w-4 h-4" />
                        Aceitar
                      </Button>
                      <Button size="sm" variant="outline" onClick={handleDeclineFriendRequest}>
                        <X className="w-4 h-4" />
                        Recusar
                      </Button>
                    </div>
                  )}

                  {(!friendStatus || friendStatus.status === "none" || friendStatus.status === "declined") && (
                    <Button
                      variant="outline"
                      size="sm"
                      className="gap-2"
                      onClick={handleSendFriendRequest}
                      disabled={sendFriendRequest.isPending}
                    >
                      <Users className="w-4 h-4" />
                      Adicionar amigo
                    </Button>
                  )}
                </div>
              )}
            </div>

            {/* Stats */}
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
          <TrophyShowcase games={platinumGames} isLoading={gamesLoading} />
        </div>
        <div className="mb-8">
          <ProfileInsights games={userGames} isLoading={gamesLoading} />
        </div>
        <div className="mb-8">
          <PlayerBadges games={userGames} isLoading={gamesLoading} />
        </div>

        {/* Tabs */}
        <Tabs defaultValue="library" className="w-full">
          <TabsList className="w-full justify-start border-b border-border/50 rounded-none bg-transparent h-auto p-0 mb-6 overflow-x-auto flex-nowrap">
            <TabsTrigger
              value="library"
              className="gap-2 rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent px-4 py-3"
            >
              <GamepadIcon className="w-4 h-4" />
              Biblioteca ({userGames.length})
            </TabsTrigger>
            <TabsTrigger
              value="favorites"
              className="gap-2 rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent px-4 py-3"
            >
              <Heart className="w-4 h-4" />
              Favoritos ({favoriteGames.length})
            </TabsTrigger>
            <TabsTrigger
              value="platinum"
              className="gap-2 rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent px-4 py-3"
            >
              <Trophy className="w-4 h-4" />
              Platinados ({platinumGames.length})
            </TabsTrigger>
            <TabsTrigger
              value="reviews"
              className="gap-2 rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent px-4 py-3"
            >
              <BookOpen className="w-4 h-4" />
              Reviews ({reviews.length})
            </TabsTrigger>
          </TabsList>

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
                Biblioteca privada.
              </div>
            )}
          </TabsContent>

          <TabsContent value="favorites">
            {canViewLibrary ? (
              <GameLibrary
                games={favoriteGames}
                isLoading={gamesLoading}
                emptyMessage="Este usuário ainda não tem favoritos."
                readOnly
                highlightPlatinum
                onGameSelect={handleOpenGame}
              />
            ) : (
              <div className="text-center py-12 text-muted-foreground">
                Favoritos privados.
              </div>
            )}
          </TabsContent>

          <TabsContent value="platinum">
            {canViewLibrary ? (
              <GameLibrary
                games={platinumGames}
                isLoading={gamesLoading}
                emptyMessage="Este usuário ainda não tem jogos platinados."
                readOnly
                highlightPlatinum
                cardTone="completed"
                onGameSelect={handleOpenGame}
              />
            ) : (
              <div className="text-center py-12 text-muted-foreground">
                Platinas privadas.
              </div>
            )}
          </TabsContent>

          <TabsContent value="reviews">
            {canViewReviews ? (
              <ProfileReviews reviews={reviews} isLoading={reviewsLoading} />
            ) : (
              <div className="text-center py-12 text-muted-foreground">
                Reviews privadas.
              </div>
            )}
          </TabsContent>
        </Tabs>
      </main>

      <FollowListDialog
        open={isFollowersOpen}
        onOpenChange={setIsFollowersOpen}
        title="Seguidores"
        profiles={followersList}
        isLoading={followersLoading}
        emptyMessage="Ainda sem seguidores."
      />
      <FollowListDialog
        open={isFollowingOpen}
        onOpenChange={setIsFollowingOpen}
        title="Seguindo"
        profiles={followingList}
        isLoading={followingLoading}
        emptyMessage="Ainda não está seguindo ninguém."
      />

      <GameModal game={selectedGame} isOpen={isModalOpen} onClose={handleCloseModal} />
    </div>
  );
};

export default PublicProfile;
