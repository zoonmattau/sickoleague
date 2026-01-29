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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ArrowUpDown, ArrowUp, ArrowDown, Search, ChevronDown, Crown, Star } from "lucide-react";
import { getPositionColorClasses } from "@/lib/position-colors";
import { assignPlayerToRoster, removePlayerFromRoster } from "./actions";
// import { setCaptain } from "./captain-actions";
import { RosterSpot, Squad } from "@prisma/client";
import { toast } from "sonner";

// Rule 9 eligibility threshold (players with fewer than this many senior games are eligible)
const RULE9_GAMES_THRESHOLD = 5;

export type RosterPlayer = {
  contractId: string;
  firstName: string;
  lastName: string;
  positions: string[];
  aflTeam: string | null;
  salary: number;
  endSeason: number;
  contractType: string;
  tradeBlock: boolean;
  squad: string | null;
  rosterSpot: string | null;
  isCaptain: boolean;
  isViceCaptain: boolean;
  avgScore: number | null;
  last5Avg: number | null;
  gamesPlayed: number;
  seniorsGames: number;
  reservesGames: number;
  highScore: number | null;
  lowScore: number | null;
};

type Props = {
  players: RosterPlayer[];
  clubId: string;
  onPlayerClick?: (player: RosterPlayer) => void;
};

type SortKey = "lastName" | "avgScore" | "last5Avg" | "gamesPlayed" | "seniorsGames" | "reservesGames" | "salary" | "endSeason" | "highScore" | "squad";

// Map roster spot to position prefix
function getSpotPosition(spot: string | null): string | null {
  if (!spot) return null;
  if (spot.startsWith("DEF") || spot.startsWith("RDEF")) return "DEF";
  if (spot.startsWith("MID") || spot.startsWith("RMID")) return "MID";
  if (spot === "RUC" || spot === "RRUC") return "RUC";
  if (spot.startsWith("FWD") || spot.startsWith("RFWD")) return "FWD";
  if (spot.startsWith("BENCH")) return "BENCH";
  if (spot.startsWith("IL")) return "IL";
  return null;
}

// Format squad display as "S-DEF" or "R-MID"
function formatSquadDisplay(squad: string | null, spot: string | null): string {
  if (!squad || !spot) return "Unassigned";
  const position = getSpotPosition(spot);
  // Bench and IL don't need the S/R prefix
  if (position === "BENCH") return "Bench";
  if (position === "IL") return "IL";
  const prefix = squad === "SENIORS" ? "S" : "R";
  return position ? `${prefix}-${position}` : spot;
}

// Get available roster spots for a player based on their positions
function getAvailableSpots(positions: string[]): { spot: RosterSpot; squad: Squad; label: string }[] {
  const spots: { spot: RosterSpot; squad: Squad; label: string }[] = [];

  // Senior positions
  if (positions.includes("DEF")) {
    spots.push(
      { spot: "DEF1", squad: "SENIORS", label: "S-DEF" },
      { spot: "DEF2", squad: "SENIORS", label: "S-DEF" },
      { spot: "DEF3", squad: "SENIORS", label: "S-DEF" },
    );
  }
  if (positions.includes("MID")) {
    spots.push(
      { spot: "MID1", squad: "SENIORS", label: "S-MID" },
      { spot: "MID2", squad: "SENIORS", label: "S-MID" },
      { spot: "MID3", squad: "SENIORS", label: "S-MID" },
      { spot: "MID4", squad: "SENIORS", label: "S-MID" },
    );
  }
  if (positions.includes("RUC")) {
    spots.push({ spot: "RUC", squad: "SENIORS", label: "S-RUC" });
  }
  if (positions.includes("FWD")) {
    spots.push(
      { spot: "FWD1", squad: "SENIORS", label: "S-FWD" },
      { spot: "FWD2", squad: "SENIORS", label: "S-FWD" },
      { spot: "FWD3", squad: "SENIORS", label: "S-FWD" },
    );
  }

  // Reserve positions
  if (positions.includes("DEF")) {
    spots.push(
      { spot: "RDEF1", squad: "RESERVES", label: "R-DEF" },
      { spot: "RDEF2", squad: "RESERVES", label: "R-DEF" },
    );
  }
  if (positions.includes("MID")) {
    spots.push(
      { spot: "RMID1", squad: "RESERVES", label: "R-MID" },
      { spot: "RMID2", squad: "RESERVES", label: "R-MID" },
      { spot: "RMID3", squad: "RESERVES", label: "R-MID" },
    );
  }
  if (positions.includes("RUC")) {
    spots.push({ spot: "RRUC", squad: "RESERVES", label: "R-RUC" });
  }
  if (positions.includes("FWD")) {
    spots.push(
      { spot: "RFWD1", squad: "RESERVES", label: "R-FWD" },
      { spot: "RFWD2", squad: "RESERVES", label: "R-FWD" },
    );
  }

  // Bench and IL can hold any position
  spots.push(
    { spot: "BENCH1", squad: "SENIORS", label: "Bench" },
    { spot: "BENCH2", squad: "SENIORS", label: "Bench" },
    { spot: "IL1", squad: "SENIORS", label: "IL" },
    { spot: "IL2", squad: "SENIORS", label: "IL" },
  );

  return spots;
}

