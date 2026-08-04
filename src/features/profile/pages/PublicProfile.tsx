/**
 * Perfil público acessado por `/u/:username`.
 *
 * Toda informação exibida aqui deve respeitar as visibilidades retornadas pelo
 * backend; nunca reutilize ações exclusivas do proprietário nesta página.
 */

import { useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { UserPlus, UserCheck, Clock3 } from "lucide-react";
import { PageContainer, PageShell } from "@/components/PageShell";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent } from "@/components/ui/tabs";
import { useAuth } from "@/contexts/AuthContext";
import { useProfileByUsername } from "@/hooks/useProfile";
import { useUserGames } from "@/hooks/useUserGames";
import { useReviewsByUser } from "@/hooks/useReviews";
import { useFollowUser, useFollowingIds, useUnfollowUser } from "@/hooks/useFollows";
import { ProfileLibrarySections } from "@/features/profile/components/ProfileLibrarySections";
import { GameLibrary } from "@/features/profile/components/GameLibrary";
import { ProfileReviews } from "@/features/profile/components/ProfileReviews";
import { ProfileComments } from "@/features/profile/components/ProfileComments";
import {
  useAcceptFriendRequest,
  useFriends,
  useFriendship,
  useRemoveFriendship,
  useSendFriendRequest,
  getFriendshipState,
} from "@/hooks/useFriendships";
import { useProfileCounts } from "@/hooks/useProfileCounts";
import GameModal from "@/features/games/components/GameModal";
import { GameData } from "@/types/game";
import { useTranslation } from "react-i18next";
import { canViewProfileSection } from "@/lib/profilePrivacy";
import { ProfileHero } from "@/features/profile/components/ProfileHero";
import { ProfileTabBar } from "@/features/profile/components/ProfileTabBar";
import { UserAvatar } from "@/features/profile/components/UserAvatar";
import NotFound from "@/pages/NotFound";
import { PresenceBadge } from "@/features/profile/components/PresenceBadge";
import { ProfileProgressCard } from "@/features/profile/components/ProfileProgress";
import { FavoriteGameShowcase } from "@/features/profile/components/FavoriteGameShowcase";
import { ProfileSidePanel } from "@/features/profile/components/ProfileSidePanel";
import { RecentActivity } from "@/features/profile/components/RecentActivity";
import { PlatinumShowcase } from "@/features/profile/components/PlatinumShowcase";

