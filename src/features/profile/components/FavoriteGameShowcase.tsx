import { useMemo, useState } from "react";
import { Settings, Star } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { useFavoriteGame } from "@/hooks/useFavoriteGame";
import { useUserGames } from "@/hooks/useUserGames";
import { useGamesByIds } from "@/hooks/useGames";
import { useUpdateProfile } from "@/hooks/useProfile";
import { getPosterImage } from "@/lib/steam";

export function FavoriteGameShowcase({ userId, appId, editable = false }: { userId?: string; appId?: number | null; editable?: boolean }) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const { data: favorite } = useFavoriteGame(userId, appId);
  const { data: library = [] } = useUserGames(undefined, true, editable && open);
  const visibleLibrary = useMemo(() => library.filter((game) => !game.is_private), [library]);
  const { data: catalog = [] } = useGamesByIds(visibleLibrary.map((game) => game.app_id));
  const filtered = catalog.filter((game) => game.title.toLowerCase().includes(search.toLowerCase())).slice(0, 30);
  const updateProfile = useUpdateProfile();
  const select = async (selectedAppId: number | null) => { await updateProfile.mutateAsync({ favorite_game_app_id: selectedAppId }); setOpen(false); setSearch(""); };

  return <section className="overflow-hidden rounded-2xl border border-border/50 bg-card/70">
    <header className="flex items-center justify-between px-5 py-4"><div className="flex items-center gap-2"><Star className="h-4 w-4 fill-current text-amber-400" /><h2 className="font-semibold">Jogo favorito</h2></div>{editable && <Button variant="ghost" size="icon" onClick={() => setOpen(true)} aria-label="Configurar jogo favorito"><Settings className="h-4 w-4" /></Button>}</header>
    {favorite ? <div className="relative aspect-[16/7] overflow-hidden"><img src={favorite.image} alt={favorite.title} className="h-full w-full object-cover" /><div className="absolute inset-0 bg-gradient-to-t from-black via-black/20 to-transparent" /><div className="absolute inset-x-0 bottom-0 p-5"><p className="text-lg font-bold text-white">{favorite.title}</p><p className="text-xs text-white/70">{favorite.genre || "Em destaque no perfil"}</p></div></div> : <div className="px-5 pb-5 text-sm text-muted-foreground">{editable ? "Escolha um jogo da sua biblioteca para destacar." : "Nenhum jogo favorito escolhido."}</div>}
    {editable && <Dialog open={open} onOpenChange={setOpen}><DialogContent><DialogHeader><DialogTitle>Escolher jogo favorito</DialogTitle></DialogHeader><Input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Buscar na sua biblioteca..." /><div className="max-h-80 space-y-2 overflow-y-auto">{appId && <Button variant="outline" size="sm" onClick={() => select(null)}>Remover destaque</Button>}{filtered.map((game) => <button key={game.app_id} onClick={() => select(game.app_id)} className="flex w-full items-center gap-3 rounded-lg border border-border/40 p-2 text-left hover:border-primary/40"><img src={getPosterImage(game.app_id)} alt="" className="h-14 w-10 rounded object-cover" /><span className="text-sm font-medium">{game.title}</span></button>)}</div></DialogContent></Dialog>}
  </section>;
}
