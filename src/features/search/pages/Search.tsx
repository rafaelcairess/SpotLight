/**
 * Página da feature search.
 */

import { useEffect, useState } from "react";
import { useSearchParams, Link } from "react-router-dom";
import { Search as SearchIcon, ArrowLeft } from "lucide-react";
import { PageContainer, PageShell } from "@/components/PageShell";
import { GameGrid } from "@/features/games/components/GameGrid";
import GameModal from "@/features/games/components/GameModal";
import { useGameSelection } from "@/features/games/hooks/useGameSelection";
import LoadingSkeleton from "@/components/LoadingSkeleton";
import type { GameData } from "@/types/game";
import { useEnsureGameDetails, useGameById, useSearchCatalog } from "@/hooks/useGames";
import { useToast } from "@/hooks/use-toast";
import { useTranslation } from "react-i18next";

const Search = () => {
  const [searchParams] = useSearchParams();
  const query = searchParams.get("q") || "";
  const { selectedGame, isGameOpen, openGame, closeGame, setSelectedGame } =
    useGameSelection<GameData>();
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
  }, [fullGame, selectedAppId, setSelectedGame]);

  const handleGameClick = async (game: GameData & { hasDetails?: boolean }) => {
    openGame(game);
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
    closeGame();
    setSelectedAppId(null);
  };

  return (
    <PageShell>
      <PageContainer className="pb-12">
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
            <GameGrid games={results} onGameSelect={handleGameClick} />
          </>
        )}
      </PageContainer>

      <GameModal game={selectedGame} isOpen={isGameOpen} onClose={handleCloseModal} />
    </PageShell>
  );
};

export default Search;
