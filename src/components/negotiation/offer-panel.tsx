"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Plus, Minus, DollarSign, AlertTriangle } from "lucide-react";

interface YearBreakdown {
  season: number;
  value: number;
}

interface OfferPanelProps {
  currentOffer: {
    years: number;
    totalValue: number;
    yearBreakdown: YearBreakdown[];
  };
  onModifyOffer: (offer: {
    years: number;
    yearBreakdown: YearBreakdown[];
  }) => Promise<void>;
  disabled?: boolean;
  salaryCapInfo?: {
    salaryCap: number;
    roomByYear: Record<number, number>;
  } | null;
  listManagerDiscount?: number;
}

export function OfferPanel({
  currentOffer,
  onModifyOffer,
  disabled,
  salaryCapInfo,
  listManagerDiscount = 0,
}: OfferPanelProps) {
  const currentYear = new Date().getFullYear();
  const [years, setYears] = useState(currentOffer.years);
  const [breakdown, setBreakdown] = useState<YearBreakdown[]>(
    currentOffer.yearBreakdown
  );
  const [isSubmitting, setIsSubmitting] = useState(false);

  const totalValue = breakdown.reduce((sum, y) => sum + y.value, 0);
  const discountMultiplier = 1 - listManagerDiscount / 100;

  // Calculate which years would exceed cap
  const overCapYears = salaryCapInfo
    ? breakdown.filter((y) => {
        const room = salaryCapInfo.roomByYear[y.season] ?? salaryCapInfo.salaryCap;
        const effectiveValue = y.value * discountMultiplier;
        return effectiveValue > room;
      }).map((y) => y.season)
    : [];

  const handleYearsChange = (newYears: number) => {
    const clampedYears = Math.max(1, Math.min(5, newYears));
    setYears(clampedYears);

    // Adjust breakdown
    const newBreakdown: YearBreakdown[] = [];
    for (let i = 0; i < clampedYears; i++) {
      const existingYear = breakdown.find((y) => y.season === currentYear + i);
      newBreakdown.push({
        season: currentYear + i,
        value: existingYear?.value ?? 50,
      });
    }
    setBreakdown(newBreakdown);
  };

  const handleValueChange = (season: number, value: number) => {
    setBreakdown((prev) =>
      prev.map((y) =>
        y.season === season ? { ...y, value: Math.max(1, value) } : y
      )
    );
  };

  const handleQuickAdjust = (amount: number) => {
    setBreakdown((prev) =>
      prev.map((y) => ({ ...y, value: Math.max(1, y.value + amount) }))
    );
  };

  const handleSubmit = async () => {
    setIsSubmitting(true);
    try {
      await onModifyOffer({ years, yearBreakdown: breakdown });
    } finally {
      setIsSubmitting(false);
    }
  };

  const hasChanges =
    years !== currentOffer.years ||
    JSON.stringify(breakdown) !== JSON.stringify(currentOffer.yearBreakdown);

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2">
          <DollarSign className="h-5 w-5" />
          Contract Offer
        </CardTitle>
        <CardDescription>
          Total: ${totalValue}k over {years} year{years !== 1 ? "s" : ""}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Years selector */}
        <div className="flex items-center gap-3">
          <Label>Duration:</Label>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="icon"
              className="h-8 w-8"
              onClick={() => handleYearsChange(years - 1)}
              disabled={years <= 1 || disabled}
            >
              <Minus className="h-4 w-4" />
            </Button>
            <span className="w-16 text-center font-medium">
              {years} year{years !== 1 ? "s" : ""}
            </span>
            <Button
              variant="outline"
              size="icon"
              className="h-8 w-8"
              onClick={() => handleYearsChange(years + 1)}
              disabled={years >= 5 || disabled}
            >
              <Plus className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Year breakdown */}
        <div className="space-y-2">
          <Label>Per-Season Breakdown:</Label>
          {breakdown.map((year) => {
            const isOverCap = overCapYears.includes(year.season);
            const room = salaryCapInfo?.roomByYear[year.season];
            return (
              <div key={year.season} className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="text-sm text-muted-foreground w-12">
                    {year.season}:
                  </span>
                  <div className="flex-1 flex items-center gap-1">
                    <span className="text-muted-foreground">$</span>
                    <Input
                      type="number"
                      min={1}
                      value={year.value}
                      onChange={(e) =>
                        handleValueChange(year.season, parseInt(e.target.value) || 0)
                      }
                      className={`h-8 ${isOverCap ? "border-red-500" : ""}`}
                      disabled={disabled}
                    />
                    <span className="text-muted-foreground text-sm">k</span>
                  </div>
                  {isOverCap && (
                    <AlertTriangle className="h-4 w-4 text-red-500" />
                  )}
                </div>
                {room !== undefined && (
                  <p className={`text-xs ml-14 ${isOverCap ? "text-red-500" : "text-muted-foreground"}`}>
                    Cap room: ${room.toFixed(0)}k
                  </p>
                )}
              </div>
            );
          })}
        </div>

        {/* Quick adjust buttons */}
        <div className="flex items-center gap-2">
          <span className="text-sm text-muted-foreground">Quick adjust:</span>
          <Button
            variant="outline"
            size="sm"
            onClick={() => handleQuickAdjust(-10)}
            disabled={disabled}
          >
            -$10k
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => handleQuickAdjust(-5)}
            disabled={disabled}
          >
            -$5k
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => handleQuickAdjust(5)}
            disabled={disabled}
          >
            +$5k
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => handleQuickAdjust(10)}
            disabled={disabled}
          >
            +$10k
          </Button>
        </div>

        {/* Submit button */}
        {hasChanges && (
          <Button
            onClick={handleSubmit}
            disabled={isSubmitting || disabled}
            className="w-full"
          >
            {isSubmitting ? "Updating..." : "Update Offer"}
          </Button>
        )}
      </CardContent>
    </Card>
  );
}
