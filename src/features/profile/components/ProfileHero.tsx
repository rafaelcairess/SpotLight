import type { ReactNode } from "react";
import { UserAvatar } from "@/features/profile/components/UserAvatar";

interface ProfileHeroProps {
  avatarUrl?: string | null;
  displayName?: string | null;
  username?: string | null;
  bio?: string | null;
  fallbackName: string;
  presence: ReactNode;
  actions: ReactNode;
}

/** Cabeçalho visual compartilhado pelo perfil próprio e pelo perfil público. */
export function ProfileHero({
  avatarUrl,
  displayName,
  username,
  bio,
  fallbackName,
  presence,
  actions,
}: ProfileHeroProps) {
  return (
    <div className="grid gap-6 p-5 md:grid-cols-[10rem_minmax(0,1fr)] md:p-7">
      <UserAvatar
        src={avatarUrl}
        displayName={displayName}
        username={username}
        size="xl"
        shape="square"
        className="h-40 w-40 rounded-md ring-primary/40"
      />

      <div className="flex min-w-0 flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0">
          <h1 className="truncate text-2xl font-bold md:text-3xl">{displayName || fallbackName}</h1>
          <p className="text-muted-foreground">@{username}</p>
          <div className="mt-2">{presence}</div>
          {bio && <p className="mt-2 max-w-xl text-foreground/80">{bio}</p>}
        </div>
        <div className="flex shrink-0 flex-col items-start gap-3 sm:items-end">{actions}</div>
      </div>
    </div>
  );
}
