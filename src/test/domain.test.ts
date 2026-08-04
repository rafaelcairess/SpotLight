import { describe, expect, it } from "vitest";
import { isLikelyGame } from "@/lib/gameFilters";
import { isMatureGame } from "@/lib/matureFilter";
import { getEffectiveHours, hasManualOverride } from "@/lib/playtime";
import { sortByPopularity } from "@/lib/sort";
import { parseSteamReleaseDate, rankNoteworthyReleases, rankQualityGames } from "@/lib/discovery";
import {
  rankPersonalRecommendations,
  type RecommendationProfileGame,
} from "@/lib/recommendations";

describe("game filters", () => {
  it("rejects DLC and soundtrack catalog entries", () => {
    expect(isLikelyGame({ title: "Game Soundtrack" })).toBe(false);
    expect(isLikelyGame({ title: "Game", tags: ["DLC"] })).toBe(false);
  });

  it("rejects Steam software and seasonal add-ons", () => {
    expect(isLikelyGame({ title: "OBS Studio", tags: ["Utilities"] })).toBe(false);
    expect(isLikelyGame({ title: "Butim da Temporada de Skull and Bones" })).toBe(false);
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

describe("personal recommendations", () => {
  const profile: RecommendationProfileGame[] = [
    {
      app_id: 1,
      genre: "Action, RPG",
      tags: ["Turn-Based", "Party-Based RPG"],
      status: "completed",
      is_favorite: true,
      is_platinumed: false,
      hours_played: 80,
      hours_played_manual: null,
      hours_override: false,
    },
  ];

  const reviews = [{ app_id: 1, is_positive: true, score: 5 }];

  it("prioritizes an informative taste match over a generic genre", () => {
    const result = rankPersonalRecommendations({
      profileGames: profile,
      reviews,
      limit: 2,
      candidates: [
        {
          app_id: 2,
          title: "Generic Action",
          image: "2.jpg",
          genre: "Action",
          tags: ["Singleplayer"],
          communityRating: 96,
          activePlayers: 50_000,
        },
        {
          app_id: 3,
          title: "Tactical Adventure",
          image: "3.jpg",
          genre: "RPG",
          tags: ["Turn-Based"],
          communityRating: 88,
          activePlayers: 800,
        },
      ],
    });

    expect(result[0].game.app_id).toBe(3);
    expect(result[0].matchedTags).toEqual(expect.arrayContaining(["RPG", "Turn-Based"]));
    expect(result[1].matchedTags).toEqual([]);
  });

  it("removes owned games, add-ons and candidates without reliable quality", () => {
    const result = rankPersonalRecommendations({
      profileGames: profile,
      reviews,
      candidates: [
        {
          app_id: 1,
          title: "Meu RPG",
          image: "owned.jpg",
          genre: "RPG",
          communityRating: 99,
          activePlayers: 5_000,
        },
        {
          app_id: 2,
          title: "Meu RPG DLC",
          image: "dlc.jpg",
          genre: "RPG",
          communityRating: 99,
          activePlayers: 5_000,
        },
        {
          app_id: 3,
          title: "Unknown RPG",
          image: "unknown.jpg",
          genre: "RPG",
          communityRating: 77,
          activePlayers: 2,
        },
      ],
    });

    expect(result).toEqual([]);
  });

  it("limits repetition when other genres are available", () => {
    const candidates = [
      ...Array.from({ length: 5 }, (_, index) => ({
        app_id: index + 10,
        title: `Roguelike ${index}`,
        image: `${index}.jpg`,
        genre: "Roguelike",
        tags: ["Turn-Based"],
        communityRating: 94 - index,
        activePlayers: 2_000 - index * 100,
      })),
      {
        app_id: 20,
        title: "Strategy Pick",
        image: "strategy.jpg",
        genre: "Strategy",
        tags: ["Turn-Based"],
        communityRating: 89,
        activePlayers: 900,
      },
      {
        app_id: 21,
        title: "Party Pick",
        image: "party.jpg",
        genre: "Party-Based RPG",
        tags: ["RPG"],
        communityRating: 88,
        activePlayers: 850,
      },
      {
        app_id: 22,
        title: "Management Pick",
        image: "management.jpg",
        genre: "Simulation",
        tags: ["Party-Based RPG"],
        communityRating: 88,
        activePlayers: 800,
      },
    ];

    const result = rankPersonalRecommendations({
      candidates,
      profileGames: profile,
      reviews,
      limit: 6,
    });

    expect(result.filter(({ game }) => game.genre === "Roguelike")).toHaveLength(3);
    expect(result.map(({ game }) => game.app_id)).toEqual(expect.arrayContaining([20, 21, 22]));
  });
});
