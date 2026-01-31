"use client";

import { cn } from "@/lib/utils";

interface QueuePick {
  pickNumber: number;
  clubId: string;
  club: {
    id: string;
    name: string;
    abbreviation: string;
    primaryColor: string | null;
    secondaryColor: string | null;
  };
  round: number;
}

interface DraftQueueProps {
  queue: QueuePick[];
  currentPickNumber: number;
}

export function DraftQueue({ queue, currentPickNumber }: DraftQueueProps) {
  if (queue.length === 0) {
    return null;
  }

  return (
    <div className="flex items-center gap-2 overflow-x-auto py-2">
      {queue.map((pick, index) => {
        const isOnClock = pick.pickNumber === currentPickNumber;

        return (
          <div
            key={pick.pickNumber}
            className={cn(
              "flex items-center gap-2 px-3 py-2 rounded-lg border transition-all shrink-0",
              isOnClock
                ? "ring-2 ring-primary shadow-lg scale-105"
                : "opacity-80"
            )}
            style={{
              backgroundColor: pick.club.primaryColor || undefined,
              color: pick.club.secondaryColor || undefined,
              borderColor: pick.club.secondaryColor || undefined,
            }}
          >
            {isOnClock && (
              <span className="text-xs font-bold uppercase tracking-wider animate-pulse">
                ON CLOCK
              </span>
            )}
            <span className="font-bold">{pick.club.abbreviation}</span>
            <span className="text-xs opacity-75">R{pick.round}</span>
          </div>
        );
      })}
    </div>
  );
}
