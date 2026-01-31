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
    <div className="flex items-center gap-2 overflow-x-auto pb-1">
      <span className="text-xs text-zinc-500 shrink-0">Up next:</span>
      {queue.map((pick, index) => {
        const isOnClock = pick.pickNumber === currentPickNumber;

        return (
          <div
            key={pick.pickNumber}
            className={cn(
              "flex items-center gap-1.5 px-2 py-1 rounded text-xs font-bold shrink-0 transition-all",
              isOnClock
                ? "ring-2 ring-yellow-500 shadow-lg scale-105"
                : "opacity-70"
            )}
            style={{
              backgroundColor: pick.club.primaryColor || '#3f3f46',
              color: pick.club.secondaryColor || '#ffffff',
            }}
          >
            {isOnClock && (
              <span className="text-[10px] font-bold uppercase tracking-wider animate-pulse text-yellow-300">
                NOW
              </span>
            )}
            <span>{pick.club.abbreviation}</span>
            <span className="text-[10px] opacity-75">#{pick.pickNumber}</span>
          </div>
        );
      })}
    </div>
  );
}
