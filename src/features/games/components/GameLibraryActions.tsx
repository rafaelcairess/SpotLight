import { BookOpen, Check, Loader2, Plus, Trash2, Trophy } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import { useUserGameByAppId, useAddGame, useUpdateGame, useRemoveGame } from "@/hooks/useUserGames";
import { useToast } from "@/hooks/use-toast";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";

interface GameLibraryActionsProps {
  appId: number;
  onWriteReview?: () => void;
}

export function GameLibraryActions({ appId, onWriteReview }: GameLibraryActionsProps) {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { data: userGame, isLoading } = useUserGameByAppId(appId);
  const addGame = useAddGame();
  const updateGame = useUpdateGame();
  const removeGame = useRemoveGame();
  const { t } = useTranslation();
  const busy = isLoading || addGame.isPending || updateGame.isPending || removeGame.isPending;

  const addToLibrary = async () => {
    if (!user) return navigate("/auth");
    try {
      await addGame.mutateAsync({ appId, status: "playing" });
      toast({ title: t("library.added") });
    } catch {
      toast({ title: t("library.updateError"), variant: "destructive" });
    }
  };

  const togglePlatinum = async () => {
    if (!userGame) return;
    try {
      await updateGame.mutateAsync({
        id: userGame.id,
        updates: {
          is_platinumed: !userGame.is_platinumed,
          platinum_platforms: userGame.is_platinumed ? [] : ["steam"],
        },
      });
    } catch {
      toast({ title: t("library.updateError"), variant: "destructive" });
    }
  };

  const remove = async () => {
    if (!userGame || !window.confirm("Remover este jogo da sua biblioteca?")) return;
    try {
      await removeGame.mutateAsync(userGame.id);
      toast({ title: t("library.removeSuccess") });
    } catch {
      toast({ title: t("library.removeError"), variant: "destructive" });
    }
  };

  return (
    <div className="flex flex-wrap items-center gap-2 rounded-lg border border-border/40 bg-black/10 p-3">
      {!userGame ? (
        <Button onClick={addToLibrary} disabled={busy} className="gap-2">
          {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
          Adicionar à biblioteca
        </Button>
      ) : (
        <span className="inline-flex h-9 items-center gap-2 rounded-md bg-emerald-500/10 px-3 text-sm text-emerald-400">
          <Check className="h-4 w-4" /> Na biblioteca
        </span>
      )}

      {userGame && <Button variant={userGame.is_platinumed ? "secondary" : "outline"} onClick={togglePlatinum} disabled={busy} className="gap-2"><Trophy className={`h-4 w-4 ${userGame.is_platinumed ? "text-amber-400" : ""}`} />{userGame.is_platinumed ? "Platinado" : "Marcar como platinado"}</Button>}
      {onWriteReview && <Button variant="outline" onClick={onWriteReview} disabled={busy} className="gap-2 border-primary/40 text-primary hover:bg-primary/10"><BookOpen className="h-4 w-4" />Escrever avaliação</Button>}
      {userGame && <Button variant="ghost" onClick={remove} disabled={busy} className="ml-auto gap-2 text-destructive hover:bg-destructive/10 hover:text-destructive"><Trash2 className="h-4 w-4" />Remover</Button>}
    </div>
  );
}
