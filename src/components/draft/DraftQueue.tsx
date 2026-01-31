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
  myClubId?: string | null;
}

export function DraftQueue({ queue, currentPickNumber, myClubId }: DraftQueueProps) {
  if (queue.length === 0) {
    return null;
  }

  // Find how many picks until my next pick
  const myNextPickIndex = myClubId
    ? queue.findIndex((pick) => pick.clubId === myClubId)
    : -1;
  const picksUntilMyTurn = myNextPickIndex >= 0 ? myNextPickIndex : null;

  return (
    <div className="space-y-2">
      {/* My next pick indicator */}
      {myClubId && picksUntilMyTurn !== null && (
        <div className={cn(
          "text-sm font-medium",
          picksUntilMyTurn === 0 ? "text-yellow-400" : "text-zinc-400"
        )}>
          {picksUntilMyTurn === 0 ? (
            <span className="animate-pulse">Your pick is NOW!</span>
          ) : picksUntilMyTurn === 1 ? (
            <span>You pick next (1 pick away)</span>
          ) : (
            <span>Your next pick: {picksUntilMyTurn} picks away</span>
          )}
        </div>
      )}

      {/* Queue slider */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-thin">
        <span className="text-[10px] text-zinc-500 shrink-0 uppercase font-bold">Queue:</span>
        {queue.map((pick, index) => {
          const isOnClock = pick.pickNumber === currentPickNumber;
          const isMyPick = myClubId && pick.clubId === myClubId;

          return (
            <div
              key={pick.pickNumber}
              className={cn(
                "flex items-center gap-1 px-2 py-1 rounded text-xs font-bold shrink-0 transition-all",
                isOnClock && "ring-2 ring-yellow-500 shadow-lg scale-110",
                isMyPick && !isOnClock && "ring-2 ring-blue-500",
                !isOnClock && !isMyPick && "opacity-60"
              )}
              style={{
                backgroundColor: pick.club.primaryColor || '#3f3f46',
                color: pick.club.secondaryColor || '#ffffff',
              }}
            >
              {isOnClock && (
                <span className="text-[9px] font-bold uppercase tracking-wider animate-pulse text-yellow-300">
                  NOW
                </span>
              )}
              <span>{pick.club.abbreviation}</span>
              {isMyPick && !isOnClock && (
                <span className="text-[9px] opacity-75">({index} away)</span>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
