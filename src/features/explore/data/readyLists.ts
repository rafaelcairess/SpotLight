/**
 * Dados/curadoria da feature explore.
 */

export interface ReadyList {
  id: string;
  appIds: number[];
  fallbackKeywords: string[];
}

export const READY_LISTS: ReadyList[] = [
  {
    id: "quick-30",
    appIds: [1794680, 1942280, 291550, 570, 730, 1276390, 960090, 391540, 400, 620],
    fallbackKeywords: ["casual", "arcade", "indie", "platformer", "shooter"],
  },
  {
    id: "coop-today",
    appIds: [1426210, 550, 218620, 548430, 322330, 648800, 892970, 1172620, 49520, 397540],
    fallbackKeywords: ["co-op", "online co-op", "multiplayer", "local co-op"],
  },
  {
    id: "relax-after-work",
    appIds: [413150, 227300, 270880, 294100, 255710, 526870, 703080, 1222670, 281990, 359320],
    fallbackKeywords: ["simulation", "city", "building", "casual", "strategy", "adventure"],
  },
];
