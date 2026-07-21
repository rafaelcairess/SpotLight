/**
 * Componente compartilhado (LanguageSwitcher).
 */

import { Globe } from "lucide-react";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { useLanguage } from "@/contexts/LanguageContext";
import { useTranslation } from "react-i18next";

const LANGUAGE_OPTIONS = [
  { value: "pt", short: "PT" },
  { value: "en", short: "EN" },
  { value: "es", short: "ES" },
] as const;

type LanguageValue = (typeof LANGUAGE_OPTIONS)[number]["value"];

interface LanguageSwitcherProps {
  showLabel?: boolean;
  align?: "start" | "end";
}

export default function LanguageSwitcher({ showLabel = false, align = "end" }: LanguageSwitcherProps) {
  const { locale, setLocale } = useLanguage();
  const { t } = useTranslation();

  const currentLabel = t(`languageOptions.${locale}`);
  const currentShort = LANGUAGE_OPTIONS.find((opt) => opt.value === locale)?.short ?? locale.toUpperCase();

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="sm" className="gap-2">
          <Globe className="w-4 h-4" />
          <span className="text-xs font-semibold">{currentShort}</span>
          {showLabel && (
            <span className="text-sm text-muted-foreground">{currentLabel}</span>
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align={align} className="w-40">
        {LANGUAGE_OPTIONS.map((option) => (
          <DropdownMenuItem
            key={option.value}
            onClick={() => setLocale(option.value as LanguageValue)}
            className={option.value === locale ? "text-primary font-semibold" : ""}
          >
            {t(`languageOptions.${option.value}`)}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
