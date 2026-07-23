/**
 * Perfil privado do usuário autenticado.
 *
 * As abas carregam dados pesados somente quando abertas. A visão pública fica
 * em `PublicProfile.tsx` e não deve receber ações administrativas.
 */

import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { GamepadIcon, Trophy, BookOpen, List, EyeOff, Users } from "lucide-react";
import Header from "@/components/Header";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useAuth } from "@/contexts/AuthContext";
import { useProfile } from "@/hooks/useProfile";
import { useUserGames, useHiddenGames } from "@/hooks/useUserGames";
import { useReviewsByUser } from "@/hooks/useReviews";
import { ProfileLibrarySections } from "@/features/profile/components/ProfileLibrarySections";
import { GameLibrary } from "@/features/profile/components/GameLibrary";
import { ProfileReviews } from "@/features/profile/components/ProfileReviews";
import { UserListsTab } from "@/features/profile/components/UserListsTab";
import { ProfileComments } from "@/features/profile/components/ProfileComments";
import { useFriends } from "@/hooks/useFriendships";
import { useProfileCounts } from "@/hooks/useProfileCounts";
import { PresenceSelector } from "@/features/profile/components/PresenceSelector";
import { ProfileProgressCard } from "@/features/profile/components/ProfileProgress";
import { FavoriteGameShowcase } from "@/features/profile/components/FavoriteGameShowcase";
import { ProfileSidePanel } from "@/features/profile/components/ProfileSidePanel";
import { RecentActivity } from "@/features/profile/components/RecentActivity";
import { PlatinumShowcase } from "@/features/profile/components/PlatinumShowcase";
import { PlatinumGamePicker } from "@/features/profile/components/PlatinumGamePicker";
import { ProfileHero } from "@/features/profile/components/ProfileHero";
import { UserAvatar } from "@/features/profile/components/UserAvatar";
import GameModal from "@/features/games/components/GameModal";
import { GameData } from "@/types/game";
import { useTranslation } from "react-i18next";
import { useSyncSteamPlaytime } from "@/hooks/useSteamPlaytime";
import { useToast } from "@/hooks/use-toast";

