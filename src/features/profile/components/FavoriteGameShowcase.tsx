import { useFavoriteGame } from "@/hooks/useFavoriteGame";
import { useMaturePreference } from "@/hooks/useMaturePreference";
import { isMatureGame } from "@/lib/matureFilter";

export function FavoriteGameShowcase({ userId, appId }: { userId?: string; appId?: number | null }) {
  const { data: favorite } = useFavoriteGame(userId, appId);
  const [showMature] = useMaturePreference();

  if (!favorite || (!showMature && isMatureGame(favorite))) return null;

  return (
    <section className="overflow-hidden rounded-lg bg-black/15">
      <header className="border-b border-white/5 bg-primary/10 px-4 py-2.5">
        <h2 className="text-sm font-medium">Jogo favorito</h2>
      </header>
      <div className="p-4">
        <div className="flex flex-col gap-4 rounded-md bg-black/20 p-3 sm:flex-row sm:items-start">
          <img src={favorite.image} alt={favorite.title} className="aspect-[460/215] w-full rounded object-cover sm:w-44" />
          <div className="min-w-0 flex-1">
            <p className="truncate text-lg font-medium">{favorite.title}</p>
            {favorite.hoursPlayed != null && (
              <div className="mt-5">
                <p className="text-3xl font-light leading-none">{favorite.hoursPlayed.toLocaleString("pt-BR", { maximumFractionDigits: 1 })}</p>
                <p className="mt-1 text-sm text-muted-foreground">Horas de jogo</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
