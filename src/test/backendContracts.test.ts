import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";
import { buildFriendRequestDeletionFilter } from "../../supabase/functions/_shared/account-deletion";
import {
  isSteamId64,
  minutesToHours,
  parseSteamInput,
} from "../../supabase/functions/_shared/steam-sync";

const workspaceFile = (path: string) => readFileSync(resolve(process.cwd(), path), "utf8");

describe("account deletion contract", () => {
  it("deletes friendship rows in both directions using the real column names", () => {
    expect(buildFriendRequestDeletionFilter("user-id")).toBe(
      "requester_id.eq.user-id,addressee_id.eq.user-id",
    );
  });

  it("does not reintroduce the old requestee_id typo", () => {
    const source = workspaceFile("supabase/functions/delete-account/index.ts");
    expect(source).toContain("buildFriendRequestDeletionFilter");
    expect(source).not.toContain("requestee_id");
  });
});

describe("Steam synchronization helpers", () => {
  it("recognizes SteamID64 and common community profile URLs", () => {
    expect(isSteamId64("76561198000000000")).toBe(true);
    expect(parseSteamInput("https://steamcommunity.com/profiles/76561198000000000/")).toEqual({
      type: "steamid",
      value: "76561198000000000",
    });
    expect(parseSteamInput("https://steamcommunity.com/id/rafae/")).toEqual({
      type: "vanity",
      value: "rafae",
    });
  });

  it("rejects lookalike domains and treats them only as a vanity input", () => {
    expect(parseSteamInput("https://evilsteamcommunity.com/id/rafae")).toEqual({
      type: "vanity",
      value: "https://evilsteamcommunity.com/id/rafae",
    });
  });

  it("converts Steam minutes to stable decimal hours", () => {
    expect(minutesToHours(90)).toBe(1.5);
    expect(minutesToHours(1)).toBe(0.02);
    expect(minutesToHours(-10)).toBe(0);
  });

  it("never accepts a Steam identity from the sync request body", () => {
    const source = workspaceFile("supabase/functions/sync-steam-playtime/index.ts");
    expect(source).not.toContain("payload.steam_id");
    expect(source).toContain("profile?.steam_id");
    expect(source).toContain("steam_identity_requires_reconnect");
  });
});

describe("RLS privacy contract", () => {
  const migration = workspaceFile("supabase/migrations/20260723000000_enforce_profile_privacy.sql");

  it("enforces profile, library and review visibility in SQL", () => {
    expect(migration).toContain('CREATE POLICY "Friends can view friend profiles"');
    expect(migration).toContain('CREATE POLICY "Visible libraries can be read"');
    expect(migration).toContain('CREATE POLICY "Visible reviews can be read"');
    expect(migration).toContain("public.is_friend(auth.uid(), profile.user_id)");
  });

  it("replaces the old globally-public reviews policy", () => {
    expect(migration).toContain('DROP POLICY IF EXISTS "Reviews visíveis por todos"');
  });

  it("keeps the restrictive private-game guard", () => {
    const privateGuard = workspaceFile(
      "supabase/migrations/20260722000000_profile_presence_privacy_progress.sql",
    );
    expect(privateGuard).toContain('CREATE POLICY "Private games are owner only"');
    expect(privateGuard).toContain("user_id = auth.uid() OR is_private = false");
  });

  it("hardens platform identities, social graph, rate limits and avatars", () => {
    const hardening = workspaceFile("supabase/migrations/20260728000000_security_hardening.sql");
    expect(hardening).toContain("REVOKE UPDATE (steam_id)");
    expect(hardening).toContain("profiles_steam_id_unique");
    expect(hardening).toContain('DROP POLICY IF EXISTS "Accepted friendships are visible"');
    expect(hardening).toContain("consume_function_rate_limit");
    expect(hardening).toContain("Avatar uploads require safe owner path");
  });
});
