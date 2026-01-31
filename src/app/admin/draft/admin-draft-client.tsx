"use client";

import { useState, useTransition, useCallback } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { DraftBoard, DraftTimer, DraftQueue, PlayerSelector } from "@/components/draft";
import {
  getDraftState,
  getDraftEligiblePlayers,
  setDraftOrderType,
  setPickTimer,
  generateDraftPicks,
  startDraft,
  pauseDraft,
  resumeDraft,
  resumeDraftWithTime,
  setPickTime,
  adminMakePick,
  reassignPick,
  undoLastPick,
  resetDraft,
  deleteDraftPicks,
  skipToPick,
} from "@/app/(dashboard)/dashboard/draft/actions";
import type { DraftOrderType, Position } from "@prisma/client";

interface Season {
  id: string;
  year: number;
  status: string;
  draftStatus: string;
  draftOrderType: string;
  pickTimerSeconds: number;
  currentPickNumber: number;
}

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

interface AdminDraftClientProps {
  seasons: Season[];
  clubs: Club[];
  currentSeasonId: string | null;
  initialDraftState: DraftState | null;
  eligiblePlayers: EligiblePlayer[];
}

export function AdminDraftClient({
  seasons,
  clubs,
  currentSeasonId,
  initialDraftState,
  eligiblePlayers: initialPlayers,
}: AdminDraftClientProps) {
  const [isPending, startTransition] = useTransition();
  const [selectedSeasonId, setSelectedSeasonId] = useState<string>(currentSeasonId ?? "");
  const [draftState, setDraftState] = useState<DraftState | null>(initialDraftState);
  const [players, setPlayers] = useState<EligiblePlayer[]>(initialPlayers);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [timerInput, setTimerInput] = useState<string>(
    initialDraftState?.pickTimerSeconds.toString() ?? "120"
  );
  const [skipToPickInput, setSkipToPickInput] = useState<string>("");
  const [reassignPickId, setReassignPickId] = useState<string>("");
  const [reassignClubId, setReassignClubId] = useState<string>("");
  const [selectedPickForAdmin, setSelectedPickForAdmin] = useState<string>("");
  const [editingPick, setEditingPick] = useState<Pick | null>(null);
  const [editClubId, setEditClubId] = useState<string>("");
  const [customTimeSeconds, setCustomTimeSeconds] = useState<string>("");

  const selectedSeason = seasons.find((s) => s.id === selectedSeasonId);

  const refreshData = useCallback(async () => {
    if (!selectedSeasonId) return;
    try {
      const [newState, newPlayers] = await Promise.all([
        getDraftState(selectedSeasonId),
        getDraftEligiblePlayers(selectedSeasonId),
      ]);
      setDraftState(newState);
      setPlayers(newPlayers);
    } catch (err) {
      console.error("Failed to refresh:", err);
    }
  }, [selectedSeasonId]);

  const handleAction = async (
    action: () => Promise<{ success?: boolean; error?: string; [key: string]: unknown }>,
    successMessage: string
  ) => {
    setMessage(null);
    startTransition(async () => {
      const result = await action();
      if (result.error) {
        setMessage({ type: "error", text: result.error });
      } else {
        setMessage({ type: "success", text: successMessage });
        await refreshData();
      }
    });
  };

  const handleSeasonChange = async (newSeasonId: string) => {
    setSelectedSeasonId(newSeasonId);
    if (newSeasonId) {
      const [newState, newPlayers] = await Promise.all([
        getDraftState(newSeasonId),
        getDraftEligiblePlayers(newSeasonId),
      ]);
      setDraftState(newState);
      setPlayers(newPlayers);
      setTimerInput(newState?.pickTimerSeconds.toString() ?? "120");
    } else {
      setDraftState(null);
      setPlayers([]);
    }
  };

  return (
    <div className="space-y-6">
      {/* Season Selector */}
      <Card>
        <CardHeader>
          <CardTitle>Select Season</CardTitle>
        </CardHeader>
        <CardContent>
          <Select value={selectedSeasonId} onValueChange={handleSeasonChange}>
            <SelectTrigger className="w-[300px]">
              <SelectValue placeholder="Select a season" />
            </SelectTrigger>
            <SelectContent>
              {seasons.map((season) => (
                <SelectItem key={season.id} value={season.id}>
                  {season.year} - {season.status} (Draft: {season.draftStatus})
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </CardContent>
      </Card>

      {/* Message Display */}
      {message && (
        <Card className={message.type === "error" ? "border-destructive" : "border-green-500"}>
          <CardContent className={`p-4 ${message.type === "error" ? "text-destructive" : "text-green-600"}`}>
            {message.text}
          </CardContent>
        </Card>
      )}

      {selectedSeasonId && (
        <Tabs defaultValue="controls" className="space-y-4">
          <TabsList>
            <TabsTrigger value="controls">Draft Controls</TabsTrigger>
            <TabsTrigger value="board">Live Board</TabsTrigger>
            <TabsTrigger value="picks">Manage Picks</TabsTrigger>
            <TabsTrigger value="manual">Manual Pick</TabsTrigger>
          </TabsList>

          <TabsContent value="controls" className="space-y-4">
            {/* Draft Settings */}
            <Card>
              <CardHeader>
                <CardTitle>Draft Settings</CardTitle>
                <CardDescription>
                  Configure draft order and timer settings
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Draft Order Type */}
                  <div className="space-y-2">
                    <Label>Draft Order Type</Label>
                    <div className="flex gap-2">
                      <Button
                        variant={draftState?.draftOrderType === "SNAKE" ? "default" : "outline"}
                        onClick={() =>
                          handleAction(
                            () => setDraftOrderType(selectedSeasonId, "SNAKE"),
                            "Draft order set to SNAKE"
                          )
                        }
                        disabled={isPending || draftState?.draftStatus !== "NOT_STARTED"}
                      >
                        Snake
                      </Button>
                      <Button
                        variant={draftState?.draftOrderType === "STRAIGHT" ? "default" : "outline"}
                        onClick={() =>
                          handleAction(
                            () => setDraftOrderType(selectedSeasonId, "STRAIGHT"),
                            "Draft order set to STRAIGHT"
                          )
                        }
                        disabled={isPending || draftState?.draftStatus !== "NOT_STARTED"}
                      >
                        Straight
                      </Button>
                    </div>
                    {draftState?.draftStatus !== "NOT_STARTED" && (
                      <p className="text-xs text-muted-foreground">
                        Order type can only be changed before draft starts
                      </p>
                    )}
                  </div>

                  {/* Timer Setting */}
                  <div className="space-y-2">
                    <Label>Pick Timer (seconds)</Label>
                    <div className="flex gap-2">
                      <Input
                        type="number"
                        min={30}
                        max={600}
                        value={timerInput}
                        onChange={(e) => setTimerInput(e.target.value)}
                        className="w-24"
                      />
                      <Button
                        onClick={() =>
                          handleAction(
                            () => setPickTimer(selectedSeasonId, parseInt(timerInput) || 120),
                            "Timer updated"
                          )
                        }
                        disabled={isPending}
                      >
                        Set Timer
                      </Button>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Current: {draftState?.pickTimerSeconds ?? 120}s (30-600 allowed)
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Draft Actions */}
            <Card>
              <CardHeader>
                <CardTitle>Draft Actions</CardTitle>
                <CardDescription>
                  Generate picks, start/pause/resume the draft
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex flex-wrap gap-2">
                  {/* Generate Picks */}
                  <Button
                    onClick={() =>
                      handleAction(
                        () => generateDraftPicks(selectedSeasonId),
                        "Draft picks generated successfully"
                      )
                    }
                    disabled={isPending || (draftState?.picks.length ?? 0) > 0}
                    variant="outline"
                  >
                    Generate Picks
                  </Button>

                  {/* Start Draft */}
                  <Button
                    onClick={() =>
                      handleAction(() => startDraft(selectedSeasonId), "Draft started")
                    }
                    disabled={
                      isPending ||
                      draftState?.draftStatus === "IN_PROGRESS" ||
                      draftState?.draftStatus === "COMPLETED"
                    }
                  >
                    Start Draft
                  </Button>

                  {/* Pause Draft */}
                  <Button
                    onClick={() =>
                      handleAction(() => pauseDraft(selectedSeasonId), "Draft paused")
                    }
                    disabled={isPending || draftState?.draftStatus !== "IN_PROGRESS"}
                    variant="secondary"
                  >
                    Pause Draft
                  </Button>

                  {/* Resume Draft */}
                  <Button
                    onClick={() =>
                      handleAction(() => resumeDraft(selectedSeasonId), "Draft resumed")
                    }
                    disabled={isPending || draftState?.draftStatus !== "PAUSED"}
                  >
                    Resume Draft
                  </Button>

                  {/* Undo Last Pick */}
                  <Button
                    onClick={() =>
                      handleAction(
                        () => undoLastPick(selectedSeasonId),
                        "Last pick undone"
                      )
                    }
                    disabled={
                      isPending ||
                      !draftState?.picks.some((p) => p.used || p.passed)
                    }
                    variant="outline"
                  >
                    Undo Last Pick
                  </Button>

                  {/* Refresh */}
                  <Button
                    onClick={() => refreshData()}
                    disabled={isPending}
                    variant="outline"
                  >
                    Refresh
                  </Button>
                </div>

                {/* Resume with custom time */}
                {draftState?.draftStatus === "PAUSED" && (
                  <div className="pt-4 border-t">
                    <h4 className="text-sm font-medium mb-2">Resume with Custom Time</h4>
                    <div className="flex gap-2 items-end">
                      <div className="space-y-1">
                        <Label className="text-xs text-muted-foreground">Seconds</Label>
                        <Input
                          type="number"
                          min={10}
                          max={3600}
                          value={customTimeSeconds}
                          onChange={(e) => setCustomTimeSeconds(e.target.value)}
                          placeholder={draftState?.pickTimerSeconds.toString()}
                          className="w-24"
                        />
                      </div>
                      <Button
                        onClick={() => {
                          const seconds = parseInt(customTimeSeconds) || draftState?.pickTimerSeconds || 120;
                          handleAction(
                            () => resumeDraftWithTime(selectedSeasonId, seconds),
                            `Draft resumed with ${seconds}s on the clock`
                          );
                          setCustomTimeSeconds("");
                        }}
                        disabled={isPending}
                      >
                        Resume with Time
                      </Button>
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">
                      Leave blank to use default ({draftState?.pickTimerSeconds}s)
                    </p>
                  </div>
                )}

                {/* Danger Zone */}
                <div className="pt-4 border-t">
                  <h4 className="text-sm font-medium text-destructive mb-2">Danger Zone</h4>
                  <div className="flex flex-wrap gap-2">
                    <Button
                      onClick={() => {
                        if (confirm("Are you sure you want to reset all draft picks? This cannot be undone.")) {
                          handleAction(
                            () => resetDraft(selectedSeasonId),
                            "Draft reset successfully"
                          );
                        }
                      }}
                      disabled={isPending}
                      variant="destructive"
                    >
                      Reset Draft
                    </Button>
                    <Button
                      onClick={() => {
                        if (confirm("Are you sure you want to delete all draft picks? This cannot be undone.")) {
                          handleAction(
                            () => deleteDraftPicks(selectedSeasonId),
                            "Draft picks deleted"
                          );
                        }
                      }}
                      disabled={isPending || draftState?.draftStatus === "IN_PROGRESS"}
                      variant="destructive"
                    >
                      Delete All Picks
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Skip to Pick */}
            <Card>
              <CardHeader>
                <CardTitle>Skip to Pick</CardTitle>
                <CardDescription>
                  Jump to a specific pick number (will set draft to in progress)
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex gap-2">
                  <Input
                    type="number"
                    min={1}
                    max={draftState?.picks.length || 252}
                    value={skipToPickInput}
                    onChange={(e) => setSkipToPickInput(e.target.value)}
                    placeholder="Pick number"
                    className="w-32"
                  />
                  <Button
                    onClick={() =>
                      handleAction(
                        () => skipToPick(selectedSeasonId, parseInt(skipToPickInput) || 1),
                        `Skipped to pick ${skipToPickInput}`
                      )
                    }
                    disabled={isPending || !skipToPickInput}
                  >
                    Skip to Pick
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Current Status */}
            <Card>
              <CardHeader>
                <CardTitle>Current Status</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div>
                    <Label className="text-muted-foreground">Status</Label>
                    <p className="font-medium">
                      <Badge>{draftState?.draftStatus ?? "N/A"}</Badge>
                    </p>
                  </div>
                  <div>
                    <Label className="text-muted-foreground">Current Pick</Label>
                    <p className="font-medium">
                      #{draftState?.currentPickNumber ?? "-"} of {draftState?.picks.length ?? 0}
                    </p>
                  </div>
                  <div>
                    <Label className="text-muted-foreground">On the Clock</Label>
                    <p className="font-medium">
                      {draftState?.currentPick?.club.abbreviation ?? "-"}
                    </p>
                  </div>
                  <div>
                    <Label className="text-muted-foreground">Order Type</Label>
                    <p className="font-medium">
                      {draftState?.draftOrderType ?? "-"}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="board" className="space-y-4">
            {draftState && draftState.picks.length > 0 ? (
              <>
                {/* Timer and Queue */}
                <Card>
                  <CardContent className="p-4">
                    <div className="flex flex-wrap items-center justify-between gap-4">
                      <DraftTimer
                        deadline={draftState.pickDeadline ? new Date(draftState.pickDeadline) : null}
                        totalSeconds={draftState.pickTimerSeconds}
                        isPaused={draftState.draftStatus !== "IN_PROGRESS"}
                      />
                      <Button onClick={() => refreshData()} disabled={isPending}>
                        Refresh
                      </Button>
                    </div>
                    {draftState.queue.length > 0 && (
                      <div className="mt-4">
                        <DraftQueue
                          queue={draftState.queue}
                          currentPickNumber={draftState.currentPickNumber}
                        />
                      </div>
                    )}
                  </CardContent>
                </Card>

                {/* Board */}
                <Card>
                  <CardContent className="p-0">
                    <div className="max-h-[600px] overflow-auto">
                      <DraftBoard
                        picks={draftState.picks}
                        clubs={draftState.clubs}
                        currentPickNumber={draftState.currentPickNumber}
                        draftOrder={draftState.draftOrder}
                      />
                    </div>
                  </CardContent>
                </Card>
              </>
            ) : (
              <Card>
                <CardContent className="p-8 text-center text-muted-foreground">
                  No draft picks generated yet. Go to Controls tab to generate picks.
                </CardContent>
              </Card>
            )}
          </TabsContent>

          <TabsContent value="picks" className="space-y-4">
            {/* Reassign Pick */}
            <Card>
              <CardHeader>
                <CardTitle>Reassign Pick</CardTitle>
                <CardDescription>
                  Transfer a pick to a different club
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label>Pick</Label>
                    <Select value={reassignPickId} onValueChange={setReassignPickId}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select pick" />
                      </SelectTrigger>
                      <SelectContent>
                        {draftState?.picks
                          .filter((p) => !p.used)
                          .map((pick) => (
                            <SelectItem key={pick.id} value={pick.id}>
                              #{pick.pickNumber} R{pick.round} ({pick.club.abbreviation})
                            </SelectItem>
                          ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>New Owner</Label>
                    <Select value={reassignClubId} onValueChange={setReassignClubId}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select club" />
                      </SelectTrigger>
                      <SelectContent>
                        {clubs.map((club) => (
                          <SelectItem key={club.id} value={club.id}>
                            {club.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>&nbsp;</Label>
                    <Button
                      onClick={() =>
                        handleAction(
                          () => reassignPick(reassignPickId, reassignClubId),
                          "Pick reassigned"
                        )
                      }
                      disabled={isPending || !reassignPickId || !reassignClubId}
                      className="w-full"
                    >
                      Reassign
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* All Picks Table */}
            <Card>
              <CardHeader>
                <CardTitle>All Draft Picks</CardTitle>
              </CardHeader>
              <CardContent>
                {draftState && draftState.picks.length > 0 ? (
                  <div className="max-h-[500px] overflow-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Pick</TableHead>
                          <TableHead>Round</TableHead>
                          <TableHead>Current Owner</TableHead>
                          <TableHead>Original</TableHead>
                          <TableHead>Status</TableHead>
                          <TableHead>Selection</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {draftState.picks.map((pick) => (
                          <TableRow
                            key={pick.id}
                            className={`cursor-pointer hover:bg-muted/50 ${pick.pickNumber === draftState.currentPickNumber ? "bg-primary/10" : ""}`}
                            onClick={() => {
                              setEditingPick(pick);
                              setEditClubId(pick.clubId);
                            }}
                          >
                            <TableCell className="font-mono">#{pick.pickNumber}</TableCell>
                            <TableCell>R{pick.round}</TableCell>
                            <TableCell>
                              <Badge
                                style={{
                                  backgroundColor: pick.club.primaryColor || undefined,
                                  color: pick.club.secondaryColor || undefined,
                                }}
                              >
                                {pick.club.abbreviation}
                              </Badge>
                            </TableCell>
                            <TableCell>
                              {pick.originalClub.abbreviation !== pick.club.abbreviation && (
                                <span className="text-muted-foreground">
                                  {pick.originalClub.abbreviation}
                                </span>
                              )}
                            </TableCell>
                            <TableCell>
                              {pick.used ? (
                                <Badge>Used</Badge>
                              ) : pick.passed ? (
                                <Badge variant="secondary">Passed</Badge>
                              ) : pick.pickNumber === draftState.currentPickNumber ? (
                                <Badge variant="outline" className="animate-pulse">
                                  On Clock
                                </Badge>
                              ) : (
                                <Badge variant="outline">Pending</Badge>
                              )}
                            </TableCell>
                            <TableCell>
                              {pick.player?.name || (pick.passed ? "Passed" : "-")}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                ) : (
                  <p className="text-muted-foreground text-center py-8">
                    No picks generated yet.
                  </p>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="manual" className="space-y-4">
            {/* Manual Pick Entry */}
            <Card>
              <CardHeader>
                <CardTitle>Manual Pick Entry</CardTitle>
                <CardDescription>
                  Make a pick on behalf of a team (for timeout or manual entry)
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label>Select Pick</Label>
                  <Select value={selectedPickForAdmin} onValueChange={setSelectedPickForAdmin}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select pick to fill" />
                    </SelectTrigger>
                    <SelectContent>
                      {draftState?.picks
                        .filter((p) => !p.used && !p.passed)
                        .slice(0, 20)
                        .map((pick) => (
                          <SelectItem key={pick.id} value={pick.id}>
                            #{pick.pickNumber} - {pick.club.name} (R{pick.round})
                            {pick.pickNumber === draftState.currentPickNumber && " - ON CLOCK"}
                          </SelectItem>
                        ))}
                    </SelectContent>
                  </Select>
                </div>

                {selectedPickForAdmin && (
                  <div className="border rounded-lg p-4">
                    <h4 className="font-medium mb-2">Select Player for Pick</h4>
                    <div className="h-[400px]">
                      <PlayerSelector
                        players={players}
                        onSelect={(playerId) =>
                          handleAction(
                            () => adminMakePick(selectedPickForAdmin, playerId),
                            "Pick made successfully"
                          )
                        }
                        disabled={isPending}
                        isLoading={isPending}
                      />
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      )}

      {/* Pick Edit Dialog */}
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
                  <span className="text-muted-foreground">Original Owner:</span>{" "}
                  {editingPick?.originalClub.abbreviation}
                </div>
                {editingPick?.player && (
                  <div className="col-span-2">
                    <span className="text-muted-foreground">Selection:</span>{" "}
                    {editingPick.player.name}
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
                      {clubs.map((club) => (
                        <SelectItem key={club.id} value={club.id}>
                          {club.name} ({club.abbreviation})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Button
                    onClick={() => {
                      if (editingPick && editClubId) {
                        handleAction(
                          () => reassignPick(editingPick.id, editClubId),
                          "Pick reassigned"
                        );
                        setEditingPick(null);
                        setEditClubId("");
                      }
                    }}
                    disabled={isPending || !editClubId}
                  >
                    Reassign
                  </Button>
                </div>
              </div>
            )}

            {/* Set custom time for this pick */}
            {editingPick?.pickNumber === draftState?.currentPickNumber && !editingPick?.used && (
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
                      handleAction(
                        () => setPickTime(selectedSeasonId, seconds),
                        `Time set to ${seconds} seconds`
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
                  Sets a custom countdown for the current pick (10-3600 seconds)
                </p>
              </div>
            )}

            {/* Skip to this pick */}
            <div className="space-y-2">
              <Label>Quick Actions</Label>
              <div className="flex flex-wrap gap-2">
                <Button
                  variant="outline"
                  onClick={() => {
                    if (editingPick) {
                      handleAction(
                        () => skipToPick(selectedSeasonId, editingPick.pickNumber),
                        `Draft moved to pick ${editingPick.pickNumber}`
                      );
                      setEditingPick(null);
                    }
                  }}
                  disabled={isPending || editingPick?.used || editingPick?.passed}
                >
                  Skip to This Pick
                </Button>
                {editingPick?.used && (
                  <Button
                    variant="destructive"
                    onClick={() => {
                      if (confirm("Are you sure you want to undo this pick? The player will become available again.")) {
                        handleAction(
                          () => undoLastPick(selectedSeasonId),
                          "Pick undone"
                        );
                        setEditingPick(null);
                      }
                    }}
                    disabled={isPending}
                  >
                    Undo This Pick
                  </Button>
                )}
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
