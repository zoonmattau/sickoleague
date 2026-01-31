"use client";

import { useEffect, useState } from "react";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";

interface DraftTimerProps {
  deadline: Date | null;
  totalSeconds: number;
  isPaused: boolean;
}

export function DraftTimer({ deadline, totalSeconds, isPaused }: DraftTimerProps) {
  const [timeRemaining, setTimeRemaining] = useState<number | null>(null);

  useEffect(() => {
    if (!deadline || isPaused) {
      setTimeRemaining(null);
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
  }, [deadline, isPaused]);

  if (timeRemaining === null) {
    return (
      <div className="flex items-center gap-3 px-4 py-2 bg-muted rounded-lg">
        <div className="text-2xl font-mono font-bold text-muted-foreground">
          {isPaused ? "PAUSED" : "--:--"}
        </div>
      </div>
    );
  }

  const minutes = Math.floor(timeRemaining / 60);
  const seconds = timeRemaining % 60;
  const percentage = (timeRemaining / totalSeconds) * 100;
  const isLow = timeRemaining <= 30;
  const isCritical = timeRemaining <= 10;

  return (
    <div className="flex items-center gap-4">
      <div
        className={cn(
          "text-3xl font-mono font-bold tabular-nums transition-colors",
          isCritical && "text-red-500 animate-pulse",
          isLow && !isCritical && "text-orange-500"
        )}
      >
        {minutes}:{seconds.toString().padStart(2, "0")}
      </div>
      <div className="flex-1 max-w-[200px]">
        <Progress
          value={percentage}
          className={cn(
            "h-3",
            isCritical && "[&>div]:bg-red-500",
            isLow && !isCritical && "[&>div]:bg-orange-500"
          )}
        />
      </div>
    </div>
  );
}
