import { useEffect, useMemo, useState } from "react";
import { ArrowRight, Check, Sparkles } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/contexts/AuthContext";
import { useSearchGames } from "@/hooks/useGames";
import { useEnsureFavoriteGame } from "@/hooks/useUserGames";
import { useToast } from "@/hooks/use-toast";
import { useTranslation } from "react-i18next";
import { useLanguage } from "@/contexts/LanguageContext";

const STORAGE_KEY = "spotlight.onboarding.v2";

const LANGUAGE_OPTIONS = [
  { value: "pt", short: "PT" },
  { value: "en", short: "EN" },
  { value: "es", short: "ES" },
] as const;

type LanguageValue = (typeof LANGUAGE_OPTIONS)[number]["value"];

type HowToItem = {
  title: string;
  description: string;
};

export default function OnboardingModal() {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const ensureFavorite = useEnsureFavoriteGame();
  const { t } = useTranslation();
  const { locale, setLocale } = useLanguage();

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
        toast({ title: t("onboarding.favoritesSaved") });
      } catch (error) {
        toast({ title: t("onboarding.favoritesError"), variant: "destructive" });
      }
    }
    closeOnboarding();
  };

  const stepTitles = [
    t("onboarding.languageTitle"),
    t("onboarding.introTitle"),
    t("onboarding.howToUseTitle"),
    t("onboarding.favoritesTitle"),
  ];

  const howToItems = t("onboarding.howToUseItems", { returnObjects: true }) as HowToItem[];
  const roadmapItems = t("onboarding.roadmapItems", { returnObjects: true }) as string[];

  const renderStep = () => {
    if (step === 0) {
      return (
        <div className="space-y-4">
          <p className="text-sm text-muted-foreground">{t("onboarding.languageDescription")}</p>
          <div className="grid gap-3 sm:grid-cols-3">
            {LANGUAGE_OPTIONS.map((option) => (
              <button
                key={option.value}
                type="button"
                onClick={() => setLocale(option.value as LanguageValue)}
                className={`rounded-lg border px-3 py-4 text-left transition ${
                  option.value === locale
                    ? "border-primary/60 bg-primary/10"
                    : "border-border/50 bg-secondary/30 hover:border-primary/40"
                }`}
              >
                <p className="text-sm font-semibold">{t(`languageOptions.${option.value}`)}</p>
                <p className="text-xs text-muted-foreground">{option.short}</p>
              </button>
            ))}
          </div>
        </div>
      );
    }

    if (step === 1) {
      return (
        <div className="space-y-4">
          <p className="text-sm text-muted-foreground">{t("onboarding.introDescription")}</p>
          <div className="rounded-lg border border-border/40 bg-secondary/30 p-4 space-y-3">
            <h4 className="text-sm font-semibold">{t("onboarding.roadmapTitle")}</h4>
            <ul className="text-sm text-muted-foreground space-y-1">
              {roadmapItems.map((item) => (
                <li key={item}>• {item}</li>
              ))}
            </ul>
          </div>
        </div>
      );
    }

    if (step === 2) {
      return (
        <div className="space-y-3">
          <div className="grid gap-2 sm:grid-cols-2">
            {howToItems.map((item) => (
              <div
                key={item.title}
                className="rounded-lg border border-border/40 bg-secondary/30 p-2"
              >
                <p className="text-xs font-semibold">{item.title}</p>
                <p className="text-[11px] text-muted-foreground leading-snug">
                  {item.description}
                </p>
              </div>
            ))}
          </div>
          <div className="rounded-lg border border-border/40 bg-secondary/30 p-3 space-y-2">
            <h4 className="text-xs font-semibold">{t("onboarding.roadmapTitle")}</h4>
            <div className="flex flex-wrap gap-1.5">
              {roadmapItems.map((item) => (
                <Badge key={item} variant="secondary" className="text-[11px] px-2 py-0.5">
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
        <p className="text-sm text-muted-foreground">{t("onboarding.favoritesDescription")}</p>

        {!user && (
          <div className="rounded-lg border border-border/40 bg-secondary/30 p-4 space-y-3">
            <p className="text-sm text-muted-foreground">{t("onboarding.favoritesLogin")}</p>
            <Button onClick={() => navigate("/auth")}>{t("header.signIn")}</Button>
          </div>
        )}

        <div className="space-y-2">
          <Input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder={t("onboarding.favoritesPlaceholder")}
            disabled={!user}
          />
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <span>{t("onboarding.favoritesLimit")}</span>
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
              {t("onboarding.favoritesSearchHint")}
            </div>
          )}
          {search.trim().length >= 2 && searchLoading && (
            <div className="text-xs text-muted-foreground">{t("common.status.updating")}</div>
          )}
          {search.trim().length >= 2 && !searchLoading && results.length === 0 && (
            <div className="text-xs text-muted-foreground">{t("onboarding.favoritesEmpty")}</div>
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
                  <p className="font-semibold text-sm leading-tight line-clamp-2">{game.title}</p>
                  <p className="text-xs text-muted-foreground line-clamp-1">
                    {game.genre || t("common.status.noneFound")}
                  </p>
                </div>
                {selectedMap.has(game.app_id) ? <Check className="w-4 h-4 text-primary" /> : null}
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
      <DialogContent className="max-w-2xl max-h-[92vh] flex flex-col min-h-0 p-4 sm:p-6">
        <DialogHeader>
          <div className="flex items-center gap-2 text-primary">
            <Sparkles className="w-4 h-4" />
            <span className="text-xs font-semibold uppercase tracking-wider">{t("onboarding.tutorialLabel")}</span>
          </div>
          <DialogTitle>{stepTitles[step]}</DialogTitle>
          <DialogDescription className="sr-only">
            {t("onboarding.tutorialDescription")}
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 min-h-0 overflow-y-auto pr-1 space-y-4">
          {renderStep()}
        </div>

        <div className="flex flex-wrap items-center justify-between gap-2 pt-4">
          <Button type="button" variant="ghost" onClick={closeOnboarding}>
            {t("common.actions.skip")}
          </Button>
          <div className="flex items-center gap-2">
            {step > 0 && (
              <Button type="button" variant="outline" onClick={() => setStep(step - 1)}>
                {t("common.actions.back")}
              </Button>
            )}
            {step < stepTitles.length - 1 ? (
              <Button type="button" onClick={() => setStep(step + 1)}>
                {t("common.actions.next")}
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            ) : (
              <Button type="button" onClick={handleFinish} disabled={ensureFavorite.isPending}>
                {t("common.actions.finish")}
              </Button>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
