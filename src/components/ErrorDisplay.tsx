/**
 * Componente de exibição de erro padronizado com código.
 */

import { AlertTriangle, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface ErrorDisplayProps {
  code: string;        // ex: "PROFILE_NOT_FOUND"
  message: string;     // mensagem amigável
  detail?: string;     // detalhe técnico opcional
  onRetry?: () => void;
  className?: string;
  variant?: "page" | "section" | "inline";
}

export function ErrorDisplay({
  code,
  message,
  detail,
  onRetry,
  className,
  variant = "section",
}: ErrorDisplayProps) {
  if (variant === "inline") {
    return (
      <span className={cn("text-sm text-muted-foreground inline-flex items-center gap-1.5", className)}>
        <AlertTriangle className="w-3.5 h-3.5 text-destructive" />
        {message}
        <code className="text-xs bg-secondary px-1 py-0.5 rounded font-mono">{code}</code>
      </span>
    );
  }

  if (variant === "page") {
    return (
      <div className={cn("min-h-[40vh] flex flex-col items-center justify-center gap-4 text-center px-4", className)}>
        <AlertTriangle className="w-10 h-10 text-destructive/60" />
        <div className="space-y-1">
          <p className="font-semibold">{message}</p>
          {detail && <p className="text-sm text-muted-foreground">{detail}</p>}
        </div>
        <code className="text-xs bg-secondary px-2 py-1 rounded font-mono text-muted-foreground">
          Código: {code}
        </code>
        {onRetry && (
          <Button variant="outline" size="sm" onClick={onRetry} className="gap-2 mt-2">
            <RefreshCw className="w-3.5 h-3.5" />
            Tentar novamente
          </Button>
        )}
      </div>
    );
  }

  return (
    <div className={cn("rounded-xl border border-destructive/30 bg-destructive/5 p-4 space-y-2", className)}>
      <div className="flex items-center gap-2 text-sm font-medium text-destructive">
        <AlertTriangle className="w-4 h-4 flex-shrink-0" />
        {message}
      </div>
      {detail && <p className="text-xs text-muted-foreground pl-6">{detail}</p>}
      <div className="flex items-center justify-between pl-6">
        <code className="text-xs bg-secondary px-1.5 py-0.5 rounded font-mono text-muted-foreground">
          {code}
        </code>
        {onRetry && (
          <Button variant="ghost" size="sm" onClick={onRetry} className="gap-1.5 h-7 text-xs">
            <RefreshCw className="w-3 h-3" />
            Tentar novamente
          </Button>
        )}
      </div>
    </div>
  );
}
