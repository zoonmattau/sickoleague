"use client";

import { useState } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { TeamInfoDialog } from "./team-info-dialog";

type Standing = {
  id: string;
  played: number;
  wins: number;
  losses: number;
  draws: number;
  pointsFor: number;
  pointsAgainst: number;
  percentage: number;
  club: {
    id: string;
    name: string;
    abbreviation: string;
    reservesName: string | null;
    primaryColor: string | null;
    secondaryColor: string | null;
  };
};

type Props = {
  standings: Standing[];
  isReserves?: boolean;
};

export function StandingsTable({ standings, isReserves = false }: Props) {
  const [selectedTeam, setSelectedTeam] = useState<Standing | null>(null);

  return (
    <>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-12">#</TableHead>
            <TableHead>Club</TableHead>
            <TableHead className="text-center">P</TableHead>
            <TableHead className="text-center">W</TableHead>
            <TableHead className="text-center">D</TableHead>
            <TableHead className="text-center">L</TableHead>
            <TableHead className="text-center">Pts</TableHead>
            <TableHead className="text-right">PF</TableHead>
            <TableHead className="text-right">PA</TableHead>
            <TableHead className="text-right">%</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {standings.length > 0 ? (
            standings.map((s, i) => (
              <TableRow
                key={s.id}
                className={`cursor-pointer hover:bg-muted/50 ${i < 4 ? "bg-green-500/10" : ""}`}
                onClick={() => setSelectedTeam(s)}
              >
                <TableCell className="font-medium">{i + 1}</TableCell>
                <TableCell>
                  <span
                    className="px-2 py-0.5 rounded text-xs font-semibold"
                    style={{
                      backgroundColor: s.club.primaryColor || "#6b7280",
                      color: s.club.secondaryColor || "#ffffff",
                    }}
                  >
                    {isReserves ? (s.club.reservesName ?? s.club.name) : s.club.name}
                  </span>
                </TableCell>
                <TableCell className="text-center">{s.played}</TableCell>
                <TableCell className="text-center">{s.wins}</TableCell>
                <TableCell className="text-center">{s.draws}</TableCell>
                <TableCell className="text-center">{s.losses}</TableCell>
                <TableCell className="text-center font-bold">{s.wins * 4 + s.draws * 2}</TableCell>
                <TableCell className="text-right">{s.pointsFor}</TableCell>
                <TableCell className="text-right">{s.pointsAgainst}</TableCell>
                <TableCell className="text-right">{s.percentage.toFixed(1)}</TableCell>
              </TableRow>
            ))
          ) : (
            <TableRow>
              <TableCell colSpan={10} className="text-center text-muted-foreground py-8">
                Season not started - standings will appear here
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>

      {/* Team Info Dialog */}
      <TeamInfoDialog
        standing={selectedTeam}
        standings={standings}
        isReserves={isReserves}
        open={!!selectedTeam}
        onOpenChange={(open) => !open && setSelectedTeam(null)}
      />
    </>
  );
}

export function FinalsProjection({ standings, isReserves = false }: Props) {
  if (standings.length < 4) return null;

  return (
    <div className="mt-4 pt-4 border-t">
      <h4 className="text-xs font-semibold text-muted-foreground mb-2">Projected Finals</h4>
      <div className="grid grid-cols-2 gap-2 text-xs">
        <div className="space-y-1">
          <div className="text-muted-foreground">Qualifying Final 1</div>
          <div className="flex items-center gap-1">
            <span
              className="px-1.5 py-0.5 rounded text-[10px] font-semibold"
              style={{
                backgroundColor: standings[0]?.club.primaryColor || "#6b7280",
                color: standings[0]?.club.secondaryColor || "#fff",
              }}
            >
              1. {standings[0]?.club.abbreviation}
            </span>
            <span className="text-muted-foreground">v</span>
            <span
              className="px-1.5 py-0.5 rounded text-[10px] font-semibold"
              style={{
                backgroundColor: standings[3]?.club.primaryColor || "#6b7280",
                color: standings[3]?.club.secondaryColor || "#fff",
              }}
            >
              4. {standings[3]?.club.abbreviation}
            </span>
          </div>
        </div>
        <div className="space-y-1">
          <div className="text-muted-foreground">Qualifying Final 2</div>
          <div className="flex items-center gap-1">
            <span
              className="px-1.5 py-0.5 rounded text-[10px] font-semibold"
              style={{
                backgroundColor: standings[1]?.club.primaryColor || "#6b7280",
                color: standings[1]?.club.secondaryColor || "#fff",
              }}
            >
              2. {standings[1]?.club.abbreviation}
            </span>
            <span className="text-muted-foreground">v</span>
            <span
              className="px-1.5 py-0.5 rounded text-[10px] font-semibold"
              style={{
                backgroundColor: standings[2]?.club.primaryColor || "#6b7280",
                color: standings[2]?.club.secondaryColor || "#fff",
              }}
            >
              3. {standings[2]?.club.abbreviation}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
