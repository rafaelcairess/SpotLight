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
  stats?: Array<{ label: string; value: number }>;
}

/** Shared premium hero for owner and public profiles. */
export function ProfileHero({
  avatarUrl,
  displayName,
  username,
  bio,
  fallbackName,
  presence,
  actions,
  stats = [],
}: ProfileHeroProps) {
  return (
    <div className="relative overflow-hidden border-b border-white/[0.07]">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_18%_15%,hsl(var(--primary)/0.24),transparent_32%),radial-gradient(circle_at_85%_5%,hsl(255_80%_62%/0.12),transparent_30%)]" />
      <div className="premium-grid absolute inset-0 opacity-40" />
      <div className="absolute inset-x-0 bottom-0 h-32 bg-gradient-to-t from-card/80 to-transparent" />

      <div className="relative grid gap-5 p-4 sm:p-7 md:grid-cols-[10rem_minmax(0,1fr)] md:gap-6 lg:p-9">
        <UserAvatar
          src={avatarUrl}
          displayName={displayName}
          username={username}
          size="xl"
          shape="square"
          className="h-28 w-28 justify-self-center rounded-2xl border-2 border-white/10 shadow-[0_22px_65px_hsl(226_70%_2%/0.55)] ring-4 ring-primary/15 sm:h-36 sm:w-36 md:h-40 md:w-40 md:justify-self-start"
        />

        <div className="flex min-w-0 flex-col justify-end gap-5">
          <div className="flex min-w-0 flex-col items-center gap-4 text-center sm:flex-row sm:items-start sm:justify-between sm:text-left">
            <div className="min-w-0 max-w-full">
              <h1 className="truncate font-logo text-2xl font-extrabold tracking-[-0.04em] sm:text-3xl md:text-4xl md:tracking-[-0.05em]">
                {displayName || fallbackName}
              </h1>
              <div className="mt-1 flex flex-wrap items-center justify-center gap-2 sm:justify-start sm:gap-3">
                <p className="text-sm text-muted-foreground">@{username}</p>
                {presence}
              </div>
              {bio && <p className="mt-3 max-w-2xl text-sm leading-6 text-foreground/75">{bio}</p>}
            </div>
            <div className="flex w-full shrink-0 flex-wrap items-center justify-center gap-2 sm:w-auto sm:flex-col sm:items-end sm:gap-3">
              {actions}
            </div>
          </div>

          {!!stats.length && (
            <dl className="grid w-full max-w-2xl grid-cols-3 gap-2">
              {stats.map((stat) => (
                <div
                  key={stat.label}
                  className="min-w-0 rounded-xl border border-white/[0.08] bg-black/20 px-2 py-2 text-center backdrop-blur-md sm:px-3 sm:text-left"
                >
                  <dt className="truncate text-[0.6rem] font-medium uppercase tracking-wide text-muted-foreground sm:text-[0.68rem] sm:tracking-wider">
                    {stat.label}
                  </dt>
                  <dd className="mt-0.5 font-logo text-lg font-bold sm:text-xl">{stat.value}</dd>
                </div>
              ))}
            </dl>
          )}
        </div>
      </div>
    </div>
  );
}
