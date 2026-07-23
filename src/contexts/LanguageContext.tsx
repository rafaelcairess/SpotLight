/**
 * Sincroniza o idioma escolhido entre i18next, localStorage e o atributo
 * `lang` do documento.
 */

import { createContext, useContext, useEffect, useMemo, ReactNode } from "react";
import i18n from "@/i18n";
import { normalizeLocale, type SupportedLocale } from "@/i18n/utils";
import { STORAGE_KEYS } from "@/config/storageKeys";
import { useLocalStorageState } from "@/hooks/useLocalStorageState";

type LanguageContextValue = {
  locale: SupportedLocale;
  setLocale: (locale: SupportedLocale) => void;
};

const LanguageContext = createContext<LanguageContextValue | undefined>(undefined);

export const LanguageProvider = ({ children }: { children: ReactNode }) => {
  const defaultLocale = normalizeLocale(i18n.language);
  const [locale, setLocaleState] = useLocalStorageState<SupportedLocale>(
    STORAGE_KEYS.language,
    defaultLocale,
    (raw) => (raw ? normalizeLocale(raw) : null),
    (value) => value,
  );

  useEffect(() => {
    i18n.changeLanguage(locale);
    if (typeof document !== "undefined") {
      document.documentElement.lang = locale;
    }
  }, [locale]);

  const value = useMemo(
    () => ({
      locale,
      setLocale: setLocaleState,
    }),
    [locale, setLocaleState],
  );

  return <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>;
};

export const useLanguage = () => {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error("useLanguage must be used within LanguageProvider");
  }
  return context;
};
