/**
 * Entrada principal do app (bootstrap do React).
 */

import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import "./index.css";
import i18n from "@/i18n";
import { I18nextProvider } from "react-i18next";
import { LanguageProvider } from "@/contexts/LanguageContext";
import { SectionErrorBoundary } from "@/components/SectionErrorBoundary";

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <SectionErrorBoundary
      code="APP_ERROR"
      fallback={
        <div className="min-h-screen bg-background flex items-center justify-center text-sm text-muted-foreground">
          {i18n.t("common.status.error", { defaultValue: "Algo deu errado." })}
        </div>
      }
    >
      <I18nextProvider i18n={i18n}>
        <LanguageProvider>
          <App />
        </LanguageProvider>
      </I18nextProvider>
    </SectionErrorBoundary>
  </React.StrictMode>,
);
