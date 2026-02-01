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
import { ArrowUpDown, ArrowUp, ArrowDown } from "lucide-react";

type TeamStat = {
  id: string;
  clubId: string;
  clubName: string;
  clubAbbr: string;
  primaryColor: string | null;
  secondaryColor: string | null;
  rosterSize: number;
  totalSalary: number;
  salaryCap: number;
  capRoom: number;
  isOverCap: boolean;
  avgPlayerScore: number | null;
  totalGamesPlayed: number;
  expiringContracts: number;
};

type Props = {
  stats: TeamStat[];
};

type SortKey = "clubName" | "rosterSize" | "totalSalary" | "capRoom" | "avgPlayerScore" | "expiringContracts";

export function TeamsStats({ stats }: Props) {
  const [sortKey, setSortKey] = useState<SortKey>("avgPlayerScore");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("desc");

  const sortedStats = useMemo(() => {
    return [...stats].sort((a, b) => {
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
  }, [stats, sortKey, sortDir]);

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
      {/* Table */}
      <div className="rounded-lg border overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>
                <button onClick={() => handleSort("clubName")} className="flex items-center hover:text-foreground">
                  Club <SortIcon column="clubName" />
                </button>
              </TableHead>
              <TableHead className="text-center">
                <button onClick={() => handleSort("rosterSize")} className="flex items-center justify-center hover:text-foreground">
                  Roster <SortIcon column="rosterSize" />
                </button>
              </TableHead>
              <TableHead className="text-right">
                <button onClick={() => handleSort("totalSalary")} className="flex items-center justify-end hover:text-foreground">
                  Salary <SortIcon column="totalSalary" />
                </button>
              </TableHead>
              <TableHead className="text-right">
                <button onClick={() => handleSort("capRoom")} className="flex items-center justify-end hover:text-foreground">
                  Cap Room <SortIcon column="capRoom" />
                </button>
              </TableHead>
              <TableHead className="text-right">
                <button onClick={() => handleSort("avgPlayerScore")} className="flex items-center justify-end hover:text-foreground">
                  Avg Score <SortIcon column="avgPlayerScore" />
                </button>
              </TableHead>
              <TableHead className="text-center">
                <button onClick={() => handleSort("expiringContracts")} className="flex items-center justify-center hover:text-foreground">
                  Expiring <SortIcon column="expiringContracts" />
                </button>
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {sortedStats.length > 0 ? (
              sortedStats.map((team) => (
                <TableRow key={team.id}>
                  <TableCell>
                    <span
                      className="px-2 py-0.5 rounded text-xs font-semibold"
                      style={{
                        backgroundColor: team.primaryColor || "#6b7280",
                        color: team.secondaryColor || "#ffffff",
                      }}
                    >
                      {team.clubName}
                    </span>
                  </TableCell>
                  <TableCell className="text-center">{team.rosterSize}</TableCell>
                  <TableCell className="text-right">
                    ${Math.round(team.totalSalary)}k
                  </TableCell>
                  <TableCell className={`text-right ${team.isOverCap ? "text-red-500 font-semibold" : team.capRoom < 100 ? "text-yellow-600" : "text-green-600"}`}>
                    {team.isOverCap ? "-" : ""}${Math.abs(Math.round(team.capRoom))}k
                  </TableCell>
                  <TableCell className="text-right font-semibold">
                    {team.avgPlayerScore !== null ? team.avgPlayerScore.toFixed(1) : "-"}
                  </TableCell>
                  <TableCell className="text-center text-muted-foreground">
                    {team.expiringContracts}
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={6} className="text-center text-muted-foreground py-8">
                  No team data available
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
