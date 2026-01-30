import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

export default function StaffLoading() {
  return (
    <div className="space-y-6">
      <div>
        <Skeleton className="h-9 w-56" />
        <Skeleton className="h-5 w-72 mt-2" />
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-3 gap-4">
        {Array.from({ length: 3 }).map((_, i) => (
          <Card key={i}>
            <CardHeader className="pb-2">
              <Skeleton className="h-4 w-20" />
              <Skeleton className="h-8 w-12 mt-1" />
            </CardHeader>
          </Card>
        ))}
      </div>

      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-56" />
          <Skeleton className="h-4 w-80" />
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Filter skeletons */}
          <div className="flex gap-4">
            <Skeleton className="h-10 flex-1" />
            <Skeleton className="h-10 w-40" />
          </div>

          {/* Info box */}
          <Skeleton className="h-24 w-full" />

          {/* League sections */}
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-14 w-full" />
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
