"use client";

import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { Position } from "@prisma/client";
import { removeFromShortlist } from "@/app/(dashboard)/dashboard/draft/actions";

interface ShortlistPlayer {
  id: string;
  rank: number;
  notes: string | null;
  player: {
    id: string;
    firstName: string;
    lastName: string;
    name: string;
    positions: Position[];
    avgPoints: number | null;
    gamesPlayed: number | null;
    aflTeam: string | null;
    aflTeamName: string | null;
  };
}

interface DraftShortlistProps {
  shortlist: ShortlistPlayer[];
  onDraft: (playerId: string) => void;
  onRemove: (shortlistId: string) => void;
  disabled?: boolean;
  isLoading?: boolean;
  onRefresh?: () => void;
}

const POSITION_COLORS: Record<Position, string> = {
  DEF: "text-blue-400",
  MID: "text-green-400",
  RUC: "text-purple-400",
  FWD: "text-red-400",
};

export function DraftShortlist({
  shortlist,
  onDraft,
  onRemove,
  disabled,
  isLoading,
  onRefresh,
}: DraftShortlistProps) {
  const [isPending, startTransition] = useTransition();

  const handleRemove = async (shortlistId: string) => {
    startTransition(async () => {
      await removeFromShortlist(shortlistId);
      onRemove(shortlistId);
      if (onRefresh) onRefresh();
    });
  };

  if (shortlist.length === 0) {
    return (
      <div className="p-4 text-center text-zinc-500 text-sm">
        <p className="mb-2">No players in shortlist</p>
        <p className="text-xs">Click the star on any player to add them</p>
      </div>
    );
  }

  return (
    <div className="divide-y divide-zinc-800">
      {shortlist.map((item, index) => (
        <div
          key={item.id}
          className="flex items-center gap-2 px-2 py-1.5 hover:bg-zinc-800 transition-colors group"
        >
          {/* Rank */}
          <div className="w-5 text-center font-mono text-[10px] font-bold text-zinc-500">
            {index + 1}
          </div>

          {/* Avg points */}
          <div className="w-8 text-right font-mono text-xs font-bold text-zinc-300">
            {item.player.avgPoints?.toFixed(0) || "-"}
          </div>

          {/* Player info */}
          <div className="flex-1 min-w-0">
            <div className="text-xs font-medium text-white truncate">
              {item.player.firstName.charAt(0)}. {item.player.lastName}
            </div>
            <div className="flex items-center gap-1 text-[10px] text-zinc-500">
              <span>{item.player.aflTeam || "N/A"}</span>
              {item.notes && (
                <span className="truncate max-w-[60px]" title={item.notes}>
                  • {item.notes}
                </span>
              )}
            </div>
          </div>

          {/* Positions */}
          <div className="flex gap-0.5">
            {item.player.positions.map((pos) => (
              <span
                key={pos}
                className={cn("text-[9px] font-bold", POSITION_COLORS[pos])}
              >
                {pos}
              </span>
            ))}
          </div>

          {/* Actions */}
          <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
            <Button
              size="sm"
              disabled={disabled || isLoading || isPending}
              onClick={() => onDraft(item.player.id)}
              className="h-5 px-1.5 text-[9px] font-bold bg-green-600 hover:bg-green-500 text-white"
            >
              DRAFT
            </Button>
            <Button
              size="sm"
              variant="ghost"
              disabled={isPending}
              onClick={() => handleRemove(item.id)}
              className="h-5 w-5 p-0 text-zinc-500 hover:text-red-400 hover:bg-red-500/10"
            >
              ×
            </Button>
          </div>
        </div>
      ))}
    </div>
  );
}
