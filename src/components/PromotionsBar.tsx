import { useState } from "react";
import { DollarSign } from "lucide-react";
import SectionHeader from "@/components/SectionHeader";
import GameCard from "@/components/GameCard";
import GameModal from "@/components/GameModal";
import LoadingSkeleton from "@/components/LoadingSkeleton";
import { useDiscountedGames } from "@/hooks/useGames";
import { GameData } from "@/types/game";

const PromotionsBar = () => {
  const { data: games = [], isLoading } = useDiscountedGames(30);
  const [selectedGame, setSelectedGame] = useState<GameData | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const handleGameClick = (game: GameData) => {
    setSelectedGame(game);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setSelectedGame(null);
  };

  return (
    <section className="container mx-auto px-4 mb-12 md:mb-16">
      <SectionHeader
        title="Promoções"
        subtitle="Os jogos populares com desconto agora"
        icon={DollarSign}
      />

      {isLoading ? (
        <LoadingSkeleton variant="card" count={6} />
      ) : games.length === 0 ? (
        <div className="text-center py-8 text-muted-foreground">
          Sem promoções no momento.
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

      <GameModal
        game={selectedGame}
        isOpen={isModalOpen}
        onClose={handleCloseModal}
      />
    </section>
  );
};

export default PromotionsBar;
