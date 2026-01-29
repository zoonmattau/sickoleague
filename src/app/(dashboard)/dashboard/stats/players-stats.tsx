"use client";

import { useState, useMemo } from "react";
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
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { ArrowUpDown, ArrowUp, ArrowDown, Search } from "lucide-react";

type PlayerStat = {
  contractId: string;
  aflPlayerId: string;
  firstName: string;
  lastName: string;
  positions: string[];
  photoUrl: string | null;
  aflTeam: string | null;
  clubId: string;
  clubName: string;
  clubAbbr: string;
  primaryColor: string | null;
  secondaryColor: string | null;
  salary: number;
  tradeBlock: boolean;
  avgScore: number | null;
  last5Avg: number | null;
  gamesPlayed: number;
  seniorsGames: number;
  reservesGames: number;
};

type Props = {
  stats: PlayerStat[];
  clubs: { id: string; name: string; abbreviation: string }[];
  onPlayerClick?: (player: PlayerStat) => void;
};

type SortKey = "lastName" | "avgScore" | "last5Avg" | "gamesPlayed" | "salary";

export function PlayersStats({ stats, clubs, onPlayerClick }: Props) {
  const [search, setSearch] = useState("");
  const [position, setPosition] = useState<string>("all");
  const [club, setClub] = useState<string>("all");
  const [squad, setSquad] = useState<"all" | "seniors" | "reserves">("all");
  const [tradeBlockOnly, setTradeBlockOnly] = useState(false);
  const [sortKey, setSortKey] = useState<SortKey>("avgScore");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("desc");

  const filteredStats = useMemo(() => {
    let filtered = stats;

    // Search filter
    if (search) {
      const searchLower = search.toLowerCase();
      filtered = filtered.filter(
        (p) =>
          p.firstName.toLowerCase().includes(searchLower) ||
          p.lastName.toLowerCase().includes(searchLower) ||
          p.clubName.toLowerCase().includes(searchLower)
      );
    }

    // Position filter
    if (position !== "all") {
      filtered = filtered.filter((p) => p.positions.includes(position));
    }

    // Club filter
    if (club !== "all") {
      filtered = filtered.filter((p) => p.clubId === club);
    }

    // Squad filter
    if (squad === "seniors") {
      filtered = filtered.filter((p) => p.seniorsGames > 0);
    } else if (squad === "reserves") {
      filtered = filtered.filter((p) => p.reservesGames > 0 && p.seniorsGames === 0);
    }

    // Trade block filter
    if (tradeBlockOnly) {
      filtered = filtered.filter((p) => p.tradeBlock);
    }

    // Sort
    return [...filtered].sort((a, b) => {
      if (sortKey === "lastName") {
        const cmp = a.lastName.localeCompare(b.lastName);
        return sortDir === "asc" ? cmp : -cmp;
      }

      const aVal = a[sortKey] ?? 0;
      const bVal = b[sortKey] ?? 0;
      return sortDir === "asc" ? aVal - bVal : bVal - aVal;
    });
  }, [stats, search, position, club, squad, tradeBlockOnly, sortKey, sortDir]);

  const handleSort = (key: SortKey) => {
    if (sortKey === key) {
      setSortDir(sortDir === "asc" ? "desc" : "asc");
    } else {
      setSortKey(key);
      setSortDir("desc");
    }
  };

  const SortIcon = ({ column }: { column: SortKey }) => {
    if (sortKey !== column) return <ArrowUpDown className="ml-1 h-3 w-3 inline opacity-50" />;
    return sortDir === "asc"
      ? <ArrowUp className="ml-1 h-3 w-3 inline" />
      : <ArrowDown className="ml-1 h-3 w-3 inline" />;
  };

  return (
    <div className="space-y-4">
      {/* Filters */}
      <div className="flex flex-wrap gap-4">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search players..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>

        <Select value={position} onValueChange={setPosition}>
          <SelectTrigger className="w-[140px]">
            <SelectValue placeholder="Position" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Positions</SelectItem>
            <SelectItem value="DEF">DEF</SelectItem>
            <SelectItem value="MID">MID</SelectItem>
            <SelectItem value="RUC">RUC</SelectItem>
            <SelectItem value="FWD">FWD</SelectItem>
          </SelectContent>
        </Select>

        <Select value={club} onValueChange={setClub}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Club" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Clubs</SelectItem>
            {clubs.map((c) => (
              <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select value={squad} onValueChange={(v) => setSquad(v as typeof squad)}>
          <SelectTrigger className="w-[140px]">
            <SelectValue placeholder="Squad" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Squads</SelectItem>
            <SelectItem value="seniors">Seniors Only</SelectItem>
            <SelectItem value="reserves">Reserves Only</SelectItem>
          </SelectContent>
        </Select>

        <div className="flex items-center space-x-2">
          <Checkbox
            id="tradeBlock"
            checked={tradeBlockOnly}
            onCheckedChange={(c) => setTradeBlockOnly(c === true)}
          />
          <label htmlFor="tradeBlock" className="text-sm cursor-pointer">
            Trade Block
          </label>
        </div>
      </div>

      {/* Results count */}
      <div className="text-sm text-muted-foreground">
        Showing {filteredStats.length} of {stats.length} players
      </div>

      {/* Table */}
      <div className="rounded-lg border overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>
                <button onClick={() => handleSort("lastName")} className="flex items-center hover:text-foreground">
                  Name <SortIcon column="lastName" />
                </button>
              </TableHead>
              <TableHead>Club</TableHead>
              <TableHead>Position</TableHead>
              <TableHead className="text-right">
                <button onClick={() => handleSort("avgScore")} className="flex items-center justify-end hover:text-foreground">
                  Avg <SortIcon column="avgScore" />
                </button>
              </TableHead>
              <TableHead className="text-right">
                <button onClick={() => handleSort("last5Avg")} className="flex items-center justify-end hover:text-foreground">
                  L5 <SortIcon column="last5Avg" />
                </button>
              </TableHead>
              <TableHead className="text-right">
                <button onClick={() => handleSort("gamesPlayed")} className="flex items-center justify-end hover:text-foreground">
                  Games <SortIcon column="gamesPlayed" />
                </button>
              </TableHead>
              <TableHead className="text-right">
                <button onClick={() => handleSort("salary")} className="flex items-center justify-end hover:text-foreground">
                  Salary <SortIcon column="salary" />
                </button>
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredStats.length > 0 ? (
              filteredStats.slice(0, 100).map((player) => (
                <TableRow
                  key={player.contractId}
                  className={onPlayerClick ? "cursor-pointer hover:bg-muted/50" : ""}
                  onClick={() => onPlayerClick?.(player)}
                >
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <div>
                        <div className="font-medium">
                          {player.lastName}, {player.firstName}
                          {player.tradeBlock && (
                            <Badge variant="destructive" className="ml-2 text-xs">TB</Badge>
                          )}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {player.aflTeam || "-"}
                        </div>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <span
                      className="px-2 py-0.5 rounded text-xs font-semibold"
                      style={{
                        backgroundColor: player.primaryColor || "#6b7280",
                        color: player.secondaryColor || "#ffffff",
                      }}
                    >
                      {player.clubAbbr}
                    </span>
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-1">
                      {player.positions.map((pos) => (
                        <Badge key={pos} variant="outline" className="text-xs">{pos}</Badge>
                      ))}
                    </div>
                  </TableCell>
                  <TableCell className="text-right font-semibold">
                    {player.avgScore !== null ? player.avgScore.toFixed(1) : "-"}
                  </TableCell>
                  <TableCell className="text-right">
                    {player.last5Avg !== null ? player.last5Avg.toFixed(1) : "-"}
                  </TableCell>
                  <TableCell className="text-right text-muted-foreground">
                    {player.gamesPlayed}
                  </TableCell>
                  <TableCell className="text-right">
                    ${player.salary}k
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={7} className="text-center text-muted-foreground py-8">
                  No players match your filters
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      {filteredStats.length > 100 && (
        <div className="text-sm text-muted-foreground text-center">
          Showing first 100 results. Use filters to narrow down.
        </div>
      )}
    </div>
  );
}
