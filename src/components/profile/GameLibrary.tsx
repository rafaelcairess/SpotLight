import { useMemo } from "react";
import { Heart, Trophy, Clock, Trash2, MoreVertical } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { UserGame, useUpdateGame, useRemoveGame } from "@/hooks/useUserGames";
import { useGamesByIds } from "@/hooks/useGames";
import { GameData } from "@/types/game";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";

interface GameLibraryProps {
  games: UserGame[];
  isLoading: boolean;
  emptyMessage: string;
  readOnly?: boolean;
  highlightPlatinum?: boolean;
  cardTone?: "default" | "completed" | "dropped";
  onGameSelect?: (game: GameData) => void;
}

const statusLabels: Record<string, { label: string; color: string }> = {
  wishlist: { label: "Lista de Desejos", color: "bg-blue-500/10 text-blue-500" },
  playing: { label: "Jogando", color: "bg-emerald-500/10 text-emerald-500" },
  completed: { label: "Completado", color: "bg-purple-500/10 text-purple-500" },
  dropped: { label: "Abandonado", color: "bg-rose-500/10 text-rose-500" },
};

const cardToneStyles: Record<NonNullable<GameLibraryProps["cardTone"]>, string> = {
  default: "border-white/5 bg-card/40",
  completed: "border-emerald-500/20 bg-emerald-500/5",
  dropped: "border-rose-500/20 bg-rose-500/5",
};

