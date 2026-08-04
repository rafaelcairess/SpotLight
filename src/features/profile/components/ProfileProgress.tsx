import { useProfileProgress } from "@/hooks/useProfileProgress";

export function ProfileProgressCard({ userId }: { userId?: string }) {
  const { data } = useProfileProgress(userId);
  if (!data) return null;
  return (
    <div
      className="flex items-center gap-2 rounded-full border border-primary/20 bg-primary/10 py-1 pl-1 pr-3 backdrop-blur-md"
      title={`${data.xp.toLocaleString("pt-BR")} XP`}
    >
      <span className="grid h-8 w-8 place-items-center rounded-full bg-primary text-sm font-bold text-primary-foreground shadow-[0_0_20px_hsl(var(--primary)/0.25)]">
        {data.level}
      </span>
      <span className="text-sm font-medium">Nível {data.level}</span>
    </div>
  );
}
