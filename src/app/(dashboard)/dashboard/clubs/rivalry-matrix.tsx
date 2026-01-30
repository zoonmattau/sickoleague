"use client";

import { useState, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Swords } from "lucide-react";
import { RivalryDetailDialog } from "./rivalry-detail-dialog";

type Club = {
  id: string;
  name: string;
  abbreviation: string;
  primaryColor: string | null;
  secondaryColor: string | null;
};

type Tension = {
  id: string;
  clubAId: string;
  clubBId: string;
  score: number;
  closeMatches: number;
  finalsMatches?: number;
  trades: number;
  ladderBattles: number;
  playerMovements?: number;
  clubA: Club;
  clubB: Club;
};

type Rival = {
  club: Club;
  reason: string;
  seasonYear: number;
};

type Props = {
  clubs: Club[];
  tensions: Tension[];
  rivalries: { clubAId: string; clubBId: string; reason: string }[];
  myClubId: string | null;
};

function getTensionColor(score: number, maxScore: number): string {
  if (score === 0) return "bg-muted/30";
  const intensity = score / Math.max(maxScore, 1);
  if (intensity >= 0.7) return "bg-red-500/60 hover:bg-red-500/70";
  if (intensity >= 0.4) return "bg-orange-500/50 hover:bg-orange-500/60";
  if (intensity >= 0.2) return "bg-yellow-500/40 hover:bg-yellow-500/50";
  return "bg-muted/50 hover:bg-muted/60";
}

