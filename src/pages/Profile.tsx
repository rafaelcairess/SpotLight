import { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  GamepadIcon,
  Heart,
  Trophy,
  BookOpen,
  Settings,
} from "lucide-react";
import Header from "@/components/Header";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useAuth } from "@/contexts/AuthContext";
import { useProfile } from "@/hooks/useProfile";
import { useUserGames } from "@/hooks/useUserGames";
import { useReviewsByUser } from "@/hooks/useReviews";
import { useFollowCounts, useFollowers, useFollowing } from "@/hooks/useFollows";
import { UserAvatar } from "@/components/profile/UserAvatar";
import { ProfileStats } from "@/components/profile/ProfileStats";
import { FollowListDialog } from "@/components/profile/FollowListDialog";
import { ProfileLibrarySections } from "@/components/profile/ProfileLibrarySections";
import { GameLibrary } from "@/components/profile/GameLibrary";
import { ProfileReviews } from "@/components/profile/ProfileReviews";
import { ProfileEditDialog } from "@/components/profile/ProfileEditDialog";
import { TrophyShowcase } from "@/components/profile/TrophyShowcase";
import { ProfileInsights } from "@/components/profile/ProfileInsights";
import { PlayerBadges } from "@/components/profile/PlayerBadges";
import GameModal from "@/components/GameModal";
import { GameData } from "@/types/game";

const Profile = () => {
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();
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

  // Redirect to auth if not logged in
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
        {/* Profile Header */}
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
                  {profile?.display_name || "Gamer"}
                </h1>
                <p className="text-muted-foreground">@{profile?.username}</p>
                {profile?.bio && (
                  <p className="mt-2 text-foreground/80 max-w-xl">{profile.bio}</p>
                )}
              </div>
              <Button
                variant="outline"
                size="sm"
                className="gap-2"
                onClick={() => setIsEditOpen(true)}
              >
                <Settings className="w-4 h-4" />
                Configurações
              </Button>
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
            <ProfileLibrarySections
              games={userGames}
              isLoading={gamesLoading}
              onGameSelect={handleOpenGame}
            />
          </TabsContent>

          <TabsContent value="favorites">
            <GameLibrary
              games={favoriteGames}
              isLoading={gamesLoading}
              emptyMessage="Você ainda não tem jogos favoritos."
              highlightPlatinum
              onGameSelect={handleOpenGame}
            />
          </TabsContent>

          <TabsContent value="platinum">
            <GameLibrary
              games={platinumGames}
              isLoading={gamesLoading}
              emptyMessage="Você ainda não platinou nenhum jogo."
              highlightPlatinum
              cardTone="completed"
              onGameSelect={handleOpenGame}
            />
          </TabsContent>

          <TabsContent value="reviews">
            <ProfileReviews reviews={reviews} isLoading={reviewsLoading} />
          </TabsContent>
        </Tabs>
      </main>

      <ProfileEditDialog
        open={isEditOpen}
        onOpenChange={setIsEditOpen}
        profile={profile}
      />

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
      <GameModal
        game={selectedGame}
        isOpen={isModalOpen}
        onClose={handleCloseModal}
      />
    </div>
  );
};

export default Profile;
