import { useState } from "react";
import { TrendingUp, Sparkles } from "lucide-react";
import Header from "@/components/Header";
import FeaturedBanner from "@/components/FeaturedBanner";
import GameCard from "@/components/GameCard";
import GameModal from "@/components/GameModal";
import SectionHeader from "@/components/SectionHeader";
import CategoryCard from "@/components/CategoryCard";
import LoadingSkeleton from "@/components/LoadingSkeleton";
import { GameData, CATEGORIES } from "@/types/game";
import { usePopularGames, useTopRatedGames } from "@/hooks/useGames";

const Index = () => {
  const [selectedGame, setSelectedGame] = useState<GameData | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const { data: popularGames = [], isLoading: popularLoading } = usePopularGames(10);
  const { data: topRatedGames = [], isLoading: topRatedLoading } = useTopRatedGames(12);

  const featuredGame = popularGames[0] || topRatedGames[0] || null;

  const handleGameClick = (game: GameData) => {
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

      <main className="pt-20 md:pt-24">
        {/* Featured Banner */}
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

        {/* Rankings Section */}
        <section className="container mx-auto px-4 mb-12 md:mb-16">
          <SectionHeader
            title="Mais Vendidos"
            subtitle="Os jogos mais populares na Steam agora"
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

        {/* Categories Preview */}
        <section className="container mx-auto px-4 mb-12 md:mb-16">
          <SectionHeader
            title="Explorar Coleções"
            subtitle="Descubra jogos por categoria"
            icon={Sparkles}
            actionLabel="Ver Todas"
            actionHref="/collections"
          />

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {CATEGORIES.slice(0, 4).map((category, idx) => (
              <CategoryCard key={category.id} category={category} index={idx} />
            ))}
          </div>
        </section>

        {/* Discover Section */}
        <section className="container mx-auto px-4 pb-12 md:pb-16">
          <SectionHeader
            title="Descubra Novos Jogos"
            subtitle="Recomendações para você"
          />

          {topRatedLoading ? (
            <LoadingSkeleton variant="card" count={6} />
          ) : topRatedGames.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              Nenhum jogo encontrado. Rode o sync da Steam para popular o catálogo.
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
              {topRatedGames.map((game, idx) => (
                <GameCard
                  key={game.app_id}
                  game={game}
                  index={idx}
                  onClick={() => handleGameClick(game)}
                />
              ))}
            </div>
          )}
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t border-border/30 py-8">
        <div className="container mx-auto px-4 text-center">
          <div className="flex items-center justify-center gap-2 mb-2">
            <Sparkles className="w-5 h-5 text-primary" />
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
