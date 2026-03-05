import { Button } from "@/components/ui/button";
import { GameData } from "@/types/game";
import steamIcon from "@/assets/steam.png";
import { useTranslation } from "react-i18next";
import { getSteamStoreUrl } from "@/lib/steam";
import { isFreePrice } from "@/lib/format";
import { GameModalAlerts } from "./GameModalAlerts";

interface GameModalFooterProps {
  game: GameData;
}

export const GameModalFooter = ({ game }: GameModalFooterProps) => {
  const { t } = useTranslation();

  // Rodape com preco, alertas e CTA para abrir na Steam.
  return (
    <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between pt-4 border-t border-border/50">
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

      <Button
        onClick={() =>
          window.open(getSteamStoreUrl(game.app_id), "_blank", "noopener,noreferrer")
        }
        variant="outline"
        className="gap-2"
      >
        <img src={steamIcon} alt="Steam" className="w-4 h-4" />
        {t("gameModal.viewOnSteam")}
      </Button>
    </div>
  );
};
