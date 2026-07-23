import { useMemo, useState } from "react";
import { Check, Pencil } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useGamesByIds } from "@/hooks/useGames";
import { useMaturePreference } from "@/hooks/useMaturePreference";
import { usePlatinumShowcase } from "@/hooks/usePlatinumShowcase";
import { useUpdateProfile } from "@/hooks/useProfile";
import { useToast } from "@/hooks/use-toast";
import { isMatureGame } from "@/lib/matureFilter";
import {
  PlatformChoices,
  PlatformLogo,
} from "@/features/profile/components/PlatinumPlatformSelector";
import { PlatinumPlatform, useUpdateGame } from "@/hooks/useUserGames";

interface PlatinumShowcaseProps {
  userId?: string;
  selectedAppIds?: number[] | null;
  editable?: boolean;
  onViewAll?: () => void;
}

export function PlatinumShowcase({
  userId,
  selectedAppIds,
  editable = false,
  onViewAll,
}: PlatinumShowcaseProps) {
  const { data: entries = [] } = usePlatinumShowcase(userId);
  const { data: games = [] } = useGamesByIds(entries.map((entry) => entry.app_id));
  const [showMature] = useMaturePreference();
  const [editing, setEditing] = useState(false);
  const [selection, setSelection] = useState<number[]>([]);
  const [platformSelections, setPlatformSelections] = useState<Record<number, PlatinumPlatform>>(
    {},
  );
  const updateProfile = useUpdateProfile();
  const updateGame = useUpdateGame();
  const { toast } = useToast();

  const availableGames = useMemo(
    () => games.filter((game) => showMature || !isMatureGame(game)),
    [games, showMature],
  );
  const chosenIds = selectedAppIds?.length
    ? selectedAppIds
    : entries.slice(0, 6).map((entry) => entry.app_id);
  const order = new Map(chosenIds.map((appId, index) => [appId, index]));
  const visibleGames = availableGames
    .filter((game) => order.has(game.app_id))
    .sort((a, b) => (order.get(a.app_id) ?? 0) - (order.get(b.app_id) ?? 0))
    .slice(0, 6);
  const entriesById = new Map(entries.map((entry) => [entry.app_id, entry]));

  if (!availableGames.length) return null;

  const openEditor = () => {
    setSelection(visibleGames.map((game) => game.app_id));
    setPlatformSelections(
      Object.fromEntries(
        entries.map((entry) => [
          entry.app_id,
          (entry.platinum_platforms?.[0] || "steam") as PlatinumPlatform,
        ]),
      ),
    );
    setEditing(true);
  };

  const toggle = (appId: number) =>
    setSelection((current) =>
      current.includes(appId)
        ? current.filter((id) => id !== appId)
        : current.length < 6
          ? [...current, appId]
          : current,
    );

  const save = async () => {
    if (!selection.length) return;
    try {
      await Promise.all(
        selection.map((appId) => {
          const entry = entriesById.get(appId);
          if (!entry?.id) return Promise.resolve();
          return updateGame.mutateAsync({
            id: entry.id,
            updates: { platinum_platforms: [platformSelections[appId] || "steam"] },
          });
        }),
      );
      await updateProfile.mutateAsync({ platinum_showcase_app_ids: selection });
      toast({ title: "Destaque de platinados atualizado." });
      setEditing(false);
    } catch (error) {
      toast({
        title: "Não foi possível salvar o destaque.",
        description: error instanceof Error ? error.message : undefined,
        variant: "destructive",
      });
    }
  };

  const gridClass =
    visibleGames.length === 1
      ? "grid-cols-1"
      : visibleGames.length === 2
        ? "sm:grid-cols-2"
        : visibleGames.length === 4
          ? "sm:grid-cols-2"
          : "sm:grid-cols-2 lg:grid-cols-3";

  return (
    <>
      <section className="overflow-hidden rounded-lg bg-black/15">
        <header className="flex items-center justify-between gap-3 border-b border-white/5 bg-primary/10 px-4 py-2.5">
          <h2 className="text-sm font-medium">Jogos platinados</h2>
          <div className="flex items-center gap-3">
            {editable && (
              <button
                type="button"
                onClick={openEditor}
                className="inline-flex items-center gap-1 text-xs underline underline-offset-2 hover:text-primary"
              >
                <Pencil className="h-3 w-3" />
                Editar ou alterar destaque
              </button>
            )}
            {onViewAll && (
              <button
                type="button"
                onClick={onViewAll}
                className="text-xs text-muted-foreground underline underline-offset-2 hover:text-foreground"
              >
                Ver todos
              </button>
            )}
          </div>
        </header>
        <div className={`grid gap-3 p-4 ${gridClass}`}>
          {visibleGames.map((game) => {
            const entry = entriesById.get(game.app_id);
            return (
              <article
                key={game.app_id}
                className={`overflow-hidden rounded-md border border-amber-300/25 bg-black/20 shadow-[0_0_16px_rgba(251,191,36,0.12)] ${visibleGames.length === 1 ? "flex items-center" : ""}`}
              >
                <img
                  src={game.image}
                  alt=""
                  className={
                    visibleGames.length === 1
                      ? "aspect-[460/215] w-2/5 object-cover"
                      : "aspect-[460/215] w-full object-cover"
                  }
                />
                <div className="min-w-0 p-3">
                  <h3 className="truncate text-sm font-medium">{game.title}</h3>
                  {entry?.hours_played != null && (
                    <p className="mt-1 text-xs text-muted-foreground">
                      {entry.hours_played.toLocaleString("pt-BR", { maximumFractionDigits: 1 })}{" "}
                      horas
                    </p>
                  )}
                  {!!entry?.platinum_platforms?.[0] && (
                    <div className="mt-2">
                      <PlatformLogo platform={entry.platinum_platforms[0]} />
                    </div>
                  )}
                </div>
              </article>
            );
          })}
        </div>
      </section>

      <Dialog open={editing} onOpenChange={setEditing}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Editar jogos em destaque</DialogTitle>
            <DialogDescription>
              Escolha de 1 a 6 jogos platinados. A ordem de seleção será usada na vitrine.
            </DialogDescription>
          </DialogHeader>
          <div className="grid max-h-[55vh] gap-2 overflow-y-auto sm:grid-cols-2">
            {availableGames.map((game) => {
              const selected = selection.includes(game.app_id);
              return (
                <div
                  key={game.app_id}
                  className={`rounded-lg border p-2 ${selected ? "border-amber-300/40 bg-amber-300/5" : "border-border/50"}`}
                >
                  <button
                    type="button"
                    onClick={() => toggle(game.app_id)}
                    className="flex w-full items-center gap-3 text-left"
                  >
                    <img src={game.image} alt="" className="h-12 w-20 rounded object-cover" />
                    <span className="min-w-0 flex-1 truncate text-sm">{game.title}</span>
                    {selected && <Check className="h-4 w-4 text-amber-300" />}
                  </button>
                  {selected && (
                    <div className="mt-2 border-t border-white/5 pt-2">
                      <PlatformChoices
                        value={platformSelections[game.app_id] || "steam"}
                        onChange={(platform) =>
                          setPlatformSelections((current) => ({
                            ...current,
                            [game.app_id]: platform,
                          }))
                        }
                      />
                    </div>
                  )}
                </div>
              );
            })}
          </div>
          <div className="flex items-center justify-between gap-3">
            <span className="text-xs text-muted-foreground">{selection.length}/6 selecionados</span>
            <Button onClick={save} disabled={!selection.length || updateProfile.isPending}>
              {updateProfile.isPending ? "Salvando..." : "Salvar destaque"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
