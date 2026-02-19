import { useEffect, useMemo, useState } from "react";
import { ArrowRight, Check, Sparkles } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/contexts/AuthContext";
import { onboardingContent } from "@/data/onboarding";
import { useSearchGames } from "@/hooks/useGames";
import { useEnsureFavoriteGame } from "@/hooks/useUserGames";
import { useToast } from "@/hooks/use-toast";

const STORAGE_KEY = "spotlight.onboarding.v1";

const STEP_TITLES = [
  onboardingContent.intro.title,
  onboardingContent.howToUse.title,
  onboardingContent.favorites.title,
];

export default function OnboardingModal() {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const ensureFavorite = useEnsureFavoriteGame();

  const [open, setOpen] = useState(false);
  const [step, setStep] = useState(0);
  const [search, setSearch] = useState("");
  const [selectedGames, setSelectedGames] = useState<
    { app_id: number; title: string; image?: string; genre?: string }[]
  >([]);

  const { data: results = [], isLoading: searchLoading } = useSearchGames(search, 20);

  useEffect(() => {
    if (loading) return;
    if (typeof window === "undefined") return;
    const done = window.localStorage.getItem(STORAGE_KEY);
    if (done !== "done") {
      setOpen(true);
    }
  }, [loading]);

  const selectedIds = useMemo(
    () => selectedGames.map((game) => game.app_id),
    [selectedGames]
  );
  const selectedMap = useMemo(() => new Set(selectedIds), [selectedIds]);

  const closeOnboarding = () => {
    if (typeof window !== "undefined") {
      window.localStorage.setItem(STORAGE_KEY, "done");
    }
    setOpen(false);
  };

  const handleToggleGame = (appId: number) => {
    if (selectedMap.has(appId)) {
      setSelectedGames((prev) => prev.filter((game) => game.app_id !== appId));
      return;
    }
    if (selectedIds.length >= 3) return;
    const game = results.find((item) => item.app_id === appId);
    if (!game) return;
    setSelectedGames((prev) => [
      ...prev,
      { app_id: game.app_id, title: game.title, image: game.image, genre: game.genre },
    ]);
  };

  const handleFinish = async () => {
    if (user && selectedIds.length > 0) {
      try {
        for (const appId of selectedIds) {
          await ensureFavorite.mutateAsync(appId);
        }
        toast({ title: "Favoritos salvos!" });
      } catch (error) {
        toast({ title: "Não foi possível salvar favoritos", variant: "destructive" });
      }
    }
    closeOnboarding();
  };

  const renderStep = () => {
    if (step === 0) {
      return (
        <div className="space-y-4">
          <p className="text-sm text-muted-foreground">
            {onboardingContent.intro.description}
          </p>
          <div className="rounded-lg border border-border/40 bg-secondary/30 p-4 space-y-3">
            <h4 className="text-sm font-semibold">{onboardingContent.roadmap.title}</h4>
            <ul className="text-sm text-muted-foreground space-y-1">
              {onboardingContent.roadmap.items.map((item) => (
                <li key={item}>• {item}</li>
              ))}
            </ul>
          </div>
        </div>
      );
    }

    if (step === 1) {
      return (
        <div className="space-y-4">
          <div className="grid gap-3 sm:grid-cols-2">
            {onboardingContent.howToUse.items.map((item) => (
              <div
                key={item.title}
                className="rounded-lg border border-border/40 bg-secondary/30 p-3"
              >
                <p className="text-sm font-semibold">{item.title}</p>
                <p className="text-xs text-muted-foreground">{item.description}</p>
              </div>
            ))}
          </div>
          <div className="rounded-lg border border-border/40 bg-secondary/30 p-4 space-y-2">
            <h4 className="text-sm font-semibold">{onboardingContent.roadmap.title}</h4>
            <div className="flex flex-wrap gap-2">
              {onboardingContent.roadmap.items.map((item) => (
                <Badge key={item} variant="secondary">
                  {item}
                </Badge>
              ))}
            </div>
          </div>
        </div>
      );
    }

    return (
      <div className="space-y-4">
        <p className="text-sm text-muted-foreground">
          {onboardingContent.favorites.description}
        </p>

        {!user && (
          <div className="rounded-lg border border-border/40 bg-secondary/30 p-4 space-y-3">
            <p className="text-sm text-muted-foreground">
              Entre na sua conta para escolher seus favoritos.
            </p>
            <Button onClick={() => navigate("/auth")}>Entrar</Button>
          </div>
        )}

        <div className="space-y-2">
          <Input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Buscar jogos..."
            disabled={!user}
          />
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <span>Escolha até 3 jogos.</span>
            <span>{selectedIds.length}/3</span>
          </div>
        </div>

        {selectedGames.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {selectedGames.map((game) => {
              return (
                <Badge key={game.app_id} variant="secondary" className="gap-2">
                  {game.title}
                  <button
                    type="button"
                    onClick={() => handleToggleGame(game.app_id)}
                    className="text-xs"
                  >
                    x
                  </button>
                </Badge>
              );
            })}
          </div>
        )}

        <div className="max-h-64 space-y-2 overflow-auto pr-1">
          {search.trim().length < 2 && (
            <div className="text-xs text-muted-foreground">
              Digite ao menos 2 letras para buscar.
            </div>
          )}
          {search.trim().length >= 2 && searchLoading && (
            <div className="text-xs text-muted-foreground">Buscando jogos...</div>
          )}
          {search.trim().length >= 2 && !searchLoading && results.length === 0 && (
            <div className="text-xs text-muted-foreground">Nenhum jogo encontrado.</div>
          )}
          {results.map((game) => (
            <button
              key={game.app_id}
              type="button"
              onClick={() => handleToggleGame(game.app_id)}
              disabled={!user}
              className="w-full rounded-lg border border-border/40 bg-card px-3 py-3 text-left transition hover:border-primary/40"
            >
              <div className="flex items-center gap-3">
                <div className="h-12 w-12 shrink-0 overflow-hidden rounded-lg border border-border/40 bg-muted">
                  {game.image ? (
                    <img
                      src={game.image}
                      alt={game.title}
                      className="h-full w-full object-cover"
                      loading="lazy"
                    />
                  ) : null}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="font-semibold text-sm leading-tight line-clamp-2">
                    {game.title}
                  </p>
                  <p className="text-xs text-muted-foreground line-clamp-1">
                    {game.genre || "Sem gênero"}
                  </p>
                </div>
                {selectedMap.has(game.app_id) ? (
                  <Check className="w-4 h-4 text-primary" />
                ) : null}
              </div>
            </button>
          ))}
        </div>
      </div>
    );
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(nextOpen) => {
        if (!nextOpen) closeOnboarding();
        else setOpen(nextOpen);
      }}
    >
      <DialogContent className="max-w-2xl max-h-[85vh] flex flex-col">
        <DialogHeader>
          <div className="flex items-center gap-2 text-primary">
            <Sparkles className="w-4 h-4" />
            <span className="text-xs font-semibold uppercase tracking-wider">Tutorial</span>
          </div>
          <DialogTitle>{STEP_TITLES[step]}</DialogTitle>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto pr-1 space-y-6">{renderStep()}</div>

        <div className="flex flex-wrap items-center justify-between gap-2 pt-4">
          <Button type="button" variant="ghost" onClick={closeOnboarding}>
            Pular por enquanto
          </Button>
          <div className="flex items-center gap-2">
            {step > 0 && (
              <Button type="button" variant="outline" onClick={() => setStep(step - 1)}>
                Voltar
              </Button>
            )}
            {step < 2 ? (
              <Button type="button" onClick={() => setStep(step + 1)}>
                Próximo
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            ) : (
              <Button
                type="button"
                onClick={handleFinish}
                disabled={ensureFavorite.isPending}
              >
                Concluir
              </Button>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