export function GameLibrary({
  games,
  isLoading,
  emptyMessage,
  readOnly = false,
  highlightPlatinum = false,
  cardTone = "default",
  onGameSelect,
}: GameLibraryProps) {
  const { toast } = useToast();
  const updateGame = useUpdateGame();
  const removeGame = useRemoveGame();
  const appIds = games.map((game) => game.app_id);
  const { data: catalogGames = [], isLoading: catalogLoading } = useGamesByIds(appIds);
  const gameMap = useMemo(
    () => new Map(catalogGames.map((game) => [game.app_id, game])),
    [catalogGames]
  );

  const handleToggleFavorite = async (game: UserGame) => {
    try {
      await updateGame.mutateAsync({
        id: game.id,
        updates: { is_favorite: !game.is_favorite },
      });
      toast({
        title: game.is_favorite ? "Removido dos favoritos" : "Adicionado aos favoritos",
      });
    } catch (error) {
      toast({ title: "Erro ao atualizar", variant: "destructive" });
    }
  };

  const handleTogglePlatinum = async (game: UserGame) => {
    try {
      await updateGame.mutateAsync({
        id: game.id,
        updates: { is_platinumed: !game.is_platinumed },
      });
      toast({
        title: game.is_platinumed ? "Platina removida" : "Platina conquistada! 🏆",
      });
    } catch (error) {
      toast({ title: "Erro ao atualizar", variant: "destructive" });
    }
  };

  const handleChangeStatus = async (game: UserGame, status: UserGame["status"]) => {
    try {
      await updateGame.mutateAsync({
        id: game.id,
        updates: { status },
      });
      toast({ title: `Status alterado para "${statusLabels[status].label}"` });
    } catch (error) {
      toast({ title: "Erro ao atualizar", variant: "destructive" });
    }
  };

  const handleRemove = async (game: UserGame) => {
    try {
      await removeGame.mutateAsync(game.id);
      toast({ title: "Jogo removido da biblioteca" });
    } catch (error) {
      toast({ title: "Erro ao remover", variant: "destructive" });
    }
  };

  const formatPlaytime = (hours?: number | null) => {
    if (hours === null || hours === undefined || hours <= 0) return "";
    if (hours < 1) {
      const minutes = Math.max(1, Math.round(hours * 60));
      return `${minutes} min`;
    }
    if (hours === 1) return "1 hora";
    return `${Math.round(hours)} horas`;
  };

  const getPortraitImage = (appId: number, fallback: string) =>
    `https://cdn.cloudflare.steamstatic.com/steam/apps/${appId}/library_600x900.jpg`;

  if (isLoading || catalogLoading) {
    return (
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-4">
        {[...Array(6)].map((_, i) => (
          <div key={i} className="animate-pulse">
            <div className="aspect-[2/3] bg-secondary rounded-xl" />
          </div>
        ))}
      </div>
    );
  }

  if (games.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground">{emptyMessage}</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-4">
      {games.map((userGame) => {
        const gameInfo = gameMap.get(userGame.app_id);
        if (!gameInfo) return null;
        const handleSelect = () => onGameSelect?.(gameInfo);
        const playtimeLabel = formatPlaytime(userGame.hours_played);
        const portraitImage = getPortraitImage(gameInfo.app_id, gameInfo.image);

        return (
          <div
            key={userGame.id}
            className={cn(
              "group relative rounded-xl overflow-hidden border hover:border-primary/40 transition-all",
              cardToneStyles[cardTone],
              highlightPlatinum &&
                userGame.is_platinumed &&
                "ring-2 ring-amber-400/40 shadow-[0_0_20px_rgba(251,191,36,0.35)]"
            )}
            onClick={onGameSelect ? handleSelect : undefined}
            role={onGameSelect ? "button" : undefined}
            tabIndex={onGameSelect ? 0 : undefined}
            onKeyDown={
              onGameSelect
                ? (event) => {
                    if (event.key === "Enter" || event.key === " ") {
                      event.preventDefault();
                      handleSelect();
                    }
                  }
                : undefined
            }
          >
            {/* Image */}
            <div className="aspect-[2/3] relative">
              <img
                src={portraitImage}
                alt={gameInfo.title}
                className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                loading="lazy"
                onError={(event) => {
                  const target = event.currentTarget;
                  if (target.src !== gameInfo.image) {
                    target.src = gameInfo.image;
                  }
                }}
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />

              {/* Badges */}
              <div className="absolute top-2 left-2 flex items-center gap-2">
                {playtimeLabel && (
                  <span className="inline-flex items-center gap-1 rounded-full bg-black/70 text-white text-[11px] px-2 py-0.5">
                    <Clock className="w-3 h-3" />
                    {playtimeLabel}
                  </span>
                )}
              </div>
              {highlightPlatinum && userGame.is_platinumed && (
                <div className="absolute bottom-2 left-2 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide bg-amber-400 text-black rounded-full shadow">
                  Platina
                </div>
              )}
              <div className="absolute bottom-12 right-2 flex items-center gap-1">
                {userGame.is_favorite && (
                  <div className="p-1.5 rounded-full bg-rose-500/90">
                    <Heart className="w-3 h-3 fill-current text-white" />
                  </div>
                )}
                {userGame.is_platinumed && (
                  <div className="p-1.5 rounded-full bg-amber-500/90">
                    <Trophy className="w-3 h-3 text-white" />
                  </div>
                )}
              </div>

              {/* Actions Menu */}
              {!readOnly && (
                <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button
                        variant="secondary"
                        size="icon"
                        className="h-8 w-8"
                        onClick={(event) => event.stopPropagation()}
                      >
                        <MoreVertical className="w-4 h-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem
                        onClick={(event) => {
                          event.stopPropagation();
                          handleToggleFavorite(userGame);
                        }}
                      >
                        <Heart
                          className={cn(
                            "w-4 h-4 mr-2",
                            userGame.is_favorite && "fill-current text-rose-500"
                          )}
                        />
                        {userGame.is_favorite ? "Remover dos Favoritos" : "Adicionar aos Favoritos"}
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onClick={(event) => {
                          event.stopPropagation();
                          handleTogglePlatinum(userGame);
                        }}
                      >
                        <Trophy
                          className={cn(
                            "w-4 h-4 mr-2",
                            userGame.is_platinumed && "text-amber-500"
                          )}
                        />
                        {userGame.is_platinumed ? "Remover Platina" : "Marcar como Platinado"}
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem
                        onClick={(event) => {
                          event.stopPropagation();
                          handleChangeStatus(userGame, "wishlist");
                        }}
                      >
                        Lista de Desejos
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onClick={(event) => {
                          event.stopPropagation();
                          handleChangeStatus(userGame, "playing");
                        }}
                      >
                        Jogando
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onClick={(event) => {
                          event.stopPropagation();
                          handleChangeStatus(userGame, "completed");
                        }}
                      >
                        Completado
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onClick={(event) => {
                          event.stopPropagation();
                          handleChangeStatus(userGame, "dropped");
                        }}
                      >
                        Abandonado
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem
                        onClick={(event) => {
                          event.stopPropagation();
                          handleRemove(userGame);
                        }}
                        className="text-destructive"
                      >
                        <Trash2 className="w-4 h-4 mr-2" />
                        Remover da Biblioteca
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              )}
            </div>

            {/* Info */}
            <div className="absolute inset-x-0 bottom-0 p-3">
              <div className="flex items-end justify-between gap-2">
                <div className="min-w-0">
                  <h3 className="text-sm font-semibold text-white truncate">{gameInfo.title}</h3>
                  <p className="text-[11px] text-white/70 truncate">{statusLabels[userGame.status].label}</p>
                </div>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
