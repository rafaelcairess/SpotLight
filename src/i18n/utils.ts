import { enUS, es, ptBR } from "date-fns/locale";

export type SupportedLocale = "pt" | "en" | "es";

export const normalizeLocale = (value?: string | null): SupportedLocale => {
  if (!value) return "pt";
  const normalized = value.toLowerCase();
  if (normalized.startsWith("en")) return "en";
  if (normalized.startsWith("es")) return "es";
  return "pt";
};

export const getDateLocale = (locale: SupportedLocale) => {
  switch (locale) {
    case "en":
      return enUS;
    case "es":
      return es;
    default:
      return ptBR;
  }
};

export const mapToSteamLanguage = (locale: SupportedLocale) => {
  switch (locale) {
    case "en":
      return "english";
    case "es":
      return "spanish";
    default:
      return "brazilian";
  }
};
