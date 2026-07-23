import { useMemo, useState } from "react";
import { Clock3, Flame, Layers3, Orbit, Sparkles } from "lucide-react";
import Header from "@/components/Header";
import FeaturedBanner from "@/features/explore/components/FeaturedBanner";
import GameCard from "@/features/games/components/GameCard";
import GameModal from "@/features/games/components/GameModal";
import SectionHeader from "@/components/SectionHeader";
import CategoryCard from "@/features/collections/components/CategoryCard";
import LoadingSkeleton from "@/components/LoadingSkeleton";
import LayoutToggle from "@/components/LayoutToggle";
import { Button } from "@/components/ui/button";
import { useLayoutPreference } from "@/hooks/useLayoutPreference";
import { STORAGE_KEYS } from "@/config/storageKeys";
import { CATEGORIES, type GameData } from "@/types/game";
import { useAllGames, useDailyFeaturedGame, usePopularGames } from "@/hooks/useGames";
import { useMaturePreference } from "@/hooks/useMaturePreference";
import { useRecommendations } from "@/hooks/useRecommendations";
import { useAuth } from "@/contexts/AuthContext";
import { useTranslation } from "react-i18next";
import { rankNoteworthyReleases, rankQualityGames } from "@/lib/discovery";
import { isMatureGame } from "@/lib/matureFilter";

const PAGE_SIZE = 20;
const FEATURED_CATEGORY_IDS = [
  "action",
  "rpg",
  "story-rich",
  "open-world",
  "coop-2-online",
  "simulation",
  "terror",
  "roguelike",
];

