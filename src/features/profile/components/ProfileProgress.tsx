import { useProfileProgress } from "@/hooks/useProfileProgress";

export function ProfileProgressCard({ userId }: { userId?: string }) {
  const { data } = useProfileProgress(userId);
  if (!data) return null;
  return (
    <div className="flex items-center gap-2" title={`${data.xp.toLocaleString("pt-BR")} XP`}>
      <span className="grid h-9 w-9 place-items-center rounded-full border-2 border-primary text-sm font-semibold text-primary">
        {data.level}
      </span>
      <span className="text-sm font-medium">Nível {data.level}</span>
    </div>
  );
}
