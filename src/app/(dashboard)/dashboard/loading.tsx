import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

export default function DashboardLoading() {
  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header skeleton */}
      <div>
        <Skeleton className="h-9 w-48 mb-2" />
        <Skeleton className="h-5 w-32" />
      </div>

      {/* Overview cards skeleton */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
        {[...Array(5)].map((_, i) => (
          <Card key={i} className="relative overflow-hidden">
            <div className="absolute left-0 top-0 bottom-0 w-1 bg-muted" />
            <CardContent className="pt-4 pb-4 pl-5">
              <Skeleton className="h-4 w-20 mb-3" />
              <Skeleton className="h-8 w-24 mb-3" />
              <Skeleton className="h-2 w-full mb-3" />
              <Skeleton className="h-4 w-32" />
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Upcoming match + checklist skeleton */}
      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardContent className="pt-6">
            <Skeleton className="h-6 w-32 mb-4" />
            <div className="space-y-3">
              <Skeleton className="h-20 w-full" />
              <Skeleton className="h-20 w-full" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <Skeleton className="h-6 w-24 mb-4" />
            <div className="space-y-2">
              <Skeleton className="h-8 w-full" />
              <Skeleton className="h-8 w-full" />
              <Skeleton className="h-8 w-full" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Graph cards skeleton */}
      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardContent className="pt-6">
            <Skeleton className="h-6 w-40 mb-4" />
            <Skeleton className="h-44 w-full" />
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <Skeleton className="h-6 w-40 mb-4" />
            <Skeleton className="h-44 w-full" />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
