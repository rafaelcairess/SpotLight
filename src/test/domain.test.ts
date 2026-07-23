import { describe, expect, it } from "vitest";
import { isLikelyGame } from "@/lib/gameFilters";
import { isMatureGame } from "@/lib/matureFilter";
import { getEffectiveHours, hasManualOverride } from "@/lib/playtime";
import { sortByPopularity } from "@/lib/sort";
import { parseSteamReleaseDate, rankNoteworthyReleases, rankQualityGames } from "@/lib/discovery";

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
    expect(
      getEffectiveHours({ hours_played: 10, hours_played_manual: 25, hours_override: true }),
    ).toBe(25);
    expect(
      getEffectiveHours({ hours_played: 10, hours_played_manual: 25, hours_override: false }),
    ).toBe(10);
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

describe("discovery ranking", () => {
  const games = [
    {
      app_id: 1,
      title: "Ótimo",
      image: "1.jpg",
      communityRating: 95,
      activePlayers: 5_000,
      releaseDate: "9/jul./2026",
    },
    {
      app_id: 2,
      title: "Popular ruim",
      image: "2.jpg",
      communityRating: 55,
      activePlayers: 100_000,
      releaseDate: "5/jun./2026",
    },
    {
      app_id: 3,
      title: "Antigo bom",
      image: "3.jpg",
      communityRating: 98,
      activePlayers: 4_000,
      releaseDate: "26/fev./2016",
    },
  ];

  it("interpreta datas localizadas da Steam", () => {
    expect(parseSteamReleaseDate("21/ago./2012")?.toISOString()).toBe("2012-08-21T00:00:00.000Z");
    expect(parseSteamReleaseDate("5 de Dec, 2025")?.toISOString()).toBe("2025-12-05T00:00:00.000Z");
  });

  it("remove jogos populares mal avaliados da seleção de qualidade", () => {
    expect(rankQualityGames(games).map((game) => game.app_id)).toEqual([3, 1]);
  });

  it("seleciona lançamentos recentes com tração e boa avaliação", () => {
    const now = new Date("2026-07-21T00:00:00.000Z");
    expect(rankNoteworthyReleases(games, now).map((game) => game.app_id)).toEqual([1]);
  });
});
