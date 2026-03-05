/**
 * Pagina da feature profile.
 */

﻿import { useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  GamepadIcon,
  Heart,
  Trophy,
  BookOpen,
  UserPlus,
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
import { TrophyShowcase } from "@/features/profile/components/TrophyShowcase";
import { ProfileInsights } from "@/features/profile/components/ProfileInsights";
import { ProfileTopGames } from "@/features/profile/components/ProfileTopGames";
import GameModal from "@/features/games/components/GameModal";
import { GameData } from "@/types/game";
import { useTranslation } from "react-i18next";
import NotFound from "@/pages/NotFound";

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

  const isPublicVisibility = (value?: string) =>
    value === "public" || value === "friends";

  const canViewProfile =
    !!profile && (isSelf || isPublicVisibility(profile.profile_visibility));

  const canViewLibrary =
    !!profile && (isSelf || isPublicVisibility(profile.library_visibility));

  const canViewReviews =
    !!profile && (isSelf || isPublicVisibility(profile.reviews_visibility));

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
                  {profile.display_name || t("profile.defaultName")}
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
                    {isFollowing ? t("community.following") : t("community.follow")}
                  </Button>




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
          {canViewLibrary ? (
            <ProfileTopGames
              userId={userId}
              games={userGames}
              isLoading={gamesLoading}
              readOnly
              onGameSelect={handleOpenGame}
            />
          ) : (
            <div className="rounded-xl border border-border/50 bg-card p-4 text-sm text-muted-foreground">
              {t("profile.privateTop")}
            </div>
          )}
        </div>

        {/* Tabs */}
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
