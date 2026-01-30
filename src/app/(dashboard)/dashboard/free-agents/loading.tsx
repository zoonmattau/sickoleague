import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

export default function FreeAgentsLoading() {
  return (
    <div className="space-y-6">
      <div>
        <Skeleton className="h-9 w-48" />
        <Skeleton className="h-5 w-72 mt-2" />
      </div>

      <Skeleton className="h-10 w-64" />

      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-48" />
          <Skeleton className="h-4 w-80" />
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Filter skeletons */}
          <div className="flex gap-4">
            <Skeleton className="h-10 flex-1" />
            <Skeleton className="h-10 w-36" />
            <Skeleton className="h-10 w-36" />
          </div>

          {/* Stats bar */}
          <Skeleton className="h-16 w-full" />

          {/* Table skeleton */}
          <div className="space-y-2">
            <Skeleton className="h-10 w-full" />
            {Array.from({ length: 8 }).map((_, i) => (
              <Skeleton key={i} className="h-14 w-full" />
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
