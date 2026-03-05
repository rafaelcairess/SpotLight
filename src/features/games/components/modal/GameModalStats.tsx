/**
 * Componente da feature games.
 */

import { Users, Star, Calendar, Building } from "lucide-react";
import { GameData } from "@/types/game";
import { cn } from "@/lib/utils";
import { useTranslation } from "react-i18next";
import { formatPlayers, getRatingColorClass } from "@/lib/format";

interface GameModalStatsProps {
  game: GameData;
}

export const GameModalStats = ({ game }: GameModalStatsProps) => {
  const { t } = useTranslation();

  // Linha de metricas rapidas do jogo (jogadores, nota, data e estudio).
  return (
    <div className="flex flex-wrap items-center gap-6">
      {game.activePlayers && (
        <div className="flex items-center gap-2">
          <div className="p-2 rounded-lg bg-primary/10">
            <Users className="w-4 h-4 text-primary" />
          </div>
          <div>
            <p className="text-xs text-muted-foreground">{t("gameModal.playingNow")}</p>
            <p className="font-semibold">{formatPlayers(game.activePlayers)}</p>
          </div>
        </div>
      )}

      {game.communityRating && (
        <div className="flex items-center gap-2">
          <div
            className={cn(
              "p-2 rounded-lg",
              game.communityRating >= 80
                ? "bg-emerald-500/10"
                : game.communityRating >= 50
                ? "bg-amber-500/10"
                : "bg-red-500/10"
            )}
          >
            <Star
              className={cn(
                "w-4 h-4 fill-current",
                getRatingColorClass(game.communityRating)
              )}
            />
          </div>
          <div>
            <p className="text-xs text-muted-foreground">{t("gameModal.rating")}</p>
            <p className={cn("font-semibold", getRatingColorClass(game.communityRating))}>
              {game.communityRating}%
            </p>
          </div>
        </div>
      )}

      {game.releaseDate && (
        <div className="flex items-center gap-2">
          <div className="p-2 rounded-lg bg-secondary">
            <Calendar className="w-4 h-4 text-muted-foreground" />
          </div>
          <div>
            <p className="text-xs text-muted-foreground">{t("gameModal.release")}</p>
            <p className="font-semibold">{game.releaseDate}</p>
          </div>
        </div>
      )}

      {game.developer && (
        <div className="flex items-center gap-2">
          <div className="p-2 rounded-lg bg-secondary">
            <Building className="w-4 h-4 text-muted-foreground" />
          </div>
          <div>
            <p className="text-xs text-muted-foreground">{t("gameModal.developer")}</p>
            <p className="font-semibold">{game.developer}</p>
          </div>
        </div>
      )}
    </div>
  );
};
