/**
 * Componente da feature games.
 */

import { useEffect, useState } from "react";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { GameData } from "@/types/game";
import { GameLibraryActions } from "@/features/games/components/GameLibraryActions";
import ReviewForm from "@/features/reviews/components/ReviewForm";
import { useTranslation } from "react-i18next";
import { GameModalHeader } from "@/features/games/components/modal/GameModalHeader";
import { GameModalStats } from "@/features/games/components/modal/GameModalStats";
import { GameModalReviews } from "@/features/games/components/modal/GameModalReviews";
import { GameModalFooter } from "@/features/games/components/modal/GameModalFooter";
import { useEnsureGameDetails, useGameById } from "@/hooks/useGames";
import { useToast } from "@/hooks/use-toast";
import { AddToListButton } from "@/features/games/components/AddToListButton";
import { GameModalMedia } from "@/features/games/components/modal/GameModalMedia";

interface GameModalProps {
  game: GameData | null;
  isOpen: boolean;
  onClose: () => void;
}

const GameModal = ({ game, isOpen, onClose }: GameModalProps) => {
  const [isReviewOpen, setIsReviewOpen] = useState(false);
  const [detailsRequested, setDetailsRequested] = useState(false);
  const { t } = useTranslation();
  const { toast } = useToast();
  const ensureDetails = useEnsureGameDetails();
  const { data: fullGame } = useGameById(game?.app_id);

  useEffect(() => {
    if (!isOpen) {
      setIsReviewOpen(false);
      setDetailsRequested(false);
    }
  }, [isOpen]);

  // Se o jogo veio do catalogo sem detalhes, tenta buscar ao abrir o modal.
  useEffect(() => {
    if (!isOpen || !game) return;
    const mediaComplete = game.mediaSyncedAt && !(game.trailerThumbnail && !game.trailerUrl);
    if (game.hasDetails !== false && mediaComplete) return;
    if (detailsRequested) return;

    setDetailsRequested(true);
    ensureDetails.mutate(game.app_id, {
      onError: () => {
        toast({ title: t("search.loadError"), variant: "destructive" });
      },
    });
  }, [isOpen, game, detailsRequested, ensureDetails, toast, t]);

  if (!game) return null;

  const displayGame = fullGame ?? game;

  // Modal principal com areas separadas em componentes menores.
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl p-0 bg-card border-border/50 gap-0 max-h-[90vh] overflow-hidden grid-rows-[auto_1fr]">
        <GameModalHeader game={displayGame} />

        <div className="p-6 space-y-6 overflow-y-auto min-h-0">
          <GameModalStats game={displayGame} />

          {/* Descricao do jogo */}
          {displayGame.short_description && (
            <div>
              <h3 className="text-sm font-medium text-muted-foreground mb-2">
                {t("gameModal.about")}
              </h3>
              <p className="text-foreground/90 leading-relaxed">{displayGame.short_description}</p>
            </div>
          )}

          <GameModalMedia game={displayGame} />

          {/* Acoes de biblioteca + review */}
          <div className="pt-4 border-t border-border/50 space-y-4">
            <div className="flex flex-wrap items-center gap-2">
              <GameLibraryActions
                appId={Number(displayGame.app_id)}
                onWriteReview={() => setIsReviewOpen(true)}
              />
              <AddToListButton appId={Number(displayGame.app_id)} />
            </div>
            {isReviewOpen && (
              <div className="rounded-lg border border-border/50 bg-secondary/20 p-4 space-y-3">
                <h3 className="text-sm font-medium text-foreground">
                  {t("gameModal.writeReview")}
                </h3>
                <ReviewForm
                  appId={Number(displayGame.app_id)}
                  onClose={() => setIsReviewOpen(false)}
                />
              </div>
            )}
          </div>

          {/* Reviews da comunidade */}
          <GameModalReviews appId={Number(displayGame.app_id)} gameTitle={displayGame.title} />

          {/* Preco, alertas e botao da Steam */}
          <GameModalFooter game={displayGame} />
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default GameModal;
