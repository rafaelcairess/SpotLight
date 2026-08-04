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

      <div className="relative grid gap-6 p-5 sm:p-7 md:grid-cols-[10rem_minmax(0,1fr)] lg:p-9">
        <UserAvatar
          src={avatarUrl}
          displayName={displayName}
          username={username}
          size="xl"
          shape="square"
          className="h-36 w-36 rounded-2xl border-2 border-white/10 shadow-[0_22px_65px_hsl(226_70%_2%/0.55)] ring-4 ring-primary/15 sm:h-40 sm:w-40"
        />

        <div className="flex min-w-0 flex-col justify-end gap-5">
          <div className="flex min-w-0 flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div className="min-w-0">
              <p className="eyebrow mb-2">SpotLight player</p>
              <h1 className="truncate font-logo text-3xl font-extrabold tracking-[-0.05em] md:text-4xl">
                {displayName || fallbackName}
              </h1>
              <div className="mt-1 flex flex-wrap items-center gap-3">
                <p className="text-sm text-muted-foreground">@{username}</p>
                {presence}
              </div>
              {bio && <p className="mt-3 max-w-2xl text-sm leading-6 text-foreground/75">{bio}</p>}
            </div>
            <div className="flex shrink-0 flex-col items-start gap-3 sm:items-end">{actions}</div>
          </div>

          {!!stats.length && (
            <dl className="flex max-w-2xl flex-wrap gap-2">
              {stats.map((stat) => (
                <div
                  key={stat.label}
                  className="min-w-[6.5rem] rounded-xl border border-white/[0.08] bg-black/20 px-3 py-2 backdrop-blur-md"
                >
                  <dt className="text-[0.68rem] font-medium uppercase tracking-wider text-muted-foreground">
                    {stat.label}
                  </dt>
                  <dd className="mt-0.5 font-logo text-xl font-bold">{stat.value}</dd>
                </div>
              ))}
            </dl>
          )}
        </div>
      </div>
    </div>
  );
}
