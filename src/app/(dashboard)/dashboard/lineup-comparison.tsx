"use client";

import { useMemo } from "react";
import { Badge } from "@/components/ui/badge";
import { RosterSpot } from "@prisma/client";
import type { SerializedContract, SerializedRosterPlayer, PlayerStats, CaptaincyInfo } from "./types";

// Aligned rows structure for comparison
type AlignedRow = {
  group: string;
  seniorSpot: RosterSpot | null;
  reserveSpot: RosterSpot | null;
  label: string;
};

const SENIORS_ROWS: AlignedRow[] = [
  { group: "Defenders", seniorSpot: "DEF1", reserveSpot: null, label: "DEF 1" },
  { group: "Defenders", seniorSpot: "DEF2", reserveSpot: null, label: "DEF 2" },
  { group: "Defenders", seniorSpot: "DEF3", reserveSpot: null, label: "DEF 3" },
  { group: "Midfielders", seniorSpot: "MID1", reserveSpot: null, label: "MID 1" },
  { group: "Midfielders", seniorSpot: "MID2", reserveSpot: null, label: "MID 2" },
  { group: "Midfielders", seniorSpot: "MID3", reserveSpot: null, label: "MID 3" },
  { group: "Midfielders", seniorSpot: "MID4", reserveSpot: null, label: "MID 4" },
  { group: "Ruck", seniorSpot: "RUC", reserveSpot: null, label: "RUC" },
  { group: "Forwards", seniorSpot: "FWD1", reserveSpot: null, label: "FWD 1" },
  { group: "Forwards", seniorSpot: "FWD2", reserveSpot: null, label: "FWD 2" },
  { group: "Forwards", seniorSpot: "FWD3", reserveSpot: null, label: "FWD 3" },
];

const RESERVES_ROWS: AlignedRow[] = [
  { group: "Defenders", seniorSpot: null, reserveSpot: "RDEF1", label: "DEF 1" },
  { group: "Defenders", seniorSpot: null, reserveSpot: "RDEF2", label: "DEF 2" },
  { group: "Midfielders", seniorSpot: null, reserveSpot: "RMID1", label: "MID 1" },
  { group: "Midfielders", seniorSpot: null, reserveSpot: "RMID2", label: "MID 2" },
  { group: "Midfielders", seniorSpot: null, reserveSpot: "RMID3", label: "MID 3" },
  { group: "Ruck", seniorSpot: null, reserveSpot: "RRUC", label: "RUC" },
  { group: "Forwards", seniorSpot: null, reserveSpot: "RFWD1", label: "FWD 1" },
  { group: "Forwards", seniorSpot: null, reserveSpot: "RFWD2", label: "FWD 2" },
];

type OpponentPlayer = {
  id: string;
  rosterSpot: RosterSpot;
  squad: string;
  contract: {
    id: string;
    aflPlayer: {
      id: string;
      firstName: string;
      lastName: string;
      positions: string[];
      aflTeam: string | null;
    };
  };
  avgScore: number | null;
  last5Avg: number | null;
};

type Props = {
  clubId: string;
  myRosterPlayers: SerializedRosterPlayer[];
  myContracts: SerializedContract[];
  myPlayerStats: PlayerStats[];
  myCaptaincy: CaptaincyInfo;
  opponentLineup: {
    isLocked: boolean;
    isProjected: boolean;
    players: OpponentPlayer[];
  };
  matchType: "SENIORS" | "RESERVES";
  isLocked: boolean;
  isProjected: boolean;
};

