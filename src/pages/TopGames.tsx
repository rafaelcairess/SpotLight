import { useMemo, useState } from "react";
import { Trophy, Filter, Loader2 } from "lucide-react";
import Header from "@/components/Header";
import SectionHeader from "@/components/SectionHeader";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useTopGamesRanking } from "@/hooks/useTopGamesRanking";
import GameModal from "@/components/GameModal";
import { GameData } from "@/types/game";

export default function TopGames() {
  const [genreFilter, setGenreFilter] = useState("");
  const [tagFilter, setTagFilter] = useState("");
  const [selectedGame, setSelectedGame] = useState<GameData | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const { data: ranking = [], isLoading, isFetching } = useTopGamesRanking(
    genreFilter,
    tagFilter,
    100
  );

  const topTenAverage = useMemo(() => {
    if (ranking.length === 0) return 0;
    const top = ranking.slice(0, 10);
    const avg = top.reduce((acc, game) => acc + game.weightedScore, 0) / top.length;
    return Number(avg.toFixed(1));
  }, [ranking]);

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
            title="Top Games Series"
            subtitle="Ranking ponderado por nota de usuarios (estilo MAL)"
            icon={Trophy}
          />

          <div className="mb-6 rounded-xl border border-border/40 bg-card/60 p-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 items-end">
              <div>
                <label className="text-xs text-muted-foreground">Filtro de genero</label>
                <Input
                  placeholder="Ex: rpg"
                  value={genreFilter}
                  onChange={(event) => setGenreFilter(event.target.value)}
                />
              </div>
              <div>
                <label className="text-xs text-muted-foreground">Filtro de tag</label>
                <Input
                  placeholder="Ex: co-op"
                  value={tagFilter}
                  onChange={(event) => setTagFilter(event.target.value)}
                />
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  onClick={() => {
                    setGenreFilter("");
                    setTagFilter("");
                  }}
                  className="gap-2"
                >
                  <Filter className="w-4 h-4" />
                  Limpar filtros
                </Button>
                {isFetching && (
                  <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
                    <Loader2 className="w-3 h-3 animate-spin" />
                    Atualizando
                  </span>
                )}
              </div>
            </div>

            <div className="mt-4 grid grid-cols-2 md:grid-cols-4 gap-3">
              <div className="rounded-lg border border-border/40 p-3 bg-secondary/20">
                <p className="text-xs text-muted-foreground">Jogos ranqueados</p>
                <p className="text-xl font-semibold">{ranking.length}</p>
              </div>
              <div className="rounded-lg border border-border/40 p-3 bg-secondary/20">
                <p className="text-xs text-muted-foreground">Media Top 10</p>
                <p className="text-xl font-semibold">{topTenAverage}</p>
              </div>
              <div className="rounded-lg border border-border/40 p-3 bg-secondary/20">
                <p className="text-xs text-muted-foreground">Parametro m</p>
                <p className="text-xl font-semibold">20</p>
              </div>
              <div className="rounded-lg border border-border/40 p-3 bg-secondary/20">
                <p className="text-xs text-muted-foreground">Escala</p>
                <p className="text-xl font-semibold">0 - 100</p>
              </div>
            </div>
          </div>

          {isLoading ? (
            <div className="space-y-3">
              {Array.from({ length: 8 }).map((_, idx) => (
                <div key={idx} className="h-20 rounded-xl border border-border/40 bg-card/50 animate-pulse" />
              ))}
            </div>
          ) : ranking.length === 0 ? (
            <div className="rounded-xl border border-border/40 bg-card/50 p-8 text-center text-muted-foreground">
              Nenhum jogo com reviews suficientes para ranking ainda.
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
                    <div className="grid grid-cols-3 gap-4 text-right min-w-[320px]">
                      <div>
                        <p className="text-[11px] text-muted-foreground">Weighted</p>
                        <p className="font-semibold">{game.weightedScore.toFixed(1)}</p>
                      </div>
                      <div>
                        <p className="text-[11px] text-muted-foreground">Media</p>
                        <p className="font-semibold">{game.averageScore.toFixed(1)}</p>
                      </div>
                      <div>
                        <p className="text-[11px] text-muted-foreground">Votos</p>
                        <p className="font-semibold">{game.votes}</p>
                      </div>
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
