/**
 * Página da feature explore.
 */

import { useMemo, useRef, useState } from "react";
import {
  TrendingUp,
  Sparkles,
  Orbit,
  Loader2,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import Header from "@/components/Header";
import FeaturedBanner from "@/features/explore/components/FeaturedBanner";
import GameCard from "@/features/games/components/GameCard";
import GameModal from "@/features/games/components/GameModal";
import SectionHeader from "@/components/SectionHeader";
import CategoryCard from "@/features/collections/components/CategoryCard";
import LoadingSkeleton from "@/components/LoadingSkeleton";
import LayoutToggle from "@/components/LayoutToggle";
import ReadyListsSection from "@/features/explore/components/ReadyListsSection";
import { Button } from "@/components/ui/button";
import { useLayoutPreference } from "@/hooks/useLayoutPreference";
import { STORAGE_KEYS } from "@/config/storageKeys";
import { GameData, CATEGORIES, CategoryData } from "@/types/game";
import { useAllGames, useDailyFeaturedGame, usePopularGames } from "@/hooks/useGames";
import { useMaturePreference } from "@/hooks/useMaturePreference";
import { useRecommendations } from "@/hooks/useRecommendations";
import { useAuth } from "@/contexts/AuthContext";
import { useTranslation } from "react-i18next";

const Explore = () => {
  const PAGE_SIZE = 24;
  const { user } = useAuth();
  const { t } = useTranslation();
  const [selectedGame, setSelectedGame] = useState<GameData | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [discoverLimit, setDiscoverLimit] = useState(PAGE_SIZE);
  const popularLimit = Math.max(10, discoverLimit);
  const {
    data: popularGames = [],
    isLoading: popularLoading,
    isFetching: popularFetching,
  } = usePopularGames(popularLimit);
  const { data: allGames = [], isLoading: allGamesLoading } = useAllGames(300);
  const { data: recommendedGames = [], isLoading: recommendationsLoading } = useRecommendations(12);
  const [layoutMode, setLayoutMode] = useLayoutPreference(
    STORAGE_KEYS.layoutMode.explore,
    "compact"
  );
  const categoriesScrollRef = useRef<HTMLDivElement | null>(null);
  const [scrollLocked, setScrollLocked] = useState(false);

  const { data: dailyFeaturedGame, isLoading: dailyFeaturedLoading } = useDailyFeaturedGame();
  const featuredGame = dailyFeaturedGame || popularGames[0] || null;
  const [showMature] = useMaturePreference();

  const matureGames = useMemo(() => {
    const keywords = [
      "nudity",
      "nudez",
      "conteudo sexual",
      "sexual content",
      "sexual",
      "hentai",
      "adult",
      "adulto",
      "mature",
      "erotico",
    ];

    const matchesMature = (game: GameData) => {
      const values = [game.genre ?? "", ...(game.tags ?? [])].join(" ").toLowerCase();
      return keywords.some((keyword) => values.includes(keyword));
    };

    return [...allGames]
      .filter(matchesMature)
      .sort((a, b) => (b.activePlayers ?? 0) - (a.activePlayers ?? 0))
      .slice(0, 12);
  }, [allGames]);

  const exploreCategories = useMemo(() => {
    const featured = CATEGORIES.filter((category) => category.featured);
    const others = CATEGORIES.filter((category) => !category.featured);
    const shuffled = [...others];

    for (let i = shuffled.length - 1; i > 0; i -= 1) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }

    const result: CategoryData[] = [];
    const gap = Math.max(1, Math.floor(shuffled.length / (featured.length + 1)));
    let cursor = 0;

    featured.forEach((category) => {
      result.push(...shuffled.slice(cursor, cursor + gap));
      result.push(category);
      cursor += gap;
    });

    result.push(...shuffled.slice(cursor));

    return result.map((category) => ({ ...category, featured: false }));
  }, []);

  const handleGameClick = (game: GameData) => {
    setSelectedGame(game);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setSelectedGame(null);
  };

  const handleCategoryScroll = (direction: "left" | "right") => {
    const container = categoriesScrollRef.current;
    if (!container || scrollLocked) return;
    const scrollAmount = container.clientWidth * 0.8;
    container.scrollBy({
      left: direction === "left" ? -scrollAmount : scrollAmount,
      behavior: "smooth",
    });
    setScrollLocked(true);
    setTimeout(() => setScrollLocked(false), 600);
  };

  const discoverGridClass =
    layoutMode === "compact"
      ? "grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4"
      : "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6";

  return (
    <div className="min-h-screen bg-background">
      <Header />

      <main className="pt-20 md:pt-24">
        <section className="container mx-auto px-4 mb-12 md:mb-16">
          {featuredGame ? (
            <FeaturedBanner game={featuredGame} onExplore={() => handleGameClick(featuredGame)} />
          ) : dailyFeaturedLoading || popularLoading ? (
            <LoadingSkeleton variant="banner" />
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              {t("home.featuredEmpty")}
            </div>
          )}
        </section>

        <section className="container mx-auto px-4 mb-12 md:mb-16">
          <SectionHeader
            title={t("home.popularTitle")}
            subtitle={t("home.popularSubtitle")}
            icon={TrendingUp}
          />

          {popularLoading ? (
            <LoadingSkeleton variant="ranking" count={10} />
          ) : popularGames.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              {t("home.featuredEmpty")}
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              <div className="space-y-2">
                {popularGames.slice(0, 5).map((game, idx) => (
                  <GameCard
                    key={game.app_id}
                    game={game}
                    variant="ranking"
                    rank={idx + 1}
                    index={idx}
                    onClick={() => handleGameClick(game)}
                  />
                ))}
              </div>

              <div className="space-y-2">
                {popularGames.slice(5, 10).map((game, idx) => (
                  <GameCard
                    key={game.app_id}
                    game={game}
                    variant="ranking"
                    rank={idx + 6}
                    index={idx + 5}
                    onClick={() => handleGameClick(game)}
                  />
                ))}
              </div>
            </div>
          )}
        </section>

        <section className="container mx-auto px-4 mb-12 md:mb-16">
          <SectionHeader
            title={t("home.exploreCollectionsTitle")}
            subtitle={t("home.exploreCollectionsSubtitle")}
            icon={Sparkles}
            actionLabel={t("home.viewAll")}
            actionHref="/collections"
          />

          <div className="-mx-4 px-4 relative">
            <Button
              type="button"
              size="icon"
              variant="secondary"
              onClick={() => handleCategoryScroll("left")}
              disabled={scrollLocked}
              className="hidden md:flex absolute left-2 top-1/2 -translate-y-1/2 z-10 h-10 w-10 rounded-full shadow-sm border border-border/40 bg-background/80 backdrop-blur hover:bg-background"
              aria-label={t("home.prevCategories")}
            >
              <ChevronLeft className="w-5 h-5" />
            </Button>
            <Button
              type="button"
              size="icon"
              variant="secondary"
              onClick={() => handleCategoryScroll("right")}
              disabled={scrollLocked}
              className="hidden md:flex absolute right-2 top-1/2 -translate-y-1/2 z-10 h-10 w-10 rounded-full shadow-sm border border-border/40 bg-background/80 backdrop-blur hover:bg-background"
              aria-label={t("home.nextCategories")}
            >
              <ChevronRight className="w-5 h-5" />
            </Button>

            <div
              ref={categoriesScrollRef}
              className="flex gap-4 overflow-x-auto pb-2 snap-x snap-mandatory scroll-smooth md:px-12"
            >
              {exploreCategories.map((category, idx) => (
                <div
                  key={category.id}
                  className="min-w-[240px] sm:min-w-[280px] lg:min-w-[300px] snap-start"
                >
                  <CategoryCard category={category} index={idx} />
                </div>
              ))}
            </div>
          </div>
        </section>

        {showMature && (
          <section className="container mx-auto px-4 mb-12 md:mb-16">
            <SectionHeader
              title={t("home.matureTitle")}
              subtitle={t("home.matureSubtitle")}
            />

            {allGamesLoading ? (
              <LoadingSkeleton variant="card" count={6} />
            ) : matureGames.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                {t("home.matureEmpty")}
              </div>
            ) : (
              <div className={discoverGridClass}>
                {matureGames.map((game, idx) => (
                  <GameCard
                    key={game.app_id}
                    game={game}
                    index={idx}
                    variant={layoutMode === "compact" ? "poster" : "default"}
                    onClick={() => handleGameClick(game)}
                  />
                ))}
              </div>
            )}
          </section>
        )}

        <section className="container mx-auto px-4 pb-12 md:pb-16">
          <SectionHeader
            title={t("home.discoverTitle")}
            subtitle={t("home.discoverSubtitle")}
            actions={<LayoutToggle value={layoutMode} onChange={setLayoutMode} />}
          />

          {popularLoading ? (
            <LoadingSkeleton variant="card" count={6} />
          ) : popularGames.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              {t("home.featuredEmpty")}
            </div>
          ) : (
            <>
              <div className={discoverGridClass}>
                {popularGames.slice(0, discoverLimit).map((game, idx) => (
                  <GameCard
                    key={game.app_id}
                    game={game}
                    index={idx}
                    variant={layoutMode === "compact" ? "poster" : "default"}
                    onClick={() => handleGameClick(game)}
                  />
                ))}
              </div>
              {popularGames.length >= discoverLimit && (
                <div className="flex justify-center mt-8">
                  <Button
                    variant="outline"
                    onClick={() => setDiscoverLimit((prev) => prev + PAGE_SIZE)}
                    disabled={popularFetching}
                    className="w-full sm:min-w-[200px]"
                  >
                    {popularFetching ? (
                      <span className="inline-flex items-center gap-2">
                        <Loader2 className="w-4 h-4 animate-spin" />
                        {t("common.actions.loading")}
                      </span>
                    ) : (
                      t("common.actions.loadMore")
                    )}
                  </Button>
                </div>
              )}
            </>
          )}
        </section>

        {user && (
          <section className="container mx-auto px-4 pb-12 md:pb-16">
            <SectionHeader
              title={t("home.recommendationsTitle")}
              subtitle={t("home.recommendationsSubtitle")}
              icon={Sparkles}
            />

            {recommendationsLoading ? (
              <LoadingSkeleton variant="card" count={6} />
            ) : recommendedGames.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                {t("home.recommendationsEmpty")}
              </div>
            ) : (
              <div className={discoverGridClass}>
                {recommendedGames.map((game, idx) => (
                  <GameCard
                    key={game.app_id}
                    game={game}
                    index={idx}
                    variant={layoutMode === "compact" ? "poster" : "default"}
                    onClick={() => handleGameClick(game)}
                  />
                ))}
              </div>
            )}
          </section>
        )}

        <ReadyListsSection onGameClick={handleGameClick} />
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

      <GameModal game={selectedGame} isOpen={isModalOpen} onClose={handleCloseModal} />
    </div>
  );
};

export default Explore;
