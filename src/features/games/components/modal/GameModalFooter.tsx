/**
 * Componente da feature games.
 */

import { GameData } from "@/types/game";
import { useTranslation } from "react-i18next";
import { isFreePrice } from "@/lib/format";
import { GameModalAlerts } from "./GameModalAlerts";

interface GameModalFooterProps {
  game: GameData;
}

export const GameModalFooter = ({ game }: GameModalFooterProps) => {
  const { t } = useTranslation();

  // Rodape com preco e alertas. O CTA da Steam fica no cabecalho.
  return (
    <div className="pt-4 border-t border-border/50">
      <div className="space-y-2">
        {game.price && (
          <div>
            <p className="text-xs text-muted-foreground">{t("gameModal.price")}</p>
            <p className="text-xl font-bold text-primary">
              {isFreePrice(game.price) ? t("gameModal.free") : game.price}
            </p>
          </div>
        )}

        <GameModalAlerts appId={Number(game.app_id)} />
      </div>
    </div>
  );
};
