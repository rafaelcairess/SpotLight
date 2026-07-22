/**
 * Componente da feature games.
 */

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { GameData } from "@/types/game";
import { getPosterImage, getSteamStoreUrl } from "@/lib/steam";
import steamIcon from "@/assets/steam.png";
import { ExternalLink } from "lucide-react";
import { useTranslation } from "react-i18next";

interface GameModalHeaderProps {
  game: GameData;
}

export const GameModalHeader = ({ game }: GameModalHeaderProps) => {
  const { t } = useTranslation();

  // Cabecalho compacto com a capa do jogo e informacoes principais.
  return (
    <div className="border-b border-border/50 bg-gradient-to-br from-background via-background/95 to-background p-4 sm:p-6">
      <div className="flex items-start gap-4">
        <div className="w-24 sm:w-28 md:w-32 aspect-[2/3] rounded-lg overflow-hidden border border-white/10 bg-black/40 flex-shrink-0">
          <img
            src={getPosterImage(game.app_id)}
            alt={game.title}
            className="w-full h-full object-cover"
            loading="lazy"
            onError={(event) => {
              const target = event.currentTarget;
              if (target.src !== game.image) {
                target.src = game.image;
              }
            }}
          />
        </div>
        <div className="min-w-0 flex-1">
          <h2 className="text-2xl md:text-3xl font-bold">{game.title}</h2>
          {game.genre && (
            <Badge variant="secondary" className="mt-2">
              {game.genre}
            </Badge>
          )}
          <Button
            onClick={() => window.open(getSteamStoreUrl(game.app_id), "_blank", "noopener,noreferrer")}
            className="mt-5 h-11 gap-2 bg-[#1b6ca8] px-5 text-white shadow-lg shadow-[#1b6ca8]/20 hover:bg-[#2387c8]"
          >
            <img src={steamIcon} alt="" className="h-5 w-5" />
            {t("gameModal.viewOnSteam")}
            <ExternalLink className="h-4 w-4 opacity-80" />
          </Button>
        </div>
      </div>
    </div>
  );
};
