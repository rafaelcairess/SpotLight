import { cn } from "@/lib/utils";

interface LoadingSkeletonProps {
  variant?: "card" | "banner" | "ranking" | "category";
  count?: number;
}

const LoadingSkeleton = ({ variant = "card", count = 6 }: LoadingSkeletonProps) => {
  if (variant === "banner") {
    return (
      <div className="w-full aspect-[21/9] md:aspect-[21/8] rounded-2xl skeleton-shimmer" />
    );
  }

  if (variant === "ranking") {
    return (
      <div className="space-y-2">
        {Array.from({ length: count }).map((_, i) => (
          <div
            key={i}
            className="flex items-center gap-4 p-3 rounded-xl bg-card border border-border/50"
          >
            <div className="w-8 h-8 skeleton-shimmer rounded" />
            <div className="w-20 h-12 skeleton-shimmer rounded-md" />
            <div className="flex-1 space-y-2">
              <div className="h-4 w-3/4 skeleton-shimmer rounded" />
              <div className="h-3 w-1/2 skeleton-shimmer rounded" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (variant === "category") {
    return (
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {Array.from({ length: count }).map((_, i) => (
          <div
            key={i}
            className="aspect-[16/10] rounded-xl skeleton-shimmer"
          />
        ))}
      </div>
    );
  }

  return (
    <div className={cn("grid gap-4 md:gap-6", "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3")}>
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="rounded-xl overflow-hidden bg-card border border-border/50">
          <div className="aspect-[16/9] skeleton-shimmer" />
          <div className="p-4 space-y-3">
            <div className="h-5 w-3/4 skeleton-shimmer rounded" />
            <div className="h-4 w-1/2 skeleton-shimmer rounded" />
            <div className="h-3 w-full skeleton-shimmer rounded" />
          </div>
        </div>
      ))}
    </div>
  );
};

export default LoadingSkeleton;
