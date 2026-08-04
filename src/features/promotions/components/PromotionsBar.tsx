/**
 * Componente da feature promotions.
 */

import { useState } from "react";
import { DollarSign } from "lucide-react";
import SectionHeader from "@/components/SectionHeader";
import { GameGrid } from "@/features/games/components/GameGrid";
import GameModal from "@/features/games/components/GameModal";
import { useGameSelection } from "@/features/games/hooks/useGameSelection";
import LoadingSkeleton from "@/components/LoadingSkeleton";
import LayoutToggle from "@/components/LayoutToggle";
import { useLayoutPreference } from "@/hooks/useLayoutPreference";
import { useDiscountedGamesPaged } from "@/hooks/useGames";
import { Button } from "@/components/ui/button";
import { useTranslation } from "react-i18next";

const PromotionsBar = () => {
  const PAGE_SIZE = 30;
  const [page, setPage] = useState(1);
  const { data, isLoading, isFetching } = useDiscountedGamesPaged(PAGE_SIZE, page);
  const games = data?.games ?? [];
  const total = data?.count ?? 0;
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const [cooldown, setCooldown] = useState(false);

  const { selectedGame, isGameOpen, openGame, closeGame } = useGameSelection();
  const [layoutMode, setLayoutMode] = useLayoutPreference();
  const { t } = useTranslation();

  const handlePageChange = (nextPage: number) => {
    if (cooldown || isFetching || nextPage === page) return;
    setPage(nextPage);
    setCooldown(true);
    setTimeout(() => setCooldown(false), 400);
  };

  return (
    <section className="mb-12 md:mb-16">
      <SectionHeader
        title={t("promotions.title")}
        subtitle={t("promotions.subtitle")}
        icon={DollarSign}
        actions={<LayoutToggle value={layoutMode} onChange={setLayoutMode} />}
      />

      {isLoading ? (
        <LoadingSkeleton variant="card" count={6} />
      ) : games.length === 0 ? (
        <div className="text-center py-8 text-muted-foreground">{t("promotions.empty")}</div>
      ) : (
        <>
          <GameGrid
            games={games}
            layout={layoutMode === "compact" ? "posters" : "cards"}
            posterColumns={4}
            cardVariant={layoutMode === "compact" ? "compact" : "default"}
            onGameSelect={openGame}
          />

          <div className="flex items-center justify-center gap-3 mt-8">
            <Button
              variant="outline"
              disabled={page <= 1 || isFetching || cooldown}
              onClick={() => handlePageChange(Math.max(1, page - 1))}
            >
              {t("common.actions.previous")}
            </Button>
            <span className="text-sm text-muted-foreground">
              {t("common.pagination.pageOf", { page, total: totalPages })}
            </span>
            <Button
              variant="outline"
              disabled={page >= totalPages || isFetching || cooldown}
              onClick={() => handlePageChange(Math.min(totalPages, page + 1))}
            >
              {t("common.actions.next")}
            </Button>
          </div>
        </>
      )}

      <GameModal game={selectedGame} isOpen={isGameOpen} onClose={closeGame} />
    </section>
  );
};

export default PromotionsBar;
