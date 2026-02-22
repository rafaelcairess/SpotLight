import { createContext, useContext, useEffect, useMemo, useState, ReactNode } from "react";
import i18n, { LANGUAGE_KEY } from "@/i18n";
import { normalizeLocale, type SupportedLocale } from "@/i18n/utils";

type LanguageContextValue = {
  locale: SupportedLocale;
  setLocale: (locale: SupportedLocale) => void;
};

const LanguageContext = createContext<LanguageContextValue | undefined>(undefined);

const readInitialLocale = () => {
  if (typeof window === "undefined") return normalizeLocale(i18n.language);
  const stored = window.localStorage.getItem(LANGUAGE_KEY);
  return normalizeLocale(stored || i18n.language);
};

export const LanguageProvider = ({ children }: { children: ReactNode }) => {
  const [locale, setLocaleState] = useState<SupportedLocale>(readInitialLocale);

  useEffect(() => {
    i18n.changeLanguage(locale);
    if (typeof document !== "undefined") {
      document.documentElement.lang = locale;
    }
    if (typeof window !== "undefined") {
      window.localStorage.setItem(LANGUAGE_KEY, locale);
    }
  }, [locale]);

  const value = useMemo(
    () => ({
      locale,
      setLocale: setLocaleState,
    }),
    [locale]
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
