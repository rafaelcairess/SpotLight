import { describe, expect, it } from "vitest";
import { isLikelyGame } from "@/lib/gameFilters";
import { isMatureGame } from "@/lib/matureFilter";
import { getEffectiveHours, hasManualOverride } from "@/lib/playtime";
import { sortByPopularity } from "@/lib/sort";

describe("game filters", () => {
  it("rejects DLC and soundtrack catalog entries", () => {
    expect(isLikelyGame({ title: "Game Soundtrack" })).toBe(false);
    expect(isLikelyGame({ title: "Game", tags: ["DLC"] })).toBe(false);
  });

  it("keeps regular games", () => {
    expect(isLikelyGame({ title: "Hades", genre: "Action Roguelike" })).toBe(true);
  });

  it("detects mature tags without case sensitivity", () => {
    expect(isMatureGame({ app_id: 1, title: "Example", image: "", tags: ["Mature"] })).toBe(true);
  });
});

describe("playtime", () => {
  it("uses manual hours only when override is enabled", () => {
    expect(getEffectiveHours({ hours_played: 10, hours_played_manual: 25, hours_override: true })).toBe(25);
    expect(getEffectiveHours({ hours_played: 10, hours_played_manual: 25, hours_override: false })).toBe(10);
  });

  it("identifies a valid manual override", () => {
    expect(hasManualOverride({ hours_played_manual: 0, hours_override: true })).toBe(true);
  });
});

describe("popularity sorting", () => {
  it("sorts by players, rating and title without mutating the input", () => {
    const games = [
      { title: "B", activePlayers: 10, communityRating: 9 },
      { title: "C", activePlayers: 20, communityRating: 7 },
      { title: "A", activePlayers: 10, communityRating: 9 },
    ];
    expect(sortByPopularity(games).map((game) => game.title)).toEqual(["C", "A", "B"]);
    expect(games.map((game) => game.title)).toEqual(["B", "C", "A"]);
  });
});
