export function Skeleton({ className = '' }: { className?: string }) {
  return (
    <div
      className={`animate-pulse rounded-lg bg-brand-800/20 ${className}`}
    />
  );
}

export function TrackSkeleton() {
  return (
    <div className="flex items-center gap-4 rounded-xl bg-[#15151f] p-4">
      <Skeleton className="w-8 h-4" />
      <Skeleton className="w-12 h-12 rounded-lg" />
      <div className="flex-1 space-y-2">
        <Skeleton className="h-4 w-3/4" />
        <Skeleton className="h-3 w-1/2" />
      </div>
      <div className="hidden sm:block space-y-2 text-right">
        <Skeleton className="h-3 w-12 ml-auto" />
        <Skeleton className="h-3 w-16 ml-auto" />
      </div>
    </div>
  );
}

export function TrackListSkeleton({ count = 5 }: { count?: number }) {
  return (
    <div className="space-y-3">
      {Array.from({ length: count }).map((_, i) => (
        <TrackSkeleton key={i} />
      ))}
    </div>
  );
}

export function CardSkeleton() {
  return (
    <div className="rounded-2xl bg-[#15151f] p-6">
      <Skeleton className="w-full h-32 rounded-xl mb-4" />
      <Skeleton className="h-5 w-3/4 mb-2" />
      <Skeleton className="h-3 w-full mb-1" />
      <Skeleton className="h-3 w-2/3 mb-4" />
      <div className="flex justify-between">
        <Skeleton className="h-6 w-16" />
        <Skeleton className="h-5 w-20 rounded-full" />
      </div>
    </div>
  );
}

export function CardGridSkeleton({ count = 3 }: { count?: number }) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
      {Array.from({ length: count }).map((_, i) => (
        <CardSkeleton key={i} />
      ))}
    </div>
  );
}

export function EventCardSkeleton() {
  return (
    <div className="rounded-2xl bg-[#15151f] p-6">
      <div className="flex items-start justify-between mb-3">
        <div className="space-y-2">
          <Skeleton className="h-3 w-24" />
          <Skeleton className="h-5 w-40" />
          <Skeleton className="h-3 w-28" />
        </div>
        <Skeleton className="h-5 w-16 rounded-full" />
      </div>
      <div className="flex gap-4">
        <Skeleton className="h-3 w-20" />
        <Skeleton className="h-3 w-24" />
      </div>
    </div>
  );
}

export function ArtistCardSkeleton() {
  return (
    <div className="rounded-2xl bg-[#15151f] p-6 flex flex-col items-center">
      <Skeleton className="w-20 h-20 rounded-full mb-4" />
      <Skeleton className="h-5 w-32 mb-2" />
      <Skeleton className="h-5 w-16 rounded-full" />
    </div>
  );
}

export function DetailPageSkeleton() {
  return (
    <div className="min-h-screen pt-24 pb-16 px-6">
      <div className="max-w-3xl mx-auto">
        <Skeleton className="h-4 w-32 mb-8" />
        <div className="flex gap-6 items-start mb-10">
          <Skeleton className="w-32 h-32 rounded-2xl shrink-0" />
          <div className="flex-1 space-y-3">
            <Skeleton className="h-3 w-16" />
            <Skeleton className="h-8 w-3/4" />
            <Skeleton className="h-5 w-24 rounded-full" />
          </div>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-10">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="rounded-xl bg-[#15151f] p-4 text-center">
              <Skeleton className="h-8 w-16 mx-auto mb-2" />
              <Skeleton className="h-3 w-12 mx-auto" />
            </div>
          ))}
        </div>
        <Skeleton className="h-48 w-full rounded-2xl" />
      </div>
    </div>
  );
}
