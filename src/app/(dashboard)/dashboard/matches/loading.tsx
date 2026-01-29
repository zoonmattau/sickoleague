import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

export default function MatchesLoading() {
  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <Skeleton className="h-8 w-32 mb-2" />
        <Skeleton className="h-5 w-48" />
      </div>

      <div className="flex gap-2">
        {[...Array(6)].map((_, i) => (
          <Skeleton key={i} className="h-10 w-16" />
        ))}
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        {[...Array(6)].map((_, i) => (
          <Card key={i}>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <Skeleton className="h-10 w-10 rounded-full" />
                  <Skeleton className="h-5 w-24" />
                </div>
                <Skeleton className="h-8 w-16" />
                <div className="flex items-center gap-3">
                  <Skeleton className="h-5 w-24" />
                  <Skeleton className="h-10 w-10 rounded-full" />
                </div>
              </div>
              <Skeleton className="h-4 w-full" />
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