export default function Explore() {
  const { user } = useAuth();
  const { t } = useTranslation();
  const [showMature] = useMaturePreference();
  const [selectedGame, setSelectedGame] = useState<GameData | null>(null);
  const [discoverLimit, setDiscoverLimit] = useState(PAGE_SIZE);
  const [layoutMode, setLayoutMode] = useLayoutPreference(
    STORAGE_KEYS.layoutMode.explore,
    "compact",
  );

  const { data: popularGames = [], isLoading: popularLoading } = usePopularGames(20);
  const { data: allGames = [], isLoading: allGamesLoading } = useAllGames(300);
  const { data: recommendedGames = [], isLoading: recommendationsLoading } = useRecommendations(12);
  const { data: dailyFeaturedGame, isLoading: dailyFeaturedLoading } = useDailyFeaturedGame();

  const qualityGames = useMemo(() => rankQualityGames(allGames), [allGames]);
  const newReleases = useMemo(() => rankNoteworthyReleases(allGames).slice(0, 10), [allGames]);
  const newReleaseIds = useMemo(
    () => new Set(newReleases.map((game) => game.app_id)),
    [newReleases],
  );
  const acclaimedGames = useMemo(
    () => qualityGames.filter((game) => !newReleaseIds.has(game.app_id)),
    [newReleaseIds, qualityGames],
  );
  const matureGames = useMemo(
    () =>
      allGames
        .filter(isMatureGame)
        .filter((game) => (game.communityRating ?? 0) >= 75)
        .sort((a, b) => (b.activePlayers ?? 0) - (a.activePlayers ?? 0))
        .slice(0, 10),
    [allGames],
  );
  const categories = useMemo(
    () =>
      FEATURED_CATEGORY_IDS.map((id) => CATEGORIES.find((category) => category.id === id)).filter(
        (category): category is (typeof CATEGORIES)[number] => Boolean(category),
      ),
    [],
  );

  const dailyIsRelevant =
    dailyFeaturedGame &&
    !isMatureGame(dailyFeaturedGame) &&
    (dailyFeaturedGame.communityRating ?? 0) >= 82 &&
    (dailyFeaturedGame.activePlayers ?? 0) >= 200;
  const featuredGame = dailyIsRelevant
    ? dailyFeaturedGame
    : qualityGames[0] || popularGames[0] || null;

  const gridClass =
    layoutMode === "compact"
      ? "grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4"
      : "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6";

  const openGame = (game: GameData) => setSelectedGame(game);

  return (
    <div className="min-h-screen bg-background">
      <Header />

      <main className="pt-20 md:pt-24">
        <section className="container mx-auto px-4 mb-12 md:mb-16">
          {featuredGame ? (
            <FeaturedBanner game={featuredGame} onExplore={() => openGame(featuredGame)} />
          ) : dailyFeaturedLoading || allGamesLoading ? (
            <LoadingSkeleton variant="banner" />
          ) : (
            <div className="text-center py-8 text-muted-foreground">{t("home.featuredEmpty")}</div>
          )}
        </section>

        <section className="container mx-auto px-4 mb-12 md:mb-16">
          <SectionHeader
            title={t("home.popularTitle")}
            subtitle={t("home.popularSubtitle")}
            icon={Flame}
            actionLabel={t("home.viewRanking")}
            actionHref="/mais-jogados"
          />
          {popularLoading ? (
            <LoadingSkeleton variant="ranking" count={10} />
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {[popularGames.slice(0, 5), popularGames.slice(5, 10)].map((column, columnIndex) => (
                <div className="space-y-2" key={columnIndex}>
                  {column.map((game, index) => {
                    const rank = columnIndex * 5 + index + 1;
                    return (
                      <GameCard
                        key={game.app_id}
                        game={game}
                        variant="ranking"
                        rank={rank}
                        index={rank - 1}
                        onClick={() => openGame(game)}
                      />
                    );
                  })}
                </div>
              ))}
            </div>
          )}
        </section>

        <section className="container mx-auto px-4 mb-12 md:mb-16">
          <SectionHeader
            title={t("home.newWorthPlayingTitle")}
            subtitle={t("home.newWorthPlayingSubtitle")}
            icon={Clock3}
          />
          {allGamesLoading ? (
            <LoadingSkeleton variant="card" count={5} />
          ) : newReleases.length === 0 ? (
            <div className="rounded-xl border border-border/40 bg-card/40 p-6 text-muted-foreground">
              {t("home.newWorthPlayingEmpty")}
            </div>
          ) : (
            <div className={gridClass}>
              {newReleases.map((game, index) => (
                <GameCard
                  key={game.app_id}
                  game={game}
                  index={index}
                  variant={layoutMode === "compact" ? "poster" : "default"}
                  onClick={() => openGame(game)}
                />
              ))}
            </div>
          )}
        </section>

        {user && (
          <section className="container mx-auto px-4 mb-12 md:mb-16">
            <SectionHeader
              title={t("home.recommendationsTitle")}
              subtitle={t("home.recommendationsSubtitle")}
              icon={Sparkles}
            />
            {recommendationsLoading ? (
              <LoadingSkeleton variant="card" count={5} />
            ) : recommendedGames.length === 0 ? (
              <div className="rounded-xl border border-border/40 bg-card/40 p-6 text-muted-foreground">
                {t("home.recommendationsEmpty")}
              </div>
            ) : (
              <div className={gridClass}>
                {recommendedGames.map((game, index) => (
                  <GameCard
                    key={game.app_id}
                    game={game}
                    index={index}
                    variant={layoutMode === "compact" ? "poster" : "default"}
                    onClick={() => openGame(game)}
                  />
                ))}
              </div>
            )}
          </section>
        )}

        <section className="container mx-auto px-4 mb-12 md:mb-16">
          <SectionHeader
            title={t("home.acclaimedTitle")}
            subtitle={t("home.acclaimedSubtitle")}
            icon={Sparkles}
            actions={<LayoutToggle value={layoutMode} onChange={setLayoutMode} />}
          />
          {allGamesLoading ? (
            <LoadingSkeleton variant="card" count={5} />
          ) : (
            <>
              <div className={gridClass}>
                {acclaimedGames.slice(0, discoverLimit).map((game, index) => (
                  <GameCard
                    key={game.app_id}
                    game={game}
                    index={index}
                    variant={layoutMode === "compact" ? "poster" : "default"}
                    onClick={() => openGame(game)}
                  />
                ))}
              </div>
              {acclaimedGames.length > discoverLimit && (
                <div className="flex justify-center mt-8">
                  <Button
                    variant="outline"
                    onClick={() => setDiscoverLimit((current) => current + PAGE_SIZE)}
                    className="w-full sm:w-auto sm:min-w-[200px]"
                  >
                    {t("common.actions.loadMore")}
                  </Button>
                </div>
              )}
            </>
          )}
        </section>

        <section className="container mx-auto px-4 mb-12 md:mb-16">
          <SectionHeader
            title={t("home.exploreCollectionsTitle")}
            subtitle={t("home.exploreCollectionsSubtitle")}
            icon={Layers3}
            actionLabel={t("home.viewAll")}
            actionHref="/collections"
          />
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {categories.map((category, index) => (
              <CategoryCard key={category.id} category={category} index={index} />
            ))}
          </div>
        </section>

        {showMature && matureGames.length > 0 && (
          <section className="container mx-auto px-4 mb-12 md:mb-16">
            <SectionHeader title={t("home.matureTitle")} subtitle={t("home.matureSubtitle")} />
            <div className={gridClass}>
              {matureGames.map((game, index) => (
                <GameCard
                  key={game.app_id}
                  game={game}
                  index={index}
                  variant={layoutMode === "compact" ? "poster" : "default"}
                  onClick={() => openGame(game)}
                />
              ))}
            </div>
          </section>
        )}
      </main>

      <footer className="border-t border-border/30 py-8">
        <div className="container mx-auto px-4 text-center">
          <div className="flex items-center justify-center gap-2 mb-2">
            <Orbit className="w-5 h-5 text-primary" />
            <span className="font-bold text-gradient-primary">SpotLight</span>
          </div>
          <p className="text-sm text-muted-foreground">{t("home.footerTagline")}</p>
        </div>
      </footer>

      <GameModal
        game={selectedGame}
        isOpen={Boolean(selectedGame)}
        onClose={() => setSelectedGame(null)}
      />
    </div>
  );
}
