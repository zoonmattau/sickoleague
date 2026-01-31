"use client";

import { useMemo } from "react";
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
  draftOrderType?: "STRAIGHT" | "SNAKE";
}

const POSITION_COLORS: Record<Position, string> = {
  DEF: "text-blue-400",
  MID: "text-green-400",
  RUC: "text-purple-400",
  FWD: "text-red-400",
};

export function DraftBoard({
  picks,
  clubs,
  currentPickNumber,
  draftOrder,
  numRounds = 21,
  draftOrderType = "SNAKE",
}: DraftBoardProps) {
  // Build a grid of picks organized by round and column position
  const grid = useMemo(() => {
    const numClubs = clubs.length;

    // Get round 1 club order from draftOrder
    const firstRoundClubIds = draftOrder.slice(0, numClubs);
    const clubOrder = firstRoundClubIds.map((clubId) =>
      clubs.find((c) => c.id === clubId) || clubs[0]
    );

    // For each round, we need to figure out which pick goes in which column
    // In SNAKE order, even rounds are reversed
    const rounds: (Pick | null)[][] = [];

    for (let round = 1; round <= numRounds; round++) {
      const roundPicks: (Pick | null)[] = new Array(numClubs).fill(null);

      // Get all picks for this round
      const picksInRound = picks.filter(p => p.round === round);

      for (const pick of picksInRound) {
        // Find which column (0-11) this pick belongs to based on pick number
        const pickInRound = ((pick.pickNumber - 1) % numClubs);

        // For snake draft, even rounds go in reverse column order
        let columnIndex: number;
        if (draftOrderType === "SNAKE" && round % 2 === 0) {
          // Even round - reverse: pick 0 in round goes to column 11, pick 11 goes to column 0
          columnIndex = numClubs - 1 - pickInRound;
        } else {
          // Odd round or straight draft - normal order
          columnIndex = pickInRound;
        }

        roundPicks[columnIndex] = pick;
      }

      rounds.push(roundPicks);
    }

    return { rounds, clubOrder };
  }, [picks, clubs, draftOrder, numRounds, draftOrderType]);

  const { rounds, clubOrder } = grid;

  return (
    <div className="w-full overflow-x-auto bg-zinc-900 rounded-lg">
      <table className="w-full border-collapse min-w-[900px]">
        {/* Header - Team Names */}
        <thead>
          <tr className="bg-zinc-800">
            <th className="sticky left-0 z-20 bg-zinc-800 px-2 py-3 text-center text-xs font-bold text-zinc-400 border-r border-zinc-700 w-10">
              RD
            </th>
            {clubOrder.map((club, idx) => (
              <th
                key={club.id}
                className="px-1 py-2 text-center border-r border-zinc-700 min-w-[75px]"
                style={{
                  backgroundColor: club.primaryColor || '#3f3f46',
                  color: club.secondaryColor || '#ffffff',
                }}
              >
                <div className="font-bold text-xs">{club.abbreviation}</div>
                <div className="text-[10px] opacity-75">#{idx + 1}</div>
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rounds.map((roundPicks, roundIndex) => {
            const roundNum = roundIndex + 1;
            const isEvenRound = roundNum % 2 === 0;

            return (
              <tr
                key={roundIndex}
                className={cn(
                  "border-b border-zinc-800",
                  isEvenRound && draftOrderType === "SNAKE" ? "bg-zinc-850" : "bg-zinc-900"
                )}
              >
                <td className="sticky left-0 z-10 bg-zinc-800 px-2 py-1 text-center text-xs font-bold text-zinc-400 border-r border-zinc-700">
                  {roundNum}
                </td>
                {roundPicks.map((pick, colIndex) => {
                  const isCurrentPick = pick?.pickNumber === currentPickNumber;

                  return (
                    <td
                      key={colIndex}
                      className={cn(
                        "px-1 py-1 text-center align-top border-r border-zinc-800 transition-all",
                        isCurrentPick && "bg-yellow-500/20 ring-2 ring-yellow-500 ring-inset"
                      )}
                    >
                      <div className="min-h-[52px] flex flex-col">
                        {pick ? (
                          <>
                            {/* Pick number - always shown */}
                            <div className={cn(
                              "text-[10px] font-bold mb-0.5",
                              isCurrentPick ? "text-yellow-400" : "text-zinc-500"
                            )}>
                              {pick.pickNumber}
                            </div>

                            {pick.used && pick.player ? (
                              // Drafted player
                              <div className="flex-1 flex flex-col justify-center">
                                <div className="text-[11px] font-semibold text-white truncate leading-tight">
                                  {pick.player.name.split(" ")[0].charAt(0)}. {pick.player.name.split(" ").slice(1).join(" ")}
                                </div>
                                <div className="flex justify-center gap-0.5 mt-0.5">
                                  {pick.player.positions.map((pos) => (
                                    <span
                                      key={pos}
                                      className={cn(
                                        "text-[9px] font-bold",
                                        POSITION_COLORS[pos]
                                      )}
                                    >
                                      {pos}
                                    </span>
                                  ))}
                                </div>
                                {pick.player.avgPoints && (
                                  <div className="text-[9px] text-zinc-500 mt-0.5">
                                    {pick.player.avgPoints.toFixed(0)} avg
                                  </div>
                                )}
                              </div>
                            ) : pick.passed ? (
                              // Passed pick
                              <div className="flex-1 flex items-center justify-center">
                                <span className="text-[10px] text-zinc-600 italic">PASS</span>
                              </div>
                            ) : isCurrentPick ? (
                              // Current pick - on the clock
                              <div className="flex-1 flex items-center justify-center">
                                <span className="text-[10px] font-bold text-yellow-400 animate-pulse">
                                  ON CLOCK
                                </span>
                              </div>
                            ) : (
                              // Future pick
                              <div className="flex-1" />
                            )}

                            {/* Traded indicator */}
                            {pick.originalClubId !== pick.clubId && (
                              <div className="text-[8px] text-zinc-600">
                                via {pick.originalClub.abbreviation}
                              </div>
                            )}
                          </>
                        ) : (
                          // No pick data
                          <div className="flex-1 flex items-center justify-center">
                            <span className="text-[10px] text-zinc-700">-</span>
                          </div>
                        )}
                      </div>
                    </td>
                  );
                })}
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
