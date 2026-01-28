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
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

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
      <Dialog open={!!selectedTeam} onOpenChange={() => setSelectedTeam(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <span
                className="px-3 py-1 rounded font-semibold"
                style={{
                  backgroundColor: selectedTeam?.club.primaryColor || "#6b7280",
                  color: selectedTeam?.club.secondaryColor || "#ffffff",
                }}
              >
                {isReserves
                  ? (selectedTeam?.club.reservesName ?? selectedTeam?.club.name)
                  : selectedTeam?.club.name}
              </span>
            </DialogTitle>
          </DialogHeader>
          {selectedTeam && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <div className="text-xs text-muted-foreground">Position</div>
                  <div className="text-2xl font-bold">
                    {standings.findIndex((s) => s.id === selectedTeam.id) + 1}
                    <span className="text-sm text-muted-foreground">
                      {standings.findIndex((s) => s.id === selectedTeam.id) < 4 ? " (Finals)" : ""}
                    </span>
                  </div>
                </div>
                <div className="space-y-1">
                  <div className="text-xs text-muted-foreground">Points</div>
                  <div className="text-2xl font-bold">{selectedTeam.wins * 4 + selectedTeam.draws * 2}</div>
                </div>
              </div>

              <div className="grid grid-cols-4 gap-2 text-center">
                <div className="p-2 bg-muted rounded">
                  <div className="text-xs text-muted-foreground">Played</div>
                  <div className="font-semibold">{selectedTeam.played}</div>
                </div>
                <div className="p-2 bg-green-500/10 rounded">
                  <div className="text-xs text-muted-foreground">Wins</div>
                  <div className="font-semibold text-green-600">{selectedTeam.wins}</div>
                </div>
                <div className="p-2 bg-yellow-500/10 rounded">
                  <div className="text-xs text-muted-foreground">Draws</div>
                  <div className="font-semibold text-yellow-600">{selectedTeam.draws}</div>
                </div>
                <div className="p-2 bg-red-500/10 rounded">
                  <div className="text-xs text-muted-foreground">Losses</div>
                  <div className="font-semibold text-red-600">{selectedTeam.losses}</div>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-2 text-center">
                <div className="p-2 bg-muted rounded">
                  <div className="text-xs text-muted-foreground">Points For</div>
                  <div className="font-semibold">{selectedTeam.pointsFor}</div>
                </div>
                <div className="p-2 bg-muted rounded">
                  <div className="text-xs text-muted-foreground">Points Against</div>
                  <div className="font-semibold">{selectedTeam.pointsAgainst}</div>
                </div>
                <div className="p-2 bg-muted rounded">
                  <div className="text-xs text-muted-foreground">Percentage</div>
                  <div className="font-semibold">{selectedTeam.percentage.toFixed(1)}%</div>
                </div>
              </div>

              <div className="text-xs text-muted-foreground text-center pt-2 border-t">
                Win Rate: {selectedTeam.played > 0 ? ((selectedTeam.wins / selectedTeam.played) * 100).toFixed(0) : 0}%
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
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
