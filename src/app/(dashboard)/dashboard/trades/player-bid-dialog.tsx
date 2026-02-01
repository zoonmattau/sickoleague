"use client";

import { useState, useTransition } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
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
import { toast } from "sonner";
import type { FreeAgentPlayer } from "./actions";
import { placeBid } from "./actions";

interface PlayerBidDialogProps {
  player: FreeAgentPlayer;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  gamesRemaining: number;
}

const positionColors: Record<string, string> = {
  DEF: "bg-red-600 text-white",
  MID: "bg-blue-600 text-white",
  RUC: "bg-yellow-500 text-black",
  FWD: "bg-green-600 text-white",
};

const currentYear = new Date().getFullYear();

export function PlayerBidDialog({
  player,
  open,
  onOpenChange,
  gamesRemaining,
}: PlayerBidDialogProps) {
  const [isPending, startTransition] = useTransition();
  const [years, setYears] = useState<number>(2);
  const [yearValues, setYearValues] = useState<Record<number, number>>({
    [currentYear]: player.expectedPrice,
    [currentYear + 1]: player.expectedPrice,
    [currentYear + 2]: player.expectedPrice,
    [currentYear + 3]: player.expectedPrice,
  });

  // Calculate minimum contract: (Games Remaining × $1) + $2 signing bonus
  // Reserves can have $0 contracts, but seniors need at least $1
  const minimumContract = gamesRemaining + 2;
  const isReservesOnly = player.positions.length === 0; // Adjust based on your reserves logic

  const totalValue = Array.from({ length: years }, (_, i) => currentYear + i)
    .map((year) => yearValues[year] || player.expectedPrice)
    .reduce((sum, v) => sum + v, 0);

  const applyMinimumContract = () => {
    // Set 1-year contract with minimum value in first year
    setYears(1);
    setYearValues((prev) => ({
      ...prev,
      [currentYear]: minimumContract,
    }));
  };

  const handleYearValueChange = (year: number, value: string) => {
    const numValue = parseInt(value) || 0;
    setYearValues((prev) => ({ ...prev, [year]: numValue }));
  };

  const handleSubmit = () => {
    const yearBreakdown = Array.from({ length: years }, (_, i) => ({
      season: currentYear + i,
      value: yearValues[currentYear + i] || player.expectedPrice,
    }));

    startTransition(async () => {
      const result = await placeBid(player.id, years, yearBreakdown);

      if (result.error) {
        toast.error(result.error);
      } else {
        toast.success(
          `Bid placed successfully${result.discount ? ` (${result.discount}% list manager discount applied)` : ""}`
        );
        onOpenChange(false);
      }
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>
            Place Bid on {player.firstName} {player.lastName}
          </DialogTitle>
          <DialogDescription>
            Submit a contract offer to this free agent
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Player info */}
          <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
            <div>
              <p className="font-semibold">
                {player.firstName} {player.lastName}
              </p>
              <p className="text-sm text-muted-foreground">
                {player.aflTeam?.name ?? "No AFL Team"}
              </p>
            </div>
            <div className="flex gap-1">
              {player.positions.map((pos) => (
                <Badge
                  key={pos}
                  className={`${positionColors[pos]} text-xs`}
                >
                  {pos}
                </Badge>
              ))}
            </div>
          </div>

          {/* Player stats */}
          <div className="grid grid-cols-3 gap-4 text-center">
            <div>
              <p className="text-2xl font-bold">
                {player.averagePoints?.toFixed(1) ?? "-"}
              </p>
              <p className="text-xs text-muted-foreground">Avg Points</p>
            </div>
            <div>
              <p className="text-2xl font-bold">${player.expectedPrice}</p>
              <p className="text-xs text-muted-foreground">Est. Price</p>
            </div>
            <div>
              <p className="text-2xl font-bold">
                {player.topBid ? `$${player.topBid}` : "-"}
              </p>
              <p className="text-xs text-muted-foreground">Top Bid</p>
            </div>
          </div>

          {/* Minimum contract info */}
          <div className="flex items-center justify-between p-3 bg-yellow-500/10 border border-yellow-500/30 rounded-lg">
            <div>
              <p className="font-medium text-sm">Minimum Contract</p>
              <p className="text-xs text-muted-foreground">
                {gamesRemaining} games × $1 + $2 signing bonus
              </p>
              <p className="text-xs text-muted-foreground mt-0.5">
                $0 contracts allowed for reserves only
              </p>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-lg font-bold">${minimumContract}</span>
              <Button
                variant="outline"
                size="sm"
                onClick={applyMinimumContract}
                type="button"
              >
                Offer Min
              </Button>
            </div>
          </div>

          {/* Contract length */}
          <div className="space-y-2">
            <Label>Contract Length</Label>
            <Select
              value={years.toString()}
              onValueChange={(v) => setYears(parseInt(v))}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="1">1 Year</SelectItem>
                <SelectItem value="2">2 Years</SelectItem>
                <SelectItem value="3">3 Years</SelectItem>
                <SelectItem value="4">4 Years</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Year breakdown */}
          <div className="space-y-2">
            <Label>Salary Breakdown</Label>
            <div className="space-y-2">
              {Array.from({ length: years }, (_, i) => currentYear + i).map(
                (year) => (
                  <div
                    key={year}
                    className="flex items-center gap-2"
                  >
                    <span className="w-16 text-sm text-muted-foreground">
                      {year}
                    </span>
                    <div className="relative flex-1">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                        $
                      </span>
                      <Input
                        type="number"
                        value={yearValues[year] || player.expectedPrice}
                        onChange={(e) =>
                          handleYearValueChange(year, e.target.value)
                        }
                        className="pl-7"
                        min={0}
                      />
                    </div>
                  </div>
                )
              )}
            </div>
          </div>

          {/* Total */}
          <div className="flex items-center justify-between p-3 bg-primary/10 rounded-lg">
            <span className="font-medium">Total Contract Value</span>
            <span className="text-xl font-bold">${totalValue}</span>
          </div>

          {/* Warning if outbid */}
          {player.topBid && totalValue <= player.topBid && (
            <p className="text-sm text-orange-600">
              Your bid is at or below the current top bid of ${player.topBid}.
              Consider increasing your offer.
            </p>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={isPending}>
            {isPending ? "Submitting..." : "Place Bid"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
