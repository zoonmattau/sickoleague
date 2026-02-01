"use client";

import { useState, useMemo, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Search, Clock, TrendingUp, Users } from "lucide-react";
import type { FreeAgentPlayer } from "./actions";
import { PlayerBidDialog } from "./player-bid-dialog";
import { PlayerDetailDialog } from "./player-detail-dialog";

interface FreeAgentsTabProps {
  players: FreeAgentPlayer[];
  gamesRemaining: number;
}

const positionColors: Record<string, string> = {
  DEF: "bg-red-600 text-white",
  MID: "bg-blue-600 text-white",
  RUC: "bg-yellow-500 text-black",
  FWD: "bg-green-600 text-white",
};

function formatTimeRemaining(date: Date | null): string {
  if (!date) return "-";
  const now = new Date();
  const diff = new Date(date).getTime() - now.getTime();
  if (diff < 0) return "Expired";

  const hours = Math.floor(diff / (1000 * 60 * 60));
  const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));

  if (hours > 24) {
    const days = Math.floor(hours / 24);
    return `${days}d ${hours % 24}h`;
  }
  return `${hours}h ${minutes}m`;
}

export function FreeAgentsTab({ players, gamesRemaining }: FreeAgentsTabProps) {
  const [search, setSearch] = useState("");
  const [positionFilter, setPositionFilter] = useState<string>("all");
  const [teamFilter, setTeamFilter] = useState<string>("all");
  const [selectedPlayer, setSelectedPlayer] = useState<FreeAgentPlayer | null>(
    null
  );
  const [bidDialogOpen, setBidDialogOpen] = useState(false);
  const [detailPlayerId, setDetailPlayerId] = useState<string | null>(null);
  const [detailDialogOpen, setDetailDialogOpen] = useState(false);

  // Get unique teams for filter
  const teams = Array.from(
    new Set(players.map((p) => p.aflTeam?.abbreviation).filter(Boolean))
  ).sort() as string[];

  // Filter players
  const filteredPlayers = players.filter((player) => {
    const matchesSearch =
      `${player.firstName} ${player.lastName}`
        .toLowerCase()
        .includes(search.toLowerCase()) ||
      player.aflTeam?.name.toLowerCase().includes(search.toLowerCase());

    const matchesPosition =
      positionFilter === "all" || player.positions.includes(positionFilter);

    const matchesTeam =
      teamFilter === "all" || player.aflTeam?.abbreviation === teamFilter;

    return matchesSearch && matchesPosition && matchesTeam;
  });

  // Track current time for "deciding soon" calculations
  const [now, setNow] = useState(() => Date.now());

  // Update time every minute
  useEffect(() => {
    const interval = setInterval(() => setNow(Date.now()), 60000);
    return () => clearInterval(interval);
  }, []);

  const oneDayMs = 24 * 60 * 60 * 1000;

  // Compute "deciding soon" count (within 24 hours)
  const decidingSoonCount = useMemo(() => {
    return filteredPlayers.filter(
      (p) => p.decision && new Date(p.decision).getTime() - now < oneDayMs
    ).length;
  }, [filteredPlayers, now, oneDayMs]);

  // Helper to check if a player is deciding soon
  const isDecidingSoon = (decision: Date | null): boolean => {
    if (!decision) return false;
    return new Date(decision).getTime() - now < oneDayMs;
  };

  const handleBid = (player: FreeAgentPlayer) => {
    setSelectedPlayer(player);
    setBidDialogOpen(true);
  };

  return (
    <div className="space-y-4">
      {/* Filters */}
      <div className="flex flex-wrap gap-4">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search players or teams..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>

        <Select value={positionFilter} onValueChange={setPositionFilter}>
          <SelectTrigger className="w-[140px]">
            <SelectValue placeholder="Position" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Positions</SelectItem>
            <SelectItem value="DEF">Defender</SelectItem>
            <SelectItem value="MID">Midfielder</SelectItem>
            <SelectItem value="RUC">Ruck</SelectItem>
            <SelectItem value="FWD">Forward</SelectItem>
          </SelectContent>
        </Select>

        <Select value={teamFilter} onValueChange={setTeamFilter}>
          <SelectTrigger className="w-[140px]">
            <SelectValue placeholder="AFL Team" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Teams</SelectItem>
            {teams.map((team) => (
              <SelectItem key={team} value={team}>
                {team}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Stats bar */}
      <div className="grid grid-cols-3 gap-4 p-4 bg-muted/50 rounded-lg">
        <div className="flex items-center gap-2">
          <Users className="h-4 w-4 text-muted-foreground" />
          <span className="text-sm">
            <span className="font-semibold">{filteredPlayers.length}</span>{" "}
            available players
          </span>
        </div>
        <div className="flex items-center gap-2">
          <TrendingUp className="h-4 w-4 text-muted-foreground" />
          <span className="text-sm">
            <span className="font-semibold">
              {filteredPlayers.filter((p) => p.activeBids > 0).length}
            </span>{" "}
            with active bids
          </span>
        </div>
        <div className="flex items-center gap-2">
          <Clock className="h-4 w-4 text-muted-foreground" />
          <span className="text-sm">
            <span className="font-semibold">{decidingSoonCount}</span> deciding
            soon
          </span>
        </div>
      </div>

      {/* Players table */}
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Player</TableHead>
              <TableHead>Position</TableHead>
              <TableHead>AFL Team</TableHead>
              <TableHead className="text-right">Avg Pts</TableHead>
              <TableHead className="text-right">Est. Price</TableHead>
              <TableHead className="text-center">Bids</TableHead>
              <TableHead className="text-center">Top Bid</TableHead>
              <TableHead className="text-center">Decision</TableHead>
              <TableHead></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredPlayers.length === 0 ? (
              <TableRow>
                <TableCell colSpan={9} className="text-center py-8">
                  <p className="text-muted-foreground">
                    No free agents match your filters
                  </p>
                </TableCell>
              </TableRow>
            ) : (
              filteredPlayers.map((player) => (
                <TableRow key={player.id}>
                  <TableCell className="font-medium">
                    <button
                      onClick={() => {
                        setDetailPlayerId(player.id);
                        setDetailDialogOpen(true);
                      }}
                      className="hover:underline text-left"
                    >
                      {player.firstName} {player.lastName}
                    </button>
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-1">
                      {player.positions.map((pos) => (
                        <Badge
                          key={pos}
                          className={`${positionColors[pos]} text-xs`}
                        >
                          {pos}
                        </Badge>
                      ))}
                    </div>
                  </TableCell>
                  <TableCell>
                    {player.aflTeam?.abbreviation ?? "-"}
                  </TableCell>
                  <TableCell className="text-right">
                    {player.averagePoints?.toFixed(1) ?? "-"}
                  </TableCell>
                  <TableCell className="text-right font-medium">
                    ${player.expectedPrice}
                  </TableCell>
                  <TableCell className="text-center">
                    {player.activeBids > 0 ? (
                      <Badge variant="secondary">{player.activeBids}</Badge>
                    ) : (
                      "-"
                    )}
                  </TableCell>
                  <TableCell className="text-center">
                    {player.topBid ? `$${player.topBid}` : "-"}
                  </TableCell>
                  <TableCell className="text-center">
                    <span
                      className={
                        isDecidingSoon(player.decision)
                          ? "text-orange-500 font-medium"
                          : ""
                      }
                    >
                      {formatTimeRemaining(player.decision)}
                    </span>
                  </TableCell>
                  <TableCell>
                    <Button size="sm" onClick={() => handleBid(player)}>
                      Place Bid
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* Bid dialog */}
      {selectedPlayer && (
        <PlayerBidDialog
          player={selectedPlayer}
          open={bidDialogOpen}
          onOpenChange={setBidDialogOpen}
          gamesRemaining={gamesRemaining}
        />
      )}

      {/* Player detail dialog */}
      <PlayerDetailDialog
        playerId={detailPlayerId}
        open={detailDialogOpen}
        onOpenChange={setDetailDialogOpen}
      />
    </div>
  );
}
