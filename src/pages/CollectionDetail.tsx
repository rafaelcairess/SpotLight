import { useState } from "react";
import { useParams, Link } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import Header from "@/components/Header";
import GameCard from "@/components/GameCard";
import GameModal from "@/components/GameModal";
import LoadingSkeleton from "@/components/LoadingSkeleton";
import { Button } from "@/components/ui/button";
import { GameData, CATEGORIES } from "@/types/game";
import { mockCollectionGames } from "@/data/mockGames";

const CollectionDetail = () => {
  const { categoryId } = useParams<{ categoryId: string }>();
  const [selectedGame, setSelectedGame] = useState<GameData | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const category = CATEGORIES.find((c) => c.id === categoryId);

  // Simulando dados - será substituído por chamada à API real
  const games = mockCollectionGames;
  const isLoading = false;

  const handleGameClick = (game: GameData) => {
    setSelectedGame(game);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setSelectedGame(null);
  };

  if (!category) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">Categoria não encontrada</h1>
          <Link to="/collections">
            <Button>Voltar às Coleções</Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />

      <main className="pt-24 md:pt-28 pb-12">
        <div className="container mx-auto px-4">
          {/* Back Button */}
          <Link
            to="/collections"
            className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors mb-8"
          >
            <ArrowLeft className="w-4 h-4" />
            Voltar às Coleções
          </Link>

          {/* Category Header */}
          <div
            className={`relative rounded-2xl overflow-hidden mb-8 bg-gradient-to-br ${category.gradient} border border-border/30`}
          >
            <div className="absolute inset-0 hero-gradient opacity-30" />
            <div className="relative p-8 md:p-12">
              <h1 className="text-3xl md:text-4xl font-bold mb-2">
                {category.name}
              </h1>
              <p className="text-muted-foreground max-w-lg">
                {category.description}
              </p>
            </div>
          </div>

          {/* Games Grid */}
          {isLoading ? (
            <LoadingSkeleton variant="card" count={6} />
          ) : games.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-muted-foreground">
                Nenhum jogo encontrado nesta categoria.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
              {games.map((game, idx) => (
                <GameCard
                  key={game.app_id}
                  game={game}
                  index={idx}
                  onClick={() => handleGameClick(game)}
                />
              ))}
            </div>
          )}
        </div>
      </main>

      <GameModal
        game={selectedGame}
        isOpen={isModalOpen}
        onClose={handleCloseModal}
      />
    </div>
  );
};

export default CollectionDetail;
