import { Star } from "lucide-react";
import { useFavoriteGame } from "@/hooks/useFavoriteGame";

export function FavoriteGameShowcase({ userId, appId }: { userId?: string; appId?: number | null }) {
  const { data: favorite } = useFavoriteGame(userId, appId);

  if (!favorite) return null;

  return (
    <section className="overflow-hidden rounded-xl border border-border/50 bg-card/70">
      <header className="flex items-center gap-2 px-5 py-4">
        <Star className="h-4 w-4 fill-current text-amber-400" />
        <h2 className="font-semibold">Jogo favorito</h2>
      </header>
      <div className="relative aspect-[16/6] overflow-hidden">
        <img src={favorite.image} alt={favorite.title} className="h-full w-full object-cover" />
        <div className="absolute inset-0 bg-gradient-to-t from-black via-black/20 to-transparent" />
        <div className="absolute inset-x-0 bottom-0 p-5">
          <p className="text-lg font-bold text-white">{favorite.title}</p>
          <p className="text-xs text-white/70">{favorite.genre || "Em destaque no perfil"}</p>
        </div>
      </div>
    </section>
  );
}
