/**
 * Componente da feature profile.
 */

import { useMemo, useState } from "react";
import { Trophy, Clock, Trash2, MoreVertical, PencilLine, EyeOff, Eye, Lock, Unlock } from "lucide-react";
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
import { useMaturePreference } from "@/hooks/useMaturePreference";
import { isMatureGame } from "@/lib/matureFilter";

interface GameLibraryProps {
  games: UserGame[];
  isLoading: boolean;
  emptyMessage: string;
  readOnly?: boolean;
  highlightPlatinum?: boolean;
  cardTone?: "default" | "completed" | "dropped";
  showHidden?: boolean;
  onGameSelect?: (game: GameData) => void;
}

export function GameLibrary({
  games,
  isLoading,
  emptyMessage,
  readOnly = false,
  highlightPlatinum = false,
  showHidden = false,
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
  const [showMature] = useMaturePreference();
  const visibleGames = useMemo(
    () => showMature ? games : games.filter((entry) => {
      const details = gameMap.get(entry.app_id);
      return details ? !isMatureGame(details) : false;
    }),
    [games, gameMap, showMature]
  );

  const handleTogglePlatinum = async (game: UserGame) => {
    try {
      await updateGame.mutateAsync({
        id: game.id,
        updates: {
          is_platinumed: !game.is_platinumed,
          platinum_platforms: game.is_platinumed ? [] : ["steam"],
        },
      });
      toast({
        title: game.is_platinumed ? t("library.platinumRemoved") : t("library.platinumAdded"),
      });
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

  const handleHideGame = async (game: UserGame) => {
    try {
      await updateGame.mutateAsync({ id: game.id, updates: { is_hidden: true } });
      toast({ title: t("library.hideGameSuccess") });
    } catch {
      toast({ title: t("library.updateError"), variant: "destructive" });
    }
  };

  const handleShowGame = async (game: UserGame) => {
    try {
      await updateGame.mutateAsync({ id: game.id, updates: { is_hidden: false } });
      toast({ title: t("library.showGameSuccess") });
    } catch {
      toast({ title: t("library.updateError"), variant: "destructive" });
    }
  };

  const handleTogglePrivate = async (game: UserGame) => {
    try {
      await updateGame.mutateAsync({ id: game.id, updates: { is_private: !game.is_private } });
      toast({ title: game.is_private ? "Jogo visível no perfil." : "Jogo privado. Só você pode vê-lo." });
    } catch {
      toast({ title: t("library.updateError"), variant: "destructive" });
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

  if (visibleGames.length === 0) {
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
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {visibleGames.map((userGame) => {
          const gameInfo = gameMap.get(userGame.app_id);
          if (!gameInfo) return null;
          const handleSelect = () => onGameSelect?.(gameInfo);
          const effectiveHours = getEffectiveHours(userGame);
          const playtimeLabel = formatPlaytime(effectiveHours);
          const isManual = hasManualOverride(userGame);
          const coverImage = gameInfo.image || `https://cdn.cloudflare.steamstatic.com/steam/apps/${gameInfo.app_id}/header.jpg`;

          return (
            <div
              key={userGame.id}
              className={cn(
                "group overflow-hidden rounded-lg border border-white/5 bg-black/20 transition-all hover:border-primary/40 hover:bg-black/30",
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
            <div className="relative aspect-[460/215]">
              <img
                src={coverImage}
                alt={gameInfo.title}
                className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                loading="lazy"
                onError={(event) => {
                  event.currentTarget.src = getPosterImage(gameInfo.app_id);
                }}
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />

              <div className="absolute top-2 left-2 flex items-center gap-2">
                {userGame.is_private && <span className="inline-flex items-center gap-1 rounded-full bg-black/80 px-2 py-0.5 text-[10px] font-semibold text-white"><Lock className="h-3 w-3" />Privado</span>}
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
                          handleTogglePrivate(userGame);
                        }}
                      >
                        {userGame.is_private ? <Unlock className="w-4 h-4 mr-2" /> : <Lock className="w-4 h-4 mr-2" />}
                        {userGame.is_private ? "Tornar público" : "Marcar como privado"}
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
                      {showHidden ? (
                        <DropdownMenuItem
                          onClick={(event) => {
                            event.stopPropagation();
                            handleShowGame(userGame);
                          }}
                        >
                          <Eye className="w-4 h-4 mr-2" />
                          {t("library.showGame")}
                        </DropdownMenuItem>
                      ) : (
                        <DropdownMenuItem
                          onClick={(event) => {
                            event.stopPropagation();
                            handleHideGame(userGame);
                          }}
                        >
                          <EyeOff className="w-4 h-4 mr-2" />
                          {t("library.hideGame")}
                        </DropdownMenuItem>
                      )}
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

            <div className="flex items-center gap-3 p-3">
              <div className="min-w-0 flex-1">
                <h3 className="truncate text-sm font-semibold">{gameInfo.title}</h3>
                {playtimeLabel && <p className="mt-1 text-xs text-muted-foreground">{playtimeLabel}</p>}
              </div>
              {userGame.is_platinumed && <Trophy className="h-4 w-4 text-amber-500" />}
            </div>
          </div>
        );
        })}
      </div>
      {editDialog}
    </>
  );
}
