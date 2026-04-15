/**
 * Error boundary para seções individuais — evita que um crash derrube a página inteira.
 */

import React from "react";
import { AlertTriangle } from "lucide-react";

interface State {
  hasError: boolean;
  errorCode?: string;
}

interface Props {
  children: React.ReactNode;
  code?: string; // código de erro para exibir
  fallback?: React.ReactNode;
}

export class SectionErrorBoundary extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(): State {
    return { hasError: true };
  }

  componentDidCatch(error: Error) {
    console.error(`[SectionErrorBoundary code=${this.props.code}]`, error.message);
  }

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) return this.props.fallback;
      return (
        <div className="rounded-xl border border-destructive/30 bg-destructive/5 p-4 flex items-center gap-3 text-sm text-muted-foreground">
          <AlertTriangle className="w-4 h-4 text-destructive flex-shrink-0" />
          <span>
            Erro ao carregar esta seção.{" "}
            {this.props.code && (
              <code className="text-xs bg-secondary px-1.5 py-0.5 rounded font-mono">
                {this.props.code}
              </code>
            )}
          </span>
        </div>
      );
    }
    return this.props.children;
  }
}
