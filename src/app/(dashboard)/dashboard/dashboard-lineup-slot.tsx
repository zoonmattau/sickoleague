"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Position } from "@prisma/client";
import { useState } from "react";
import { assignPlayerToRoster, removePlayerFromRoster } from "./roster/actions";
import { X } from "lucide-react";
import type {
  SpotConfig,
  SerializedContract,
  SerializedRosterPlayer,
  PlayerStats,
} from "./types";

const POSITION_COLORS: Record<string, string> = {
  DEF: "bg-red-500/15 text-red-700 dark:text-red-400 border-red-500/30",
  MID: "bg-blue-500/15 text-blue-700 dark:text-blue-400 border-blue-500/30",
  RUC: "bg-amber-500/15 text-amber-700 dark:text-amber-400 border-amber-500/30",
  FWD: "bg-green-500/15 text-green-700 dark:text-green-400 border-green-500/30",
};

function PositionBadge({ pos, size = "sm" }: { pos: string; size?: "sm" | "xs" }) {
  const colors = POSITION_COLORS[pos] ?? "bg-muted text-muted-foreground";
  const sizeClass = size === "xs"
    ? "text-[10px] px-1 py-0 h-4"
    : "text-xs px-1.5 py-0 h-5";
  return (
    <span className={`inline-flex items-center rounded-md border font-medium ${colors} ${sizeClass}`}>
      {pos}
    </span>
  );
}

type DashboardLineupSlotProps = {
  spotConfig: SpotConfig;
  clubId: string;
  assignedPlayer?: SerializedRosterPlayer;
  availablePlayers: SerializedContract[];
  onPlayerClick: (contract: SerializedContract) => void;
  playerStats: Map<string, PlayerStats>;
  captainRosterPlayerId: string | null;
  vcRosterPlayerId: string | null;
};

export function DashboardLineupSlot({
  spotConfig,
  clubId,
  assignedPlayer,
  availablePlayers,
  onPlayerClick,
  playerStats,
  captainRosterPlayerId,
  vcRosterPlayerId,
}: DashboardLineupSlotProps) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  const { spot, label, position, squad } = spotConfig;

  // Filter eligible unassigned players
  const eligiblePlayers = availablePlayers.filter((contract) => {
    if (contract.rosterPlayers.length > 0) return false;
    if (position === "BENCH" || position === "IL") return true;
    return contract.aflPlayer.positions.includes(position as Position);
  });

  const handleAssign = async (contractId: string) => {
    setLoading(true);
    const result = await assignPlayerToRoster(contractId, clubId, squad, spot);
    setLoading(false);
    if (result.success) {
      setOpen(false);
    }
  };

  const handleRemove = async () => {
    if (!assignedPlayer) return;
    setLoading(true);
    await removePlayerFromRoster(assignedPlayer.id);
    setLoading(false);
  };

  if (assignedPlayer) {
    const player = assignedPlayer.contract.aflPlayer;
    const contract = assignedPlayer.contract;
    const stats = playerStats.get(contract.id);
    const isCaptain = assignedPlayer.id === captainRosterPlayerId;
    const isVc = assignedPlayer.id === vcRosterPlayerId;

    return (
      <div className="flex items-center justify-between text-sm py-1.5 px-2 rounded-md bg-muted/50 hover:bg-muted transition-colors">
        <div className="flex items-center gap-2 min-w-0">
          <span className="font-medium w-12 shrink-0 text-xs text-muted-foreground">
            {label}
          </span>
          <div className="flex gap-0.5 shrink-0">
            {player.positions.map((pos) => (
              <PositionBadge key={pos} pos={pos} size="xs" />
            ))}
          </div>
          <button
            onClick={() => onPlayerClick(contract)}
            className="font-medium truncate hover:underline text-left"
          >
            {player.firstName} {player.lastName}
          </button>
          {isCaptain && (
            <Badge variant="default" className="text-[10px] px-1 py-0 h-4 shrink-0">
              C
            </Badge>
          )}
          {isVc && (
            <Badge variant="secondary" className="text-[10px] px-1 py-0 h-4 shrink-0">
              VC
            </Badge>
          )}
        </div>
        <div className="flex items-center shrink-0 divide-x divide-border">
          <span className="text-xs text-muted-foreground w-10 text-center px-1.5">
            {player.aflTeam?.abbreviation ?? "—"}
          </span>
          <span className="text-xs text-muted-foreground w-10 text-right px-1.5" title={stats ? `${stats.gamesPlayed} games` : "0 games"}>
            {stats && stats.gamesPlayed > 0 ? stats.avgScore : "—"}
          </span>
          <span className="text-xs text-muted-foreground w-10 text-right px-1.5" title="Last 5 games avg">
            {stats && stats.last5Avg !== null ? stats.last5Avg : "—"}
          </span>
          <span className="text-xs font-mono text-muted-foreground w-[4.5rem] text-right px-1.5">
            ${(contract.totalValue * 1000).toLocaleString()}
          </span>
          <span className="pl-1.5">
            <Button
              variant="ghost"
              size="icon-sm"
              onClick={handleRemove}
              disabled={loading}
              className="h-5 w-5"
            >
              <X className="h-3 w-3" />
            </Button>
          </span>
        </div>
      </div>
    );
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <div className="flex items-center justify-between text-sm py-1.5 px-2 rounded-md bg-muted/30 hover:bg-muted/50 transition-colors cursor-pointer">
          <div className="flex items-center gap-2">
            <span className="font-medium w-12 shrink-0 text-xs text-muted-foreground">
              {label}
            </span>
            <span className="text-muted-foreground italic text-xs">Empty</span>
          </div>
          <span className="text-xs text-muted-foreground">+ Assign</span>
        </div>
      </DialogTrigger>
      <DialogContent className="max-w-md max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Assign Player — {label}</DialogTitle>
          <DialogDescription>
            Select a player from your contracted roster
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-2 mt-4">
          {eligiblePlayers.length === 0 ? (
            <p className="text-muted-foreground text-center py-4">
              No eligible players available for this position
            </p>
          ) : (
            eligiblePlayers.map((contract) => {
              const stats2 = playerStats.get(contract.id);
              return (
                <button
                  key={contract.id}
                  onClick={() => handleAssign(contract.id)}
                  disabled={loading}
                  className="w-full flex items-center justify-between p-3 border rounded-lg hover:bg-accent transition-colors text-left"
                >
                  <div className="flex items-center gap-2">
                    <div className="flex gap-0.5 shrink-0">
                      {contract.aflPlayer.positions.map((pos) => (
                        <PositionBadge key={pos} pos={pos} size="sm" />
                      ))}
                    </div>
                    <span className="font-medium">
                      {contract.aflPlayer.firstName} {contract.aflPlayer.lastName}
                    </span>
                    <span className="text-muted-foreground text-sm">
                      {contract.aflPlayer.aflTeam?.abbreviation}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-muted-foreground">
                      {stats2 && stats2.gamesPlayed > 0 ? stats2.avgScore : "—"} avg
                    </span>
                    <span className="text-xs font-mono">${contract.totalValue}</span>
                  </div>
                </button>
              );
            })
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
