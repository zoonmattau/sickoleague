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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Plus, Minus, DollarSign } from "lucide-react";

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
}

export function OfferPanel({
  currentOffer,
  onModifyOffer,
  disabled,
}: OfferPanelProps) {
  const currentYear = new Date().getFullYear();
  const [years, setYears] = useState(currentOffer.years);
  const [breakdown, setBreakdown] = useState<YearBreakdown[]>(
    currentOffer.yearBreakdown
  );
  const [isSubmitting, setIsSubmitting] = useState(false);

  const totalValue = breakdown.reduce((sum, y) => sum + y.value, 0);

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
          Total: ${totalValue} over {years} year{years !== 1 ? "s" : ""}
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
          {breakdown.map((year) => (
            <div key={year.season} className="flex items-center gap-2">
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
                  className="h-8"
                  disabled={disabled}
                />
              </div>
            </div>
          ))}
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
            -$10
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => handleQuickAdjust(-5)}
            disabled={disabled}
          >
            -$5
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => handleQuickAdjust(5)}
            disabled={disabled}
          >
            +$5
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => handleQuickAdjust(10)}
            disabled={disabled}
          >
            +$10
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