export function RosterTable({ players, clubId, onPlayerClick }: Props) {
  const [search, setSearch] = useState("");
  const [position, setPosition] = useState<string>("all");
  const [squad, setSquad] = useState<string>("all");
  const [sortKey, setSortKey] = useState<SortKey>("avgScore");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("desc");
  const [updating, setUpdating] = useState<string | null>(null);

  // Optimistic updates for instant UI feedback
  const [optimisticUpdates, setOptimisticUpdates] = useState<Map<string, Partial<RosterPlayer>>>(new Map());

  // Merge optimistic updates with server data
  const playersWithOptimistic = useMemo(() => {
    return players.map(p => {
      const update = optimisticUpdates.get(p.contractId);
      return update ? { ...p, ...update } : p;
    });
  }, [players, optimisticUpdates]);

  // Build a map of rosterSpot -> player for showing swap consequences
  const spotToPlayer = useMemo(() => {
    const map = new Map<string, RosterPlayer>();
    for (const p of playersWithOptimistic) {
      if (p.rosterSpot && p.squad) {
        map.set(`${p.squad}-${p.rosterSpot}`, p);
      }
    }
    return map;
  }, [playersWithOptimistic]);

  // Get consequence text for moving to a spot
  const getSwapConsequence = (targetSquad: Squad, targetSpot: RosterSpot, movingPlayer: RosterPlayer): string | null => {
    const key = `${targetSquad}-${targetSpot}`;
    const occupant = spotToPlayer.get(key);
    if (!occupant || occupant.contractId === movingPlayer.contractId) return null;

    const occupantName = `${occupant.firstName.charAt(0)}. ${occupant.lastName}`;

    // If moving player has a spot, they'll swap
    if (movingPlayer.rosterSpot) {
      return `↔ ${occupantName}`;
    }
    // Otherwise occupant goes to bench
    return `${occupantName} → Bench`;
  };

  const filteredPlayers = useMemo(() => {
    let filtered = playersWithOptimistic;

    // Search filter
    if (search) {
      const searchLower = search.toLowerCase();
      filtered = filtered.filter(
        (p) =>
          p.firstName.toLowerCase().includes(searchLower) ||
          p.lastName.toLowerCase().includes(searchLower) ||
          (p.aflTeam?.toLowerCase().includes(searchLower) ?? false)
      );
    }

    // Position filter
    if (position !== "all") {
      filtered = filtered.filter((p) => p.positions.includes(position));
    }

    // Squad filter
    if (squad !== "all") {
      if (squad === "unassigned") {
        filtered = filtered.filter((p) => !p.squad);
      } else {
        filtered = filtered.filter((p) => p.squad === squad);
      }
    }

    // Sort
    return [...filtered].sort((a, b) => {
      if (sortKey === "lastName") {
        const cmp = a.lastName.localeCompare(b.lastName);
        return sortDir === "asc" ? cmp : -cmp;
      }

      if (sortKey === "squad") {
        // Sort by squad: SENIORS first, then RESERVES, then unassigned
        const squadOrder = (s: string | null) => {
          if (s === "SENIORS") return 0;
          if (s === "RESERVES") return 1;
          return 2;
        };
        const cmp = squadOrder(a.squad) - squadOrder(b.squad);
        return sortDir === "asc" ? cmp : -cmp;
      }

      const aVal = a[sortKey] ?? 0;
      const bVal = b[sortKey] ?? 0;
      return sortDir === "asc" ? aVal - bVal : bVal - aVal;
    });
  }, [players, search, position, squad, sortKey, sortDir]);

  const handleSort = (key: SortKey) => {
    if (sortKey === key) {
      setSortDir(sortDir === "asc" ? "desc" : "asc");
    } else {
      setSortKey(key);
      setSortDir("desc");
    }
  };

  const handleAssignSpot = async (player: RosterPlayer, spot: RosterSpot, targetSquad: Squad) => {
    setUpdating(player.contractId);

    // Find who's currently in the target spot
    const targetKey = `${targetSquad}-${spot}`;
    const displacedPlayer = spotToPlayer.get(targetKey);

    // Apply optimistic updates immediately for BOTH players
    setOptimisticUpdates(prev => {
      const next = new Map(prev);

      // Update the moving player
      next.set(player.contractId, { squad: targetSquad, rosterSpot: spot });

      // Update the displaced player if there is one
      if (displacedPlayer && displacedPlayer.contractId !== player.contractId) {
        if (player.rosterSpot && player.squad) {
          // Swap: displaced player goes to moving player's old spot
          next.set(displacedPlayer.contractId, { squad: player.squad, rosterSpot: player.rosterSpot });
        } else {
          // No swap: displaced player goes to bench
          next.set(displacedPlayer.contractId, { squad: "SENIORS", rosterSpot: "BENCH1" });
        }
      }

      return next;
    });

    // Show toast messages for both moves
    toast.success(`${player.firstName.charAt(0)}. ${player.lastName} → ${formatSquadDisplay(targetSquad, spot)}`);
    if (displacedPlayer && displacedPlayer.contractId !== player.contractId) {
      const displacedName = `${displacedPlayer.firstName.charAt(0)}. ${displacedPlayer.lastName}`;
      if (player.rosterSpot && player.squad) {
        toast.success(`${displacedName} → ${formatSquadDisplay(player.squad, player.rosterSpot)}`);
      } else {
        toast.success(`${displacedName} → Bench`);
      }
    }

    try {
      const result = await assignPlayerToRoster(player.contractId, clubId, targetSquad, spot);
      if (!result.success && "error" in result) {
        // Revert optimistic updates on error
        setOptimisticUpdates(prev => {
          const next = new Map(prev);
          next.delete(player.contractId);
          if (displacedPlayer) next.delete(displacedPlayer.contractId);
          return next;
        });
        toast.error(result.error);
      }
    } catch {
      // Revert optimistic updates on error
      setOptimisticUpdates(prev => {
        const next = new Map(prev);
        next.delete(player.contractId);
        if (displacedPlayer) next.delete(displacedPlayer.contractId);
        return next;
      });
      toast.error("Failed to update roster");
    }
    setUpdating(null);
  };

  const handleRemoveFromRoster = async (player: RosterPlayer) => {
    // We need the roster player ID, not the contract ID
    // For now, just show a message - removal should be done via the slots view
    toast.info("Use the squad tabs to remove players from roster");
  };

  const handleSetCaptain = async (player: RosterPlayer, role: "captain" | "viceCaptain" | "none") => {
    if (!player.squad) return;
    setUpdating(player.contractId);

    // TODO: Captain functionality temporarily disabled for deployment
    toast.info("Captain selection coming soon");
    setUpdating(null);
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

        <Select value={squad} onValueChange={setSquad}>
          <SelectTrigger className="w-[160px]">
            <SelectValue placeholder="Squad" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Squads</SelectItem>
            <SelectItem value="SENIORS">Seniors</SelectItem>
            <SelectItem value="RESERVES">Reserves</SelectItem>
            <SelectItem value="unassigned">Unassigned</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Results count */}
      <div className="text-sm text-muted-foreground">
        Showing {filteredPlayers.length} of {players.length} players
      </div>

      {/* Table */}
      <div className="rounded-lg border overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[180px] sticky left-0 bg-background z-10">
                <button onClick={() => handleSort("lastName")} className="flex items-center hover:text-foreground">
                  Name <SortIcon column="lastName" />
                </button>
              </TableHead>
              <TableHead>AFL Team</TableHead>
              <TableHead>Role</TableHead>
              <TableHead>Positions</TableHead>
              <TableHead>
                <button onClick={() => handleSort("squad")} className="flex items-center hover:text-foreground">
                  Squad <SortIcon column="squad" />
                </button>
              </TableHead>
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
                <button onClick={() => handleSort("highScore")} className="flex items-center justify-end hover:text-foreground">
                  High <SortIcon column="highScore" />
                </button>
              </TableHead>
              <TableHead className="text-right">
                <button onClick={() => handleSort("seniorsGames")} className="flex items-center justify-end hover:text-foreground">
                  SGP <SortIcon column="seniorsGames" />
                </button>
              </TableHead>
              <TableHead className="text-right">
                <button onClick={() => handleSort("reservesGames")} className="flex items-center justify-end hover:text-foreground">
                  RGP <SortIcon column="reservesGames" />
                </button>
              </TableHead>
              <TableHead className="text-right">
                <button onClick={() => handleSort("gamesPlayed")} className="flex items-center justify-end hover:text-foreground">
                  AFL GP <SortIcon column="gamesPlayed" />
                </button>
              </TableHead>
              <TableHead className="text-right">
                <button onClick={() => handleSort("salary")} className="flex items-center justify-end hover:text-foreground">
                  Salary <SortIcon column="salary" />
                </button>
              </TableHead>
              <TableHead className="text-right">
                <button onClick={() => handleSort("endSeason")} className="flex items-center justify-end hover:text-foreground">
                  Ends <SortIcon column="endSeason" />
                </button>
              </TableHead>
              <TableHead>Type</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredPlayers.length > 0 ? (
              filteredPlayers.map((player) => {
                const availableSpots = getAvailableSpots(player.positions);
                const isUpdating = updating === player.contractId;

                return (
                  <TableRow key={player.contractId}>
                    <TableCell className="sticky left-0 bg-background z-10">
                      <button
                        className="text-left hover:underline focus:outline-none focus:underline"
                        onClick={() => onPlayerClick?.(player)}
                      >
                        <div className="font-medium">
                          {player.firstName.charAt(0)}. {player.lastName}
                        </div>
                      </button>
                      {player.tradeBlock && (
                        <Badge variant="destructive" className="text-[10px] mt-0.5">TB</Badge>
                      )}
                      {player.seniorsGames < RULE9_GAMES_THRESHOLD && (
                        <Badge variant="outline" className="text-[10px] mt-0.5 ml-1 border-amber-500 text-amber-600">R9</Badge>
                      )}
                    </TableCell>
                    <TableCell className="text-muted-foreground text-sm">
                      {player.aflTeam || "-"}
                    </TableCell>
                    <TableCell>
                      {player.squad ? (
                        <div className="flex items-center gap-1">
                          <button
                            onClick={() => handleSetCaptain(player, player.isCaptain ? "none" : "captain")}
                            disabled={isUpdating}
                            className={`px-1.5 py-0.5 rounded text-xs font-medium transition-colors ${player.isCaptain ? "bg-amber-500 text-white" : "bg-muted text-muted-foreground hover:bg-amber-500/20 hover:text-amber-600"}`}
                            title={player.isCaptain ? "Remove Captain" : "Set as Captain"}
                          >
                            C
                          </button>
                          <button
                            onClick={() => handleSetCaptain(player, player.isViceCaptain ? "none" : "viceCaptain")}
                            disabled={isUpdating}
                            className={`px-1.5 py-0.5 rounded text-xs font-medium transition-colors ${player.isViceCaptain ? "bg-amber-500 text-white" : "bg-muted text-muted-foreground hover:bg-amber-500/20 hover:text-amber-600"}`}
                            title={player.isViceCaptain ? "Remove Vice Captain" : "Set as Vice Captain"}
                          >
                            VC
                          </button>
                        </div>
                      ) : (
                        <span className="text-muted-foreground text-xs">-</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-1 flex-wrap">
                        {player.positions.map((pos) => (
                          <span
                            key={pos}
                            className={`text-[10px] px-1.5 py-0.5 rounded font-medium ${getPositionColorClasses(pos)}`}
                          >
                            {pos}
                          </span>
                        ))}
                      </div>
                    </TableCell>
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-7 px-2 text-xs font-normal"
                            disabled={isUpdating}
                          >
                            {formatSquadDisplay(player.squad, player.rosterSpot)}
                            <ChevronDown className="ml-1 h-3 w-3" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="start" className="w-56">
                          {/* Seniors spots */}
                          <div className="px-2 py-1 text-xs font-semibold text-muted-foreground">Seniors</div>
                          {availableSpots
                            .filter(s => s.squad === "SENIORS" && !s.label.startsWith("Bench") && !s.label.startsWith("IL"))
                            .filter((s, i, arr) => arr.findIndex(x => x.label === s.label) === i) // unique labels
                            .map((s) => {
                              const consequence = getSwapConsequence(s.squad, s.spot, player);
                              return (
                                <DropdownMenuItem
                                  key={`${s.squad}-${s.label}`}
                                  onClick={() => handleAssignSpot(player, s.spot, s.squad)}
                                  className="flex justify-between"
                                >
                                  <span>{s.label}</span>
                                  {consequence && (
                                    <span className="text-[10px] text-muted-foreground ml-2">{consequence}</span>
                                  )}
                                </DropdownMenuItem>
                              );
                            })}

                          <DropdownMenuSeparator />

                          {/* Reserves spots */}
                          <div className="px-2 py-1 text-xs font-semibold text-muted-foreground">Reserves</div>
                          {availableSpots
                            .filter(s => s.squad === "RESERVES")
                            .filter((s, i, arr) => arr.findIndex(x => x.label === s.label) === i)
                            .map((s) => {
                              const consequence = getSwapConsequence(s.squad, s.spot, player);
                              return (
                                <DropdownMenuItem
                                  key={`${s.squad}-${s.label}`}
                                  onClick={() => handleAssignSpot(player, s.spot, s.squad)}
                                  className="flex justify-between"
                                >
                                  <span>{s.label}</span>
                                  {consequence && (
                                    <span className="text-[10px] text-muted-foreground ml-2">{consequence}</span>
                                  )}
                                </DropdownMenuItem>
                              );
                            })}

                          <DropdownMenuSeparator />

                          {/* Bench and IL */}
                          <DropdownMenuItem
                            onClick={() => handleAssignSpot(player, "BENCH1", "SENIORS")}
                          >
                            Bench
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() => handleAssignSpot(player, "IL1", "SENIORS")}
                          >
                            Injury List
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                    <TableCell className="text-right font-semibold">
                      {player.avgScore !== null ? player.avgScore.toFixed(1) : "-"}
                    </TableCell>
                    <TableCell className="text-right text-muted-foreground">
                      {player.last5Avg !== null ? player.last5Avg.toFixed(1) : "-"}
                    </TableCell>
                    <TableCell className="text-right text-muted-foreground">
                      {player.highScore !== null ? player.highScore : "-"}
                    </TableCell>
                    <TableCell className="text-right text-muted-foreground">
                      {player.seniorsGames}
                    </TableCell>
                    <TableCell className="text-right text-muted-foreground">
                      {player.reservesGames}
                    </TableCell>
                    <TableCell className="text-right text-muted-foreground">
                      {player.gamesPlayed}
                    </TableCell>
                    <TableCell className="text-right">
                      ${player.salary}k
                    </TableCell>
                    <TableCell className="text-right text-muted-foreground">
                      {player.endSeason}
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className="text-[10px]">
                        {player.contractType}
                      </Badge>
                    </TableCell>
                  </TableRow>
                );
              })
            ) : (
              <TableRow>
                <TableCell colSpan={14} className="text-center text-muted-foreground py-8">
                  No players match your filters
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
