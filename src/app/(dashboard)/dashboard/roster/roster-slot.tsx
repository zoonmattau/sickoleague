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
import { RosterSpot, Squad, Position } from "@prisma/client";
import { useState } from "react";
import { assignPlayerToRoster, removePlayerFromRoster } from "./actions";
import { X, Crown, Star } from "lucide-react";
import { getPositionColorClasses } from "@/lib/position-colors";

type ContractedPlayer = {
  id: string;
  aflPlayer: {
    id: string;
    firstName: string;
    lastName: string;
    positions: Position[];
    aflTeam: {
      abbreviation: string;
    } | null;
  };
  rosterPlayers: { id: string; rosterSpot: RosterSpot }[];
};

type RosterPlayerData = {
  id: string;
  rosterSpot: RosterSpot;
  isCaptain?: boolean;
  isViceCaptain?: boolean;
  contract: {
    id: string;
    aflPlayer: {
      firstName: string;
      lastName: string;
      positions: Position[];
      aflTeam: {
        abbreviation: string;
      } | null;
    };
  };
};

type PlayerStats = {
  avgScore: number | null;
  last5Avg: number | null;
  gamesPlayed: number;
};

type RosterSlotProps = {
  position: string;
  rosterSpot: RosterSpot;
  squad: Squad;
  clubId: string;
  assignedPlayer?: RosterPlayerData;
  availablePlayers: ContractedPlayer[];
  playerStats?: Map<string, PlayerStats>;
  onPlayerClick?: (contractId: string) => void;
};

export function RosterSlot({
  position,
  rosterSpot,
  squad,
  clubId,
  assignedPlayer,
  availablePlayers,
  playerStats,
  onPlayerClick,
}: RosterSlotProps) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  // Filter available players to those with valid positions and not already assigned
  const eligiblePlayers = availablePlayers.filter((contract) => {
    // Already has a roster assignment
    if (contract.rosterPlayers.length > 0) return false;

    // Check position eligibility (BENCH and IL can take any position)
    if (position === "BENCH" || position === "IL") return true;

    return contract.aflPlayer.positions.includes(position as Position);
  });

  const handleAssign = async (contractId: string) => {
    setLoading(true);
    const result = await assignPlayerToRoster(contractId, clubId, squad, rosterSpot);
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

  // Get position color classes
  const positionColors = getPositionColorClasses(position);

  if (assignedPlayer) {
    const player = assignedPlayer.contract.aflPlayer;
    const stats = playerStats?.get(assignedPlayer.contract.id);

    return (
      <div className="flex items-center justify-between p-3 border rounded-lg bg-card hover:bg-accent/50 transition-colors">
        <div className="flex items-center gap-3">
          <span className={`text-xs px-2 py-0.5 rounded font-medium ${positionColors}`}>
            {position}
          </span>
          <div className="flex items-center gap-1">
            {assignedPlayer.isCaptain && (
              <Crown className="h-3.5 w-3.5 text-amber-500" />
            )}
            {assignedPlayer.isViceCaptain && (
              <Star className="h-3.5 w-3.5 text-amber-500" />
            )}
            <button
              onClick={(e) => {
                e.stopPropagation();
                onPlayerClick?.(assignedPlayer.contract.id);
              }}
              className="font-medium hover:text-primary hover:underline transition-colors"
            >
              {player.firstName.charAt(0)}. {player.lastName}
            </button>
            <span className="text-muted-foreground text-sm">
              {player.aflTeam?.abbreviation}
            </span>
          </div>
          <div className="flex gap-1">
            {player.positions.map((pos) => (
              <span
                key={pos}
                className={`text-[10px] px-1.5 py-0.5 rounded font-medium ${getPositionColorClasses(pos)}`}
              >
                {pos}
              </span>
            ))}
          </div>
          {/* Stats */}
          {stats && (
            <div className="flex gap-3 text-xs text-muted-foreground ml-2">
              <span>
                Avg: <span className="font-medium text-foreground">{stats.avgScore?.toFixed(1) ?? "-"}</span>
              </span>
              <span>
                L5: <span className="font-medium text-foreground">{stats.last5Avg?.toFixed(1) ?? "-"}</span>
              </span>
              <span>
                GP: <span className="font-medium text-foreground">{stats.gamesPlayed}</span>
              </span>
            </div>
          )}
        </div>
        <Button
          variant="ghost"
          size="icon"
          onClick={handleRemove}
          disabled={loading}
        >
          <X className="h-4 w-4" />
        </Button>
      </div>
    );
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <div className="flex items-center justify-between p-3 border rounded-lg bg-muted/50 hover:bg-muted transition-colors cursor-pointer">
          <div className="flex items-center gap-3">
            <span className={`text-xs px-2 py-0.5 rounded font-medium ${positionColors}`}>
              {position}
            </span>
            <span className="text-muted-foreground">Empty slot</span>
          </div>
          <span className="text-sm text-muted-foreground">
            Click to assign player
          </span>
        </div>
      </DialogTrigger>
      <DialogContent className="max-w-md max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Assign Player to {position}</DialogTitle>
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
              const stats = playerStats?.get(contract.id);
              return (
                <button
                  key={contract.id}
                  onClick={() => handleAssign(contract.id)}
                  disabled={loading}
                  className="w-full flex items-center justify-between p-3 border rounded-lg hover:bg-accent transition-colors text-left"
                >
                  <div>
                    <span className="font-medium">
                      {contract.aflPlayer.firstName.charAt(0)}. {contract.aflPlayer.lastName}
                    </span>
                    <span className="text-muted-foreground ml-2 text-sm">
                      {contract.aflPlayer.aflTeam?.abbreviation}
                    </span>
                    {stats && (
                      <span className="text-muted-foreground ml-2 text-xs">
                        Avg: {stats.avgScore?.toFixed(1) ?? "-"}
                      </span>
                    )}
                  </div>
                  <div className="flex gap-1">
                    {contract.aflPlayer.positions.map((pos) => (
                      <span
                        key={pos}
                        className={`text-[10px] px-1.5 py-0.5 rounded font-medium ${getPositionColorClasses(pos)}`}
                      >
                        {pos}
                      </span>
                    ))}
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
