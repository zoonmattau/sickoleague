"use client";

import { Trophy } from "lucide-react";
import { cn } from "@/lib/utils";

interface TrophyCaseProps {
  trophies: {
    season: { year: number };
    competition: string;
  }[];
  clubName?: string;
}

export function TrophyCase({ trophies, clubName }: TrophyCaseProps) {
  if (trophies.length === 0) {
    return null;
  }

  // Group by competition
  const seniorsTrophies = trophies.filter((t) => t.competition === "SENIORS");
  const reservesTrophies = trophies.filter((t) => t.competition === "RESERVES");

  return (
    <div className="space-y-3">
      <h4 className="text-sm font-medium text-muted-foreground flex items-center gap-2">
        <Trophy className="h-4 w-4" />
        {clubName ? `${clubName} Premierships` : "Premierships"}
      </h4>

      {seniorsTrophies.length > 0 && (
        <div>
          <p className="text-xs text-muted-foreground mb-1">Seniors</p>
          <div className="flex flex-wrap gap-2">
            {seniorsTrophies.map((trophy, idx) => (
              <div
                key={idx}
                className={cn(
                  "relative group",
                  "flex items-center justify-center",
                  "w-10 h-10 rounded-lg",
                  "bg-gradient-to-br from-yellow-400 to-yellow-600",
                  "shadow-md hover:shadow-lg transition-shadow"
                )}
              >
                <Trophy className="h-5 w-5 text-yellow-100" />
                <span className="absolute -bottom-1 -right-1 text-xs font-bold bg-background rounded px-1 shadow">
                  {trophy.season.year.toString().slice(-2)}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {reservesTrophies.length > 0 && (
        <div>
          <p className="text-xs text-muted-foreground mb-1">Reserves</p>
          <div className="flex flex-wrap gap-2">
            {reservesTrophies.map((trophy, idx) => (
              <div
                key={idx}
                className={cn(
                  "relative group",
                  "flex items-center justify-center",
                  "w-8 h-8 rounded-lg",
                  "bg-gradient-to-br from-gray-300 to-gray-500",
                  "shadow-md hover:shadow-lg transition-shadow"
                )}
              >
                <Trophy className="h-4 w-4 text-gray-100" />
                <span className="absolute -bottom-1 -right-1 text-xs font-bold bg-background rounded px-1 shadow">
                  {trophy.season.year.toString().slice(-2)}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
