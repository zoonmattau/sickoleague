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
}

const positionColors: Record<string, string> = {
  DEF: "bg-blue-600",
  MID: "bg-green-600",
  RUC: "bg-purple-600",
  FWD: "bg-red-600",
};

const currentYear = new Date().getFullYear();

export function PlayerBidDialog({
  player,
  open,
  onOpenChange,
}: PlayerBidDialogProps) {
  const [isPending, startTransition] = useTransition();
  const [years, setYears] = useState<number>(2);
  const [yearValues, setYearValues] = useState<Record<number, number>>({
    [currentYear]: player.expectedPrice,
    [currentYear + 1]: player.expectedPrice,
    [currentYear + 2]: player.expectedPrice,
    [currentYear + 3]: player.expectedPrice,
  });

  const totalValue = Array.from({ length: years }, (_, i) => currentYear + i)
    .map((year) => yearValues[year] || player.expectedPrice)
    .reduce((sum, v) => sum + v, 0);

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
                  className={`${positionColors[pos]} text-white text-xs`}
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
                        min={1}
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
