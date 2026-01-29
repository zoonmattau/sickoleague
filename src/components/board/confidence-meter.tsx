"use client";

import { cn } from "@/lib/utils";

interface ConfidenceMeterProps {
  value: number;
  showLabel?: boolean;
  size?: "sm" | "md" | "lg";
}

export function ConfidenceMeter({
  value,
  showLabel = true,
  size = "md",
}: ConfidenceMeterProps) {
  const clampedValue = Math.max(0, Math.min(100, value));

  const getColor = () => {
    if (clampedValue >= 70) return "text-green-500";
    if (clampedValue >= 40) return "text-yellow-500";
    return "text-red-500";
  };

  const getBgColor = () => {
    if (clampedValue >= 70) return "bg-green-500";
    if (clampedValue >= 40) return "bg-yellow-500";
    return "bg-red-500";
  };

  const getLabel = () => {
    if (clampedValue >= 70) return "High";
    if (clampedValue >= 40) return "Medium";
    if (clampedValue >= 20) return "Low";
    return "Critical";
  };

  const sizeConfig = {
    sm: { height: "h-32", width: "w-20", fontSize: "text-sm" },
    md: { height: "h-48", width: "w-28", fontSize: "text-base" },
    lg: { height: "h-64", width: "w-36", fontSize: "text-lg" },
  };

  const config = sizeConfig[size];

  return (
    <div className="flex flex-col items-center gap-2">
      {showLabel && (
        <span className={cn("font-medium", getColor(), config.fontSize)}>
          {getLabel()} Confidence
        </span>
      )}

      {/* Gauge container */}
      <div
        className={cn(
          "relative bg-muted rounded-full overflow-hidden",
          config.height,
          config.width
        )}
      >
        {/* Background zones */}
        <div className="absolute inset-0 flex flex-col">
          <div className="flex-1 bg-green-500/20" />
          <div className="flex-1 bg-yellow-500/20" />
          <div className="flex-1 bg-red-500/20" />
        </div>

        {/* Fill */}
        <div
          className={cn(
            "absolute bottom-0 left-0 right-0 transition-all duration-500",
            getBgColor()
          )}
          style={{ height: `${clampedValue}%` }}
        />

        {/* Value display */}
        <div className="absolute inset-0 flex items-center justify-center">
          <span
            className={cn(
              "font-bold text-white drop-shadow-lg",
              size === "lg" ? "text-3xl" : size === "md" ? "text-2xl" : "text-xl"
            )}
          >
            {Math.round(clampedValue)}%
          </span>
        </div>

        {/* Zone markers */}
        <div className="absolute left-0 right-0 top-[30%] h-px bg-white/30" />
        <div className="absolute left-0 right-0 top-[60%] h-px bg-white/30" />
      </div>

      {/* Scale labels */}
      <div className="flex justify-between w-full text-xs text-muted-foreground px-1">
        <span>0</span>
        <span>50</span>
        <span>100</span>
      </div>
    </div>
  );
}