export function RivalryMatrix({ clubs, tensions, rivalries, myClubId }: Props) {
  const [selectedPair, setSelectedPair] = useState<{ clubA: Club; clubB: Club } | null>(null);

  // Build a lookup for tensions
  const tensionMap = useMemo(() => {
    const map = new Map<string, Tension>();
    for (const t of tensions) {
      map.set(`${t.clubAId}-${t.clubBId}`, t);
      map.set(`${t.clubBId}-${t.clubAId}`, t);
    }
    return map;
  }, [tensions]);

  // Build a lookup for official rivalries
  const rivalrySet = useMemo(() => {
    const set = new Set<string>();
    for (const r of rivalries) {
      set.add(`${r.clubAId}-${r.clubBId}`);
      set.add(`${r.clubBId}-${r.clubAId}`);
    }
    return set;
  }, [rivalries]);

  // Find max tension score for color scaling
  const maxScore = useMemo(() => {
    return Math.max(...tensions.map(t => t.score), 1);
  }, [tensions]);

  // Get clubs that have at least one rivalry
  const clubsWithRivalries = useMemo(() => {
    const rivalClubIds = new Set<string>();
    for (const r of rivalries) {
      rivalClubIds.add(r.clubAId);
      rivalClubIds.add(r.clubBId);
    }
    return clubs.filter(c => rivalClubIds.has(c.id));
  }, [clubs, rivalries]);

  // Sort clubs to put user's club first
  const sortedClubs = useMemo(() => {
    return [...clubsWithRivalries].sort((a, b) => {
      if (a.id === myClubId) return -1;
      if (b.id === myClubId) return 1;
      return a.name.localeCompare(b.name);
    });
  }, [clubsWithRivalries, myClubId]);

  const getTension = (clubAId: string, clubBId: string): Tension | undefined => {
    return tensionMap.get(`${clubAId}-${clubBId}`);
  };

  const isRivals = (clubAId: string, clubBId: string): boolean => {
    return rivalrySet.has(`${clubAId}-${clubBId}`);
  };

  // If no rivalries exist, show a different message
  if (sortedClubs.length === 0) {
    return (
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-lg flex items-center gap-2">
            <Swords className="h-5 w-5 text-orange-500" />
            Club Rivalries
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground text-sm">No rivalries have been established yet.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <TooltipProvider delayDuration={200}>
      <Card className="lg:max-w-[50%]">
        <CardHeader className="pb-3">
          <CardTitle className="text-lg flex items-center gap-2">
            <Swords className="h-5 w-5 text-orange-500" />
            Active Rivalries
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <div className="inline-block">
              {/* Header row */}
              <div className="flex">
                <div className="w-16 shrink-0" /> {/* Corner cell */}
                {sortedClubs.map((club) => (
                  <div
                    key={club.id}
                    className="w-10 h-10 shrink-0 flex items-center justify-center"
                    title={club.name}
                  >
                    <span
                      className="text-[8px] font-bold px-1 py-0.5 rounded"
                      style={{
                        backgroundColor: club.primaryColor || "#6b7280",
                        color: club.secondaryColor || "#ffffff",
                      }}
                    >
                      {club.abbreviation}
                    </span>
                  </div>
                ))}
              </div>

              {/* Grid rows */}
              {sortedClubs.map((rowClub) => (
                <div key={rowClub.id} className="flex">
                  {/* Row header */}
                  <div
                    className="w-16 h-10 shrink-0 flex items-center px-1"
                    title={rowClub.name}
                  >
                    <span
                      className="text-[8px] font-bold px-1 py-0.5 rounded truncate"
                      style={{
                        backgroundColor: rowClub.primaryColor || "#6b7280",
                        color: rowClub.secondaryColor || "#ffffff",
                      }}
                    >
                      {rowClub.abbreviation}
                    </span>
                  </div>

                  {/* Grid cells */}
                  {sortedClubs.map((colClub, colIndex) => {
                    const rowIndex = sortedClubs.findIndex(c => c.id === rowClub.id);

                    if (rowClub.id === colClub.id) {
                      // Diagonal - self
                      return (
                        <div
                          key={colClub.id}
                          className="w-10 h-10 shrink-0 bg-muted/30"
                        />
                      );
                    }

                    // Only show lower triangle (row > col)
                    if (rowIndex < colIndex) {
                      return (
                        <div
                          key={colClub.id}
                          className="w-10 h-10 shrink-0"
                        />
                      );
                    }

                    const tension = getTension(rowClub.id, colClub.id);
                    const rivals = isRivals(rowClub.id, colClub.id);
                    const score = tension?.score ?? 0;

                    // Rivals get a distinct black background, non-rivals show tension colors
                    const cellClass = rivals
                      ? "bg-black hover:bg-gray-800"
                      : getTensionColor(score, maxScore);

                    return (
                      <Tooltip key={colClub.id}>
                        <TooltipTrigger asChild>
                          <button
                            className={`w-10 h-10 shrink-0 flex items-center justify-center text-xs font-medium transition-colors ${cellClass}`}
                            onClick={() => setSelectedPair({ clubA: rowClub, clubB: colClub })}
                          >
                            {rivals ? (
                              <Swords className="h-4 w-4 text-white" />
                            ) : (
                              score > 0 && score
                            )}
                          </button>
                        </TooltipTrigger>
                        <TooltipContent side="top" className="bg-popover text-popover-foreground border shadow-md p-3">
                          <div className="space-y-2">
                            <div className="flex items-center gap-2">
                              <span
                                className="px-2 py-0.5 rounded text-xs font-bold"
                                style={{
                                  backgroundColor: rowClub.primaryColor || "#6b7280",
                                  color: rowClub.secondaryColor || "#ffffff",
                                }}
                              >
                                {rowClub.abbreviation}
                              </span>
                              <span className="text-muted-foreground">vs</span>
                              <span
                                className="px-2 py-0.5 rounded text-xs font-bold"
                                style={{
                                  backgroundColor: colClub.primaryColor || "#6b7280",
                                  color: colClub.secondaryColor || "#ffffff",
                                }}
                              >
                                {colClub.abbreviation}
                              </span>
                            </div>
                            {rivals && (
                              <div className="text-orange-500 flex items-center gap-1 text-xs">
                                <Swords className="h-3 w-3" /> Official Rivals
                              </div>
                            )}
                            <div className="text-xs text-muted-foreground">
                              Tension Score: <span className="font-semibold text-foreground">{score}</span>
                            </div>
                            {tension && (
                              <div className="text-[10px] text-muted-foreground space-y-0.5 pt-1 border-t">
                                {tension.closeMatches > 0 && <div>Close matches: {tension.closeMatches}</div>}
                                {tension.finalsMatches ? <div>Finals meetings: {tension.finalsMatches}</div> : null}
                                {tension.trades > 0 && <div>Trades: {tension.trades}</div>}
                                {tension.ladderBattles > 0 && <div>Ladder battles: {tension.ladderBattles}</div>}
                                {tension.playerMovements ? <div>Player movements: {tension.playerMovements}</div> : null}
                              </div>
                            )}
                            {!rivals && score === 0 && (
                              <div className="text-muted-foreground text-[10px]">No history yet</div>
                            )}
                          </div>
                        </TooltipContent>
                      </Tooltip>
                    );
                  })}
                </div>
              ))}
            </div>
          </div>

          {/* Legend */}
          <div className="mt-4 pt-3 border-t">
            <div className="flex flex-wrap items-center gap-3 text-[10px] text-muted-foreground">
              <div className="flex items-center gap-1">
                <div className="w-4 h-4 rounded bg-black flex items-center justify-center">
                  <Swords className="h-2.5 w-2.5 text-white" />
                </div>
                <span>Official Rivals</span>
              </div>
              <span className="text-muted-foreground">|</span>
              <span>Tension: </span>
              <div className="flex items-center gap-1">
                <div className="w-3 h-3 rounded bg-yellow-500/40" />
                <span>Low</span>
              </div>
              <div className="flex items-center gap-1">
                <div className="w-3 h-3 rounded bg-orange-500/50" />
                <span>Med</span>
              </div>
              <div className="flex items-center gap-1">
                <div className="w-3 h-3 rounded bg-red-500/60" />
                <span>High</span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {selectedPair && (
        <RivalryDetailDialog
          clubAId={selectedPair.clubA.id}
          clubBId={selectedPair.clubB.id}
          open={!!selectedPair}
          onOpenChange={(open) => !open && setSelectedPair(null)}
        />
      )}
    </TooltipProvider>
  );
}
