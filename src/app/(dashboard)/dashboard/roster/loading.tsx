import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

export default function RosterLoading() {
  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <Skeleton className="h-8 w-40 mb-2" />
          <Skeleton className="h-5 w-56" />
        </div>
        <Skeleton className="h-10 w-32" />
      </div>

      {/* Main Lineup Card */}
      <Card className="overflow-hidden border-0 shadow-lg">
        {/* Team Headers */}
        <CardHeader className="pb-0 pt-0 px-0">
          <div className="grid grid-cols-2">
            <div className="px-4 py-3 border-b-4 border-primary">
              <Skeleton className="h-6 w-32 mb-1" />
              <Skeleton className="h-3 w-16" />
            </div>
            <div className="px-4 py-3 border-b-4 border-primary border-l">
              <Skeleton className="h-6 w-32 mb-1" />
              <Skeleton className="h-3 w-16" />
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {/* Column Headers */}
          <div className="grid grid-cols-2 border-b">
            <div className="flex items-center gap-2 px-3 py-2 bg-muted/30">
              <Skeleton className="h-3 w-full" />
            </div>
            <div className="flex items-center gap-2 px-3 py-2 bg-muted/30 border-l">
              <Skeleton className="h-3 w-full" />
            </div>
          </div>

          {/* Position Groups */}
          {["DEF", "MID", "RUC", "FWD"].map((pos, groupIdx) => (
            <div key={pos} className="border-b last:border-b-0">
              {/* Group Header */}
              <div className="grid grid-cols-2 bg-muted/40">
                <div className="flex items-center gap-2 px-3 py-1.5">
                  <Skeleton className="h-4 w-24" />
                </div>
                <div className="flex items-center gap-2 px-3 py-1.5 border-l">
                  <Skeleton className="h-4 w-24" />
                </div>
              </div>
              {/* Slots */}
              {[...Array(pos === "RUC" ? 1 : pos === "MID" ? 4 : 3)].map((_, i) => (
                <div key={i} className="grid grid-cols-2 border-t border-muted/50">
                  <div className="px-3 py-2">
                    <div className="flex items-center gap-2">
                      <Skeleton className="h-5 w-5 rounded-full" />
                      <Skeleton className="h-4 w-32" />
                      <Skeleton className="h-4 w-10 ml-auto hidden md:block" />
                      <Skeleton className="h-4 w-12" />
                      <Skeleton className="h-4 w-8" />
                    </div>
                  </div>
                  <div className="px-3 py-2 border-l">
                    {i < (pos === "RUC" ? 1 : pos === "MID" ? 3 : 2) ? (
                      <div className="flex items-center gap-2">
                        <Skeleton className="h-5 w-5 rounded-full" />
                        <Skeleton className="h-4 w-32" />
                        <Skeleton className="h-4 w-10 ml-auto hidden md:block" />
                        <Skeleton className="h-4 w-12" />
                        <Skeleton className="h-4 w-8" />
                      </div>
                    ) : (
                      <div className="h-8" />
                    )}
                  </div>
                </div>
              ))}
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Bench & IL */}
      <div className="grid gap-4 md:grid-cols-2">
        <Card className="overflow-hidden border-0 shadow-lg">
          <CardHeader className="pb-0 pt-0 px-0">
            <div className="px-4 py-2 bg-muted/40 border-b">
              <Skeleton className="h-5 w-20" />
            </div>
          </CardHeader>
          <CardContent className="p-0">
            {[...Array(2)].map((_, i) => (
              <div key={i} className={`px-3 py-2 ${i > 0 ? 'border-t border-muted/50' : ''}`}>
                <div className="flex items-center gap-2">
                  <Skeleton className="h-5 w-5 rounded-full" />
                  <Skeleton className="h-4 w-32" />
                  <Skeleton className="h-4 w-12 ml-auto" />
                  <Skeleton className="h-4 w-8" />
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card className="overflow-hidden border-0 shadow-lg">
          <CardHeader className="pb-0 pt-0 px-0">
            <div className="px-4 py-2 bg-muted/40 border-b">
              <Skeleton className="h-5 w-24" />
            </div>
          </CardHeader>
          <CardContent className="p-0">
            {[...Array(2)].map((_, i) => (
              <div key={i} className={`px-3 py-2 ${i > 0 ? 'border-t border-muted/50' : ''}`}>
                <div className="flex items-center gap-2">
                  <Skeleton className="h-5 w-5 rounded-full" />
                  <Skeleton className="h-4 w-32" />
                  <Skeleton className="h-4 w-12 ml-auto" />
                  <Skeleton className="h-4 w-8" />
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
