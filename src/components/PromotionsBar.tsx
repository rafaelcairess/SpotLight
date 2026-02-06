import { useState } from "react";
import { DollarSign } from "lucide-react";
import SectionHeader from "@/components/SectionHeader";
import GameCard from "@/components/GameCard";
import GameModal from "@/components/GameModal";
import LoadingSkeleton from "@/components/LoadingSkeleton";
import LayoutToggle from "@/components/LayoutToggle";
import { useLayoutPreference } from "@/hooks/useLayoutPreference";
import { useDiscountedGamesPaged } from "@/hooks/useGames";
import { GameData } from "@/types/game";
import { Button } from "@/components/ui/button";

const PromotionsBar = () => {
  const PAGE_SIZE = 30;
  const [page, setPage] = useState(1);
  const { data, isLoading, isFetching } = useDiscountedGamesPaged(PAGE_SIZE, page);
  const games = data?.games ?? [];
  const total = data?.count ?? 0;
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const [cooldown, setCooldown] = useState(false);

  const [selectedGame, setSelectedGame] = useState<GameData | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [layoutMode, setLayoutMode] = useLayoutPreference();

  const handleGameClick = (game: GameData) => {
    setSelectedGame(game);
    setIsModalOpen(true);
  };

  const handlePageChange = (nextPage: number) => {
    if (cooldown || isFetching || nextPage === page) return;
    setPage(nextPage);
    setCooldown(true);
    setTimeout(() => setCooldown(false), 400);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setSelectedGame(null);
  };

  const gridClass =
    layoutMode === "compact"
      ? "grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6"
      : "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6";

  return (
    <section className="container mx-auto px-4 mb-12 md:mb-16">
      <SectionHeader
        title="Promoções"
        subtitle="Os jogos populares com desconto agora"
        icon={DollarSign}
        actions={<LayoutToggle value={layoutMode} onChange={setLayoutMode} />}
      />

      {isLoading ? (
        <LoadingSkeleton variant="card" count={6} />
      ) : games.length === 0 ? (
        <div className="text-center py-8 text-muted-foreground">
          Sem promoções no momento.
        </div>
      ) : (
        <>
          <div className={gridClass}>
            {games.map((game, idx) => (
              <GameCard
                key={game.app_id}
                game={game}
                index={idx}
                variant={layoutMode === "compact" ? "compact" : "default"}
                onClick={() => handleGameClick(game)}
              />
            ))}
          </div>

          <div className="flex items-center justify-center gap-3 mt-8">
            <Button
              variant="outline"
              disabled={page <= 1 || isFetching || cooldown}
              onClick={() => handlePageChange(Math.max(1, page - 1))}
            >
              Anterior
            </Button>
            <span className="text-sm text-muted-foreground">
              Página {page} de {totalPages}
            </span>
            <Button
              variant="outline"
              disabled={page >= totalPages || isFetching || cooldown}
              onClick={() => handlePageChange(Math.min(totalPages, page + 1))}
            >
              Próxima
            </Button>
          </div>
        </>
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
