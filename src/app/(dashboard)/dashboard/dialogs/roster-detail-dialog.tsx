"use client";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { POSITION_COLORS } from "@/lib/position-colors";
import type { SerializedContract, SerializedRosterPlayer } from "../types";

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  contracts: SerializedContract[];
  rosterPlayers: SerializedRosterPlayer[];
  seniorsCount: number;
  reservesCount: number;
};

// Use centralized position colors
const positionColors = POSITION_COLORS;

export function RosterDetailDialog({
  open,
  onOpenChange,
  contracts,
  rosterPlayers,
  seniorsCount,
  reservesCount,
}: Props) {
  const totalContracts = contracts.length;
  const maxRoster = 21;
  const minRoster = 19;
  const benchCount = rosterPlayers.filter(rp => rp.rosterSpot.startsWith("BENCH")).length;
  const ilCount = rosterPlayers.filter(rp => rp.rosterSpot.startsWith("IL")).length;

  // Group players by position
  const groupedByPosition: Record<string, SerializedContract[]> = {
    DEF: [],
    MID: [],
    RUC: [],
    FWD: [],
  };

  for (const contract of contracts) {
    const primaryPosition = contract.aflPlayer.positions[0];
    if (primaryPosition && groupedByPosition[primaryPosition]) {
      groupedByPosition[primaryPosition].push(contract);
    } else if (contract.aflPlayer.positions.length > 0) {
      const firstPos = contract.aflPlayer.positions.find(p => groupedByPosition[p]);
      if (firstPos) {
        groupedByPosition[firstPos].push(contract);
      }
    }
  }

  // Get unassigned players (have contract but not in roster)
  const assignedContractIds = new Set(rosterPlayers.map(rp => rp.contractId));
  const unassignedContracts = contracts.filter(c => !assignedContractIds.has(c.id));

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Roster Details</DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Summary */}
          <div className="grid grid-cols-5 gap-3">
            <div className="p-3 rounded-lg bg-muted/50 text-center">
              <div className="text-xl font-bold">{totalContracts}</div>
              <div className="text-xs text-muted-foreground">Total</div>
            </div>
            <div className="p-3 rounded-lg bg-amber-500/10 text-center border border-amber-500/20">
              <div className="text-xl font-bold text-amber-600 dark:text-amber-400">{seniorsCount}</div>
              <div className="text-xs text-muted-foreground">Seniors</div>
            </div>
            <div className="p-3 rounded-lg bg-slate-500/10 text-center border border-slate-500/20">
              <div className="text-xl font-bold">{reservesCount}</div>
              <div className="text-xs text-muted-foreground">Reserves</div>
            </div>
            <div className="p-3 rounded-lg bg-muted/50 text-center">
              <div className="text-xl font-bold">{benchCount}</div>
              <div className="text-xs text-muted-foreground">Bench</div>
            </div>
            <div className="p-3 rounded-lg bg-muted/50 text-center">
              <div className="text-xl font-bold">{ilCount}</div>
              <div className="text-xs text-muted-foreground">IL</div>
            </div>
          </div>

          {/* Roster Size Progress */}
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span>Roster Size</span>
              <span className="font-medium">{totalContracts}/{maxRoster}</span>
            </div>
            <Progress value={(totalContracts / maxRoster) * 100} className="h-2" />
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>Min: {minRoster}</span>
              <span>
                {totalContracts < minRoster && (
                  <span className="text-yellow-500">Need {minRoster - totalContracts} more</span>
                )}
                {totalContracts >= minRoster && totalContracts < maxRoster && (
                  <span className="text-green-500">{maxRoster - totalContracts} spots available</span>
                )}
                {totalContracts >= maxRoster && (
                  <span className="text-red-500">Roster full</span>
                )}
              </span>
              <span>Max: {maxRoster}</span>
            </div>
          </div>

          {/* Players by Position - Color Coded */}
          <div className="space-y-4">
            <h3 className="text-sm font-semibold">Players by Position</h3>
            <div className="grid grid-cols-2 gap-4">
              {Object.entries(groupedByPosition).map(([position, players]) => {
                const colors = positionColors[position] || positionColors.MID;
                return (
                  <div key={position} className={`p-3 rounded-lg border ${colors.bg} ${colors.border}`}>
                    <div className="flex items-center justify-between mb-2">
                      <Badge className={`${colors.bg} ${colors.text} border-0`}>
                        {position}
                      </Badge>
                      <span className={`text-sm font-bold ${colors.text}`}>{players.length}</span>
                    </div>
                    <div className="space-y-1">
                      {players.slice(0, 6).map((contract) => (
                        <div key={contract.id} className="text-sm flex items-center justify-between">
                          <span className="truncate font-medium">
                            {contract.aflPlayer.lastName}, {contract.aflPlayer.firstName.charAt(0)}.
                          </span>
                          <span className="text-xs text-muted-foreground ml-2">
                            {contract.aflPlayer.aflTeam?.abbreviation || "-"}
                          </span>
                        </div>
                      ))}
                      {players.length > 6 && (
                        <div className="text-xs text-muted-foreground pt-1">
                          +{players.length - 6} more
                        </div>
                      )}
                      {players.length === 0 && (
                        <div className="text-xs text-muted-foreground italic">None</div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Dual Position Players */}
          <div>
            <h3 className="text-sm font-semibold mb-3">Dual Position Players</h3>
            <div className="flex flex-wrap gap-2">
              {contracts
                .filter(c => c.aflPlayer.positions.length > 1)
                .map((contract) => {
                  const pos1 = contract.aflPlayer.positions[0];
                  const pos2 = contract.aflPlayer.positions[1];
                  const colors1 = positionColors[pos1] || positionColors.MID;
                  const colors2 = positionColors[pos2] || positionColors.MID;
                  return (
                    <div
                      key={contract.id}
                      className="px-3 py-1.5 rounded-lg border bg-muted/30 text-sm flex items-center gap-2"
                    >
                      <span className="font-medium">
                        {contract.aflPlayer.lastName}, {contract.aflPlayer.firstName.charAt(0)}.
                      </span>
                      <div className="flex gap-0.5">
                        <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${colors1.bg} ${colors1.text}`}>
                          {pos1}
                        </span>
                        <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${colors2.bg} ${colors2.text}`}>
                          {pos2}
                        </span>
                      </div>
                    </div>
                  );
                })}
              {contracts.filter(c => c.aflPlayer.positions.length > 1).length === 0 && (
                <span className="text-sm text-muted-foreground italic">No dual position players</span>
              )}
            </div>
          </div>

          {/* Unassigned Players */}
          {unassignedContracts.length > 0 && (
            <div>
              <h3 className="text-sm font-semibold mb-3 flex items-center gap-2">
                Unassigned Players
                <Badge variant="destructive" className="text-xs">{unassignedContracts.length}</Badge>
              </h3>
              <div className="flex flex-wrap gap-2">
                {unassignedContracts.map((contract) => {
                  const pos = contract.aflPlayer.positions[0];
                  const colors = positionColors[pos] || positionColors.MID;
                  return (
                    <div
                      key={contract.id}
                      className="px-3 py-1.5 rounded-lg border border-red-500/30 bg-red-500/10 text-sm flex items-center gap-2"
                    >
                      <span className="font-medium">
                        {contract.aflPlayer.lastName}, {contract.aflPlayer.firstName.charAt(0)}.
                      </span>
                      <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${colors.bg} ${colors.text}`}>
                        {contract.aflPlayer.positions.join("/")}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
