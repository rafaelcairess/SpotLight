import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useFavoriteGame } from "@/hooks/useFavoriteGame";
import { useMaturePreference } from "@/hooks/useMaturePreference";
import { useUserGames } from "@/hooks/useUserGames";
import { useGamesByIds } from "@/hooks/useGames";
import { useUpdateProfile } from "@/hooks/useProfile";
import { useToast } from "@/hooks/use-toast";
import { isMatureGame } from "@/lib/matureFilter";

export function FavoriteGameShowcase({
  userId,
  appId,
  editable = false,
}: {
  userId?: string;
  appId?: number | null;
  editable?: boolean;
}) {
  const { data: favorite } = useFavoriteGame(userId, appId);
  const [showMature] = useMaturePreference();
  const [editing, setEditing] = useState(false);
  const { data: library = [] } = useUserGames(undefined, true, editable);
  const visibleLibrary = library.filter((entry) => !entry.is_private && !entry.is_hidden);
  const { data: choices = [] } = useGamesByIds(visibleLibrary.map((entry) => entry.app_id));
  const updateProfile = useUpdateProfile();
  const { toast } = useToast();
  const visibleFavorite = favorite && (showMature || !isMatureGame(favorite)) ? favorite : null;

  const choose = async (selectedAppId: number) => {
    try {
      await updateProfile.mutateAsync({ favorite_game_app_id: selectedAppId });
      toast({ title: "Jogo favorito atualizado." });
      setEditing(false);
    } catch (error) {
      toast({
        title: "Não foi possível atualizar o destaque.",
        description: error instanceof Error ? error.message : undefined,
        variant: "destructive",
      });
    }
  };

  if (!visibleFavorite && !editable) return null;

  return (
    <>
      <section className="overflow-hidden rounded-lg bg-black/15">
        <header className="flex items-center justify-between gap-3 border-b border-white/5 bg-primary/10 px-4 py-2.5">
          <h2 className="text-sm font-medium">Jogo favorito</h2>
          {editable && (
            <button
              type="button"
              onClick={() => setEditing(true)}
              className="text-xs text-muted-foreground underline underline-offset-2 hover:text-foreground"
            >
              Editar ou alterar destaque
            </button>
          )}
        </header>
        {visibleFavorite ? (
          <div className="p-4">
            <div className="flex flex-col gap-4 rounded-md bg-black/20 p-3 sm:flex-row sm:items-start">
              <img
                src={visibleFavorite.image}
                alt={visibleFavorite.title}
                className="aspect-[460/215] w-full rounded object-cover sm:w-44"
              />
              <div className="min-w-0 flex-1">
                <p className="truncate text-lg font-medium">{visibleFavorite.title}</p>
                {visibleFavorite.hoursPlayed != null && (
                  <div className="mt-5">
                    <p className="text-3xl font-light leading-none">
                      {visibleFavorite.hoursPlayed.toLocaleString("pt-BR", {
                        maximumFractionDigits: 1,
                      })}
                    </p>
                    <p className="mt-1 text-sm text-muted-foreground">Horas de jogo</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        ) : (
          <div className="p-6 text-center">
            <p className="text-sm text-muted-foreground">
              Escolha um jogo da sua biblioteca para destacar.
            </p>
            <Button size="sm" variant="outline" className="mt-3" onClick={() => setEditing(true)}>
              Escolher jogo
            </Button>
          </div>
        )}
      </section>

      <Dialog open={editing} onOpenChange={setEditing}>
        <DialogContent className="max-w-xl">
          <DialogHeader>
            <DialogTitle>Escolher jogo favorito</DialogTitle>
            <DialogDescription>Este jogo aparecerá como destaque no seu perfil.</DialogDescription>
          </DialogHeader>
          <div className="grid max-h-[55vh] gap-2 overflow-y-auto sm:grid-cols-2">
            {choices
              .filter((game) => showMature || !isMatureGame(game))
              .sort((a, b) => a.title.localeCompare(b.title))
              .map((game) => (
                <button
                  key={game.app_id}
                  type="button"
                  onClick={() => choose(game.app_id)}
                  disabled={updateProfile.isPending}
                  className={`flex items-center gap-3 rounded-lg border p-2 text-left hover:bg-secondary/50 ${game.app_id === appId ? "border-primary bg-primary/10" : "border-border/50"}`}
                >
                  <img src={game.image} alt="" className="h-12 w-20 rounded object-cover" />
                  <span className="min-w-0 truncate text-sm">{game.title}</span>
                </button>
              ))}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
