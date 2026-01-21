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
import { X } from "lucide-react";

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

type RosterSlotProps = {
  position: string;
  rosterSpot: RosterSpot;
  squad: Squad;
  clubId: string;
  assignedPlayer?: RosterPlayerData;
  availablePlayers: ContractedPlayer[];
};

export function RosterSlot({
  position,
  rosterSpot,
  squad,
  clubId,
  assignedPlayer,
  availablePlayers,
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

  if (assignedPlayer) {
    const player = assignedPlayer.contract.aflPlayer;
    return (
      <div className="flex items-center justify-between p-3 border rounded-lg bg-card hover:bg-accent/50 transition-colors">
        <div className="flex items-center gap-3">
          <Badge variant="outline">{position}</Badge>
          <div>
            <span className="font-medium">
              {player.firstName} {player.lastName}
            </span>
            <span className="text-muted-foreground ml-2 text-sm">
              {player.aflTeam?.abbreviation}
            </span>
          </div>
          <div className="flex gap-1">
            {player.positions.map((pos) => (
              <Badge key={pos} variant="secondary" className="text-xs">
                {pos}
              </Badge>
            ))}
          </div>
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
            <Badge variant="outline">{position}</Badge>
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
            eligiblePlayers.map((contract) => (
              <button
                key={contract.id}
                onClick={() => handleAssign(contract.id)}
                disabled={loading}
                className="w-full flex items-center justify-between p-3 border rounded-lg hover:bg-accent transition-colors text-left"
              >
                <div>
                  <span className="font-medium">
                    {contract.aflPlayer.firstName} {contract.aflPlayer.lastName}
                  </span>
                  <span className="text-muted-foreground ml-2 text-sm">
                    {contract.aflPlayer.aflTeam?.abbreviation}
                  </span>
                </div>
                <div className="flex gap-1">
                  {contract.aflPlayer.positions.map((pos) => (
                    <Badge key={pos} variant="secondary" className="text-xs">
                      {pos}
                    </Badge>
                  ))}
                </div>
              </button>
            ))
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