const Profile = () => {
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();
  const { data: profile, isLoading: profileLoading } = useProfile();
  const [activeTab, setActiveTab] = useState("overview");
  const shouldLoadGames = ["library", "favorites", "platinum"].includes(activeTab);
  const { data: userGames = [], isLoading: gamesLoading } = useUserGames(
    undefined,
    true,
    shouldLoadGames,
  );
  const { data: hiddenGames = [], isLoading: hiddenLoading } = useHiddenGames(
    activeTab === "hidden",
  );
  const { data: reviews = [], isLoading: reviewsLoading } = useReviewsByUser(
    undefined,
    true,
    activeTab === "reviews",
  );
  const { data: friends = [], isLoading: friendsLoading } = useFriends(profile?.user_id);
  const { data: contentCounts } = useProfileCounts(profile?.user_id, true, true);
  const [selectedGame, setSelectedGame] = useState<GameData | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isPlatinumPickerOpen, setIsPlatinumPickerOpen] = useState(false);
  const { t } = useTranslation();
  const { toast } = useToast();
  const syncSteam = useSyncSteamPlaytime();

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

      <main className="mx-auto max-w-6xl px-4 pb-12 pt-24">
        <section className="overflow-hidden rounded-xl border border-primary/10 bg-gradient-to-br from-primary/10 via-card/80 to-background shadow-2xl shadow-black/20">
          <ProfileHero
            avatarUrl={profile?.avatar_url}
            displayName={profile?.display_name}
            username={profile?.username}
            bio={profile?.bio}
            fallbackName={t("profile.defaultName")}
            presence={
              profile ? (
                <PresenceSelector
                  value={profile.presence_status || "online"}
                  lastSeenAt={profile.last_seen_at}
                />
              ) : null
            }
            actions={
              <>
                <ProfileProgressCard userId={profile?.user_id} />
                <Button variant="outline" size="sm" onClick={() => navigate("/profile/edit")}>
                  Editar perfil
                </Button>
              </>
            }
          />

          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full px-5 pb-7 md:px-7">
            <TabsList className="sr-only">
              <TabsTrigger
                value="overview"
                className="gap-2 rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent px-4 py-3"
              >
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
              <TabsTrigger
                value="friends"
                className="gap-2 rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent px-4 py-3"
              >
                <Users className="w-4 h-4" /> Amigos ({friends.length})
              </TabsTrigger>
            </TabsList>

            {activeTab !== "overview" && (
              <Button
                variant="ghost"
                size="sm"
                className="mb-4"
                onClick={() => setActiveTab("overview")}
              >
                ← Voltar ao perfil
              </Button>
            )}

            <TabsContent value="overview">
              <div className="grid items-start gap-6 lg:grid-cols-[minmax(0,1fr)_16rem]">
                <div className="space-y-6">
                  <FavoriteGameShowcase
                    userId={profile?.user_id}
                    appId={profile?.favorite_game_app_id}
                    editable
                  />
                  <PlatinumShowcase
                    userId={profile?.user_id}
                    selectedAppIds={profile?.platinum_showcase_app_ids}
                    editable
                    onViewAll={() => setActiveTab("platinum")}
                  />
                  <RecentActivity userId={profile?.user_id} />
                  {profile?.user_id && (
                    <div className="rounded-lg bg-black/15 p-5">
                      <ProfileComments
                        profileUserId={profile.user_id}
                        permission={profile.comments_permission || "public"}
                        isFriend={false}
                        isOwner
                      />
                    </div>
                  )}
                </div>
                <ProfileSidePanel
                  games={contentCounts?.games ?? 0}
                  platinums={contentCounts?.platinums ?? 0}
                  reviews={contentCounts?.reviews ?? 0}
                  friends={friends.length}
                  lists
                  onSelect={setActiveTab}
                />
              </div>
            </TabsContent>

            <TabsContent value="library">
              <ProfileLibrarySections
                games={userGames}
                isLoading={gamesLoading}
                onGameSelect={handleOpenGame}
              />
            </TabsContent>

            <TabsContent value="platinum">
              <div className="mb-5 rounded-lg bg-black/15 p-4">
                <h2 className="font-medium">Jogos platinados</h2>
                <p className="mt-1 text-sm text-muted-foreground">
                  Verifique jogos com 100% das conquistas na Steam ou marque manualmente pela
                  biblioteca.
                </p>
                <div className="mt-3 flex flex-wrap gap-2">
                  <Button
                    size="sm"
                    disabled={syncSteam.isPending}
                    onClick={async () => {
                      try {
                        const result = await syncSteam.mutateAsync({ syncPlatinums: true });
                        toast({
                          title: result.platinum_synced
                            ? `${result.platinum_synced} platinado(s) encontrado(s) na Steam.`
                            : "Nenhum jogo com 100% das conquistas foi encontrado.",
                        });
                      } catch (error) {
                        toast({
                          title: "Não foi possível verificar os platinados da Steam.",
                          description: error instanceof Error ? error.message : undefined,
                          variant: "destructive",
                        });
                      }
                    }}
                  >
                    {syncSteam.isPending ? "Verificando..." : "Verificar na Steam"}
                  </Button>
                  <Button size="sm" variant="outline" onClick={() => setIsPlatinumPickerOpen(true)}>
                    Escolher qualquer jogo
                  </Button>
                </div>
              </div>
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
              {!reviewsLoading && reviews.length === 0 ? (
                <div className="rounded-lg bg-black/15 py-12 text-center">
                  <h2 className="font-medium">Escreva sua primeira avaliação</h2>
                  <p className="mt-2 text-sm text-muted-foreground">
                    Escolha um jogo da sua biblioteca e conte o que achou.
                  </p>
                  <Button className="mt-4" size="sm" onClick={() => setActiveTab("library")}>
                    Escolher um jogo
                  </Button>
                </div>
              ) : (
                <ProfileReviews reviews={reviews} isLoading={reviewsLoading} />
              )}
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
      </main>

      <PlatinumGamePicker open={isPlatinumPickerOpen} onOpenChange={setIsPlatinumPickerOpen} />

      <GameModal game={selectedGame} isOpen={isModalOpen} onClose={handleCloseModal} />
    </div>
  );
};

export default Profile;
