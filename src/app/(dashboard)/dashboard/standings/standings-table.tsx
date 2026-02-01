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

  const TeamBadge = ({ position, club }: { position: number; club: Standing["club"] }) => (
    <span
      className="px-1.5 py-0.5 rounded text-[10px] font-semibold"
      style={{
        backgroundColor: club.primaryColor || "#6b7280",
        color: club.secondaryColor || "#fff",
      }}
    >
      {position}. {club.abbreviation}
    </span>
  );

  return (
    <div className="mt-4 pt-4 border-t">
      <h4 className="text-xs font-semibold text-muted-foreground mb-3">Finals Structure</h4>
      <div className="space-y-3 text-xs">
        {/* Week 1 */}
        <div>
          <div className="text-muted-foreground mb-1.5 font-medium">Week 1</div>
          <div className="grid grid-cols-2 gap-2">
            <div className="space-y-1">
              <div className="text-[10px] text-muted-foreground">1st hosts 2nd</div>
              <div className="flex items-center gap-1">
                <TeamBadge position={1} club={standings[0].club} />
                <span className="text-muted-foreground">v</span>
                <TeamBadge position={2} club={standings[1].club} />
              </div>
            </div>
            <div className="space-y-1">
              <div className="text-[10px] text-muted-foreground">3rd hosts 4th</div>
              <div className="flex items-center gap-1">
                <TeamBadge position={3} club={standings[2].club} />
                <span className="text-muted-foreground">v</span>
                <TeamBadge position={4} club={standings[3].club} />
              </div>
            </div>
          </div>
        </div>

        {/* Week 2 */}
        <div>
          <div className="text-muted-foreground mb-1.5 font-medium">Week 2 - Preliminary Final</div>
          <div className="text-[10px] text-muted-foreground mb-1">Loser 1v2 hosts Winner 3v4</div>
          <div className="flex items-center gap-1 text-muted-foreground italic">
            <span className="px-1.5 py-0.5 rounded text-[10px] bg-muted">L(1v2)</span>
            <span>v</span>
            <span className="px-1.5 py-0.5 rounded text-[10px] bg-muted">W(3v4)</span>
          </div>
        </div>

        {/* Week 3 */}
        <div>
          <div className="text-muted-foreground mb-1.5 font-medium">Week 3 - Grand Final</div>
          <div className="text-[10px] text-muted-foreground mb-1">Winner 1v2 hosts Prelim winner</div>
          <div className="flex items-center gap-1 text-muted-foreground italic">
            <span className="px-1.5 py-0.5 rounded text-[10px] bg-muted">W(1v2)</span>
            <span>v</span>
            <span className="px-1.5 py-0.5 rounded text-[10px] bg-muted">W(Prelim)</span>
          </div>
        </div>
      </div>
    </div>
  );
}
