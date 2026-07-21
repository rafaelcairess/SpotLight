/**
 * Componente da feature explore.
 */

import { Info, Users, Star } from "lucide-react";
import { Button } from "@/components/ui/button";
import { GameData } from "@/types/game";
import { cn } from "@/lib/utils";
import steamIcon from "@/assets/steam.png";
import { useTranslation } from "react-i18next";
import { getSteamStoreUrl } from "@/lib/steam";
import { formatPlayers, getRatingColorClass } from "@/lib/format";

interface FeaturedBannerProps {
  game: GameData;
  onExplore: () => void;
}

const FeaturedBanner = ({ game, onExplore }: FeaturedBannerProps) => {
  const { t } = useTranslation();
  const handleOpenSteam = () => {
    window.open(getSteamStoreUrl(game.app_id), "_blank", "noopener,noreferrer");
  };

  return (
    <div className="relative w-full min-h-[360px] aspect-[4/3] sm:min-h-0 sm:aspect-[16/9] lg:aspect-[21/9] xl:aspect-[21/8] rounded-2xl overflow-hidden group">
      {/* Imagem de fundo */}
      <img
        src={game.image}
        alt={game.title}
        className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
        fetchPriority="high"
        loading="eager"
        decoding="async"
      />

      {/* Overlays de gradiente */}
      <div className="absolute inset-0 bg-gradient-to-r from-background via-background/70 to-transparent" />
      <div className="absolute inset-0 bg-gradient-to-t from-background via-transparent to-transparent" />
      <div className="absolute inset-0 hero-gradient opacity-50" />

      {/* Conteudo */}
      <div className="relative h-full flex flex-col justify-end p-5 pb-6 sm:p-8 sm:pb-10 md:p-10 md:pb-12 max-w-2xl">
        {/* Badge */}
        <div className="flex items-center gap-2 mb-4 animate-fade-in">
          <span className="px-3 py-1 text-xs font-semibold uppercase tracking-wider bg-primary/20 text-primary rounded-full border border-primary/30">
            {t("featuredBanner.badge")}
          </span>
          {game.genre && (
            <span className="px-3 py-1 text-xs font-medium bg-secondary/80 rounded-full">
              {game.genre}
            </span>
          )}
        </div>

        {/* Titulo */}
        <h1 className="text-2xl sm:text-3xl md:text-5xl font-bold mb-4 leading-tight break-words line-clamp-3 animate-fade-in-up">
          {game.title}
        </h1>

        {/* Estatisticas */}
        <div className="flex flex-wrap items-center gap-4 sm:gap-6 mb-4 text-sm animate-fade-in">
          {game.activePlayers && (
            <div className="flex items-center gap-2">
              <Users className="w-4 h-4 text-primary" />
              <span className="text-muted-foreground">
                <span className="text-foreground font-semibold">
                  {formatPlayers(game.activePlayers)}
                </span>{" "}
                {t("gameCard.playing")}
              </span>
            </div>
          )}
          {game.communityRating && (
            <div className="flex items-center gap-2">
              <Star
                className={cn(
                  "w-4 h-4 fill-current",
                  getRatingColorClass(game.communityRating)
                )}
              />
              <span className={getRatingColorClass(game.communityRating)}>
                {t("featuredBanner.ratingPositive", {
                  value: game.communityRating,
                })}
              </span>
            </div>
          )}
        </div>

        {/* Descricao */}
        {game.short_description && (
          <p className="text-muted-foreground mb-6 line-clamp-2 md:line-clamp-3 max-w-lg animate-fade-in">
            {game.short_description}
          </p>
        )}

        {/* Acoes */}
        <div className="flex flex-wrap items-center gap-3 animate-fade-in-up">
          <Button
            size="lg"
            className="gap-2 glow-primary"
            onClick={handleOpenSteam}
          >
            <img src={steamIcon} alt="Steam" className="w-4 h-4" />
            {t("gameModal.viewOnSteam")}
          </Button>
          <Button
            size="lg"
            variant="secondary"
            className="gap-2"
            onClick={onExplore}
          >
            <Info className="w-4 h-4" />
            {t("featuredBanner.moreDetails")}
          </Button>
        </div>
      </div>
    </div>
  );
};

export default FeaturedBanner;
