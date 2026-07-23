import { useState } from "react";
import { Loader2, Search } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { useSearchGames } from "@/hooks/useGames";
import { PlatinumPlatform, useMarkGamePlatinum } from "@/hooks/useUserGames";
import { useToast } from "@/hooks/use-toast";
import { PlatformChoices } from "@/features/profile/components/PlatinumPlatformSelector";

export function PlatinumGamePicker({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const [search, setSearch] = useState("");
  const [platform, setPlatform] = useState<PlatinumPlatform>("steam");
  const { data: games = [], isLoading } = useSearchGames(search, 20);
  const markPlatinum = useMarkGamePlatinum();
  const { toast } = useToast();

  const selectGame = async (appId: number, title: string) => {
    try {
      await markPlatinum.mutateAsync({ appId, platform });
      toast({ title: `${title} foi adicionado aos platinados.` });
      onOpenChange(false);
      setSearch("");
    } catch (error) {
      toast({
        title: "Não foi possível adicionar o jogo.",
        description: error instanceof Error ? error.message : undefined,
        variant: "destructive",
      });
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-xl">
        <DialogHeader>
          <DialogTitle>Adicionar jogo platinado</DialogTitle>
          <DialogDescription>
            Busque qualquer jogo da Steam. Ele não precisa estar na sua biblioteca do SpotLight.
          </DialogDescription>
        </DialogHeader>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Digite o nome do jogo..."
            className="pl-9"
            autoFocus
          />
        </div>
        <PlatformChoices value={platform} onChange={setPlatform} />
        <div className="max-h-80 space-y-2 overflow-y-auto">
          {isLoading && (
            <div className="flex justify-center py-8">
              <Loader2 className="h-5 w-5 animate-spin" />
            </div>
          )}
          {!isLoading && search.trim().length >= 2 && games.length === 0 && (
            <p className="py-8 text-center text-sm text-muted-foreground">
              Nenhum jogo encontrado.
            </p>
          )}
          {games.map((game) => (
            <button
              key={game.app_id}
              type="button"
              disabled={markPlatinum.isPending}
              onClick={() => selectGame(game.app_id, game.title)}
              className="flex w-full items-center gap-3 rounded-lg border border-amber-300/20 p-2 text-left shadow-[0_0_12px_rgba(251,191,36,0.08)] transition hover:border-amber-300/40 hover:bg-secondary/60 disabled:opacity-50"
            >
              <img
                src={
                  game.image ||
                  `https://cdn.cloudflare.steamstatic.com/steam/apps/${game.app_id}/header.jpg`
                }
                alt=""
                className="h-12 w-20 rounded object-cover"
              />
              <span className="min-w-0 flex-1 truncate text-sm font-medium">{game.title}</span>
            </button>
          ))}
        </div>
      </DialogContent>
    </Dialog>
  );
}
