export interface CuratedTopGameEntry {
  label: string;
  match: string[];
  appId?: number;
  steamQuery?: string;
}

export const TOP_GAMES_SERIES_CURATED: CuratedTopGameEntry[] = [
  {
    label: "Stardew Valley",
    match: ["stardew valley"],
    steamQuery: "Stardew Valley",
  },
  {
    label: "Red Dead Redemption 2",
    match: ["red dead redemption 2"],
    steamQuery: "Red Dead Redemption 2",
  },
  {
    label: "The Last of Us Part I",
    match: ["the last of us part i", "last of us part i"],
    steamQuery: "The Last of Us Part I",
  },
  {
    label: "ELDEN RING",
    match: ["elden ring"],
    steamQuery: "ELDEN RING",
  },
  {
    label: "The Last of Us Part II",
    match: [
      "the last of us part ii",
      "the last of us part ii remastered",
      "last of us 2",
      "last of us part ii",
    ],
    steamQuery: "The Last of Us Part II",
  },
  {
    label: "Sekiro",
    match: ["sekiro"],
    steamQuery: "Sekiro",
  },
  {
    label: "Dark Souls 1",
    match: ["dark souls remastered", "dark souls prepare to die", "dark souls"],
    steamQuery: "DARK SOULS: REMASTERED",
  },
  {
    label: "Death Stranding",
    match: ["death stranding"],
    steamQuery: "DEATH STRANDING",
  },
  {
    label: "Baldur's Gate 3",
    match: ["baldur", "gate 3"],
    steamQuery: "Baldur's Gate 3",
  },
  {
    label: "The Witcher 3",
    match: ["witcher 3", "wild hunt"],
    steamQuery: "The Witcher 3: Wild Hunt",
  },
];
