/** Category page backed by an explicitly curated game list. */

import { useMemo } from "react";
import { Link, useParams } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { useTranslation } from "react-i18next";
import { PageContainer, PageShell } from "@/components/PageShell";
import LoadingSkeleton from "@/components/LoadingSkeleton";
import { Button } from "@/components/ui/button";
import { CATEGORY_GAME_IDS } from "@/features/collections/data/categoryGameIds";
import { GameGrid } from "@/features/games/components/GameGrid";
import GameModal from "@/features/games/components/GameModal";
import { useGameSelection } from "@/features/games/hooks/useGameSelection";
import { useGamesByIds } from "@/hooks/useGames";
import { CATEGORIES } from "@/types/game";

export default function CollectionDetail() {
  const { categoryId } = useParams<{ categoryId: string }>();
  const { t } = useTranslation();
  const { selectedGame, isGameOpen, openGame, closeGame } = useGameSelection();
  const category = CATEGORIES.find((item) => item.id === categoryId);
  const manualIds = useMemo(
    () => (categoryId ? (CATEGORY_GAME_IDS[categoryId] ?? []) : []),
    [categoryId],
  );
  const { data: manualGames = [], isLoading } = useGamesByIds(manualIds);

  const games = useMemo(() => {
    const order = new Map(manualIds.map((id, index) => [id, index]));
    return [...manualGames].sort(
      (first, second) =>
        (order.get(first.app_id) ?? Number.MAX_SAFE_INTEGER) -
        (order.get(second.app_id) ?? Number.MAX_SAFE_INTEGER),
    );
  }, [manualGames, manualIds]);

  if (!category) {
    return (
      <PageShell>
        <PageContainer className="flex min-h-[60vh] items-center justify-center pb-12">
          <div className="text-center">
            <h1 className="mb-4 text-2xl font-bold">{t("collections.notFoundTitle")}</h1>
            <Button asChild>
              <Link to="/collections">{t("collectionDetail.back")}</Link>
            </Button>
          </div>
        </PageContainer>
      </PageShell>
    );
  }

  return (
    <PageShell>
      <PageContainer className="pb-12">
        <Link
          to="/collections"
          className="mb-8 inline-flex min-h-11 items-center gap-2 text-muted-foreground transition-colors hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          <ArrowLeft className="h-4 w-4" />
          {t("collectionDetail.back")}
        </Link>

        <section
          className={`relative mb-8 overflow-hidden rounded-2xl border border-border/30 bg-gradient-to-br ${category.gradient}`}
        >
          <div className="hero-gradient absolute inset-0 opacity-30" />
          <div className="relative p-5 sm:p-8 md:p-12">
            <h1 className="mb-2 text-3xl font-bold md:text-4xl">
              {t(`categories.${category.id}.name`, { defaultValue: category.name })}
            </h1>
            <p className="max-w-lg text-muted-foreground">
              {t(`categories.${category.id}.description`, { defaultValue: category.description })}
            </p>
          </div>
        </section>

        {isLoading ? (
          <LoadingSkeleton variant="card" count={6} />
        ) : games.length === 0 ? (
          <div className="py-12 text-center text-muted-foreground">
            {t("collectionDetail.empty")}
          </div>
        ) : (
          <GameGrid games={games} onGameSelect={openGame} />
        )}
      </PageContainer>

      <GameModal game={selectedGame} isOpen={isGameOpen} onClose={closeGame} />
    </PageShell>
  );
}
