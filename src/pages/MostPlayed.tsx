import { useState } from "react";
import { Flame, Loader2 } from "lucide-react";
import Header from "@/components/Header";
import SectionHeader from "@/components/SectionHeader";
import LayoutToggle from "@/components/LayoutToggle";
import GameCard from "@/components/GameCard";
import GameModal from "@/components/GameModal";
import { GameData } from "@/types/game";
import { useMostPlayedGames } from "@/hooks/useMostPlayedGames";
import { useLayoutPreference } from "@/hooks/useLayoutPreference";

export default function MostPlayed() {
  const [selectedGame, setSelectedGame] = useState<GameData | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [layoutMode, setLayoutMode] = useLayoutPreference(
    "spotlight.layoutMode.mostPlayed",
    "standard"
  );
  const { data: games = [], isLoading, isFetching } = useMostPlayedGames(50);

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
            title="Mais jogados da Steam"
            subtitle="Ranking pelos jogadores ativos (atualiza a cada 6 horas)"
            icon={Flame}
            actions={<LayoutToggle value={layoutMode} onChange={setLayoutMode} />}
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
          ) : games.length === 0 ? (
            <div className="rounded-xl border border-border/40 bg-card/50 p-8 text-center text-muted-foreground">
              Nenhum jogo encontrado.
            </div>
          ) : layoutMode === "compact" ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
              {games.map((game, index) => (
                <GameCard
                  key={game.app_id}
                  game={game}
                  variant="poster"
                  rank={index + 1}
                  index={index}
                  onClick={() => handleOpenGame(game)}
                />
              ))}
            </div>
          ) : (
            <div className="space-y-2">
              {games.map((game, index) => (
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
                        {game.genre || "Sem gênero"}
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
