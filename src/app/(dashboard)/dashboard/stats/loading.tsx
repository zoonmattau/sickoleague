import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

export default function StatsLoading() {
  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <Skeleton className="h-8 w-32 mb-2" />
        <Skeleton className="h-5 w-48" />
      </div>

      <div className="flex gap-2">
        {[...Array(4)].map((_, i) => (
          <Skeleton key={i} className="h-10 w-24" />
        ))}
      </div>

      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-40" />
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {[...Array(15)].map((_, i) => (
              <div key={i} className="flex items-center gap-4 p-2">
                <Skeleton className="h-6 w-6" />
                <Skeleton className="h-8 w-8 rounded-full" />
                <Skeleton className="h-5 w-40" />
                <Skeleton className="h-5 w-16 ml-auto" />
                <Skeleton className="h-5 w-12" />
                <Skeleton className="h-5 w-12" />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
