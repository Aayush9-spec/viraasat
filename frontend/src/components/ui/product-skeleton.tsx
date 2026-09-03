import { Skeleton } from "@/components/ui/skeleton";

export function ProductSkeleton() {
  return (
    <div className="rounded-2xl border border-border/40 bg-card p-4 space-y-4 shadow-sm">
      <Skeleton className="h-56 w-full rounded-xl bg-muted/60" />
      <div className="space-y-2">
        <Skeleton className="h-5 w-3/4 bg-muted/60" />
        <Skeleton className="h-4 w-1/2 bg-muted/40" />
      </div>
      <div className="flex items-center justify-between pt-2 border-t border-border/20">
        <Skeleton className="h-6 w-20 bg-muted/60" />
        <Skeleton className="h-8 w-24 rounded-full bg-primary/20" />
      </div>
    </div>
  );
}

export function ProductGridSkeleton({ count = 8 }: { count?: number }) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8 w-full">
      {Array.from({ length: count }).map((_, i) => (
        <ProductSkeleton key={i} />
      ))}
    </div>
  );
}
