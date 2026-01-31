"use client";

import { useState, useMemo } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { Position } from "@prisma/client";

interface Player {
  id: string;
  firstName: string;
  lastName: string;
  name: string;
  positions: Position[];
  avgPoints: number | null;
  gamesPlayed: number | null;
  aflTeam: string | null;
  aflTeamName: string | null;
}

interface PlayerSelectorProps {
  players: Player[];
  onSelect: (playerId: string) => void;
  disabled?: boolean;
  isLoading?: boolean;
}

const POSITION_COLORS: Record<Position, string> = {
  DEF: "text-blue-400",
  MID: "text-green-400",
  RUC: "text-purple-400",
  FWD: "text-red-400",
};

const POSITION_BG: Record<Position, string> = {
  DEF: "bg-blue-500/20 border-blue-500/30",
  MID: "bg-green-500/20 border-green-500/30",
  RUC: "bg-purple-500/20 border-purple-500/30",
  FWD: "bg-red-500/20 border-red-500/30",
};

export function PlayerSelector({
  players,
  onSelect,
  disabled,
  isLoading,
}: PlayerSelectorProps) {
  const [search, setSearch] = useState("");
  const [positionFilter, setPositionFilter] = useState<Position | null>(null);
  const [aflTeamFilter, setAflTeamFilter] = useState<string | null>(null);

  // Get unique AFL teams for filter
  const aflTeams = useMemo(() => {
    const teams = new Set(players.map((p) => p.aflTeam).filter(Boolean));
    return Array.from(teams).sort() as string[];
  }, [players]);

  // Filter and sort players
  const filteredPlayers = useMemo(() => {
    return players
      .filter((player) => {
        // Search filter
        if (search) {
          const searchLower = search.toLowerCase();
          const matchesName =
            player.name.toLowerCase().includes(searchLower) ||
            player.firstName.toLowerCase().includes(searchLower) ||
            player.lastName.toLowerCase().includes(searchLower);
          if (!matchesName) return false;
        }

        // Position filter
        if (positionFilter && !player.positions.includes(positionFilter)) {
          return false;
        }

        // AFL team filter
        if (aflTeamFilter && player.aflTeam !== aflTeamFilter) {
          return false;
        }

        return true;
      })
      .sort((a, b) => {
        // Sort by avg points descending
        const aPoints = a.avgPoints ?? 0;
        const bPoints = b.avgPoints ?? 0;
        return bPoints - aPoints;
      });
  }, [players, search, positionFilter, aflTeamFilter]);

  return (
    <div className="flex flex-col h-full bg-zinc-900">
      {/* Search & Filters */}
      <div className="p-2 border-b border-zinc-800 space-y-2">
        <Input
          placeholder="Search players..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full h-8 text-sm bg-zinc-800 border-zinc-700 text-white placeholder:text-zinc-500"
        />

        {/* Position filters */}
        <div className="flex gap-1">
          <button
            className={cn(
              "px-2 py-1 text-[10px] font-bold rounded border transition-colors",
              positionFilter === null
                ? "bg-zinc-700 border-zinc-600 text-white"
                : "bg-zinc-800 border-zinc-700 text-zinc-400 hover:bg-zinc-700"
            )}
            onClick={() => setPositionFilter(null)}
          >
            ALL
          </button>
          {(["DEF", "MID", "RUC", "FWD"] as Position[]).map((pos) => (
            <button
              key={pos}
              className={cn(
                "px-2 py-1 text-[10px] font-bold rounded border transition-colors",
                positionFilter === pos
                  ? cn(POSITION_BG[pos], POSITION_COLORS[pos])
                  : "bg-zinc-800 border-zinc-700 text-zinc-400 hover:bg-zinc-700"
              )}
              onClick={() => setPositionFilter(positionFilter === pos ? null : pos)}
            >
              {pos}
            </button>
          ))}
        </div>

        {/* AFL team filter */}
        <select
          className="w-full px-2 py-1 rounded border bg-zinc-800 border-zinc-700 text-xs text-zinc-300"
          value={aflTeamFilter || ""}
          onChange={(e) => setAflTeamFilter(e.target.value || null)}
        >
          <option value="">All AFL Teams</option>
          {aflTeams.map((team) => (
            <option key={team} value={team}>
              {team}
            </option>
          ))}
        </select>
      </div>

      {/* Player list */}
      <div className="flex-1 overflow-y-auto">
        {filteredPlayers.length === 0 ? (
          <div className="p-4 text-center text-zinc-500 text-sm">
            No players found
          </div>
        ) : (
          <div className="divide-y divide-zinc-800">
            {filteredPlayers.slice(0, 100).map((player) => (
              <div
                key={player.id}
                className="flex items-center gap-2 px-2 py-1.5 hover:bg-zinc-800 transition-colors"
              >
                {/* Avg points */}
                <div className="w-10 text-right font-mono text-xs font-bold text-zinc-300">
                  {player.avgPoints?.toFixed(0) || "-"}
                </div>

                {/* Player info */}
                <div className="flex-1 min-w-0">
                  <div className="text-xs font-medium text-white truncate">
                    {player.firstName.charAt(0)}. {player.lastName}
                  </div>
                  <div className="flex items-center gap-1 text-[10px] text-zinc-500">
                    <span>{player.aflTeam || "N/A"}</span>
                    {player.gamesPlayed !== null && player.gamesPlayed > 0 && (
                      <span>· {player.gamesPlayed}g</span>
                    )}
                  </div>
                </div>

                {/* Positions */}
                <div className="flex gap-0.5">
                  {player.positions.map((pos) => (
                    <span
                      key={pos}
                      className={cn(
                        "text-[9px] font-bold px-1 rounded",
                        POSITION_COLORS[pos]
                      )}
                    >
                      {pos}
                    </span>
                  ))}
                </div>

                {/* Draft button */}
                <Button
                  size="sm"
                  disabled={disabled || isLoading}
                  onClick={() => onSelect(player.id)}
                  className="h-6 px-2 text-[10px] font-bold bg-green-600 hover:bg-green-500 text-white"
                >
                  DRAFT
                </Button>
              </div>
            ))}
            {filteredPlayers.length > 100 && (
              <div className="p-2 text-center text-[10px] text-zinc-600">
                Showing 100 of {filteredPlayers.length}. Use filters.
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
