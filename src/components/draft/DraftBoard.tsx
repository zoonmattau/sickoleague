"use client";

import { useMemo } from "react";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import type { Position } from "@prisma/client";

interface Club {
  id: string;
  name: string;
  abbreviation: string;
  primaryColor: string | null;
  secondaryColor: string | null;
}

interface Pick {
  id: string;
  round: number;
  pickNumber: number;
  clubId: string;
  club: Club;
  originalClubId: string;
  originalClub: { id: string; name: string; abbreviation: string };
  used: boolean;
  passed: boolean;
  player: {
    id: string;
    name: string;
    positions: Position[];
    avgPoints: number | null;
    aflTeam: string | null;
  } | null;
}

interface DraftBoardProps {
  picks: Pick[];
  clubs: Club[];
  currentPickNumber: number;
  draftOrder: string[];
  numRounds?: number;
}

const POSITION_COLORS: Record<Position, string> = {
  DEF: "bg-blue-500/20 text-blue-700 dark:text-blue-300",
  MID: "bg-green-500/20 text-green-700 dark:text-green-300",
  RUC: "bg-purple-500/20 text-purple-700 dark:text-purple-300",
  FWD: "bg-red-500/20 text-red-700 dark:text-red-300",
};

export function DraftBoard({
  picks,
  clubs,
  currentPickNumber,
  draftOrder,
  numRounds = 21,
}: DraftBoardProps) {
  // Build a grid of picks: picks[round][clubIndex]
  const grid = useMemo(() => {
    const numClubs = clubs.length;
    const result: (Pick | null)[][] = [];

    // Create club order based on first-round draft order
    const firstRoundClubIds = draftOrder.slice(0, numClubs);
    const clubOrder = firstRoundClubIds.map((clubId) =>
      clubs.find((c) => c.id === clubId) || clubs[0]
    );

    for (let round = 1; round <= numRounds; round++) {
      const roundPicks: (Pick | null)[] = [];

      for (let i = 0; i < numClubs; i++) {
        const clubId = clubOrder[i].id;
        // Find pick in this round owned by this club (based on current owner)
        const pick = picks.find(
          (p) => p.round === round && p.clubId === clubId
        );
        roundPicks.push(pick || null);
      }

      result.push(roundPicks);
    }

    return { rounds: result, clubOrder };
  }, [picks, clubs, draftOrder, numRounds]);

  const { rounds, clubOrder } = grid;

  return (
    <div className="w-full overflow-x-auto">
      <table className="w-full border-collapse min-w-[800px]">
        <thead>
          <tr>
            <th className="sticky left-0 z-20 bg-background p-2 text-left text-xs font-medium text-muted-foreground border-b w-12">
              Rd
            </th>
            {clubOrder.map((club) => (
              <th
                key={club.id}
                className="p-2 text-center border-b min-w-[80px]"
                style={{
                  backgroundColor: club.primaryColor || undefined,
                  color: club.secondaryColor || undefined,
                }}
              >
                <div className="font-bold text-sm">{club.abbreviation}</div>
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rounds.map((roundPicks, roundIndex) => (
            <tr key={roundIndex} className="border-b">
              <td className="sticky left-0 z-10 bg-background p-2 text-xs font-medium text-muted-foreground w-12">
                R{roundIndex + 1}
              </td>
              {roundPicks.map((pick, clubIndex) => {
                const isCurrentPick = pick?.pickNumber === currentPickNumber;
                const club = clubOrder[clubIndex];

                return (
                  <td
                    key={clubIndex}
                    className={cn(
                      "p-1 text-center align-middle border-x",
                      isCurrentPick && "ring-2 ring-primary ring-inset bg-primary/10"
                    )}
                  >
                    {pick ? (
                      <div className="min-h-[48px] flex flex-col items-center justify-center">
                        {pick.used && pick.player ? (
                          <div className="space-y-0.5">
                            <div className="text-xs font-medium truncate max-w-[70px]">
                              {pick.player.name.split(" ")[0].charAt(0)}.{" "}
                              {pick.player.name.split(" ").slice(1).join(" ")}
                            </div>
                            <div className="flex gap-0.5 justify-center">
                              {pick.player.positions.slice(0, 2).map((pos) => (
                                <Badge
                                  key={pos}
                                  variant="outline"
                                  className={cn(
                                    "text-[8px] px-1 py-0 h-4",
                                    POSITION_COLORS[pos]
                                  )}
                                >
                                  {pos}
                                </Badge>
                              ))}
                            </div>
                          </div>
                        ) : pick.passed ? (
                          <span className="text-xs text-muted-foreground italic">
                            Pass
                          </span>
                        ) : isCurrentPick ? (
                          <span className="text-xs font-bold text-primary animate-pulse">
                            Pick #{pick.pickNumber}
                          </span>
                        ) : (
                          <span className="text-[10px] text-muted-foreground">
                            #{pick.pickNumber}
                          </span>
                        )}
                        {/* Show if pick was traded */}
                        {pick.originalClubId !== pick.clubId && (
                          <div className="text-[8px] text-muted-foreground">
                            via {pick.originalClub.abbreviation}
                          </div>
                        )}
                      </div>
                    ) : (
                      <div className="min-h-[48px] flex items-center justify-center">
                        <span className="text-xs text-muted-foreground">-</span>
                      </div>
                    )}
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
