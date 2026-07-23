import { describe, expect, it } from "vitest";
import { getEffectiveHours, hasManualOverride } from "@/lib/playtime";

describe("effective playtime", () => {
  it("prefers manual hours when override is enabled", () => {
    expect(
      getEffectiveHours({ hours_played: 12.5, hours_played_manual: 80, hours_override: true }),
    ).toBe(80);
  });

  it("keeps imported hours when override is disabled", () => {
    expect(
      getEffectiveHours({ hours_played: 12.5, hours_played_manual: 80, hours_override: false }),
    ).toBe(12.5);
  });

  it("accepts zero as an intentional manual value", () => {
    const game = { hours_played: 30, hours_played_manual: 0, hours_override: true };
    expect(getEffectiveHours(game)).toBe(0);
    expect(hasManualOverride(game)).toBe(true);
  });

  it("falls back safely when manual value is absent", () => {
    expect(
      getEffectiveHours({ hours_played: 6, hours_played_manual: null, hours_override: true }),
    ).toBe(6);
  });
});
