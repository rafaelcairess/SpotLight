/**
 * Componente da feature profile.
 */

import { useMemo, useState } from "react";
import { Heart, Trophy, Clock, Trash2, MoreVertical, PencilLine } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { UserGame, useUpdateGame, useRemoveGame } from "@/hooks/useUserGames";
import { useGamesByIds } from "@/hooks/useGames";
import { GameData } from "@/types/game";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";
import { useTranslation } from "react-i18next";
import { getPosterImage } from "@/lib/steam";
import { getEffectiveHours, hasManualOverride } from "@/lib/playtime";

interface GameLibraryProps {
  games: UserGame[];
  isLoading: boolean;
  emptyMessage: string;
  readOnly?: boolean;
  highlightPlatinum?: boolean;
  cardTone?: "default" | "completed" | "dropped";
  onGameSelect?: (game: GameData) => void;
}

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
  const { t } = useTranslation();
  const [editingGame, setEditingGame] = useState<UserGame | null>(null);
  const [manualHours, setManualHours] = useState("");
  const [manualOverride, setManualOverride] = useState(false);

  const statusLabels: Record<string, { label: string; color: string }> = {
    wishlist: { label: t("library.statusWishlist"), color: "bg-blue-500/10 text-blue-500" },
    playing: { label: t("library.statusPlaying"), color: "bg-emerald-500/10 text-emerald-500" },
    completed: { label: t("library.statusCompleted"), color: "bg-purple-500/10 text-purple-500" },
    dropped: { label: t("library.statusDropped"), color: "bg-rose-500/10 text-rose-500" },
  };

  const handleToggleFavorite = async (game: UserGame) => {
    try {
      await updateGame.mutateAsync({
        id: game.id,
        updates: { is_favorite: !game.is_favorite },
      });
      toast({
        title: game.is_favorite ? t("library.favoriteRemoved") : t("library.favoriteAdded"),
      });
    } catch (error) {
      toast({ title: t("library.updateError"), variant: "destructive" });
    }
  };

  const handleTogglePlatinum = async (game: UserGame) => {
    try {
      await updateGame.mutateAsync({
        id: game.id,
        updates: { is_platinumed: !game.is_platinumed },
      });
      toast({
        title: game.is_platinumed ? t("library.platinumRemoved") : t("library.platinumAdded"),
      });
    } catch (error) {
      toast({ title: t("library.updateError"), variant: "destructive" });
    }
  };

  const handleChangeStatus = async (game: UserGame, status: UserGame["status"]) => {
    try {
      await updateGame.mutateAsync({
        id: game.id,
        updates: { status },
      });
      toast({ title: t("library.statusChanged", { status: statusLabels[status].label }) });
    } catch (error) {
      toast({ title: t("library.updateError"), variant: "destructive" });
    }
  };

  const handleRemove = async (game: UserGame) => {
    try {
      await removeGame.mutateAsync(game.id);
      toast({ title: t("library.removeSuccess") });
    } catch (error) {
      toast({ title: t("library.removeError"), variant: "destructive" });
    }
  };

  const openEditHours = (game: UserGame) => {
    const baseValue =
      game.hours_override && typeof game.hours_played_manual === "number"
        ? game.hours_played_manual
        : typeof game.hours_played === "number"
          ? game.hours_played
          : null;

    setEditingGame(game);
    setManualOverride(Boolean(game.hours_override));
    setManualHours(baseValue !== null ? String(Math.round(baseValue * 10) / 10) : "");
  };

  const closeEditHours = () => {
    setEditingGame(null);
  };

  const handleSaveHours = async () => {
    if (!editingGame) return;

    if (manualOverride) {
      const parsed = Number(manualHours);
      if (!Number.isFinite(parsed) || parsed < 0) {
        toast({ title: t("library.manualHoursInvalid"), variant: "destructive" });
        return;
      }

      try {
        await updateGame.mutateAsync({
          id: editingGame.id,
          updates: {
            hours_override: true,
            hours_played_manual: parsed,
          },
        });
        toast({ title: t("library.manualHoursSaved") });
        closeEditHours();
      } catch {
        toast({ title: t("library.updateError"), variant: "destructive" });
      }
      return;
    }

    try {
      await updateGame.mutateAsync({
        id: editingGame.id,
        updates: {
          hours_override: false,
          hours_played_manual: null,
        },
      });
      toast({ title: t("library.manualHoursSaved") });
      closeEditHours();
    } catch {
      toast({ title: t("library.updateError"), variant: "destructive" });
    }
  };

  const formatPlaytime = (hours?: number | null) => {
    if (hours === null || hours === undefined || hours <= 0) return "";
    if (hours < 1) {
      const minutes = Math.max(1, Math.round(hours * 60));
      return t("library.playtimeMinute", { count: minutes });
    }
    if (hours === 1) return t("library.playtimeHour");
    return t("library.playtimeHours", { count: Math.round(hours) });
  };

  const editDialog = (
    <Dialog
      open={!!editingGame}
      onOpenChange={(open) => {
        if (!open) closeEditHours();
      }}
    >
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{t("library.editHoursTitle")}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div className="flex items-center justify-between rounded-lg border border-border/50 bg-secondary/20 px-3 py-2">
            <Label className="text-xs text-muted-foreground">{t("library.useManualHours")}</Label>
            <Switch checked={manualOverride} onCheckedChange={setManualOverride} />
          </div>

          <div className="space-y-2">
            <Label htmlFor="manualHours">{t("library.editHoursLabel")}</Label>
            <Input
              id="manualHours"
              type="number"
              min="0"
              step="0.1"
              value={manualHours}
              onChange={(event) => setManualHours(event.target.value)}
              placeholder={t("library.manualHoursPlaceholder")}
              disabled={!manualOverride}
            />
            <p className="text-xs text-muted-foreground">{t("library.editHoursHint")}</p>
          </div>

          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={closeEditHours}>
              {t("common.actions.cancel")}
            </Button>
            <Button onClick={handleSaveHours} disabled={updateGame.isPending}>
              {t("common.actions.save")}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );

  if (isLoading || catalogLoading) {
    return (
      <>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-4">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="animate-pulse">
              <div className="aspect-[2/3] bg-secondary rounded-xl" />
            </div>
          ))}
        </div>
        {editDialog}
      </>
    );
  }

  if (games.length === 0) {
    return (
      <>
        <div className="text-center py-12">
          <p className="text-muted-foreground">{emptyMessage}</p>
        </div>
        {editDialog}
      </>
    );
  }

  return (
    <>
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-4">
        {games.map((userGame) => {
          const gameInfo = gameMap.get(userGame.app_id);
          if (!gameInfo) return null;
          const handleSelect = () => onGameSelect?.(gameInfo);
          const effectiveHours = getEffectiveHours(userGame);
          const playtimeLabel = formatPlaytime(effectiveHours);
          const isManual = hasManualOverride(userGame);
          const portraitImage = getPosterImage(gameInfo.app_id);

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

              <div className="absolute top-2 left-2 flex items-center gap-2">
                {playtimeLabel && (
                  <span className="inline-flex items-center gap-1 rounded-full bg-black/70 text-white text-[11px] px-2 py-0.5">
                    <Clock className="w-3 h-3" />
                    {playtimeLabel}
                    {isManual && (
                      <span className="ml-1 text-[9px] uppercase tracking-wide text-white/70">
                        {t("library.playtimeManual")}
                      </span>
                    )}
                  </span>
                )}
              </div>
              {highlightPlatinum && userGame.is_platinumed && (
                <div className="absolute bottom-2 left-2 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide bg-amber-400 text-black rounded-full shadow">
                  {t("library.platinumBadge")}
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
                        {userGame.is_favorite
                          ? t("library.favoriteRemove")
                          : t("library.favoriteAdd")}
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
                        {userGame.is_platinumed
                          ? t("library.platinumRemove")
                          : t("library.platinumAdd")}
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onClick={(event) => {
                          event.stopPropagation();
                          openEditHours(userGame);
                        }}
                      >
                        <PencilLine className="w-4 h-4 mr-2" />
                        {t("library.editHours")}
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem
                        onClick={(event) => {
                          event.stopPropagation();
                          handleChangeStatus(userGame, "wishlist");
                        }}
                      >
                        {t("library.statusWishlist")}
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onClick={(event) => {
                          event.stopPropagation();
                          handleChangeStatus(userGame, "playing");
                        }}
                      >
                        {t("library.statusPlaying")}
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onClick={(event) => {
                          event.stopPropagation();
                          handleChangeStatus(userGame, "completed");
                        }}
                      >
                        {t("library.statusCompleted")}
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onClick={(event) => {
                          event.stopPropagation();
                          handleChangeStatus(userGame, "dropped");
                        }}
                      >
                        {t("library.statusDropped")}
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
                        {t("library.removeFromLibrary")}
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              )}
            </div>

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
      {editDialog}
    </>
  );
}
