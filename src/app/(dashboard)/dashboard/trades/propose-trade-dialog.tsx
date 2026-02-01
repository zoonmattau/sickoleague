"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { getTradeablePlayers, proposeTrade } from "./actions";
import { getPositionColorClasses } from "@/lib/position-colors";

type Club = {
  id: string;
  name: string;
  abbreviation: string;
  primaryColor: string | null;
  secondaryColor: string | null;
};

type Player = {
  contractId: string;
  playerId: string;
  firstName: string;
  lastName: string;
  positions: string[];
  photoUrl: string | null;
  aflTeam: string | null;
  salary: number;
  endSeason: number;
};

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  clubs: Club[];
  myClub: { id: string; name: string };
  myPlayers: Player[];
};

export function ProposeTradeDialog({ open, onOpenChange, clubs, myClub, myPlayers }: Props) {
  const router = useRouter();
  const [step, setStep] = useState<"select-club" | "select-players">("select-club");
  const [targetClubId, setTargetClubId] = useState<string>("");
  const [theirPlayers, setTheirPlayers] = useState<Player[]>([]);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const [mySelected, setMySelected] = useState<Set<string>>(new Set());
  const [theirSelected, setTheirSelected] = useState<Set<string>>(new Set());

  // Reset state when dialog closes
  useEffect(() => {
    if (!open) {
      setStep("select-club");
      setTargetClubId("");
      setTheirPlayers([]);
      setMySelected(new Set());
      setTheirSelected(new Set());
    }
  }, [open]);

  const handleSelectClub = async () => {
    if (!targetClubId) return;

    setLoading(true);
    try {
      const players = await getTradeablePlayers(targetClubId);
      setTheirPlayers(players);
      setStep("select-players");
    } catch {
      toast.error("Failed to load players");
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async () => {
    if (mySelected.size === 0 && theirSelected.size === 0) {
      toast.error("Select at least one player to trade");
      return;
    }

    setSubmitting(true);
    try {
      const result = await proposeTrade(
        targetClubId,
        Array.from(mySelected),
        Array.from(theirSelected)
      );

      if (result.error) {
        toast.error(result.error);
      } else {
        toast.success("Trade proposed successfully");
        onOpenChange(false);
        router.refresh();
      }
    } catch {
      toast.error("Failed to propose trade");
    } finally {
      setSubmitting(false);
    }
  };

  const toggleMyPlayer = (contractId: string) => {
    setMySelected((prev) => {
      const next = new Set(prev);
      if (next.has(contractId)) {
        next.delete(contractId);
      } else {
        next.add(contractId);
      }
      return next;
    });
  };

  const toggleTheirPlayer = (contractId: string) => {
    setTheirSelected((prev) => {
      const next = new Set(prev);
      if (next.has(contractId)) {
        next.delete(contractId);
      } else {
        next.add(contractId);
      }
      return next;
    });
  };

  const targetClub = clubs.find((c) => c.id === targetClubId);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Propose Trade</DialogTitle>
          <DialogDescription>
            {step === "select-club"
              ? "Select a club to trade with"
              : `Trading with ${targetClub?.name}`}
          </DialogDescription>
        </DialogHeader>

        {step === "select-club" ? (
          <div className="space-y-4">
            <Select value={targetClubId} onValueChange={setTargetClubId}>
              <SelectTrigger>
                <SelectValue placeholder="Select a club..." />
              </SelectTrigger>
              <SelectContent>
                {clubs.map((club) => (
                  <SelectItem key={club.id} value={club.id}>
                    <span className="flex items-center gap-2">
                      <span
                        className="w-3 h-3 rounded-full"
                        style={{ backgroundColor: club.primaryColor || "#6b7280" }}
                      />
                      {club.name}
                    </span>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => onOpenChange(false)}>
                Cancel
              </Button>
              <Button onClick={handleSelectClub} disabled={!targetClubId || loading}>
                {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Continue
              </Button>
            </div>
          </div>
        ) : (
          <div className="space-y-6">
            <div className="grid grid-cols-2 gap-6">
              {/* My players */}
              <div className="space-y-3">
                <h3 className="font-semibold text-sm text-muted-foreground">
                  You Send ({mySelected.size} selected)
                </h3>
                <div className="border rounded-lg max-h-[300px] overflow-y-auto">
                  {myPlayers.length === 0 ? (
                    <p className="p-4 text-sm text-muted-foreground text-center">
                      No players on roster
                    </p>
                  ) : (
                    myPlayers.map((player) => (
                      <label
                        key={player.contractId}
                        className="flex items-center gap-3 p-3 hover:bg-muted/50 cursor-pointer border-b last:border-b-0"
                      >
                        <Checkbox
                          checked={mySelected.has(player.contractId)}
                          onCheckedChange={() => toggleMyPlayer(player.contractId)}
                        />
                        <div className="flex-1 min-w-0">
                          <div className="font-medium text-sm">
                            {player.lastName}, {player.firstName}
                          </div>
                          <div className="flex items-center gap-2 text-xs text-muted-foreground">
                            <span>${player.salary}k</span>
                            <span className="flex gap-1">
                              {player.positions.map((pos) => (
                                <span
                                  key={pos}
                                  className={`px-1 py-0.5 rounded text-[10px] ${getPositionColorClasses(pos)}`}
                                >
                                  {pos}
                                </span>
                              ))}
                            </span>
                          </div>
                        </div>
                      </label>
                    ))
                  )}
                </div>
              </div>

              {/* Their players */}
              <div className="space-y-3">
                <h3 className="font-semibold text-sm text-muted-foreground">
                  You Receive ({theirSelected.size} selected)
                </h3>
                <div className="border rounded-lg max-h-[300px] overflow-y-auto">
                  {theirPlayers.length === 0 ? (
                    <p className="p-4 text-sm text-muted-foreground text-center">
                      No players on roster
                    </p>
                  ) : (
                    theirPlayers.map((player) => (
                      <label
                        key={player.contractId}
                        className="flex items-center gap-3 p-3 hover:bg-muted/50 cursor-pointer border-b last:border-b-0"
                      >
                        <Checkbox
                          checked={theirSelected.has(player.contractId)}
                          onCheckedChange={() => toggleTheirPlayer(player.contractId)}
                        />
                        <div className="flex-1 min-w-0">
                          <div className="font-medium text-sm">
                            {player.lastName}, {player.firstName}
                          </div>
                          <div className="flex items-center gap-2 text-xs text-muted-foreground">
                            <span>${player.salary}k</span>
                            <span className="flex gap-1">
                              {player.positions.map((pos) => (
                                <span
                                  key={pos}
                                  className={`px-1 py-0.5 rounded text-[10px] ${getPositionColorClasses(pos)}`}
                                >
                                  {pos}
                                </span>
                              ))}
                            </span>
                          </div>
                        </div>
                      </label>
                    ))
                  )}
                </div>
              </div>
            </div>

            {/* Summary */}
            {(mySelected.size > 0 || theirSelected.size > 0) && (
              <div className="p-3 bg-muted rounded-lg text-sm">
                <div className="flex justify-between">
                  <span>Salary out:</span>
                  <span className="font-medium">
                    ${myPlayers
                      .filter((p) => mySelected.has(p.contractId))
                      .reduce((sum, p) => sum + p.salary, 0)}k
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>Salary in:</span>
                  <span className="font-medium">
                    ${theirPlayers
                      .filter((p) => theirSelected.has(p.contractId))
                      .reduce((sum, p) => sum + p.salary, 0)}k
                  </span>
                </div>
              </div>
            )}

            <div className="flex justify-between">
              <Button variant="outline" onClick={() => setStep("select-club")}>
                Back
              </Button>
              <div className="flex gap-2">
                <Button variant="outline" onClick={() => onOpenChange(false)}>
                  Cancel
                </Button>
                <Button
                  onClick={handleSubmit}
                  disabled={submitting || (mySelected.size === 0 && theirSelected.size === 0)}
                >
                  {submitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Propose Trade
                </Button>
              </div>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
