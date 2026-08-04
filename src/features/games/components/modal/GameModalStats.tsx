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
  variant?: "compact" | "page";
}

export const GameModalStats = ({ game, variant = "compact" }: GameModalStatsProps) => {
  const { t } = useTranslation();

  // Linha de metricas rapidas do jogo (jogadores, nota, data e estudio).
  return (
    <div
      className={cn(
        variant === "page" ? "grid grid-cols-2 gap-3" : "flex flex-wrap items-center gap-6",
      )}
    >
      {game.activePlayers && (
        <div
          className={cn(
            "flex items-center gap-2",
            variant === "page" && "rounded-xl border border-white/[0.07] bg-black/15 p-3",
          )}
        >
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
        <div
          className={cn(
            "flex items-center gap-2",
            variant === "page" && "rounded-xl border border-white/[0.07] bg-black/15 p-3",
          )}
        >
          <div
            className={cn(
              "p-2 rounded-lg",
              game.communityRating >= 80
                ? "bg-emerald-500/10"
                : game.communityRating >= 50
                  ? "bg-amber-500/10"
                  : "bg-red-500/10",
            )}
          >
            <Star
              className={cn("w-4 h-4 fill-current", getRatingColorClass(game.communityRating))}
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
        <div
          className={cn(
            "flex items-center gap-2",
            variant === "page" && "rounded-xl border border-white/[0.07] bg-black/15 p-3",
          )}
        >
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
        <div
          className={cn(
            "flex items-center gap-2",
            variant === "page" && "rounded-xl border border-white/[0.07] bg-black/15 p-3",
          )}
        >
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
