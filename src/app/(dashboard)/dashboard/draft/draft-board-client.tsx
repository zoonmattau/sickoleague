"use client";

import { useState, useEffect, useTransition, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { DraftBoard, DraftTimer, DraftQueue, PlayerSelector, DraftShortlist } from "@/components/draft";
import {
  getDraftState,
  getDraftEligiblePlayers,
  makePick,
  passPick,
  getMyShortlist,
  addToShortlist,
  // Admin actions
  generateDraftPicks,
  startDraft,
  pauseDraft,
  resumeDraft,
  resumeDraftWithTime,
  setPickTime,
  setDraftOrderType,
  setPickTimer,
  adminMakePick,
  reassignPick,
  undoLastPick,
  resetDraft,
  skipToPick,
} from "./actions";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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

interface ShortlistItem {
  id: string;
  rank: number;
  notes: string | null;
  player: {
    id: string;
    firstName: string;
    lastName: string;
    name: string;
    positions: Position[];
    avgPoints: number | null;
    gamesPlayed: number | null;
    aflTeam: string | null;
    aflTeamName: string | null;
  };
}

interface DraftBoardClientProps {
  initialState: DraftState;
  eligiblePlayers: EligiblePlayer[];
  myClubId: string | null;
  myClubAbbreviation: string | null;
  seasonId: string;
  myPicks: MyPick[];
  myShortlist: ShortlistItem[];
  isAdmin: boolean;
}

export function DraftBoardClient({
  initialState,
  eligiblePlayers: initialPlayers,
  myClubId,
  myClubAbbreviation,
  seasonId,
  myPicks,
  myShortlist: initialShortlist,
  isAdmin,
}: DraftBoardClientProps) {
  const [isPending, startTransition] = useTransition();
  const [state, setState] = useState<DraftState>(initialState);
  const [players, setPlayers] = useState<EligiblePlayer[]>(initialPlayers);
  const [shortlist, setShortlist] = useState<ShortlistItem[]>(initialShortlist);
  const [error, setError] = useState<string | null>(null);
  const [lastRefresh, setLastRefresh] = useState(new Date());
  const [showShortlist, setShowShortlist] = useState(true);

  // Admin state
  const [editingPick, setEditingPick] = useState<Pick | null>(null);
  const [editClubId, setEditClubId] = useState<string>("");
  const [customTimeSeconds, setCustomTimeSeconds] = useState<string>("");
  const [adminMessage, setAdminMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [timerInput, setTimerInput] = useState<string>(state.pickTimerSeconds.toString());

  // Get set of shortlisted player IDs for quick lookup
  const shortlistedPlayerIds = new Set(shortlist.map((s) => s.player.id));

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
      const [newState, newPlayers, newShortlist] = await Promise.all([
        getDraftState(seasonId),
        getDraftEligiblePlayers(seasonId),
        getMyShortlist(seasonId),
      ]);
      if (newState) {
        setState(newState);
      }
      setPlayers(newPlayers);
      setShortlist(newShortlist);
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

  const handleAddToShortlist = async (playerId: string) => {
    if (!myClubId) return;

    startTransition(async () => {
      const result = await addToShortlist(seasonId, playerId);
      if (!result.error) {
        await refreshData();
      }
    });
  };

  const handleRemoveFromShortlist = (shortlistId: string) => {
    // Remove from local state immediately for responsiveness
    setShortlist((prev) => prev.filter((s) => s.id !== shortlistId));
  };

  // Admin action helper
  const handleAdminAction = async (
    action: () => Promise<{ success?: boolean; error?: string; [key: string]: unknown }>,
    successMessage: string
  ) => {
    setAdminMessage(null);
    startTransition(async () => {
      const result = await action();
      if (result.error) {
        setAdminMessage({ type: "error", text: result.error });
      } else {
        setAdminMessage({ type: "success", text: successMessage });
        await refreshData();
      }
    });
  };

  // Handle clicking a pick on the board (admin only)
  const handlePickClick = (pick: Pick) => {
    if (!isAdmin) return;
    setEditingPick(pick);
    setEditClubId(pick.clubId);
    setCustomTimeSeconds("");
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

      {/* Admin Controls */}
      {isAdmin && (
        <div className="bg-zinc-900 rounded-lg p-4 border border-zinc-800">
          <div className="flex flex-wrap items-center gap-3">
            <span className="text-xs font-bold text-zinc-500 uppercase">Commissioner:</span>

            {/* Generate picks if none exist */}
            {state.picks.length === 0 && (
              <Button
                size="sm"
                onClick={() => handleAdminAction(
                  () => generateDraftPicks(seasonId),
                  "Draft picks generated"
                )}
                disabled={isPending}
              >
                Generate Picks
              </Button>
            )}

            {/* Start/Pause/Resume controls */}
            {state.draftStatus === "NOT_STARTED" && state.picks.length > 0 && (
              <Button
                size="sm"
                onClick={() => handleAdminAction(
                  () => startDraft(seasonId),
                  "Draft started"
                )}
                disabled={isPending}
                className="bg-green-600 hover:bg-green-500"
              >
                Start Draft
              </Button>
            )}

            {state.draftStatus === "IN_PROGRESS" && (
              <Button
                size="sm"
                variant="secondary"
                onClick={() => handleAdminAction(
                  () => pauseDraft(seasonId),
                  "Draft paused"
                )}
                disabled={isPending}
              >
                Pause
              </Button>
            )}

            {state.draftStatus === "PAUSED" && (
              <>
                <Button
                  size="sm"
                  onClick={() => handleAdminAction(
                    () => resumeDraft(seasonId),
                    "Draft resumed"
                  )}
                  disabled={isPending}
                  className="bg-green-600 hover:bg-green-500"
                >
                  Resume
                </Button>
                <div className="flex items-center gap-1">
                  <Input
                    type="number"
                    min={10}
                    max={3600}
                    value={customTimeSeconds}
                    onChange={(e) => setCustomTimeSeconds(e.target.value)}
                    placeholder={state.pickTimerSeconds.toString()}
                    className="w-16 h-8 text-xs bg-zinc-800 border-zinc-700"
                  />
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => {
                      const seconds = parseInt(customTimeSeconds) || state.pickTimerSeconds;
                      handleAdminAction(
                        () => resumeDraftWithTime(seasonId, seconds),
                        `Resumed with ${seconds}s`
                      );
                      setCustomTimeSeconds("");
                    }}
                    disabled={isPending}
                    className="h-8 text-xs border-zinc-700"
                  >
                    Resume with Time
                  </Button>
                </div>
              </>
            )}

            {/* Undo last pick */}
            {state.picks.some(p => p.used || p.passed) && (
              <Button
                size="sm"
                variant="outline"
                onClick={() => handleAdminAction(
                  () => undoLastPick(seasonId),
                  "Last pick undone"
                )}
                disabled={isPending}
                className="border-zinc-700"
              >
                Undo Last
              </Button>
            )}

            {/* Draft order type (only before starting) */}
            {state.draftStatus === "NOT_STARTED" && (
              <div className="flex items-center gap-1 ml-auto">
                <span className="text-xs text-zinc-500">Order:</span>
                <Button
                  size="sm"
                  variant={state.draftOrderType === "SNAKE" ? "default" : "outline"}
                  onClick={() => handleAdminAction(
                    () => setDraftOrderType(seasonId, "SNAKE"),
                    "Set to Snake order"
                  )}
                  disabled={isPending}
                  className="h-7 text-xs"
                >
                  Snake
                </Button>
                <Button
                  size="sm"
                  variant={state.draftOrderType === "STRAIGHT" ? "default" : "outline"}
                  onClick={() => handleAdminAction(
                    () => setDraftOrderType(seasonId, "STRAIGHT"),
                    "Set to Straight order"
                  )}
                  disabled={isPending}
                  className="h-7 text-xs"
                >
                  Straight
                </Button>
              </div>
            )}

            {/* Timer setting */}
            <div className="flex items-center gap-1">
              <span className="text-xs text-zinc-500">Timer:</span>
              <Input
                type="number"
                min={30}
                max={600}
                value={timerInput}
                onChange={(e) => setTimerInput(e.target.value)}
                className="w-16 h-7 text-xs bg-zinc-800 border-zinc-700"
              />
              <Button
                size="sm"
                variant="outline"
                onClick={() => handleAdminAction(
                  () => setPickTimer(seasonId, parseInt(timerInput) || 120),
                  "Timer updated"
                )}
                disabled={isPending}
                className="h-7 text-xs border-zinc-700"
              >
                Set
              </Button>
            </div>
          </div>

          {/* Admin message */}
          {adminMessage && (
            <div className={cn(
              "mt-2 text-xs px-2 py-1 rounded",
              adminMessage.type === "error" ? "bg-red-500/10 text-red-400" : "bg-green-500/10 text-green-400"
            )}>
              {adminMessage.text}
            </div>
          )}

          <p className="text-[10px] text-zinc-600 mt-2">
            Click any pick on the board to edit it
          </p>
        </div>
      )}

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
                  onPickClick={isAdmin ? handlePickClick : undefined}
                />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* My Picks & Shortlist Sidebar - 2 columns */}
        <div className="xl:col-span-2 space-y-4">
          {/* My Picks */}
          <Card className="bg-zinc-900 border-zinc-800">
            <CardHeader className="pb-2 border-b border-zinc-800">
              <CardTitle className="text-white text-sm">
                My Picks
                {myClubAbbreviation && (
                  <span className="text-zinc-500 font-normal ml-2">({myClubAbbreviation})</span>
                )}
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0 max-h-[280px] overflow-y-auto">
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

          {/* Shortlist */}
          <Card className="bg-zinc-900 border-zinc-800">
            <CardHeader className="pb-2 border-b border-zinc-800">
              <CardTitle className="text-white text-sm flex items-center justify-between">
                <span>Shortlist</span>
                <Badge variant="secondary" className="text-[10px]">{shortlist.length}</Badge>
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0 max-h-[320px] overflow-y-auto">
              {!myClubId ? (
                <div className="p-4 text-center text-zinc-500 text-sm">
                  No club assigned
                </div>
              ) : (
                <DraftShortlist
                  shortlist={shortlist}
                  onDraft={handleMakePick}
                  onRemove={handleRemoveFromShortlist}
                  onRefresh={refreshData}
                  disabled={!isMyTurn || isPending}
                  isLoading={isPending}
                />
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
                onShortlist={myClubId ? handleAddToShortlist : undefined}
                shortlistedPlayerIds={shortlistedPlayerIds}
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

      {/* Admin Pick Edit Dialog */}
      {isAdmin && (
        <Dialog open={!!editingPick} onOpenChange={(open) => !open && setEditingPick(null)}>
          <DialogContent className="sm:max-w-[500px]">
            <DialogHeader>
              <DialogTitle>
                Edit Pick #{editingPick?.pickNumber} (Round {editingPick?.round})
              </DialogTitle>
              <DialogDescription>
                Currently owned by {editingPick?.club.name}
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4 py-4">
              {/* Current status */}
              <div className="rounded-lg bg-muted p-4">
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div>
                    <span className="text-muted-foreground">Status:</span>{" "}
                    {editingPick?.used ? "Used" : editingPick?.passed ? "Passed" : "Pending"}
                  </div>
                  <div>
                    <span className="text-muted-foreground">Original:</span>{" "}
                    {editingPick?.originalClub.abbreviation}
                  </div>
                  {editingPick?.player && (
                    <div className="col-span-2">
                      <span className="text-muted-foreground">Selection:</span>{" "}
                      {editingPick.player.name} ({editingPick.player.positions.join("/")})
                    </div>
                  )}
                </div>
              </div>

              {/* Reassign pick */}
              {!editingPick?.used && (
                <div className="space-y-2">
                  <Label>Reassign to Club</Label>
                  <div className="flex gap-2">
                    <Select value={editClubId} onValueChange={setEditClubId}>
                      <SelectTrigger className="flex-1">
                        <SelectValue placeholder="Select club" />
                      </SelectTrigger>
                      <SelectContent>
                        {state.clubs.map((club) => (
                          <SelectItem key={club.id} value={club.id}>
                            {club.name} ({club.abbreviation})
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <Button
                      onClick={() => {
                        if (editingPick && editClubId) {
                          handleAdminAction(
                            () => reassignPick(editingPick.id, editClubId),
                            "Pick reassigned"
                          );
                          setEditingPick(null);
                        }
                      }}
                      disabled={isPending || !editClubId || editClubId === editingPick?.clubId}
                    >
                      Reassign
                    </Button>
                  </div>
                </div>
              )}

              {/* Set custom time for current pick */}
              {editingPick?.pickNumber === state.currentPickNumber && !editingPick?.used && (
                <div className="space-y-2">
                  <Label>Set Time for This Pick</Label>
                  <div className="flex gap-2">
                    <Input
                      type="number"
                      min={10}
                      max={3600}
                      value={customTimeSeconds}
                      onChange={(e) => setCustomTimeSeconds(e.target.value)}
                      placeholder="Seconds"
                      className="w-24"
                    />
                    <Button
                      onClick={() => {
                        const seconds = parseInt(customTimeSeconds) || 120;
                        handleAdminAction(
                          () => setPickTime(seasonId, seconds),
                          `Time set to ${seconds}s`
                        );
                        setEditingPick(null);
                        setCustomTimeSeconds("");
                      }}
                      disabled={isPending || !customTimeSeconds}
                    >
                      Set Time
                    </Button>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Sets a custom countdown for this pick (10-3600 seconds)
                  </p>
                </div>
              )}

              {/* Quick actions */}
              <div className="space-y-2">
                <Label>Quick Actions</Label>
                <div className="flex flex-wrap gap-2">
                  {/* Skip to this pick */}
                  {!editingPick?.used && !editingPick?.passed && (
                    <Button
                      variant="outline"
                      onClick={() => {
                        if (editingPick) {
                          handleAdminAction(
                            () => skipToPick(seasonId, editingPick.pickNumber),
                            `Skipped to pick ${editingPick.pickNumber}`
                          );
                          setEditingPick(null);
                        }
                      }}
                      disabled={isPending}
                    >
                      Skip to This Pick
                    </Button>
                  )}

                  {/* Make pick for this team (admin pick) */}
                  {editingPick?.pickNumber === state.currentPickNumber && !editingPick?.used && (
                    <Button
                      variant="secondary"
                      onClick={() => {
                        // Close dialog and focus on player selector
                        setEditingPick(null);
                      }}
                    >
                      Select Player...
                    </Button>
                  )}

                  {/* Undo this pick */}
                  {editingPick?.used && (
                    <Button
                      variant="destructive"
                      onClick={() => {
                        if (confirm("Undo this pick? The player will become available again.")) {
                          handleAdminAction(
                            () => undoLastPick(seasonId),
                            "Pick undone"
                          );
                          setEditingPick(null);
                        }
                      }}
                      disabled={isPending}
                    >
                      Undo Pick
                    </Button>
                  )}
                </div>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}
