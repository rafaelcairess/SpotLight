import { useState } from "react";
import { useSearchParams, Link } from "react-router-dom";
import { Search as SearchIcon, ArrowLeft } from "lucide-react";
import Header from "@/components/Header";
import GameCard from "@/components/GameCard";
import GameModal from "@/components/GameModal";
import LoadingSkeleton from "@/components/LoadingSkeleton";
import { GameData } from "@/types/game";
import { mockCollectionGames, mockRankingGames } from "@/data/mockGames";

const Search = () => {
  const [searchParams] = useSearchParams();
  const query = searchParams.get("q") || "";
  const [selectedGame, setSelectedGame] = useState<GameData | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Simulando busca - será substituído por chamada à API real
  const allGames = [...mockRankingGames, ...mockCollectionGames];
  const results = query
    ? allGames.filter(
        (game) =>
          game.title.toLowerCase().includes(query.toLowerCase()) ||
          game.genre?.toLowerCase().includes(query.toLowerCase())
      )
    : [];
  const isLoading = false;

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

      <main className="pt-24 md:pt-28 pb-12">
        <div className="container mx-auto px-4">
          {/* Back Button */}
          <Link
            to="/"
            className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors mb-8"
          >
            <ArrowLeft className="w-4 h-4" />
            Voltar ao Início
          </Link>

          {/* Search Header */}
          <div className="mb-8">
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 rounded-lg bg-primary/10">
                <SearchIcon className="w-5 h-5 text-primary" />
              </div>
              <h1 className="text-2xl md:text-3xl font-bold">
                Resultados da Busca
              </h1>
            </div>
            {query && (
              <p className="text-muted-foreground">
                Exibindo resultados para{" "}
                <span className="text-foreground font-medium">"{query}"</span>
              </p>
            )}
          </div>

          {/* Results */}
          {isLoading ? (
            <LoadingSkeleton variant="card" count={6} />
          ) : !query ? (
            <div className="text-center py-12">
              <SearchIcon className="w-16 h-16 text-muted-foreground/30 mx-auto mb-4" />
              <p className="text-muted-foreground">
                Digite algo na barra de busca para encontrar jogos
              </p>
            </div>
          ) : results.length === 0 ? (
            <div className="text-center py-12">
              <SearchIcon className="w-16 h-16 text-muted-foreground/30 mx-auto mb-4" />
              <h3 className="text-xl font-semibold mb-2">
                Nenhum resultado encontrado
              </h3>
              <p className="text-muted-foreground">
                Tente buscar por outro termo ou verifique a ortografia
              </p>
            </div>
          ) : (
            <>
              <p className="text-sm text-muted-foreground mb-6">
                {results.length} {results.length === 1 ? "jogo encontrado" : "jogos encontrados"}
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
                {results.map((game, idx) => (
                  <GameCard
                    key={game.app_id}
                    game={game}
                    index={idx}
                    onClick={() => handleGameClick(game)}
                  />
                ))}
              </div>
            </>
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

export default Search;
