/**
 * Página da feature search.
 */

import { useEffect, useState } from "react";
import { useSearchParams, Link } from "react-router-dom";
import { Search as SearchIcon, ArrowLeft } from "lucide-react";
import Header from "@/components/Header";
import GameCard from "@/features/games/components/GameCard";
import GameModal from "@/features/games/components/GameModal";
import LoadingSkeleton from "@/components/LoadingSkeleton";
import { GameData } from "@/types/game";
import { useEnsureGameDetails, useGameById, useSearchCatalog } from "@/hooks/useGames";
import { useToast } from "@/hooks/use-toast";
import { useTranslation } from "react-i18next";

const Search = () => {
  const [searchParams] = useSearchParams();
  const query = searchParams.get("q") || "";
  const [selectedGame, setSelectedGame] = useState<GameData | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const { toast } = useToast();
  const { t } = useTranslation();
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
          title: t("search.loadError"),
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
          <Link
            to="/"
            className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors mb-8"
          >
            <ArrowLeft className="w-4 h-4" />
            {t("search.backHome")}
          </Link>

          <div className="mb-8">
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 rounded-lg bg-primary/10">
                <SearchIcon className="w-5 h-5 text-primary" />
              </div>
              <h1 className="text-2xl md:text-3xl font-bold">{t("search.title")}</h1>
            </div>
            {query && (
              <p className="text-muted-foreground">
                {t("search.showingFor")}{" "}
                <span className="text-foreground font-medium">"{query}"</span>
              </p>
            )}
          </div>

          {isLoading ? (
            <LoadingSkeleton variant="card" count={6} />
          ) : !query ? (
            <div className="text-center py-12">
              <SearchIcon className="w-16 h-16 text-muted-foreground/30 mx-auto mb-4" />
              <p className="text-muted-foreground">{t("search.emptyPrompt")}</p>
            </div>
          ) : results.length === 0 ? (
            <div className="text-center py-12">
              <SearchIcon className="w-16 h-16 text-muted-foreground/30 mx-auto mb-4" />
              <h3 className="text-xl font-semibold mb-2">{t("search.emptyTitle")}</h3>
              <p className="text-muted-foreground">{t("search.emptyDescription")}</p>
            </div>
          ) : (
            <>
              <p className="text-sm text-muted-foreground mb-6">
                {results.length === 1
                  ? t("search.resultsCount", { count: results.length })
                  : t("search.resultsCountPlural", { count: results.length })}
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

      <GameModal game={selectedGame} isOpen={isModalOpen} onClose={handleCloseModal} />
    </div>
  );
};

export default Search;
