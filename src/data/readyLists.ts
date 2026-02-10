export interface ReadyList {
  id: string;
  title: string;
  subtitle: string;
  appIds: number[];
  fallbackKeywords: string[];
}

export const READY_LISTS: ReadyList[] = [
  {
    id: "quick-30",
    title: "Jogos rapidos ate 30 min",
    subtitle: "Partidas curtas para entrar e sair rapido",
    appIds: [1794680, 1942280, 291550, 570, 730, 1276390, 960090, 391540, 400, 620],
    fallbackKeywords: ["casual", "arcade", "indie", "platformer", "shooter"],
  },
  {
    id: "coop-today",
    title: "Co-op pra jogar hoje",
    subtitle: "Selecao pronta para fechar squad agora",
    appIds: [1426210, 550, 218620, 548430, 322330, 648800, 892970, 1172620, 49520, 397540],
    fallbackKeywords: ["co-op", "online co-op", "multiplayer", "local co-op"],
  },
  {
    id: "relax-after-work",
    title: "Jogos relaxantes pra quem trabalha muito",
    subtitle: "Baixa pressao, boa progressao e clima tranquilo",
    appIds: [413150, 227300, 270880, 294100, 255710, 526870, 703080, 1222670, 281990, 359320],
    fallbackKeywords: ["simulation", "city", "building", "casual", "strategy", "adventure"],
  },
];
