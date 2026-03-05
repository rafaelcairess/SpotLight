import { Badge } from "@/components/ui/badge";
import { GameData } from "@/types/game";
import { getPosterImage } from "@/lib/steam";

interface GameModalHeaderProps {
  game: GameData;
}

export const GameModalHeader = ({ game }: GameModalHeaderProps) => {
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
        <div className="min-w-0">
          <h2 className="text-2xl md:text-3xl font-bold">{game.title}</h2>
          {game.genre && (
            <Badge variant="secondary" className="mt-2">
              {game.genre}
            </Badge>
          )}
        </div>
      </div>
    </div>
  );
};
