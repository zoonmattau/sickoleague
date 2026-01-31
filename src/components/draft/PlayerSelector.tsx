"use client";

import { useState, useMemo } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
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
  DEF: "bg-blue-500/20 text-blue-700 dark:text-blue-300 border-blue-500/30",
  MID: "bg-green-500/20 text-green-700 dark:text-green-300 border-green-500/30",
  RUC: "bg-purple-500/20 text-purple-700 dark:text-purple-300 border-purple-500/30",
  FWD: "bg-red-500/20 text-red-700 dark:text-red-300 border-red-500/30",
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
    <div className="flex flex-col h-full">
      {/* Search */}
      <div className="p-3 border-b space-y-3">
        <Input
          placeholder="Search players..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full"
        />

        {/* Position filters */}
        <div className="flex flex-wrap gap-1">
          <Button
            variant={positionFilter === null ? "default" : "outline"}
            size="sm"
            onClick={() => setPositionFilter(null)}
          >
            All
          </Button>
          {(["DEF", "MID", "RUC", "FWD"] as Position[]).map((pos) => (
            <Button
              key={pos}
              variant={positionFilter === pos ? "default" : "outline"}
              size="sm"
              onClick={() => setPositionFilter(positionFilter === pos ? null : pos)}
            >
              {pos}
            </Button>
          ))}
        </div>

        {/* AFL team filter */}
        <select
          className="w-full px-3 py-2 rounded-md border bg-background text-sm"
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
          <div className="p-4 text-center text-muted-foreground">
            No players found
          </div>
        ) : (
          <div className="divide-y">
            {filteredPlayers.slice(0, 100).map((player) => (
              <div
                key={player.id}
                className="flex items-center gap-3 p-3 hover:bg-muted/50 transition-colors"
              >
                <div className="flex-1 min-w-0">
                  <div className="font-medium truncate">
                    {player.firstName.charAt(0)}. {player.lastName}
                  </div>
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <span>{player.aflTeam || "N/A"}</span>
                    {player.gamesPlayed !== null && (
                      <span>{player.gamesPlayed}g</span>
                    )}
                  </div>
                </div>

                {/* Positions */}
                <div className="flex gap-1">
                  {player.positions.map((pos) => (
                    <Badge
                      key={pos}
                      variant="outline"
                      className={cn("text-[10px] px-1.5 py-0", POSITION_COLORS[pos])}
                    >
                      {pos}
                    </Badge>
                  ))}
                </div>

                {/* Avg points */}
                <div className="w-14 text-right font-mono text-sm">
                  {player.avgPoints?.toFixed(1) || "-"}
                </div>

                {/* Draft button */}
                <Button
                  size="sm"
                  disabled={disabled || isLoading}
                  onClick={() => onSelect(player.id)}
                >
                  Draft
                </Button>
              </div>
            ))}
            {filteredPlayers.length > 100 && (
              <div className="p-3 text-center text-sm text-muted-foreground">
                Showing first 100 of {filteredPlayers.length} players. Use filters to narrow results.
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
