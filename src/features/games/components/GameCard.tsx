/**
 * Componente da feature games.
 */

import { Users, Star, ExternalLink, Sparkles } from "lucide-react";
import { useTranslation } from "react-i18next";
import { GameData } from "@/types/game";
import { cn } from "@/lib/utils";
import { getPosterImage } from "@/lib/steam";
import { formatPlayers, getRatingColorClass, isFreePrice } from "@/lib/format";

export type GameCardVariant = "default" | "compact" | "ranking" | "ranking-featured" | "poster";

interface GameCardProps {
  game: GameData;
  onClick?: () => void;
  index?: number;
  variant?: GameCardVariant;
  rank?: number;
  contextLabel?: string;
}

const GameCard = ({
  game,
  onClick,
  index = 0,
  variant = "default",
  rank,
  contextLabel,
}: GameCardProps) => {
  const { t } = useTranslation();

  if (variant === "ranking-featured") {
    return (
      <button
        type="button"
        onClick={onClick}
        className="group relative min-h-64 h-full w-full overflow-hidden rounded-2xl border border-white/[0.09] bg-card text-left shadow-[0_18px_50px_hsl(224_60%_2%/0.38)] transition-all duration-300 hover:-translate-y-0.5 hover:border-primary/40 hover:shadow-[0_24px_65px_hsl(224_60%_2%/0.56)]"
      >
        <img
          src={game.image}
          alt={game.title}
          className="absolute inset-0 h-full w-full object-cover transition-transform duration-500 group-hover:scale-[1.03]"
          loading="lazy"
          decoding="async"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black via-black/35 to-black/5" />
        <div className="absolute inset-0 bg-gradient-to-r from-primary/15 to-transparent opacity-60" />

        <div className="absolute left-4 top-4 flex items-center gap-2">
          <span className="grid h-9 min-w-9 place-items-center rounded-lg border border-white/15 bg-black/70 px-2 font-logo text-sm font-bold text-white backdrop-blur-md">
            #1
          </span>
          {!!game.activePlayers && (
            <span className="inline-flex items-center gap-1.5 rounded-lg border border-white/10 bg-black/65 px-2.5 py-2 text-xs text-white backdrop-blur-md">
              <Users className="h-3.5 w-3.5" />
              {formatPlayers(game.activePlayers)}
            </span>
          )}
        </div>

        <div className="absolute inset-x-0 bottom-0 p-5">
          <p className="eyebrow mb-2 text-blue-300">{t("home.topPosition")}</p>
          <h3 className="line-clamp-2 font-logo text-2xl font-bold tracking-[-0.04em] text-white">
            {game.title}
          </h3>
          {!!game.communityRating && (
            <span
              className={cn(
                "mt-2 inline-flex items-center gap-1.5 text-sm font-semibold",
                getRatingColorClass(game.communityRating),
              )}
            >
              <Star className="h-4 w-4 fill-current" />
              {game.communityRating}%
            </span>
          )}
        </div>
      </button>
    );
  }

  if (variant === "ranking") {
    return (
      <button
        type="button"
        onClick={onClick}
        className="game-card group flex min-h-[4.5rem] w-full items-center gap-2.5 p-2.5 text-left sm:min-h-[4.75rem] sm:gap-4 sm:p-3"
        style={{ animationDelay: `${index * 50}ms` }}
      >
        <div className="w-6 flex-shrink-0 text-center sm:w-8">
          <span
            className={cn(
              "text-xl font-bold sm:text-2xl",
              rank === 1 && "text-gradient-accent",
              rank === 2 && "text-slate-300",
              rank === 3 && "text-amber-700",
              rank && rank > 3 && "text-muted-foreground",
            )}
          >
            {rank}
          </span>
        </div>

        <div className="relative h-11 w-16 flex-shrink-0 overflow-hidden rounded-lg sm:h-12 sm:w-20">
          <img
            src={game.image}
            alt={game.title}
            className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-110"
            loading="lazy"
            decoding="async"
          />
        </div>

        <div className="flex-1 min-w-0">
          <h4 className="font-medium text-sm truncate group-hover:text-primary transition-colors">
            {game.title}
          </h4>
          <div className="flex items-center gap-3 mt-1">
            {game.activePlayers && (
              <span className="flex items-center gap-1 text-xs text-muted-foreground">
                <Users className="w-3 h-3" />
                {formatPlayers(game.activePlayers)}
              </span>
            )}
            {game.communityRating && (
              <span
                className={cn(
                  "flex items-center gap-1 text-xs",
                  getRatingColorClass(game.communityRating),
                )}
              >
                <Star className="w-3 h-3 fill-current" />
                {game.communityRating}%
              </span>
            )}
          </div>
        </div>

        <ExternalLink className="hidden h-4 w-4 text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100 sm:block" />
      </button>
    );
  }

  if (variant === "poster") {
    const posterImage = getPosterImage(game.app_id);

    return (
      <button
        type="button"
        onClick={onClick}
        className="group relative w-full overflow-hidden rounded-xl border border-white/[0.08] bg-card/60 text-left shadow-[0_10px_28px_hsl(224_60%_2%/0.28)] transition-all duration-300 hover:border-primary/40 sm:rounded-2xl sm:hover:-translate-y-1 sm:hover:shadow-[0_24px_60px_hsl(224_60%_2%/0.58)]"
        style={{ animationDelay: `${index * 50}ms` }}
      >
        <div className="aspect-[2/3] relative">
          <img
            src={posterImage}
            alt={game.title}
            className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
            loading="lazy"
            decoding="async"
            onError={(event) => {
              const target = event.currentTarget;
              if (target.src !== game.image) {
                target.src = game.image;
              }
            }}
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/95 via-black/15 to-transparent" />
          <div className="absolute inset-0 bg-primary/10 opacity-0 transition-opacity duration-300 group-hover:opacity-100" />

          <div className="absolute top-2 left-2 flex items-center gap-2">
            {rank && (
              <span className="inline-flex items-center justify-center h-6 min-w-[24px] rounded-full bg-black/70 text-white text-xs font-semibold px-2">
                #{rank}
              </span>
            )}
            {game.activePlayers && (
              <span className="inline-flex items-center gap-1 rounded-full bg-black/70 text-white text-[11px] px-2 py-0.5">
                <Users className="w-3 h-3" />
                {formatPlayers(game.activePlayers)}
              </span>
            )}
          </div>

          <div className="absolute inset-x-0 bottom-0 p-2.5 sm:p-3.5">
            {contextLabel && (
              <span className="mb-1.5 flex items-center gap-1 truncate text-[10px] font-medium text-blue-200/90">
                <Sparkles className="h-3 w-3 shrink-0" />
                <span className="truncate">{contextLabel}</span>
              </span>
            )}
            <h3 className="truncate text-sm font-semibold text-white transition-colors group-hover:text-blue-200">
              {game.title}
            </h3>
            {game.communityRating && (
              <span
                className={cn(
                  "mt-1 inline-flex items-center gap-1 text-xs",
                  getRatingColorClass(game.communityRating),
                )}
              >
                <Star className="w-3 h-3 fill-current" />
                {game.communityRating}%
              </span>
            )}
          </div>
        </div>
      </button>
    );
  }

  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "game-card group w-full text-left animate-fade-in",
        variant === "compact" && "aspect-[4/3]",
      )}
      style={{ animationDelay: `${index * 50}ms` }}
    >
      <div className="relative aspect-[460/215] overflow-hidden">
        <img
          src={game.image}
          alt={game.title}
          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
          loading="lazy"
          decoding="async"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-card via-transparent to-transparent opacity-60" />

        <div className="absolute inset-0 bg-primary/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

        <div className="absolute top-3 left-3 right-3 flex items-center justify-between">
          {game.genre && (
            <span className="px-2 py-1 text-[10px] font-medium uppercase tracking-wide bg-black/60 backdrop-blur-sm rounded-full text-foreground/80">
              {game.genre}
            </span>
          )}
          <div className="flex items-center gap-2">
            {game.discountPercent && (
              <span className="px-2 py-1 text-xs font-semibold bg-emerald-500/90 backdrop-blur-sm rounded-full text-white">
                -{game.discountPercent}%
              </span>
            )}
            {game.price && (
              <span className="px-2 py-1 text-xs font-semibold bg-primary/90 backdrop-blur-sm rounded-full text-primary-foreground">
                {isFreePrice(game.price) ? t("gameCard.free") : game.price}
              </span>
            )}
          </div>
        </div>
      </div>

      <div className="p-4">
        {contextLabel && (
          <span className="mb-2 flex items-center gap-1.5 text-[11px] font-medium text-primary">
            <Sparkles className="h-3.5 w-3.5 shrink-0" />
            <span className="truncate">{contextLabel}</span>
          </span>
        )}
        <h3 className="font-semibold text-sm md:text-base truncate group-hover:text-primary transition-colors">
          {game.title}
        </h3>

        <div className="flex items-center gap-4 mt-2">
          {game.activePlayers && (
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <Users className="w-3.5 h-3.5 text-primary" />
              <span>
                {formatPlayers(game.activePlayers)} {t("gameCard.playing")}
              </span>
            </div>
          )}
          {game.communityRating && (
            <div
              className={cn(
                "flex items-center gap-1.5 text-xs",
                getRatingColorClass(game.communityRating),
              )}
            >
              <Star className="w-3.5 h-3.5 fill-current" />
              <span>{game.communityRating}%</span>
            </div>
          )}
        </div>

        {game.discountPercent && game.priceOriginal && (
          <div className="mt-2 text-xs text-muted-foreground">
            <span className="mr-2 line-through">{game.priceOriginal}</span>
            <span className="text-emerald-400 font-semibold">{game.price}</span>
          </div>
        )}

        {game.short_description && variant === "default" && (
          <p className="mt-2 text-xs text-muted-foreground line-clamp-2">
            {game.short_description}
          </p>
        )}
      </div>
    </button>
  );
};

export default GameCard;
