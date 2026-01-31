"use client";

import { useState, useEffect, useTransition, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { DraftBoard, DraftTimer, DraftQueue, PlayerSelector } from "@/components/draft";
import { getDraftState, getDraftEligiblePlayers, makePick, passPick } from "./actions";
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

interface DraftState {
  seasonId: string;
  year: number;
  draftOrderType: "STRAIGHT" | "SNAKE";
  draftStatus: "NOT_STARTED" | "IN_PROGRESS" | "PAUSED" | "COMPLETED";
  currentPickNumber: number;
  pickTimerSeconds: number;
  pickDeadline: Date | null;
  timeRemaining: number | null;
  picks: Pick[];
  clubs: Club[];
  draftOrder: string[];
  currentPick: {
    id: string;
    pickNumber: number;
    round: number;
    clubId: string;
    club: Club;
  } | null;
  queue: {
    pickNumber: number;
    clubId: string;
    club: Club;
    round: number;
  }[];
}

interface EligiblePlayer {
  id: string;
  firstName: string;
  lastName: string;
  name: string;
  positions: Position[];
  avgPoints: number | null;
  gamesPlayed: number | null;
  aflTeam: string | null;
  aflTeamName: string | null;
}

interface MyPick {
  id: string;
  round: number;
  pickNumber: number;
  originalClub: { name: string; abbreviation: string };
  used: boolean;
  passed: boolean;
  player: { name: string; positions: Position[] } | null;
}

interface DraftBoardClientProps {
  initialState: DraftState;
  eligiblePlayers: EligiblePlayer[];
  myClubId: string | null;
  myClubAbbreviation: string | null;
  seasonId: string;
  myPicks: MyPick[];
}

export function DraftBoardClient({
  initialState,
  eligiblePlayers: initialPlayers,
  myClubId,
  myClubAbbreviation,
  seasonId,
  myPicks,
}: DraftBoardClientProps) {
  const [isPending, startTransition] = useTransition();
  const [state, setState] = useState<DraftState>(initialState);
  const [players, setPlayers] = useState<EligiblePlayer[]>(initialPlayers);
  const [error, setError] = useState<string | null>(null);
  const [lastRefresh, setLastRefresh] = useState(new Date());

  // Check if it's my turn to pick
  const isMyTurn =
    state.draftStatus === "IN_PROGRESS" &&
    state.currentPick?.clubId === myClubId;

  // Find my upcoming picks (not used, not passed)
  const myUpcomingPicks = myPicks.filter(p => !p.used && !p.passed);
  const myNextPick = myUpcomingPicks.find(p => p.pickNumber >= state.currentPickNumber);

  // Refresh data periodically
  const refreshData = useCallback(async () => {
    try {
      const [newState, newPlayers] = await Promise.all([
        getDraftState(seasonId),
        getDraftEligiblePlayers(seasonId),
      ]);
      if (newState) {
        setState(newState);
      }
      setPlayers(newPlayers);
      setLastRefresh(new Date());
    } catch (err) {
      console.error("Failed to refresh draft state:", err);
    }
  }, [seasonId]);

  // Auto-refresh every 5 seconds when draft is in progress
  useEffect(() => {
    if (state.draftStatus !== "IN_PROGRESS") return;

    const interval = setInterval(() => {
      startTransition(() => {
        refreshData();
      });
    }, 5000);

    return () => clearInterval(interval);
  }, [state.draftStatus, refreshData]);

  const handleMakePick = async (playerId: string) => {
    if (!state.currentPick) return;

    setError(null);
    startTransition(async () => {
      const result = await makePick(state.currentPick!.id, playerId);
      if (result.error) {
        setError(result.error);
      } else {
        await refreshData();
      }
    });
  };

  const handlePassPick = async () => {
    if (!state.currentPick) return;

    setError(null);
    startTransition(async () => {
      const result = await passPick(state.currentPick!.id);
      if (result.error) {
        setError(result.error);
      } else {
        await refreshData();
      }
    });
  };

  return (
    <div className="space-y-4">
      {/* Status Banner */}
      <div className="bg-zinc-900 rounded-lg p-4">
        <div className="flex flex-wrap items-center justify-between gap-4">
          {/* Timer and current pick info */}
          <div className="flex items-center gap-4">
            <DraftTimer
              deadline={state.pickDeadline ? new Date(state.pickDeadline) : null}
              totalSeconds={state.pickTimerSeconds}
              isPaused={state.draftStatus !== "IN_PROGRESS"}
            />

            {state.currentPick && state.draftStatus === "IN_PROGRESS" && (
              <div className="flex items-center gap-2">
                <span className="text-sm text-zinc-400">On the clock:</span>
                <Badge
                  className="text-sm font-bold"
                  style={{
                    backgroundColor: state.currentPick.club.primaryColor || undefined,
                    color: state.currentPick.club.secondaryColor || undefined,
                  }}
                >
                  {state.currentPick.club.name}
                </Badge>
                <span className="text-sm text-zinc-500">
                  Pick #{state.currentPick.pickNumber} (R{state.currentPick.round})
                </span>
              </div>
            )}
          </div>

          {/* Status and actions */}
          <div className="flex items-center gap-2">
            <Badge variant={state.draftStatus === "IN_PROGRESS" ? "default" : "secondary"}>
              {state.draftStatus.replace("_", " ")}
            </Badge>
            <Badge variant="outline" className="text-zinc-400 border-zinc-600">
              {state.draftOrderType}
            </Badge>
            <Button
              variant="outline"
              size="sm"
              onClick={() => refreshData()}
              disabled={isPending}
              className="border-zinc-700 hover:bg-zinc-800"
            >
              {isPending ? "..." : "Refresh"}
            </Button>
          </div>
        </div>

        {/* Queue */}
        {state.queue.length > 0 && state.draftStatus === "IN_PROGRESS" && (
          <div className="mt-4 pt-4 border-t border-zinc-800">
            <DraftQueue queue={state.queue} currentPickNumber={state.currentPickNumber} />
          </div>
        )}
      </div>

      {/* Error display */}
      {error && (
        <div className="bg-red-500/10 border border-red-500/50 rounded-lg p-4 text-red-400">
          {error}
        </div>
      )}

      {/* Main content - 3 columns: Board, My Picks, Player Selector */}
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-4">
        {/* Draft Board - 7 columns */}
        <div className="xl:col-span-7">
          <Card className="bg-zinc-900 border-zinc-800">
            <CardHeader className="pb-2 border-b border-zinc-800">
              <CardTitle className="text-white flex items-center justify-between">
                <span>Draft Board</span>
                <span className="text-sm font-normal text-zinc-500">
                  {state.picks.filter(p => p.used).length} / {state.picks.length} picks made
                </span>
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <div className="max-h-[600px] overflow-auto">
                <DraftBoard
                  picks={state.picks}
                  clubs={state.clubs}
                  currentPickNumber={state.currentPickNumber}
                  draftOrder={state.draftOrder}
                  draftOrderType={state.draftOrderType}
                />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* My Picks Sidebar - 2 columns */}
        <div className="xl:col-span-2">
          <Card className="bg-zinc-900 border-zinc-800 h-[660px] flex flex-col">
            <CardHeader className="pb-2 border-b border-zinc-800 shrink-0">
              <CardTitle className="text-white text-sm">
                My Picks
                {myClubAbbreviation && (
                  <span className="text-zinc-500 font-normal ml-2">({myClubAbbreviation})</span>
                )}
              </CardTitle>
            </CardHeader>
            <CardContent className="flex-1 p-0 overflow-y-auto">
              {!myClubId ? (
                <div className="p-4 text-center text-zinc-500 text-sm">
                  No club assigned
                </div>
              ) : myPicks.length === 0 ? (
                <div className="p-4 text-center text-zinc-500 text-sm">
                  No picks yet
                </div>
              ) : (
                <div className="divide-y divide-zinc-800">
                  {myPicks.map((pick) => {
                    const isCurrent = pick.pickNumber === state.currentPickNumber;
                    const isPast = pick.used || pick.passed;
                    const isUpcoming = !isPast && pick.pickNumber > state.currentPickNumber;

                    return (
                      <div
                        key={pick.id}
                        className={cn(
                          "px-3 py-2",
                          isCurrent && "bg-yellow-500/10",
                          isPast && "opacity-50"
                        )}
                      >
                        <div className="flex items-center justify-between mb-1">
                          <span className={cn(
                            "text-xs font-bold",
                            isCurrent ? "text-yellow-400" : "text-zinc-500"
                          )}>
                            #{pick.pickNumber}
                          </span>
                          <span className="text-[10px] text-zinc-600">
                            R{pick.round}
                          </span>
                        </div>

                        {pick.used && pick.player ? (
                          <div>
                            <div className="text-xs text-white truncate">
                              {pick.player.name}
                            </div>
                            <div className="text-[10px] text-zinc-500">
                              {pick.player.positions.join("/")}
                            </div>
                          </div>
                        ) : pick.passed ? (
                          <div className="text-[10px] text-zinc-600 italic">Passed</div>
                        ) : isCurrent ? (
                          <div className="text-xs text-yellow-400 font-bold animate-pulse">
                            YOUR PICK!
                          </div>
                        ) : (
                          <div className="text-[10px] text-zinc-600">
                            {pick.originalClub.abbreviation !== myClubAbbreviation && (
                              <span>via {pick.originalClub.abbreviation}</span>
                            )}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Player Selector - 3 columns */}
        <div className="xl:col-span-3">
          <Card className="bg-zinc-900 border-zinc-800 h-[660px] flex flex-col">
            <CardHeader className="pb-2 border-b border-zinc-800 shrink-0">
              <CardTitle className="text-white flex items-center justify-between text-sm">
                <span>Select Player</span>
                {isMyTurn && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handlePassPick}
                    disabled={isPending}
                    className="h-7 text-xs border-zinc-700 hover:bg-zinc-800"
                  >
                    Pass
                  </Button>
                )}
              </CardTitle>
              {isMyTurn ? (
                <p className="text-sm text-green-400 font-medium">
                  It&apos;s your turn to pick!
                </p>
              ) : state.draftStatus === "IN_PROGRESS" ? (
                <p className="text-xs text-zinc-500">
                  Waiting for {state.currentPick?.club.abbreviation}...
                </p>
              ) : state.draftStatus === "NOT_STARTED" ? (
                <p className="text-xs text-zinc-500">
                  Draft has not started
                </p>
              ) : state.draftStatus === "PAUSED" ? (
                <p className="text-xs text-zinc-500">
                  Draft is paused
                </p>
              ) : (
                <p className="text-xs text-zinc-500">
                  Draft complete
                </p>
              )}
            </CardHeader>
            <CardContent className="flex-1 p-0 overflow-hidden">
              <PlayerSelector
                players={players}
                onSelect={handleMakePick}
                disabled={!isMyTurn || isPending}
                isLoading={isPending}
              />
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Last refresh info */}
      <div className="text-xs text-zinc-600 text-center">
        Last updated: {lastRefresh.toLocaleTimeString()}
      </div>
    </div>
  );
}
