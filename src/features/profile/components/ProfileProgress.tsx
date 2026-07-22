import { Award, BookOpen, Gamepad2, Gem, Shield, Sparkles, Trophy, Users } from "lucide-react";
import { useProfileProgress } from "@/hooks/useProfileProgress";

export function ProfileProgressCard({ userId }: { userId?: string }) {
  const { data } = useProfileProgress(userId);
  if (!data) return null;
  const currentFloor = Math.pow(Math.max(0, data.level - 1), 2) * 500;
  const progress = Math.min(100, Math.max(0, ((data.xp - currentFloor) / Math.max(1, data.next_level_xp - currentFloor)) * 100));
  const awards = [
    { label: "Primeiros passos", unlocked: data.games_count >= 1, icon: Gamepad2 },
    { label: "Colecionador", unlocked: data.games_count >= 50, icon: Shield },
    { label: "Crítico", unlocked: data.reviews_count >= 5, icon: BookOpen },
    { label: "Social", unlocked: data.friends_count >= 10, icon: Users },
    { label: "Platinador", unlocked: data.platinum_count >= 1, icon: Trophy },
    { label: "Veterano", unlocked: data.hours_count >= 500, icon: Gem },
  ];
  return <section className="rounded-2xl border border-border/50 bg-card/70 p-5">
    <div className="flex items-center justify-between gap-4"><div className="flex items-center gap-3"><div className="grid h-12 w-12 place-items-center rounded-full border-2 border-primary bg-primary/10 text-lg font-bold text-primary">{data.level}</div><div><p className="font-semibold">Nível {data.level}</p><p className="text-xs text-muted-foreground">{data.xp.toLocaleString("pt-BR")} XP</p></div></div><Sparkles className="h-5 w-5 text-primary" /></div>
    <div className="mt-4 h-2 overflow-hidden rounded-full bg-secondary"><div className="h-full rounded-full bg-gradient-to-r from-primary to-violet-400" style={{ width: `${progress}%` }} /></div>
    <p className="mt-1 text-right text-[11px] text-muted-foreground">{Math.max(0, data.next_level_xp - data.xp).toLocaleString("pt-BR")} XP para o próximo nível</p>
    <div className="mt-5 grid grid-cols-3 gap-2">{awards.map(({ label, unlocked, icon: Icon }) => <div key={label} title={label} className={`rounded-lg border p-2 text-center ${unlocked ? "border-primary/30 bg-primary/5" : "border-border/30 opacity-30"}`}><Icon className="mx-auto h-4 w-4" /><p className="mt-1 truncate text-[10px]">{label}</p></div>)}</div>
    <div className="mt-4 flex items-center gap-2 text-xs text-muted-foreground"><Award className="h-4 w-4" />{awards.filter((award) => award.unlocked).length}/{awards.length} prêmios conquistados</div>
  </section>;
}
