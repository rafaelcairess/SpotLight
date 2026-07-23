import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import type { PlatinumPlatform } from "@/hooks/useUserGames";
import steamLogo from "@/assets/steam.png";
import xboxLogo from "@/assets/xbox.png";
import playstationLogo from "@/assets/playstation.png";

const platinumPlatforms: Array<{ value: PlatinumPlatform; label: string; logo: string }> = [
  { value: "steam", label: "Steam", logo: steamLogo },
  { value: "xbox", label: "Xbox", logo: xboxLogo },
  { value: "playstation", label: "PlayStation", logo: playstationLogo },
];

export function PlatformLogo({ platform, size = "sm" }: { platform: string; size?: "sm" | "md" }) {
  const item = platinumPlatforms.find((option) => option.value === platform);
  if (!item) return null;
  return (
    <img
      src={item.logo}
      alt={item.label}
      title={item.label}
      className={size === "md" ? "h-7 w-7 object-contain" : "h-5 w-5 object-contain"}
    />
  );
}

export function PlatformChoices({
  value,
  onChange,
}: {
  value?: PlatinumPlatform;
  onChange: (platform: PlatinumPlatform) => void;
}) {
  return (
    <div className="grid grid-cols-3 gap-2">
      {platinumPlatforms.map((item) => (
        <button
          key={item.value}
          type="button"
          onClick={() => onChange(item.value)}
          className={`flex min-w-0 flex-col items-center gap-2 rounded-lg border p-3 text-xs transition ${value === item.value ? "border-amber-300/60 bg-amber-300/10 text-foreground" : "border-border/50 text-muted-foreground hover:bg-secondary/50"}`}
        >
          <PlatformLogo platform={item.value} size="md" />
          <span className="truncate">{item.label}</span>
        </button>
      ))}
    </div>
  );
}

export function PlatinumPlatformDialog({
  open,
  onOpenChange,
  onSelect,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSelect: (platform: PlatinumPlatform) => Promise<void> | void;
}) {
  const [saving, setSaving] = useState(false);
  const choose = async (platform: PlatinumPlatform) => {
    setSaving(true);
    try {
      await onSelect(platform);
      onOpenChange(false);
    } finally {
      setSaving(false);
    }
  };
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle>Onde você zerou este jogo?</DialogTitle>
          <DialogDescription>
            Escolha uma plataforma. Você poderá alterar isso depois.
          </DialogDescription>
        </DialogHeader>
        <div className={saving ? "pointer-events-none opacity-60" : ""}>
          <PlatformChoices onChange={choose} />
        </div>
      </DialogContent>
    </Dialog>
  );
}
