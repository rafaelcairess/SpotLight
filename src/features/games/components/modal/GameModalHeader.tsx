import { ExternalLink, Star, Users } from "lucide-react";
import { useTranslation } from "react-i18next";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import type { GameData } from "@/types/game";
import { getPosterImage, getSteamStoreUrl } from "@/lib/steam";
import { formatPlayers, getRatingColorClass, isFreePrice } from "@/lib/format";
import { cn } from "@/lib/utils";
import steamIcon from "@/assets/steam.png";

interface GameModalHeaderProps {
  game: GameData;
  variant?: "compact" | "page";
}

export const GameModalHeader = ({ game, variant = "compact" }: GameModalHeaderProps) => {
  const { t } = useTranslation();
  const openSteam = () =>
    window.open(getSteamStoreUrl(game.app_id), "_blank", "noopener,noreferrer");
  const poster = getPosterImage(game.app_id);

  if (variant === "page") {
    return (
      <section className="relative min-h-[29rem] overflow-hidden rounded-2xl border border-white/[0.1] bg-card shadow-[0_24px_70px_hsl(226_75%_2%/0.58)] sm:min-h-[34rem] sm:rounded-[1.75rem]">
        <img src={game.image} alt="" className="absolute inset-0 h-full w-full object-cover" />
        <div className="absolute inset-0 bg-gradient-to-r from-background via-background/85 to-background/10" />
        <div className="absolute inset-0 bg-gradient-to-t from-background via-background/20 to-black/25" />
        <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/35 to-transparent" />

        <div className="relative flex min-h-[29rem] items-end p-5 sm:min-h-[34rem] sm:p-8 lg:p-12">
          <div className="grid w-full items-end gap-6 sm:grid-cols-[10rem_minmax(0,1fr)] lg:grid-cols-[12rem_minmax(0,1fr)] lg:gap-9">
            <div className="hidden aspect-[2/3] overflow-hidden rounded-2xl border border-white/[0.14] bg-black/40 shadow-2xl sm:block">
              <img
                src={poster}
                alt={game.title}
                className="h-full w-full object-cover"
                onError={(event) => {
                  if (event.currentTarget.src !== game.image) event.currentTarget.src = game.image;
                }}
              />
            </div>

            <div className="min-w-0">
              <div className="mb-4 flex flex-wrap items-center gap-2">
                {game.genre && (
                  <Badge className="border-primary/25 bg-primary/15 text-primary">
                    {game.genre}
                  </Badge>
                )}
                {game.releaseDate && (
                  <span className="text-xs font-medium text-foreground/70">{game.releaseDate}</span>
                )}
              </div>
              <h1 className="max-w-4xl break-words font-logo text-[2.35rem] font-extrabold leading-[0.98] tracking-[-0.045em] text-white [text-wrap:balance] sm:text-5xl sm:tracking-[-0.055em] lg:text-6xl">
                {game.title}
              </h1>
              <div className="mt-5 flex flex-wrap items-center gap-3 text-sm">
                {!!game.activePlayers && (
                  <span className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-black/30 px-3 py-1.5 backdrop-blur-md">
                    <Users className="h-4 w-4 text-primary" />
                    <strong>{formatPlayers(game.activePlayers)}</strong>
                    <span className="text-muted-foreground">{t("gameModal.playingNow")}</span>
                  </span>
                )}
                {!!game.communityRating && (
                  <span className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-black/30 px-3 py-1.5 backdrop-blur-md">
                    <Star
                      className={cn(
                        "h-4 w-4 fill-current",
                        getRatingColorClass(game.communityRating),
                      )}
                    />
                    <strong className={getRatingColorClass(game.communityRating)}>
                      {game.communityRating}%
                    </strong>
                  </span>
                )}
                {game.price && (
                  <span className="inline-flex rounded-full border border-emerald-400/20 bg-emerald-400/10 px-3 py-1.5 font-bold text-emerald-300">
                    {isFreePrice(game.price) ? t("gameModal.free") : game.price}
                  </span>
                )}
              </div>
              <Button onClick={openSteam} size="lg" className="mt-6 w-full gap-2 px-4 min-[390px]:w-auto sm:px-6">
                <img src={steamIcon} alt="" className="h-5 w-5" />
                {t("gameModal.viewOnSteam")}
                <ExternalLink className="opacity-75" />
              </Button>
            </div>
          </div>
        </div>
      </section>
    );
  }

  return (
    <div className="border-b border-white/[0.07] bg-gradient-to-br from-background via-background/95 to-card p-3 pr-12 sm:p-6 sm:pr-12">
      <div className="flex items-start gap-3 sm:gap-4">
        <div className="aspect-[2/3] w-20 flex-shrink-0 overflow-hidden rounded-lg border border-white/10 bg-black/40 sm:w-28 sm:rounded-xl md:w-32">
          <img
            src={poster}
            alt={game.title}
            className="h-full w-full object-cover"
            loading="lazy"
            onError={(event) => {
              if (event.currentTarget.src !== game.image) event.currentTarget.src = game.image;
            }}
          />
        </div>
        <div className="min-w-0 flex-1">
          <h2 className="line-clamp-2 break-words font-logo text-xl font-bold leading-tight tracking-[-0.035em] sm:text-2xl md:text-3xl">
            {game.title}
          </h2>
          {game.genre && (
            <Badge variant="secondary" className="mt-2">
              {game.genre}
            </Badge>
          )}
          <Button
            onClick={openSteam}
            className="mt-4 w-full gap-2 bg-[#1b6ca8] px-3 text-xs text-white shadow-lg shadow-[#1b6ca8]/20 hover:bg-[#2387c8] sm:mt-5 sm:w-auto sm:px-5 sm:text-sm"
          >
            <img src={steamIcon} alt="" className="h-5 w-5" />
            {t("gameModal.viewOnSteam")}
            <ExternalLink className="opacity-80" />
          </Button>
        </div>
      </div>
    </div>
  );
};
