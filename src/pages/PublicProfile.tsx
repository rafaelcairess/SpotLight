import { useMemo, useState } from "react";
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
import { useFollowCounts, useFollowUser, useFollowing, useFollowers, useFollowingIds, useUnfollowUser } from "@/hooks/useFollows";
import { UserAvatar } from "@/components/profile/UserAvatar";
import { ProfileStats } from "@/components/profile/ProfileStats";
import { GameLibrary } from "@/components/profile/GameLibrary";
import { ProfileReviews } from "@/components/profile/ProfileReviews";
import { FollowListDialog } from "@/components/profile/FollowListDialog";
import NotFound from "./NotFound";

const PublicProfile = () => {
  const { username } = useParams<{ username: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { data: profile, isLoading: profileLoading, error } = useProfileByUsername(username);

  const userId = profile?.user_id;
  const { data: userGames = [], isLoading: gamesLoading } = useUserGames(userId, false);
  const { data: reviews = [], isLoading: reviewsLoading } = useReviewsByUser(userId, false);
  const { data: followCounts } = useFollowCounts(userId);
  const { data: followersList = [], isLoading: followersLoading } = useFollowers(userId);
  const { data: followingList = [], isLoading: followingLoading } = useFollowing(userId);

  const profileIds = useMemo(() => (userId ? [userId] : []), [userId]);
  const { data: followingIds = [] } = useFollowingIds(profileIds);
  const isFollowing = userId ? followingIds.includes(userId) : false;
  const isSelf = userId && user?.id === userId;

  const followUser = useFollowUser();
  const unfollowUser = useUnfollowUser();
  const [isFollowersOpen, setIsFollowersOpen] = useState(false);
  const [isFollowingOpen, setIsFollowingOpen] = useState(false);

  const favoriteGames = userGames.filter(g => g.is_favorite);
  const platinumGames = userGames.filter(g => g.is_platinumed);

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
    return <NotFound />;
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
            <div className="flex items-start justify-between gap-4">
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

        {/* Tabs */}
        <Tabs defaultValue="library" className="w-full">
          <TabsList className="w-full justify-start border-b border-border/50 rounded-none bg-transparent h-auto p-0 mb-6">
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
            <GameLibrary
              games={userGames}
              isLoading={gamesLoading}
              emptyMessage="Este usuário ainda não adicionou jogos."
              readOnly
            />
          </TabsContent>

          <TabsContent value="favorites">
            <GameLibrary
              games={favoriteGames}
              isLoading={gamesLoading}
              emptyMessage="Este usuário ainda não tem favoritos."
              readOnly
            />
          </TabsContent>

          <TabsContent value="platinum">
            <GameLibrary
              games={platinumGames}
              isLoading={gamesLoading}
              emptyMessage="Este usuário ainda não tem jogos platinados."
              readOnly
            />
          </TabsContent>

          <TabsContent value="reviews">
            <ProfileReviews reviews={reviews} isLoading={reviewsLoading} />
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
        emptyMessage="Ainda n?o est? seguindo ningu?m."
      />
    </div>
  );
};

export default PublicProfile;
