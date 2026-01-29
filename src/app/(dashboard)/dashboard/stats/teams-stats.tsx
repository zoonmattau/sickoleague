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
import { ArrowUpDown, ArrowUp, ArrowDown } from "lucide-react";
import { TeamInfoDialog } from "../standings/team-info-dialog";

type TeamStat = {
  id: string;
  clubId: string;
  clubName: string;
  clubAbbr: string;
  reservesName: string | null;
  primaryColor: string | null;
  secondaryColor: string | null;
  competition: string;
  seasonYear: number;
  played: number;
  wins: number;
  losses: number;
  draws: number;
  points: number;
  pointsFor: number;
  pointsAgainst: number;
  percentage: number;
  hfa: number | null;
};

type Props = {
  stats: TeamStat[];
};

type SortKey = "clubName" | "wins" | "losses" | "points" | "pointsFor" | "pointsAgainst" | "percentage" | "hfa";

export function TeamsStats({ stats }: Props) {
  const [competition, setCompetition] = useState<"SENIORS" | "RESERVES" | "all">("SENIORS");
  const [sortKey, setSortKey] = useState<SortKey>("points");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("desc");
  const [selectedTeam, setSelectedTeam] = useState<TeamStat | null>(null);

  const filteredStats = useMemo(() => {
    let filtered = stats;
    if (competition !== "all") {
      filtered = stats.filter(s => s.competition === competition);
    }

    return [...filtered].sort((a, b) => {
      let aVal: number | string = a[sortKey] ?? 0;
      let bVal: number | string = b[sortKey] ?? 0;

      if (sortKey === "clubName") {
        aVal = a.clubName.toLowerCase();
        bVal = b.clubName.toLowerCase();
        return sortDir === "asc"
          ? aVal.localeCompare(bVal as string)
          : (bVal as string).localeCompare(aVal);
      }

      return sortDir === "asc" ? (aVal as number) - (bVal as number) : (bVal as number) - (aVal as number);
    });
  }, [stats, competition, sortKey, sortDir]);

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

  // Convert team stat to standing format for dialog
  const standingForDialog = selectedTeam ? {
    id: selectedTeam.id,
    played: selectedTeam.played,
    wins: selectedTeam.wins,
    losses: selectedTeam.losses,
    draws: selectedTeam.draws,
    pointsFor: selectedTeam.pointsFor,
    pointsAgainst: selectedTeam.pointsAgainst,
    percentage: selectedTeam.percentage,
    club: {
      id: selectedTeam.clubId,
      name: selectedTeam.clubName,
      abbreviation: selectedTeam.clubAbbr,
      reservesName: selectedTeam.reservesName,
      primaryColor: selectedTeam.primaryColor,
      secondaryColor: selectedTeam.secondaryColor,
    },
  } : null;

  const standingsForDialog = filteredStats.map(s => ({
    id: s.id,
    played: s.played,
    wins: s.wins,
    losses: s.losses,
    draws: s.draws,
    pointsFor: s.pointsFor,
    pointsAgainst: s.pointsAgainst,
    percentage: s.percentage,
    club: {
      id: s.clubId,
      name: s.clubName,
      abbreviation: s.clubAbbr,
      reservesName: s.reservesName,
      primaryColor: s.primaryColor,
      secondaryColor: s.secondaryColor,
    },
  }));

  return (
    <div className="space-y-4">
      {/* Filters */}
      <div className="flex gap-4">
        <Select value={competition} onValueChange={(v) => setCompetition(v as typeof competition)}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Competition" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="SENIORS">Seniors</SelectItem>
            <SelectItem value="RESERVES">Reserves</SelectItem>
            <SelectItem value="all">All</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Table */}
      <div className="rounded-lg border overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-12">#</TableHead>
              <TableHead>
                <button onClick={() => handleSort("clubName")} className="flex items-center hover:text-foreground">
                  Club <SortIcon column="clubName" />
                </button>
              </TableHead>
              {competition === "all" && <TableHead>Comp</TableHead>}
              <TableHead className="text-center">
                <button onClick={() => handleSort("wins")} className="flex items-center justify-center hover:text-foreground">
                  W <SortIcon column="wins" />
                </button>
              </TableHead>
              <TableHead className="text-center">
                <button onClick={() => handleSort("losses")} className="flex items-center justify-center hover:text-foreground">
                  L <SortIcon column="losses" />
                </button>
              </TableHead>
              <TableHead className="text-center">
                <button onClick={() => handleSort("points")} className="flex items-center justify-center hover:text-foreground">
                  Pts <SortIcon column="points" />
                </button>
              </TableHead>
              <TableHead className="text-right">
                <button onClick={() => handleSort("pointsFor")} className="flex items-center justify-end hover:text-foreground">
                  PF <SortIcon column="pointsFor" />
                </button>
              </TableHead>
              <TableHead className="text-right">
                <button onClick={() => handleSort("pointsAgainst")} className="flex items-center justify-end hover:text-foreground">
                  PA <SortIcon column="pointsAgainst" />
                </button>
              </TableHead>
              <TableHead className="text-right">
                <button onClick={() => handleSort("percentage")} className="flex items-center justify-end hover:text-foreground">
                  % <SortIcon column="percentage" />
                </button>
              </TableHead>
              <TableHead className="text-right">
                <button onClick={() => handleSort("hfa")} className="flex items-center justify-end hover:text-foreground">
                  HFA <SortIcon column="hfa" />
                </button>
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredStats.length > 0 ? (
              filteredStats.map((team, idx) => (
                <TableRow
                  key={team.id}
                  className="cursor-pointer hover:bg-muted/50"
                  onClick={() => setSelectedTeam(team)}
                >
                  <TableCell className="font-medium">{idx + 1}</TableCell>
                  <TableCell>
                    <span
                      className="px-2 py-0.5 rounded text-xs font-semibold"
                      style={{
                        backgroundColor: team.primaryColor || "#6b7280",
                        color: team.secondaryColor || "#ffffff",
                      }}
                    >
                      {team.competition === "RESERVES"
                        ? (team.reservesName ?? team.clubName)
                        : team.clubName}
                    </span>
                  </TableCell>
                  {competition === "all" && (
                    <TableCell>
                      <Badge variant="outline" className="text-xs">
                        {team.competition === "SENIORS" ? "S" : "R"}
                      </Badge>
                    </TableCell>
                  )}
                  <TableCell className="text-center">{team.wins}</TableCell>
                  <TableCell className="text-center">{team.losses}</TableCell>
                  <TableCell className="text-center font-bold">{team.points}</TableCell>
                  <TableCell className="text-right">{team.pointsFor.toFixed(0)}</TableCell>
                  <TableCell className="text-right">{team.pointsAgainst.toFixed(0)}</TableCell>
                  <TableCell className="text-right">{team.percentage.toFixed(1)}</TableCell>
                  <TableCell className={`text-right ${team.hfa !== null ? (team.hfa >= 0 ? "text-green-600" : "text-red-600") : ""}`}>
                    {team.hfa !== null ? (team.hfa >= 0 ? "+" : "") + team.hfa : "-"}
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={10} className="text-center text-muted-foreground py-8">
                  No team data available
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      {/* Team Info Dialog */}
      <TeamInfoDialog
        standing={standingForDialog}
        standings={standingsForDialog}
        isReserves={selectedTeam?.competition === "RESERVES"}
        open={!!selectedTeam}
        onOpenChange={(open) => !open && setSelectedTeam(null)}
      />
    </div>
  );
}
