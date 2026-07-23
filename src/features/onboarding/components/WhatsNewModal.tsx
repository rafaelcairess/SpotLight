/**
 * Modal "O que há de novo" — exibido uma vez por versão para usuários retornantes.
 */

import { useEffect, useState } from "react";
import { Gamepad2, Trophy, BarChart2, Bug, Sparkles, List, Zap } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/contexts/AuthContext";
import { STORAGE_KEYS } from "@/config/storageKeys";

const CHANGELOG_KEY = STORAGE_KEYS.changelog;

interface ChangelogItem {
  icon: React.ElementType;
  color: string;
  title: string;
  description: string;
  type: "feature" | "fix" | "improvement";
}

const CHANGELOG_ITEMS: ChangelogItem[] = [
  {
    icon: List,
    color: "text-indigo-400",
    title: "Listas personalizadas",
    description: "Crie coleções temáticas de jogos e compartilhe com a comunidade.",
    type: "feature",
  },
  {
    icon: Trophy,
    color: "text-yellow-400",
    title: "Conquistas SpotLight",
    description:
      "Desbloqueie badges ao adicionar jogos, escrever reviews e conectar-se com jogadores.",
    type: "feature",
  },
  {
    icon: BarChart2,
    color: "text-purple-400",
    title: "Insights do perfil",
    description: "Veja gráficos de gêneros favoritos, taxa de conclusão e atividade mensal.",
    type: "feature",
  },
  {
    icon: Zap,
    color: "text-green-400",
    title: "Login com Steam e Xbox",
    description: "Entre com sua conta Steam ou Xbox Live e importe sua biblioteca automaticamente.",
    type: "feature",
  },
  {
    icon: Gamepad2,
    color: "text-blue-400",
    title: "Página individual de jogo",
    description:
      "Cada jogo agora tem sua própria página com reviews da comunidade e detalhes completos.",
    type: "feature",
  },
  {
    icon: Bug,
    color: "text-red-400",
    title: "Correções e estabilidade",
    description: "Erros com código de identificação, perfil Steam corrigido e melhorias gerais.",
    type: "fix",
  },
];

const TYPE_LABELS: Record<ChangelogItem["type"], string> = {
  feature: "Novo",
  improvement: "Melhoria",
  fix: "Correção",
};

const TYPE_COLORS: Record<ChangelogItem["type"], string> = {
  feature: "bg-indigo-500/20 text-indigo-300 border-indigo-500/30",
  improvement: "bg-blue-500/20 text-blue-300 border-blue-500/30",
  fix: "bg-red-500/20 text-red-300 border-red-500/30",
};

export default function WhatsNewModal() {
  const { user, loading } = useAuth();
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (loading) return;
    if (typeof window === "undefined") return;
    const onboardingKey = `${STORAGE_KEYS.onboarding}.${user?.id ?? "guest"}`;
    const onboardingDone = window.localStorage.getItem(onboardingKey) === "done";
    const changelogSeen = window.localStorage.getItem(CHANGELOG_KEY) === "seen";
    if (onboardingDone && !changelogSeen) {
      // Pequeno delay para não competir com outros modais
      const timer = setTimeout(() => setOpen(true), 600);
      return () => clearTimeout(timer);
    }
  }, [loading, user?.id]);

  const handleClose = () => {
    window.localStorage.setItem(CHANGELOG_KEY, "seen");
    setOpen(false);
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(v) => {
        if (!v) handleClose();
      }}
    >
      <DialogContent className="max-w-lg max-h-[85vh] overflow-y-auto">
        <DialogHeader className="space-y-3">
          <div className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-primary" />
            <Badge
              variant="outline"
              className="bg-primary/10 text-primary border-primary/30 text-xs font-semibold"
            >
              O que há de novo
            </Badge>
          </div>
          <DialogTitle className="text-xl">SpotLight foi atualizado!</DialogTitle>
          <DialogDescription className="text-sm text-muted-foreground">
            Confira as novidades e melhorias desta versão.
          </DialogDescription>
        </DialogHeader>

        <div className="mt-2 space-y-3">
          {CHANGELOG_ITEMS.map((item) => {
            const Icon = item.icon;
            return (
              <div
                key={item.title}
                className="flex items-start gap-3 rounded-lg border border-border/40 bg-secondary/10 p-3 hover:bg-secondary/20 transition-colors"
              >
                <div className={`mt-0.5 shrink-0 p-1.5 rounded-md bg-secondary/40 ${item.color}`}>
                  <Icon className="w-4 h-4" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap mb-0.5">
                    <p className="text-sm font-semibold leading-tight">{item.title}</p>
                    <span
                      className={`text-[10px] font-medium px-1.5 py-0.5 rounded border ${TYPE_COLORS[item.type]}`}
                    >
                      {TYPE_LABELS[item.type]}
                    </span>
                  </div>
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    {item.description}
                  </p>
                </div>
              </div>
            );
          })}
        </div>

        <div className="mt-4 flex justify-end">
          <Button onClick={handleClose} className="gap-2">
            <Sparkles className="w-4 h-4" />
            Entendido!
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
