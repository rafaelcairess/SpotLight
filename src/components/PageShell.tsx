import type { HTMLAttributes, ReactNode } from "react";
import Header from "@/components/Header";
import { cn } from "@/lib/utils";

type PageWidth = "narrow" | "content" | "wide" | "full";

const widthClasses: Record<PageWidth, string> = {
  narrow: "max-w-4xl",
  content: "max-w-6xl",
  wide: "max-w-[1440px]",
  full: "max-w-none",
};

interface PageShellProps {
  children: ReactNode;
  className?: string;
  mainClassName?: string;
  ambient?: boolean;
}

/** Shared page frame used by the main product journeys. */
export function PageShell({ children, className, mainClassName, ambient = true }: PageShellProps) {
  return (
    <div className={cn("relative min-h-screen overflow-x-clip bg-background", className)}>
      <Header />
      {ambient && (
        <div className="pointer-events-none fixed inset-0 overflow-hidden" aria-hidden="true">
          <div className="absolute -left-48 -top-40 h-[34rem] w-[34rem] rounded-full bg-primary/[0.10] blur-[120px]" />
          <div className="absolute -right-56 top-48 h-[32rem] w-[32rem] rounded-full bg-indigo-500/[0.07] blur-[130px]" />
          <div className="premium-grid absolute inset-0 opacity-35" />
        </div>
      )}
      <main
        className={cn(
          "relative z-10 pt-[calc(4.75rem+env(safe-area-inset-top))] lg:pt-[5.75rem]",
          mainClassName,
        )}
      >
        {children}
      </main>
    </div>
  );
}

interface PageContainerProps extends HTMLAttributes<HTMLElement> {
  width?: PageWidth;
  as?: "div" | "section" | "article";
}

export function PageContainer({
  width = "wide",
  as: Component = "div",
  className,
  ...props
}: PageContainerProps) {
  return (
    <Component
      className={cn("mx-auto w-full px-3.5 sm:px-6 lg:px-8", widthClasses[width], className)}
      {...props}
    />
  );
}

export function PageSurface({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return <div className={cn("premium-surface", className)} {...props} />;
}
