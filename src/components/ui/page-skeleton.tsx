import { Skeleton } from "@/components/ui/skeleton";

/** Full-page loading fallback for lazy routes */
export function PageSkeleton() {
  return (
    <div className="min-h-screen bg-background animate-in fade-in duration-200">
      <div className="gradient-primary px-6 pt-12 pb-8 rounded-b-3xl">
        <Skeleton className="h-8 w-32 bg-primary-foreground/20" />
        <Skeleton className="h-4 w-48 mt-3 bg-primary-foreground/10" />
      </div>
      <div className="px-6 mt-6 space-y-3">
        <Skeleton className="h-24 w-full rounded-2xl" />
        <div className="grid grid-cols-3 gap-3">
          <Skeleton className="h-20 rounded-2xl" />
          <Skeleton className="h-20 rounded-2xl" />
          <Skeleton className="h-20 rounded-2xl" />
        </div>
        <Skeleton className="h-40 w-full rounded-2xl" />
      </div>
    </div>
  );
}

/** Skeleton for driver pages */
export function DriverPageSkeleton() {
  return (
    <div className="px-4 pt-4 space-y-4 animate-in fade-in duration-200">
      <Skeleton className="h-20 w-full rounded-xl" />
      <div className="grid grid-cols-3 gap-3">
        <Skeleton className="h-20 rounded-xl" />
        <Skeleton className="h-20 rounded-xl" />
        <Skeleton className="h-20 rounded-xl" />
      </div>
      <Skeleton className="h-64 w-full rounded-xl" />
    </div>
  );
}

/** Skeleton for list pages (history, earnings) */
export function ListPageSkeleton() {
  return (
    <div className="px-4 pt-4 space-y-3 animate-in fade-in duration-200">
      <Skeleton className="h-6 w-40" />
      {Array.from({ length: 5 }).map((_, i) => (
        <Skeleton key={i} className="h-16 w-full rounded-xl" />
      ))}
    </div>
  );
}

/** Skeleton for wallet/balance pages */
export function WalletPageSkeleton() {
  return (
    <div className="px-4 pt-6 space-y-6 animate-in fade-in duration-200">
      <Skeleton className="h-36 w-full rounded-2xl" />
      <div className="space-y-2">
        <Skeleton className="h-5 w-32" />
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-14 w-full rounded-xl" />
        ))}
      </div>
    </div>
  );
}

/** Skeleton for profile page */
export function ProfilePageSkeleton() {
  return (
    <div className="min-h-screen animate-in fade-in duration-200">
      <div className="gradient-primary px-6 pt-12 pb-8 rounded-b-3xl">
        <div className="flex items-center gap-4">
          <Skeleton className="w-16 h-16 rounded-full bg-primary-foreground/20" />
          <div className="space-y-2">
            <Skeleton className="h-5 w-32 bg-primary-foreground/20" />
            <Skeleton className="h-3 w-40 bg-primary-foreground/10" />
          </div>
        </div>
      </div>
      <div className="px-6 mt-4 space-y-2">
        <Skeleton className="h-20 w-full rounded-xl" />
        {Array.from({ length: 3 }).map((_, i) => (
          <Skeleton key={i} className="h-14 w-full rounded-xl" />
        ))}
      </div>
    </div>
  );
}

/** Map + card skeleton for active ride */
export function MapCardSkeleton() {
  return (
    <div className="space-y-4 animate-in fade-in duration-200">
      <Skeleton className="h-56 w-full" />
      <div className="px-4 space-y-3">
        <Skeleton className="h-32 w-full rounded-xl" />
        <Skeleton className="h-10 w-full rounded-lg" />
      </div>
    </div>
  );
}
