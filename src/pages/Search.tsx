import { useEffect, useState } from "react";
import { useSearchParams, Link } from "react-router-dom";
import { Search as SearchIcon, ArrowLeft } from "lucide-react";
import Header from "@/components/Header";
import GameCard from "@/components/GameCard";
import GameModal from "@/components/GameModal";
import LoadingSkeleton from "@/components/LoadingSkeleton";
import { GameData } from "@/types/game";
import { useEnsureGameDetails, useGameById, useSearchCatalog } from "@/hooks/useGames";
import { useToast } from "@/hooks/use-toast";

const Search = () => {
  const [searchParams] = useSearchParams();
  const query = searchParams.get("q") || "";
  const [selectedGame, setSelectedGame] = useState<GameData | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const { toast } = useToast();
  const { data: results = [], isLoading } = useSearchCatalog(query, 40);
  const ensureDetails = useEnsureGameDetails();
  const [selectedAppId, setSelectedAppId] = useState<number | null>(null);
  const { data: fullGame } = useGameById(selectedAppId ?? undefined);

  useEffect(() => {
    if (fullGame && selectedAppId === fullGame.app_id) {
      setSelectedGame(fullGame);
    }
  }, [fullGame, selectedAppId]);

  const handleGameClick = async (game: GameData & { hasDetails?: boolean }) => {
    setSelectedGame(game);
    setIsModalOpen(true);
    setSelectedAppId(game.app_id);

    if (!game.hasDetails) {
      try {
        await ensureDetails.mutateAsync(game.app_id);
      } catch (error) {
        toast({
          title: "N?o foi poss?vel carregar os detalhes agora.",
          variant: "destructive",
        });
      }
    }
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setSelectedGame(null);
    setSelectedAppId(null);
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
            {"Voltar ao In\u00edcio"}
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

