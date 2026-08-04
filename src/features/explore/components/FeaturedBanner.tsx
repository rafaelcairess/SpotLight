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
    <div className="group relative min-h-[470px] w-full overflow-hidden rounded-[1.75rem] border border-white/[0.12] bg-card shadow-[0_32px_100px_hsl(226_75%_2%/0.72)] sm:min-h-0 sm:aspect-[16/9] lg:aspect-[21/9] xl:aspect-[23/9]">
      {/* Imagem de fundo */}
      <img
        src={game.backgroundImage || game.image}
        alt={game.title}
        className="absolute inset-0 h-full w-full object-cover transition-transform duration-1000 ease-out group-hover:scale-[1.025]"
        fetchPriority="high"
        loading="eager"
        decoding="async"
      />

      {/* Overlays de gradiente */}
      <div className="absolute inset-0 bg-gradient-to-r from-background via-background/74 to-background/5" />
      <div className="absolute inset-0 bg-gradient-to-t from-background via-transparent to-black/25" />
      <div className="absolute inset-0 bg-[linear-gradient(120deg,hsl(var(--primary)/0.15),transparent_38%)] opacity-70" />
      <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/35 to-transparent" />

      {/* Conteudo */}
      <div className="relative flex h-full max-w-3xl flex-col justify-end p-6 sm:p-9 md:p-12 lg:p-14 xl:p-16">
        {/* Badge */}
        <div className="mb-5 flex items-center gap-2 animate-fade-in">
          <span className="rounded-full border border-primary/25 bg-primary/15 px-3 py-1.5 text-[10px] font-bold uppercase tracking-[0.18em] text-primary backdrop-blur-md">
            {t("featuredBanner.badge")}
          </span>
          {game.genre && (
            <span className="rounded-full border border-white/10 bg-black/30 px-3 py-1.5 text-xs font-medium text-foreground/85 backdrop-blur-md">
              {game.genre}
            </span>
          )}
        </div>

        {/* Titulo */}
        <h1 className="mb-4 line-clamp-3 break-words font-logo text-4xl font-extrabold leading-[0.96] tracking-[-0.06em] text-white [text-wrap:balance] animate-fade-in-up sm:text-5xl md:text-6xl lg:text-7xl xl:text-[5rem]">
          {game.title}
        </h1>

        {/* Estatisticas */}
        <div className="mb-5 flex flex-wrap items-center gap-3 text-sm animate-fade-in sm:gap-5">
          {game.activePlayers && (
            <div className="flex items-center gap-2 rounded-full border border-white/10 bg-black/25 px-3 py-1.5 backdrop-blur-md">
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
            <div className="flex items-center gap-2 rounded-full border border-white/10 bg-black/25 px-3 py-1.5 backdrop-blur-md">
              <Star
                className={cn("w-4 h-4 fill-current", getRatingColorClass(game.communityRating))}
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
          <p className="mb-7 max-w-xl line-clamp-2 text-sm leading-relaxed text-slate-300 animate-fade-in sm:text-base md:line-clamp-3">
            {game.short_description}
          </p>
        )}

        {/* Acoes */}
        <div className="flex flex-wrap items-center gap-3 animate-fade-in-up">
          <Button size="lg" className="gap-2 px-5 glow-primary sm:px-7" onClick={handleOpenSteam}>
            <img src={steamIcon} alt="Steam" className="w-4 h-4" />
            {t("gameModal.viewOnSteam")}
          </Button>
          <Button
            size="lg"
            variant="secondary"
            className="gap-2 border border-white/[0.12] bg-white/10 px-5 backdrop-blur-md hover:bg-white/15 sm:px-7"
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
