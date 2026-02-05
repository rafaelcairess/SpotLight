import { Users, Star, ExternalLink } from "lucide-react";
import { GameData } from "@/types/game";
import { cn } from "@/lib/utils";

interface GameCardProps {
  game: GameData;
  onClick?: () => void;
  index?: number;
  variant?: "default" | "compact" | "ranking";
  rank?: number;
}

const GameCard = ({
  game,
  onClick,
  index = 0,
  variant = "default",
  rank,
}: GameCardProps) => {
  const formatPlayers = (count?: number) => {
    if (!count) return null;
    if (count >= 1000000) return `${(count / 1000000).toFixed(1)}M`;
    if (count >= 1000) return `${(count / 1000).toFixed(1)}K`;
    return count.toString();
  };

  const getRatingColor = (rating?: number) => {
    if (!rating) return "text-muted-foreground";
    if (rating >= 80) return "rating-positive";
    if (rating >= 50) return "rating-mixed";
    return "rating-negative";
  };

  if (variant === "ranking") {
    return (
      <div
        onClick={onClick}
        className="game-card flex items-center gap-4 p-3 cursor-pointer group"
        style={{ animationDelay: `${index * 50}ms` }}
      >
        {/* Rank Number */}
        <div className="flex-shrink-0 w-8 text-center">
          <span
            className={cn(
              "text-2xl font-bold",
              rank === 1 && "text-gradient-accent",
              rank === 2 && "text-slate-300",
              rank === 3 && "text-amber-700",
              rank && rank > 3 && "text-muted-foreground"
            )}
          >
            {rank}
          </span>
        </div>

        {/* Game Image */}
        <div className="relative w-20 h-12 flex-shrink-0 rounded-md overflow-hidden">
          <img
            src={game.image}
            alt={game.title}
            className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-110"
            loading="lazy"
          />
        </div>

        {/* Game Info */}
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
                  getRatingColor(game.communityRating)
                )}
              >
                <Star className="w-3 h-3 fill-current" />
                {game.communityRating}%
              </span>
            )}
          </div>
        </div>

        {/* Arrow */}
        <ExternalLink className="w-4 h-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
      </div>
    );
  }

  return (
    <div
      onClick={onClick}
      className={cn(
        "game-card cursor-pointer group animate-fade-in",
        variant === "compact" && "aspect-[4/3]"
      )}
      style={{ animationDelay: `${index * 50}ms` }}
    >
      {/* Image Container */}
      <div className="relative aspect-[16/9] overflow-hidden">
        <img
          src={game.image}
          alt={game.title}
          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
          loading="lazy"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-card via-transparent to-transparent opacity-60" />

        {/* Hover Overlay */}
        <div className="absolute inset-0 bg-primary/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

        {/* Top Badges */}
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
                {game.price === "Free" || game.price === "0" ? "Grátis" : game.price}
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="p-4">
        <h3 className="font-semibold text-sm md:text-base truncate group-hover:text-primary transition-colors">
          {game.title}
        </h3>

        {/* Stats Row */}
        <div className="flex items-center gap-4 mt-2">
          {game.activePlayers && (
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <Users className="w-3.5 h-3.5 text-primary" />
              <span>{formatPlayers(game.activePlayers)} jogando</span>
            </div>
          )}
          {game.communityRating && (
            <div
              className={cn(
                "flex items-center gap-1.5 text-xs",
                getRatingColor(game.communityRating)
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

        {/* Description Preview */}
        {game.short_description && variant === "default" && (
          <p className="mt-2 text-xs text-muted-foreground line-clamp-2">
            {game.short_description}
          </p>
        )}
      </div>
    </div>
  );
};

export default GameCard;
