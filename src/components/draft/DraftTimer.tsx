"use client";

import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";

interface DraftTimerProps {
  deadline: Date | null;
  totalSeconds: number;
  isPaused: boolean;
}

export function DraftTimer({ deadline, totalSeconds, isPaused }: DraftTimerProps) {
  const [timeRemaining, setTimeRemaining] = useState<number>(totalSeconds);

  useEffect(() => {
    if (!deadline || isPaused) {
      // When paused or no deadline, show the total seconds
      setTimeRemaining(totalSeconds);
      return;
    }

    const updateTimer = () => {
      const now = new Date();
      const deadlineDate = new Date(deadline);
      const remaining = Math.max(0, Math.floor((deadlineDate.getTime() - now.getTime()) / 1000));
      setTimeRemaining(remaining);
    };

    updateTimer();
    const interval = setInterval(updateTimer, 1000);

    return () => clearInterval(interval);
  }, [deadline, isPaused, totalSeconds]);

  const minutes = Math.floor(timeRemaining / 60);
  const seconds = timeRemaining % 60;
  const percentage = (timeRemaining / totalSeconds) * 100;
  const isLow = timeRemaining <= 30 && !isPaused;
  const isCritical = timeRemaining <= 10 && !isPaused;

  return (
    <div className="flex items-center gap-3">
      {/* Timer display */}
      <div
        className={cn(
          "text-3xl font-mono font-bold tabular-nums transition-colors",
          isPaused && "text-zinc-400",
          isCritical && "text-red-500 animate-pulse",
          isLow && !isCritical && "text-orange-400",
          !isLow && !isPaused && "text-white"
        )}
      >
        {minutes}:{seconds.toString().padStart(2, "0")}
        {isPaused && <span className="text-sm ml-2 text-zinc-500">(PAUSED)</span>}
      </div>

      {/* Progress bar */}
      <div className="w-24 h-2 bg-zinc-800 rounded-full overflow-hidden">
        <div
          className={cn(
            "h-full transition-all duration-1000",
            isPaused && "bg-zinc-600",
            isCritical && "bg-red-500",
            isLow && !isCritical && "bg-orange-400",
            !isLow && !isPaused && "bg-green-500"
          )}
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  );
}
