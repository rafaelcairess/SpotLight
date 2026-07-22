import { useSetPresence, type PresenceStatus } from "@/hooks/usePresence";
import { PresenceBadge } from "./PresenceBadge";

const options: Array<{ value: PresenceStatus; label: string }> = [
  { value: "online", label: "On-line" },
  { value: "away", label: "Ausente" },
  { value: "busy", label: "Ocupado" },
  { value: "invisible", label: "Invisível" },
];

export function PresenceSelector({ value, lastSeenAt }: { value: PresenceStatus; lastSeenAt?: string | null }) {
  const setPresence = useSetPresence();
  return <div className="flex items-center gap-2"><PresenceBadge status={value} lastSeenAt={lastSeenAt} /><select aria-label="Status de presença" value={value} onChange={(event) => setPresence.mutate(event.target.value as PresenceStatus)} className="rounded-md border border-border/50 bg-background px-2 py-1 text-xs">{options.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}</select></div>;
}
