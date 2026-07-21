/**
 * Página individual de um jogo (/game/:appId).
 */

import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import Header from "@/components/Header";
import { GameData } from "@/types/game";
import { GameModalHeader } from "@/features/games/components/modal/GameModalHeader";
import { GameModalStats } from "@/features/games/components/modal/GameModalStats";
import { GameModalReviews } from "@/features/games/components/modal/GameModalReviews";
import { GameModalFooter } from "@/features/games/components/modal/GameModalFooter";
import { GameLibraryActions } from "@/features/games/components/GameLibraryActions";
import { useGameById, useEnsureGameDetails } from "@/hooks/useGames";
import { useToast } from "@/hooks/use-toast";
import { useTranslation } from "react-i18next";

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
    if (game?.hasDetails !== false) return;
    setDetailsRequested(true);
    ensureDetails.mutate(numericAppId, {
      onError: () => {
        toast({ title: t("search.loadError"), variant: "destructive" });
      },
    });
  }, [numericAppId, game, isLoading, detailsRequested, ensureDetails, toast, t]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <main className="pt-24 container mx-auto px-4 max-w-4xl">
          <div className="animate-pulse space-y-6">
            <div className="h-8 w-48 bg-secondary rounded" />
            <div className="flex gap-4">
              <div className="w-32 aspect-[2/3] bg-secondary rounded-lg" />
              <div className="flex-1 space-y-3">
                <div className="h-8 w-64 bg-secondary rounded" />
                <div className="h-4 w-32 bg-secondary rounded" />
              </div>
            </div>
          </div>
        </main>
      </div>
    );
  }

  if (!game || !numericAppId) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <main className="pt-24 container mx-auto px-4 max-w-4xl text-center">
          <p className="text-muted-foreground">Jogo não encontrado.</p>
          <Button variant="ghost" className="mt-4" onClick={() => navigate(-1)}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Voltar
          </Button>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="pt-24 pb-12 container mx-auto px-4 max-w-4xl space-y-6">
        <Button variant="ghost" size="sm" onClick={() => navigate(-1)} className="gap-2 -ml-2">
          <ArrowLeft className="w-4 h-4" />
          Voltar
        </Button>

        {/* Header */}
        <div className="rounded-xl border border-border/50 bg-card overflow-hidden">
          <GameModalHeader game={game} />
          <div className="p-4 sm:p-6 space-y-6">
            {/* Stats */}
            <GameModalStats game={game} />

            {/* Descrição */}
            {game.short_description && (
              <div>
                <h3 className="text-sm font-semibold mb-2">Sobre o jogo</h3>
                <p className="text-sm text-foreground/80 leading-relaxed">
                  {game.short_description}
                </p>
              </div>
            )}

            {/* Tags */}
            {game.tags && game.tags.length > 0 && (
              <div className="flex flex-wrap gap-1.5">
                {game.tags.slice(0, 12).map((tag) => (
                  <span
                    key={tag}
                    className="inline-flex items-center rounded-full border border-border/50 bg-secondary/30 px-2.5 py-0.5 text-xs text-foreground/80"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            )}

            {/* Ações da biblioteca */}
            <div className="pt-2 border-t border-border/50">
              <GameLibraryActions appId={numericAppId} />
            </div>

            {/* Footer com preço e link Steam */}
            <GameModalFooter game={game} />
          </div>
        </div>

        {/* Reviews da comunidade */}
        <div className="rounded-xl border border-border/50 bg-card p-4 sm:p-6">
          <GameModalReviews appId={numericAppId} gameTitle={game.title} />
        </div>
      </main>
    </div>
  );
}
