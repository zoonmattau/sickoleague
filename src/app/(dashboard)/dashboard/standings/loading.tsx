import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

export default function StandingsLoading() {
  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <Skeleton className="h-8 w-40 mb-2" />
        <Skeleton className="h-5 w-64" />
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {[...Array(2)].map((_, i) => (
          <Card key={i}>
            <CardHeader>
              <Skeleton className="h-6 w-32" />
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {[...Array(12)].map((_, j) => (
                  <div key={j} className="flex items-center gap-3 p-2">
                    <Skeleton className="h-6 w-6" />
                    <Skeleton className="h-5 w-32" />
                    <Skeleton className="h-5 w-12 ml-auto" />
                    <Skeleton className="h-5 w-12" />
                    <Skeleton className="h-5 w-16" />
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
