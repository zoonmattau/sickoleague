"use client";

import { useState, useEffect, useTransition, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { DraftBoard, DraftTimer, DraftQueue, PlayerSelector } from "@/components/draft";
import { getDraftState, getDraftEligiblePlayers, makePick, passPick } from "./actions";
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

interface DraftBoardClientProps {
  initialState: DraftState;
  eligiblePlayers: EligiblePlayer[];
  myClubId: string | null;
  seasonId: string;
}

export function DraftBoardClient({
  initialState,
  eligiblePlayers: initialPlayers,
  myClubId,
  seasonId,
}: DraftBoardClientProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [state, setState] = useState<DraftState>(initialState);
  const [players, setPlayers] = useState<EligiblePlayer[]>(initialPlayers);
  const [error, setError] = useState<string | null>(null);
  const [lastRefresh, setLastRefresh] = useState(new Date());

  // Check if it's my turn to pick
  const isMyTurn =
    state.draftStatus === "IN_PROGRESS" &&
    state.currentPick?.clubId === myClubId;

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
      <Card>
        <CardContent className="p-4">
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
                  <span className="text-sm text-muted-foreground">On the clock:</span>
                  <Badge
                    className="text-sm"
                    style={{
                      backgroundColor: state.currentPick.club.primaryColor || undefined,
                      color: state.currentPick.club.secondaryColor || undefined,
                    }}
                  >
                    {state.currentPick.club.name}
                  </Badge>
                  <span className="text-sm text-muted-foreground">
                    (Pick #{state.currentPick.pickNumber}, Round {state.currentPick.round})
                  </span>
                </div>
              )}
            </div>

            {/* Status and actions */}
            <div className="flex items-center gap-2">
              <Badge variant={state.draftStatus === "IN_PROGRESS" ? "default" : "secondary"}>
                {state.draftStatus.replace("_", " ")}
              </Badge>
              <Badge variant="outline">
                {state.draftOrderType} Order
              </Badge>
              <Button
                variant="outline"
                size="sm"
                onClick={() => refreshData()}
                disabled={isPending}
              >
                {isPending ? "Refreshing..." : "Refresh"}
              </Button>
            </div>
          </div>

          {/* Queue */}
          {state.queue.length > 0 && state.draftStatus === "IN_PROGRESS" && (
            <div className="mt-4 border-t pt-4">
              <div className="text-sm text-muted-foreground mb-2">Up next:</div>
              <DraftQueue queue={state.queue} currentPickNumber={state.currentPickNumber} />
            </div>
          )}
        </CardContent>
      </Card>

      {/* Error display */}
      {error && (
        <Card className="border-destructive">
          <CardContent className="p-4 text-destructive">
            {error}
          </CardContent>
        </Card>
      )}

      {/* Main content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Draft Board - takes 2 columns on large screens */}
        <div className="lg:col-span-2">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle>Draft Board</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <div className="max-h-[600px] overflow-y-auto">
                <DraftBoard
                  picks={state.picks}
                  clubs={state.clubs}
                  currentPickNumber={state.currentPickNumber}
                  draftOrder={state.draftOrder}
                />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Player Selector - takes 1 column */}
        <div className="lg:col-span-1">
          <Card className="h-[660px] flex flex-col">
            <CardHeader className="pb-2 shrink-0">
              <CardTitle className="flex items-center justify-between">
                <span>Select Player</span>
                {isMyTurn && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handlePassPick}
                    disabled={isPending}
                  >
                    Pass
                  </Button>
                )}
              </CardTitle>
              {isMyTurn ? (
                <p className="text-sm text-green-600 dark:text-green-400 font-medium">
                  It&apos;s your turn to pick!
                </p>
              ) : state.draftStatus === "IN_PROGRESS" ? (
                <p className="text-sm text-muted-foreground">
                  Waiting for {state.currentPick?.club.name}...
                </p>
              ) : state.draftStatus === "NOT_STARTED" ? (
                <p className="text-sm text-muted-foreground">
                  Draft has not started yet
                </p>
              ) : state.draftStatus === "PAUSED" ? (
                <p className="text-sm text-muted-foreground">
                  Draft is paused
                </p>
              ) : (
                <p className="text-sm text-muted-foreground">
                  Draft is complete
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
      <div className="text-xs text-muted-foreground text-center">
        Last updated: {lastRefresh.toLocaleTimeString()}
      </div>
    </div>
  );
}
