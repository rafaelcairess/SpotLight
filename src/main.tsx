import { createRoot } from "react-dom/client";
import { SpeedInsights } from "@vercel/speed-insights/react";
import App from "./App.tsx";
import "./index.css";
import { initSentry, Sentry } from "./lib/sentry";

initSentry();

createRoot(document.getElementById("root")!).render(
  <>
    <Sentry.ErrorBoundary
      fallback={
        <div className="min-h-screen bg-background flex items-center justify-center text-muted-foreground">
          Algo deu errado. Tente recarregar a página.
        </div>
      }
    >
      <App />
    </Sentry.ErrorBoundary>
    <SpeedInsights />
  </>
);