const PublicProfile = () => {
  const { username } = useParams<{ username: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { t } = useTranslation();
  const { data: profile, isLoading: profileLoading, error } = useProfileByUsername(username);

  const userId = profile?.user_id;

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

  const relationship = { isOwner: Boolean(isSelf), isFriend };
  const canViewProfile =
    !!profile && canViewProfileSection(profile.profile_visibility, relationship);
  const canViewLibrary =
    canViewProfile && canViewProfileSection(profile?.library_visibility, relationship);
  const canViewReviews =
    canViewProfile && canViewProfileSection(profile?.reviews_visibility, relationship);

  const shouldLoadGames = ["library", "favorites", "platinum"].includes(activeTab);
  const shouldLoadReviews = activeTab === "reviews";

  const { data: userGames = [], isLoading: gamesLoading } = useUserGames(
    canViewLibrary ? userId : undefined,
    false,
    shouldLoadGames,
  );
  const { data: reviews = [], isLoading: reviewsLoading } = useReviewsByUser(
    canViewReviews ? userId : undefined,
    false,
    shouldLoadReviews,
  );
  const { data: contentCounts } = useProfileCounts(userId, canViewLibrary, canViewReviews);

  const followUser = useFollowUser();
  const unfollowUser = useUnfollowUser();

  const [selectedGame, setSelectedGame] = useState<GameData | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const platinumGames = userGames.filter((g) => g.is_platinumed);

  if (profileLoading) {
    return (
      <PageShell>
        <PageContainer>
          <div className="animate-pulse space-y-6">
            <div className="flex items-center gap-6">
              <div className="w-24 h-24 rounded-full bg-secondary" />
              <div className="space-y-2">
                <div className="h-6 w-48 bg-secondary rounded" />
                <div className="h-4 w-32 bg-secondary rounded" />
              </div>
            </div>
          </div>
        </PageContainer>
      </PageShell>
    );
  }

  if (!profile || error) {
    const isPrivate = !!error && `${error?.message ?? ""}`.toLowerCase().includes("permission");
    return isPrivate ? (
      <PageShell>
        <PageContainer>
          <div className="max-w-lg mx-auto text-center py-20">
            <h1 className="text-2xl font-bold mb-2">{t("profile.privateTitle")}</h1>
            <p className="text-muted-foreground">{t("profile.privateDescription")}</p>
          </div>
        </PageContainer>
      </PageShell>
    ) : (
      <NotFound />
    );
  }

  if (!canViewProfile) {
    return (
      <PageShell>
        <PageContainer>
          <div className="max-w-lg mx-auto text-center py-20">
            <h1 className="text-2xl font-bold mb-2">{t("profile.privateTitle")}</h1>
            <p className="text-muted-foreground">{t("profile.privateDescription")}</p>
          </div>
        </PageContainer>
      </PageShell>
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
    if (friendshipState === "incoming")
      acceptFriendRequest.mutate({ otherUserId: userId, friendship });
    if (friendshipState === "outgoing" || friendshipState === "friends")
      removeFriendship.mutate({ otherUserId: userId, friendship });
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
    <PageShell>
      <PageContainer width="content" className="pb-16">
        <section className="premium-surface overflow-hidden">
          <ProfileHero
            avatarUrl={profile.avatar_url}
            displayName={profile.display_name}
            username={profile.username}
            bio={profile.bio}
            fallbackName={t("profile.defaultName")}
            presence={
              <PresenceBadge status={profile.presence_status} lastSeenAt={profile.last_seen_at} />
            }
            actions={
              <>
                <ProfileProgressCard userId={userId} />
                {!isSelf && (
                  <div className="flex flex-wrap gap-2">
                    <Button
                      variant={friendshipState === "friends" ? "secondary" : "outline"}
                      size="sm"
                      className="gap-2"
                      onClick={handleFriendAction}
                      disabled={
                        sendFriendRequest.isPending ||
                        acceptFriendRequest.isPending ||
                        removeFriendship.isPending
                      }
                    >
                      {friendshipState === "friends" ? (
                        <UserCheck className="w-4 h-4" />
                      ) : friendshipState === "outgoing" ? (
                        <Clock3 className="w-4 h-4" />
                      ) : (
                        <UserPlus className="w-4 h-4" />
                      )}
                      {friendshipState === "friends"
                        ? "Amigos"
                        : friendshipState === "incoming"
                          ? "Aceitar amizade"
                          : friendshipState === "outgoing"
                            ? "Pedido enviado"
                            : "Adicionar amigo"}
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
              </>
            }
            stats={[
              { label: t("profile.games"), value: contentCounts?.games ?? 0 },
              { label: t("profile.platinums"), value: contentCounts?.platinums ?? 0 },
              { label: t("profile.reviews"), value: contentCounts?.reviews ?? 0 },
            ]}
          />

          <Tabs
            value={activeTab}
            onValueChange={setActiveTab}
            className="w-full space-y-6 px-5 pb-7 pt-5 md:px-7 md:pt-6"
          >
            <ProfileTabBar
              games={contentCounts?.games ?? 0}
              platinums={contentCounts?.platinums ?? 0}
              reviews={contentCounts?.reviews ?? 0}
              friends={friends.length}
            />

            <TabsContent value="overview">
              <div className="grid items-start gap-6 lg:grid-cols-[minmax(0,1fr)_16rem]">
                <div className="space-y-6">
                  <FavoriteGameShowcase userId={userId} appId={profile.favorite_game_app_id} />
                  <PlatinumShowcase
                    userId={userId}
                    selectedAppIds={profile.platinum_showcase_app_ids}
                    onViewAll={() => setActiveTab("platinum")}
                  />
                  <RecentActivity userId={userId} />
                  <div className="rounded-lg bg-black/15 p-5">
                    <ProfileComments
                      profileUserId={userId!}
                      permission={profile.comments_permission || "public"}
                      isFriend={isFriend}
                      isOwner={!!isSelf}
                    />
                  </div>
                </div>
                <ProfileSidePanel
                  games={contentCounts?.games ?? 0}
                  platinums={contentCounts?.platinums ?? 0}
                  reviews={contentCounts?.reviews ?? 0}
                  friends={friends.length}
                  onSelect={setActiveTab}
                />
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
                    <button
                      key={friend.user_id}
                      onClick={() => navigate(`/u/${friend.username}`)}
                      className="flex items-center gap-3 rounded-xl border border-border/40 bg-card/70 p-4 text-left transition-colors hover:border-primary/40"
                    >
                      <UserAvatar
                        src={friend.avatar_url}
                        displayName={friend.display_name}
                        username={friend.username}
                        size="md"
                      />
                      <div className="min-w-0">
                        <p className="truncate font-medium">
                          {friend.display_name || friend.username}
                        </p>
                        <p className="truncate text-xs text-muted-foreground">@{friend.username}</p>
                      </div>
                    </button>
                  ))}
                </div>
              ) : (
                <div className="py-12 text-center text-muted-foreground">
                  Nenhum amigo para mostrar.
                </div>
              )}
            </TabsContent>
          </Tabs>
        </section>
      </PageContainer>

      <GameModal game={selectedGame} isOpen={isModalOpen} onClose={handleCloseModal} />
    </PageShell>
  );
};

export default PublicProfile;
