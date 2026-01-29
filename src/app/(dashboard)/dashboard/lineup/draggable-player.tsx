"use client";

import { useDraggable } from "@dnd-kit/core";
import { CSS } from "@dnd-kit/utilities";
import { Badge } from "@/components/ui/badge";
import { RosterSpot } from "@prisma/client";
import { getPositionColorClasses } from "@/lib/position-colors";
import type { SerializedContract, PlayerStats } from "../types";

type Props = {
  contract: SerializedContract;
  sourceSpot: RosterSpot | "pool";
  sourceSquad: "SENIORS" | "RESERVES" | null;
  stats?: PlayerStats | null;
  isCaptain?: boolean;
  isVc?: boolean;
  compact?: boolean;
};

export function DraggablePlayer({
  contract,
  sourceSpot,
  sourceSquad,
  stats,
  isCaptain,
  isVc,
  compact = false,
}: Props) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: `player-${contract.id}`,
    data: {
      contract,
      sourceSpot,
      sourceSquad,
    },
  });

  const style = {
    transform: CSS.Translate.toString(transform),
    opacity: isDragging ? 0.5 : 1,
  };

  const player = contract.aflPlayer;

  // Get current year salary
  const currentYear = new Date().getFullYear();
  const salary = contract.yearBreakdown?.find(y => y.season === currentYear)?.value ?? 0;

  if (compact) {
    // ESPN-style table row - aligned columns with bold stats
    return (
      <div
        ref={setNodeRef}
        style={style}
        {...listeners}
        {...attributes}
        className="flex items-center gap-2 px-3 py-2 cursor-grab active:cursor-grabbing hover:bg-muted/60 transition-colors group"
      >
        {/* Captain/VC indicator */}
        <span className="w-6 text-center shrink-0">
          {isCaptain && (
            <span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-primary text-primary-foreground text-[10px] font-black">
              C
            </span>
          )}
          {isVc && (
            <span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-muted text-foreground text-[10px] font-bold border">
              VC
            </span>
          )}
        </span>

        {/* Player name - bold and prominent */}
        <span
          className="text-sm font-bold truncate flex-1 min-w-0 group-hover:text-primary transition-colors"
          title={`${player.firstName} ${player.lastName}`}
        >
          {player.firstName.charAt(0)}. <span className="uppercase">{player.lastName}</span>
        </span>

        {/* AFL Team - hidden on small */}
        <span className="text-[10px] font-semibold text-muted-foreground w-10 text-center hidden md:inline shrink-0 uppercase">
          {player.aflTeam?.abbreviation || "-"}
        </span>

        {/* Positions - color coded badges */}
        <div className="flex gap-0.5 w-14 justify-center shrink-0">
          {player.positions.map((pos) => (
            <span
              key={pos}
              className={`text-[9px] px-1.5 py-0.5 rounded font-bold ${getPositionColorClasses(pos)}`}
            >
              {pos}
            </span>
          ))}
        </div>

        {/* Avg score - prominent stat */}
        <span className="text-sm font-black tabular-nums w-10 text-right shrink-0">
          {stats?.avgScore?.toFixed(0) ?? "-"}
        </span>

        {/* L5 avg - hidden on small */}
        <span className="text-xs font-semibold text-muted-foreground tabular-nums w-10 text-right hidden md:inline shrink-0">
          {stats?.last5Avg?.toFixed(0) ?? "-"}
        </span>

        {/* Salary - hidden on small/medium */}
        <span className="text-xs font-semibold text-muted-foreground tabular-nums w-14 text-right hidden lg:inline shrink-0">
          ${salary}k
        </span>
      </div>
    );
  }

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...listeners}
      {...attributes}
      className="flex items-center justify-between p-2 rounded-lg bg-muted/50 cursor-grab active:cursor-grabbing hover:bg-muted transition-colors border border-transparent hover:border-primary/20"
    >
      <div className="flex items-center gap-2 min-w-0">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1">
            {isCaptain && <Badge variant="default" className="px-1 py-0 text-[10px]">C</Badge>}
            {isVc && <Badge variant="secondary" className="px-1 py-0 text-[10px]">VC</Badge>}
            <span className="font-medium truncate">
              {player.lastName}, {player.firstName.charAt(0)}.
            </span>
          </div>
          <div className="flex items-center gap-2 text-xs">
            <span className="text-muted-foreground">{player.aflTeam?.abbreviation || "-"}</span>
            <div className="flex gap-0.5">
              {player.positions.map((pos) => (
                <span
                  key={pos}
                  className={`text-[10px] px-1 rounded font-medium ${getPositionColorClasses(pos)}`}
                >
                  {pos}
                </span>
              ))}
            </div>
          </div>
        </div>
      </div>
      <div className="flex items-center gap-3 text-sm shrink-0">
        <div className="text-right">
          <div className="font-semibold">{stats?.avgScore?.toFixed(1) ?? "-"}</div>
          <div className="text-[10px] text-muted-foreground">avg</div>
        </div>
        <div className="text-right">
          <div className="text-muted-foreground">{stats?.last5Avg?.toFixed(1) ?? "-"}</div>
          <div className="text-[10px] text-muted-foreground">L5</div>
        </div>
      </div>
    </div>
  );
}
