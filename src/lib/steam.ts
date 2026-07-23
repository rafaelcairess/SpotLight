/**
 * Helpers utilitários (steam).
 */

export const getPosterImage = (appId: number) =>
  `https://cdn.cloudflare.steamstatic.com/steam/apps/${appId}/library_600x900.jpg`;

export const getSteamStoreUrl = (appId: number) => `https://store.steampowered.com/app/${appId}`;
