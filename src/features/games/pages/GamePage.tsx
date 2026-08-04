import { useEffect, useState } from "react";
import { ArrowLeft, Layers3 } from "lucide-react";
import { useNavigate, useParams } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { PageContainer, PageShell, PageSurface } from "@/components/PageShell";
import { Button } from "@/components/ui/button";
import { GameModalHeader } from "@/features/games/components/modal/GameModalHeader";
import { GameModalStats } from "@/features/games/components/modal/GameModalStats";
import { GameModalMedia } from "@/features/games/components/modal/GameModalMedia";
import { GameModalReviews } from "@/features/games/components/modal/GameModalReviews";
import { GameModalFooter } from "@/features/games/components/modal/GameModalFooter";
import { GameLibraryActions } from "@/features/games/components/GameLibraryActions";
import { AddToListButton } from "@/features/games/components/AddToListButton";
import { useEnsureGameDetails, useGameById } from "@/hooks/useGames";
import { useToast } from "@/hooks/use-toast";

export default function GamePage() {
  const { appId } = useParams<{ appId: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { t } = useTranslation();
  const numericAppId = Number(appId);
  const { data: game, isLoading } = useGameById(numericAppId);
  const ensureDetails = useEnsureGameDetails();
  const [detailsRequested, setDetailsRequested] = useState(false);

  useEffect(() => {
    if (!numericAppId || detailsRequested || isLoading) return;
    if (!game) return;
    const mediaComplete = game?.mediaSyncedAt && !(game.trailerThumbnail && !game.trailerUrl);
    if (game?.hasDetails !== false && mediaComplete) return;
    setDetailsRequested(true);
    ensureDetails.mutate(numericAppId, {
      onError: () => toast({ title: t("search.loadError"), variant: "destructive" }),
    });
  }, [numericAppId, game, isLoading, detailsRequested, ensureDetails, toast, t]);

  if (isLoading) {
    return (
      <PageShell>
        <PageContainer className="space-y-6 pb-16">
          <div className="h-11 w-28 rounded-xl skeleton-shimmer" />
          <div className="min-h-[31rem] rounded-[1.75rem] skeleton-shimmer" />
          <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_22rem]">
            <div className="h-96 rounded-2xl skeleton-shimmer" />
            <div className="h-80 rounded-2xl skeleton-shimmer" />
          </div>
        </PageContainer>
      </PageShell>
    );
  }

  if (!game || !numericAppId) {
    return (
      <PageShell>
        <PageContainer width="narrow" className="py-20 text-center">
          <p className="text-muted-foreground">{t("gamePage.notFound")}</p>
          <Button variant="ghost" className="mt-4" onClick={() => navigate(-1)}>
            <ArrowLeft />
            {t("common.actions.back")}
          </Button>
        </PageContainer>
      </PageShell>
    );
  }

  return (
    <PageShell>
      <PageContainer className="space-y-6 pb-16">
        <Button variant="ghost" size="sm" onClick={() => navigate(-1)} className="-ml-2 gap-2">
          <ArrowLeft />
          {t("common.actions.back")}
        </Button>

        <GameModalHeader game={game} variant="page" />

        <div className="grid items-start gap-6 lg:grid-cols-[minmax(0,1fr)_22rem]">
          <div className="min-w-0 space-y-6">
            {game.short_description && (
              <PageSurface className="p-5 sm:p-7">
                <p className="eyebrow mb-3">{t("gamePage.overview")}</p>
                <h2 className="font-logo text-2xl font-bold tracking-[-0.035em]">
                  {t("gameModal.about")}
                </h2>
                <p className="mt-4 text-base leading-7 text-foreground/78">
                  {game.short_description}
                </p>
              </PageSurface>
            )}

            <PageSurface className="p-5 sm:p-7">
              <GameModalMedia game={game} loading={ensureDetails.isPending} variant="page" />
            </PageSurface>

            <PageSurface className="p-5 sm:p-7">
              <GameModalReviews appId={numericAppId} gameTitle={game.title} />
            </PageSurface>
          </div>

          <aside className="space-y-4 lg:sticky lg:top-24">
            <PageSurface className="space-y-5 p-5">
              <div>
                <p className="eyebrow mb-3">{t("gamePage.details")}</p>
                <GameModalStats game={game} variant="page" />
              </div>

              <div className="border-t border-white/[0.07] pt-5">
                <GameLibraryActions appId={numericAppId} />
                <div className="mt-3">
                  <AddToListButton appId={numericAppId} />
                </div>
              </div>

              {!!game.tags?.length && (
                <div className="border-t border-white/[0.07] pt-5">
                  <div className="mb-3 flex items-center gap-2 text-sm font-semibold">
                    <Layers3 className="h-4 w-4 text-primary" />
                    {t("gamePage.tags")}
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {game.tags.slice(0, 12).map((tag) => (
                      <span
                        key={tag}
                        className="rounded-full border border-white/[0.08] bg-white/[0.04] px-2.5 py-1 text-xs text-foreground/75"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              <div className="border-t border-white/[0.07] pt-5">
                <GameModalFooter game={game} variant="page" />
              </div>
            </PageSurface>
          </aside>
        </div>
      </PageContainer>
    </PageShell>
  );
}