export function LineupComparison({
  clubId,
  myRosterPlayers,
  myContracts,
  myPlayerStats,
  myCaptaincy,
  opponentLineup,
  matchType,
  isLocked,
  isProjected,
}: Props) {
  const rows = matchType === "SENIORS" ? SENIORS_ROWS : RESERVES_ROWS;
  const squad = matchType === "SENIORS" ? "SENIORS" : "RESERVES";

  const myRosterMap = useMemo(() => {
    const map = new Map<RosterSpot, SerializedRosterPlayer>();
    for (const rp of myRosterPlayers) {
      if (rp.squad === squad) {
        map.set(rp.rosterSpot, rp);
      }
    }
    return map;
  }, [myRosterPlayers, squad]);

  const opponentRosterMap = useMemo(() => {
    const map = new Map<RosterSpot, OpponentPlayer>();
    for (const rp of opponentLineup.players) {
      if (rp.squad === squad) {
        map.set(rp.rosterSpot, rp);
      }
    }
    return map;
  }, [opponentLineup.players, squad]);

  const myStatsMap = useMemo(() => {
    const map = new Map<string, PlayerStats>();
    for (const s of myPlayerStats) {
      map.set(s.contractId, s);
    }
    return map;
  }, [myPlayerStats]);

  const captainId = squad === "SENIORS" ? myCaptaincy.seniorCaptainId : myCaptaincy.reservesCaptainId;
  const vcId = squad === "SENIORS" ? myCaptaincy.seniorVcId : myCaptaincy.reservesVcId;

  // Group rows by position group
  const groups: { name: string; rows: AlignedRow[] }[] = [];
  let currentGroup = "";
  for (const row of rows) {
    if (row.group !== currentGroup) {
      currentGroup = row.group;
      groups.push({ name: row.group, rows: [] });
    }
    groups[groups.length - 1].rows.push(row);
  }

  // Calculate totals
  const myTotal = rows.reduce((sum, row) => {
    const spot = matchType === "SENIORS" ? row.seniorSpot : row.reserveSpot;
    if (!spot) return sum;
    const player = myRosterMap.get(spot);
    if (!player) return sum;
    const stats = myStatsMap.get(player.contractId);
    return sum + (stats?.avgScore ?? 0);
  }, 0);

  const oppTotal = rows.reduce((sum, row) => {
    const spot = matchType === "SENIORS" ? row.seniorSpot : row.reserveSpot;
    if (!spot) return sum;
    const player = opponentRosterMap.get(spot);
    return sum + (player?.avgScore ?? 0);
  }, 0);

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between text-sm">
        <span className="font-medium">Lineup Comparison</span>
        {isProjected && (
          <Badge variant="outline" className="text-xs">
            Opponent lineup projected
          </Badge>
        )}
      </div>

      {/* Column headers */}
      <div className="grid grid-cols-[1fr_60px_1fr] gap-2 text-xs font-medium text-muted-foreground">
        <div className="text-center">You</div>
        <div className="text-center">Pos</div>
        <div className="text-center">Opponent</div>
      </div>

      {/* Position groups */}
      {groups.map((group) => (
        <div key={group.name} className="space-y-1">
          <div className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider text-center">
            {group.name}
          </div>
          {group.rows.map((row, idx) => {
            const spot = matchType === "SENIORS" ? row.seniorSpot : row.reserveSpot;
            if (!spot) return null;

            const myPlayer = myRosterMap.get(spot);
            const oppPlayer = opponentRosterMap.get(spot);

            const myStats = myPlayer ? myStatsMap.get(myPlayer.contractId) : null;

            const myIsCaptain = myPlayer?.id === captainId;
            const myIsVc = myPlayer?.id === vcId;

            return (
              <div key={idx} className="grid grid-cols-[1fr_60px_1fr] gap-2 items-center">
                {/* My Player */}
                <div className={`text-xs p-1.5 rounded ${myPlayer ? "bg-muted/50" : "bg-muted/20"}`}>
                  {myPlayer ? (
                    <div className="flex items-center justify-between">
                      <span className="truncate">
                        {myIsCaptain && <span className="text-primary font-bold mr-1">C</span>}
                        {myIsVc && <span className="text-primary mr-1">VC</span>}
                        {myPlayer.contract.aflPlayer.lastName}
                      </span>
                      <span className="text-muted-foreground ml-1">
                        {myStats?.avgScore?.toFixed(0) ?? "-"}
                      </span>
                    </div>
                  ) : (
                    <span className="text-muted-foreground italic">Empty</span>
                  )}
                </div>

                {/* Position */}
                <div className="text-center">
                  <Badge variant="outline" className="text-[10px] px-1.5">
                    {row.label}
                  </Badge>
                </div>

                {/* Opponent Player */}
                <div className={`text-xs p-1.5 rounded ${oppPlayer ? (isProjected ? "bg-muted/30" : "bg-muted/50") : "bg-muted/20"}`}>
                  {oppPlayer ? (
                    <div className="flex items-center justify-between">
                      <span className={`truncate ${isProjected ? "text-muted-foreground" : ""}`}>
                        {oppPlayer.contract.aflPlayer.lastName}
                      </span>
                      <span className="text-muted-foreground ml-1">
                        {oppPlayer.avgScore?.toFixed(0) ?? "-"}
                      </span>
                    </div>
                  ) : (
                    <span className="text-muted-foreground italic">Empty</span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      ))}

      {/* Totals */}
      <div className="grid grid-cols-[1fr_60px_1fr] gap-2 items-center pt-2 border-t">
        <div className="text-center font-bold">
          {myTotal.toFixed(0)}
        </div>
        <div className="text-center text-xs text-muted-foreground">
          Total Avg
        </div>
        <div className="text-center font-bold">
          {oppTotal.toFixed(0)}
        </div>
      </div>

      {/* Advantage indicator */}
      <div className="text-center text-sm">
        {myTotal > oppTotal ? (
          <span className="text-green-600">+{(myTotal - oppTotal).toFixed(0)} projected advantage</span>
        ) : myTotal < oppTotal ? (
          <span className="text-red-600">{(myTotal - oppTotal).toFixed(0)} projected disadvantage</span>
        ) : (
          <span className="text-muted-foreground">Even matchup</span>
        )}
      </div>
    </div>
  );
}
