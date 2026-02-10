import { useState } from "react";
import { Trophy, Loader2 } from "lucide-react";
import Header from "@/components/Header";
import SectionHeader from "@/components/SectionHeader";
import { useTopGamesRanking } from "@/hooks/useTopGamesRanking";
import GameModal from "@/components/GameModal";
import { GameData } from "@/types/game";

export default function TopGames() {
  const [selectedGame, setSelectedGame] = useState<GameData | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const { data: ranking = [], isLoading, isFetching } = useTopGamesRanking(
    "",
    "",
    50
  );

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

      <main className="pt-24 md:pt-28 pb-12">
        <div className="container mx-auto px-4">
          <SectionHeader
            title="Top Games"
            subtitle="Top 50 pelo SpotLight"
            icon={Trophy}
          />

          {isFetching && (
            <div className="mb-6 text-xs text-muted-foreground inline-flex items-center gap-1">
              <Loader2 className="w-3 h-3 animate-spin" />
              Atualizando
            </div>
          )}

          {isLoading ? (
            <div className="space-y-3">
              {Array.from({ length: 8 }).map((_, idx) => (
                <div
                  key={idx}
                  className="h-20 rounded-xl border border-border/40 bg-card/50 animate-pulse"
                />
              ))}
            </div>
          ) : ranking.length === 0 ? (
            <div className="rounded-xl border border-border/40 bg-card/50 p-8 text-center text-muted-foreground">
              Nenhum jogo encontrado para os filtros atuais.
            </div>
          ) : (
            <div className="space-y-2">
              {ranking.map((game, index) => (
                <button
                  key={game.app_id}
                  type="button"
                  onClick={() => handleOpenGame(game)}
                  className="w-full text-left rounded-xl border border-border/40 bg-card/50 hover:border-primary/40 transition-colors p-3"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 text-center">
                      <span className="text-lg font-bold text-primary">#{index + 1}</span>
                    </div>
                    <img
                      src={game.image}
                      alt={game.title}
                      className="w-24 h-14 rounded object-cover"
                    />
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold truncate">{game.title}</p>
                      <p className="text-xs text-muted-foreground truncate">
                        {game.genre || "Sem genero"}
                      </p>
                    </div>
                    <div className="text-right min-w-[160px]">
                      <p className="text-xs text-muted-foreground">
                        {(game.activePlayers || 0).toLocaleString("pt-BR")} jogando
                      </p>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      </main>

      <GameModal game={selectedGame} isOpen={isModalOpen} onClose={handleCloseModal} />
    </div>
  );
}
