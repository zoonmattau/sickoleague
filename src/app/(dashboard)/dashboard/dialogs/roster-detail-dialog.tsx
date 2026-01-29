"use client";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import type { SerializedContract, SerializedRosterPlayer } from "../types";

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  contracts: SerializedContract[];
  rosterPlayers: SerializedRosterPlayer[];
  seniorsCount: number;
  reservesCount: number;
};

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
      // Use first position if primary not in standard groups
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
          <div className="grid grid-cols-3 gap-4">
            <div className="p-4 rounded-lg bg-muted/50 text-center">
              <div className="text-2xl font-bold">{totalContracts}</div>
              <div className="text-sm text-muted-foreground">Total Players</div>
            </div>
            <div className="p-4 rounded-lg bg-muted/50 text-center">
              <div className="text-2xl font-bold">{seniorsCount}</div>
              <div className="text-sm text-muted-foreground">In Seniors</div>
            </div>
            <div className="p-4 rounded-lg bg-muted/50 text-center">
              <div className="text-2xl font-bold">{reservesCount}</div>
              <div className="text-sm text-muted-foreground">In Reserves</div>
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

          {/* Players by Position */}
          <div className="space-y-4">
            <h3 className="text-sm font-semibold">Players by Position</h3>
            <div className="grid grid-cols-2 gap-4">
              {Object.entries(groupedByPosition).map(([position, players]) => (
                <div key={position} className="p-3 rounded-lg border">
                  <div className="flex items-center justify-between mb-2">
                    <Badge variant="outline">{position}</Badge>
                    <span className="text-sm font-medium">{players.length}</span>
                  </div>
                  <div className="space-y-1">
                    {players.slice(0, 5).map((contract) => (
                      <div key={contract.id} className="text-sm flex items-center justify-between">
                        <span className="truncate">
                          {contract.aflPlayer.lastName}, {contract.aflPlayer.firstName.charAt(0)}.
                        </span>
                        <span className="text-xs text-muted-foreground">
                          {contract.aflPlayer.aflTeam?.abbreviation || "-"}
                        </span>
                      </div>
                    ))}
                    {players.length > 5 && (
                      <div className="text-xs text-muted-foreground">
                        +{players.length - 5} more
                      </div>
                    )}
                    {players.length === 0 && (
                      <div className="text-xs text-muted-foreground italic">None</div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Dual Position Players */}
          <div>
            <h3 className="text-sm font-semibold mb-3">Dual Position Players</h3>
            <div className="flex flex-wrap gap-2">
              {contracts
                .filter(c => c.aflPlayer.positions.length > 1)
                .map((contract) => (
                  <div
                    key={contract.id}
                    className="px-3 py-1.5 rounded-lg border bg-muted/30 text-sm"
                  >
                    <span className="font-medium">
                      {contract.aflPlayer.lastName}, {contract.aflPlayer.firstName.charAt(0)}.
                    </span>
                    <span className="text-muted-foreground ml-2">
                      ({contract.aflPlayer.positions.join("/")})
                    </span>
                  </div>
                ))}
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
                <Badge variant="secondary" className="text-xs">{unassignedContracts.length}</Badge>
              </h3>
              <div className="flex flex-wrap gap-2">
                {unassignedContracts.map((contract) => (
                  <div
                    key={contract.id}
                    className="px-3 py-1.5 rounded-lg border border-yellow-500/30 bg-yellow-500/10 text-sm"
                  >
                    <span className="font-medium">
                      {contract.aflPlayer.lastName}, {contract.aflPlayer.firstName.charAt(0)}.
                    </span>
                    <span className="text-muted-foreground ml-2">
                      ({contract.aflPlayer.positions.join("/")})
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
