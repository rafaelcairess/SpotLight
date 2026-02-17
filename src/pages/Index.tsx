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
import FeaturedBanner from "@/components/FeaturedBanner";
import GameCard from "@/components/GameCard";
import GameModal from "@/components/GameModal";
import SectionHeader from "@/components/SectionHeader";
import CategoryCard from "@/components/CategoryCard";
import LoadingSkeleton from "@/components/LoadingSkeleton";
import LayoutToggle from "@/components/LayoutToggle";
import ReadyListsSection from "@/components/ready-lists/ReadyListsSection";
import { Button } from "@/components/ui/button";
import { useLayoutPreference } from "@/hooks/useLayoutPreference";
import { GameData, CATEGORIES, CategoryData } from "@/types/game";
import { usePopularGames, useTopRatedGames } from "@/hooks/useGames";
import { useRecommendations } from "@/hooks/useRecommendations";
import { useAuth } from "@/contexts/AuthContext";

const Index = () => {
  // PaginaÃ§Ã£o de "Descubra Novos Jogos".
  const PAGE_SIZE = 24;
  const { user } = useAuth();
  const [selectedGame, setSelectedGame] = useState<GameData | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  // Top 10 do ranking "Mais Vendidos".
  const { data: popularGames = [], isLoading: popularLoading } = usePopularGames(10);
  const [discoverLimit, setDiscoverLimit] = useState(PAGE_SIZE);
  const {
    data: topRatedGames = [],
    isLoading: topRatedLoading,
    isFetching: topRatedFetching,
  } = useTopRatedGames(discoverLimit);
  // RecomendaÃ§Ãµes personalizadas (somente logado).
  const { data: recommendedGames = [], isLoading: recommendationsLoading } = useRecommendations(12);
  const [layoutMode, setLayoutMode] = useLayoutPreference(
    "spotlight.layoutMode.explore",
    "compact"
  );
  const categoriesScrollRef = useRef<HTMLDivElement | null>(null);
  const [scrollLocked, setScrollLocked] = useState(false);

  // O banner usa o jogo mais popular ou mais bem avaliado como fallback.
  const featuredGame = popularGames[0] || topRatedGames[0] || null;

  const exploreCategories = useMemo(() => {
    // Mistura categorias em destaque para nÃ£o ficarem em bloco.
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

  // Helpers do modal.
  const handleGameClick = (game: GameData) => {
    setSelectedGame(game);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setSelectedGame(null);
  };

  // Scroll suave do carrossel de categorias (apenas desktop).
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

  // Classes da grade alternam entre pÃ´ster compacto e card padrÃ£o.
  const discoverGridClass =
    layoutMode === "compact"
      ? "grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4"
      : "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6";

  return (
    <div className="min-h-screen bg-background">
      <Header />

      <main className="pt-20 md:pt-24">
        {/* Destaque principal */}
        <section className="container mx-auto px-4 mb-12 md:mb-16">
          {featuredGame ? (
            <FeaturedBanner
              game={featuredGame}
              onExplore={() => handleGameClick(featuredGame)}
            />
          ) : popularLoading || topRatedLoading ? (
            <LoadingSkeleton variant="banner" />
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              Nenhum jogo encontrado. Rode o sync da Steam para popular o catálogo.
            </div>
          )}
        </section>

        {/* Ranking de populares */}
        <section className="container mx-auto px-4 mb-12 md:mb-16">
          <SectionHeader
            title="Mais Vendidos"
            subtitle="Os jogos mais populares na Steam agora (atualiza a cada 6 horas)"
            icon={TrendingUp}
          />

          {popularLoading ? (
            <LoadingSkeleton variant="ranking" count={10} />
          ) : popularGames.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              Nenhum jogo encontrado. Rode o sync da Steam para popular o catálogo.
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {/* Top 5 - Left Column */}
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

              {/* 6-10 - Right Column */}
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

        {/* Explorar coleções (carrossel horizontal) */}
        <section className="container mx-auto px-4 mb-12 md:mb-16">
          <SectionHeader
            title="Explorar Coleções"
            subtitle="Descubra jogos por categoria"
            icon={Sparkles}
            actionLabel="Ver Todas"
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
              aria-label="Voltar categorias"
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
              aria-label="Avançar categorias"
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

        {/* Descubra novos jogos (lista principal) */}
        <section className="container mx-auto px-4 pb-12 md:pb-16">
          <SectionHeader
            title="Descubra Novos Jogos"
            subtitle="Recomendações para você"
            actions={<LayoutToggle value={layoutMode} onChange={setLayoutMode} />}
          />

          {topRatedLoading ? (
            <LoadingSkeleton variant="card" count={6} />
          ) : topRatedGames.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              Nenhum jogo encontrado. Rode o sync da Steam para popular o catálogo.
            </div>
          ) : (
            <>
              <div className={discoverGridClass}>
                {topRatedGames.map((game, idx) => (
                  <GameCard
                    key={game.app_id}
                    game={game}
                    index={idx}
                    variant={layoutMode === "compact" ? "poster" : "default"}
                    onClick={() => handleGameClick(game)}
                  />
                ))}
              </div>
              {topRatedGames.length >= discoverLimit && (
                <div className="flex justify-center mt-8">
                  <Button
                    variant="outline"
                    onClick={() => setDiscoverLimit((prev) => prev + PAGE_SIZE)}
                    disabled={topRatedFetching}
                    className="w-full sm:min-w-[200px]"
                  >
                    {topRatedFetching ? (
                      <span className="inline-flex items-center gap-2">
                        <Loader2 className="w-4 h-4 animate-spin" />
                        Carregando...
                      </span>
                    ) : (
                      "Carregar mais"
                    )}
                  </Button>
                </div>
              )}
            </>
          )}
        </section>
        {/* Recomendações pessoais (apenas logado) */}
        {user && (
          <section className="container mx-auto px-4 pb-12 md:pb-16">
            <SectionHeader
              title="Recomendações pessoais"
              subtitle="Baseado no que você joga e avalia"
              icon={Sparkles}
            />

            {recommendationsLoading ? (
              <LoadingSkeleton variant="card" count={6} />
            ) : recommendedGames.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                Jogue e avalie alguns títulos para destravar recomendações personalizadas.
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

      {/* Footer */}
      <footer className="border-t border-border/30 py-8">
        <div className="container mx-auto px-4 text-center">
          <div className="flex items-center justify-center gap-2 mb-2">
            <Orbit className="w-5 h-5 text-primary" />
            <span className="font-bold text-gradient-primary">SpotLight</span>
          </div>
          <p className="text-sm text-muted-foreground">
            Descubra os melhores jogos de PC
          </p>
        </div>
      </footer>

      {/* Game Details Modal */}
      <GameModal
        game={selectedGame}
        isOpen={isModalOpen}
        onClose={handleCloseModal}
      />
    </div>
  );
};

export default Index;

