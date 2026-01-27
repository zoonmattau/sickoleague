"use client";

import { useState, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { RosterSpot } from "@prisma/client";
import { DashboardLineupSlot } from "./dashboard-lineup-slot";
import { PlayerDetailPanel } from "./player-detail-panel";
import type {
  SerializedContract,
  SerializedRosterPlayer,
  SpotConfig,
  PlayerStats,
  CaptaincyInfo,
} from "./types";

// Aligned rows: each row is [seniors spot | reserves spot], with null for gaps
type AlignedRow = {
  group: string;
  senior: SpotConfig | null;
  reserve: SpotConfig | null;
};

const ALIGNED_ROWS: AlignedRow[] = [
  // Defenders
  { group: "Defenders", senior: { spot: "DEF1", label: "DEF 1", group: "Defenders", position: "DEF", squad: "SENIORS" }, reserve: { spot: "RDEF1", label: "DEF 1", group: "Defenders", position: "DEF", squad: "RESERVES" } },
  { group: "Defenders", senior: { spot: "DEF2", label: "DEF 2", group: "Defenders", position: "DEF", squad: "SENIORS" }, reserve: { spot: "RDEF2", label: "DEF 2", group: "Defenders", position: "DEF", squad: "RESERVES" } },
  { group: "Defenders", senior: { spot: "DEF3", label: "DEF 3", group: "Defenders", position: "DEF", squad: "SENIORS" }, reserve: null },
  // Midfielders
  { group: "Midfielders", senior: { spot: "MID1", label: "MID 1", group: "Midfielders", position: "MID", squad: "SENIORS" }, reserve: { spot: "RMID1", label: "MID 1", group: "Midfielders", position: "MID", squad: "RESERVES" } },
  { group: "Midfielders", senior: { spot: "MID2", label: "MID 2", group: "Midfielders", position: "MID", squad: "SENIORS" }, reserve: { spot: "RMID2", label: "MID 2", group: "Midfielders", position: "MID", squad: "RESERVES" } },
  { group: "Midfielders", senior: { spot: "MID3", label: "MID 3", group: "Midfielders", position: "MID", squad: "SENIORS" }, reserve: { spot: "RMID3", label: "MID 3", group: "Midfielders", position: "MID", squad: "RESERVES" } },
  { group: "Midfielders", senior: { spot: "MID4", label: "MID 4", group: "Midfielders", position: "MID", squad: "SENIORS" }, reserve: null },
  // Ruck
  { group: "Ruck", senior: { spot: "RUC", label: "RUC", group: "Ruck", position: "RUC", squad: "SENIORS" }, reserve: { spot: "RRUC", label: "RUC", group: "Ruck", position: "RUC", squad: "RESERVES" } },
  // Forwards
  { group: "Forwards", senior: { spot: "FWD1", label: "FWD 1", group: "Forwards", position: "FWD", squad: "SENIORS" }, reserve: { spot: "RFWD1", label: "FWD 1", group: "Forwards", position: "FWD", squad: "RESERVES" } },
  { group: "Forwards", senior: { spot: "FWD2", label: "FWD 2", group: "Forwards", position: "FWD", squad: "SENIORS" }, reserve: { spot: "RFWD2", label: "FWD 2", group: "Forwards", position: "FWD", squad: "RESERVES" } },
  { group: "Forwards", senior: { spot: "FWD3", label: "FWD 3", group: "Forwards", position: "FWD", squad: "SENIORS" }, reserve: null },
];

const BENCH_SPOTS: SpotConfig[] = [
  { spot: "BENCH1", label: "Bench 1", group: "Bench", position: "BENCH", squad: "SENIORS" },
  { spot: "BENCH2", label: "Bench 2", group: "Bench", position: "BENCH", squad: "SENIORS" },
];

const IL_SPOTS: SpotConfig[] = [
  { spot: "IL1", label: "IL 1", group: "Injury List", position: "IL", squad: "SENIORS" },
  { spot: "IL2", label: "IL 2", group: "Injury List", position: "IL", squad: "SENIORS" },
];

type DashboardLineupProps = {
  clubId: string;
  clubName: string;
  reservesName: string;
  primaryColor: string | null;
  secondaryColor: string | null;
  rosterPlayers: SerializedRosterPlayer[];
  contracts: SerializedContract[];
  playerStats: PlayerStats[];
  captaincy: CaptaincyInfo;
};

export function DashboardLineup({
  clubId,
  clubName,
  reservesName,
  primaryColor,
  secondaryColor,
  rosterPlayers,
  contracts,
  playerStats,
  captaincy,
}: DashboardLineupProps) {
  const [selectedContract, setSelectedContract] = useState<SerializedContract | null>(null);
  const [sheetOpen, setSheetOpen] = useState(false);

  const rosterMap = useMemo(() => {
    const map = new Map<RosterSpot, SerializedRosterPlayer>();
    for (const rp of rosterPlayers) {
      map.set(rp.rosterSpot, rp);
    }
    return map;
  }, [rosterPlayers]);

  const statsMap = useMemo(() => {
    const map = new Map<string, PlayerStats>();
    for (const s of playerStats) {
      map.set(s.contractId, s);
    }
    return map;
  }, [playerStats]);

  const handlePlayerClick = (contract: SerializedContract) => {
    setSelectedContract(contract);
    setSheetOpen(true);
  };

  function renderSlot(spotConfig: SpotConfig | null, squad: "SENIORS" | "RESERVES") {
    if (!spotConfig) {
      // Gap — empty cell for alignment
      return <div className="py-1.5 px-2" />;
    }

    const assigned = rosterMap.get(spotConfig.spot);
    const captainId = squad === "SENIORS" ? captaincy.seniorCaptainId : captaincy.reservesCaptainId;
    const vcId = squad === "SENIORS" ? captaincy.seniorVcId : captaincy.reservesVcId;

    return (
      <DashboardLineupSlot
        spotConfig={spotConfig}
        clubId={clubId}
        assignedPlayer={assigned}
        availablePlayers={contracts}
        onPlayerClick={handlePlayerClick}
        playerStats={statsMap}
        captainRosterPlayerId={captainId}
        vcRosterPlayerId={vcId}
      />
    );
  }

  // Group aligned rows by position group for headers
  const groups: { name: string; rows: AlignedRow[] }[] = [];
  let currentGroup = "";
  for (const row of ALIGNED_ROWS) {
    if (row.group !== currentGroup) {
      currentGroup = row.group;
      groups.push({ name: row.group, rows: [] });
    }
    groups[groups.length - 1].rows.push(row);
  }

  const teamBadgeStyle = primaryColor
    ? { backgroundColor: primaryColor, color: secondaryColor ?? "#ffffff" }
    : undefined;

  return (
    <>
      {/* Main lineup — seniors & reserves side by side */}
      <Card>
        <CardHeader className="pb-2">
          <div className="grid grid-cols-2 gap-4">
            <CardTitle className="text-base">
              <span
                className="inline-flex items-center rounded-md px-2.5 py-0.5 text-sm font-semibold"
                style={teamBadgeStyle}
              >
                {clubName}
              </span>
            </CardTitle>
            <CardTitle className="text-base">
              <span
                className="inline-flex items-center rounded-md px-2.5 py-0.5 text-sm font-semibold"
                style={teamBadgeStyle}
              >
                {reservesName}
              </span>
            </CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          {/* Column headers */}
          <div className="grid grid-cols-2 gap-2 mb-2">
            <div className="flex items-center justify-between text-[10px] font-semibold text-muted-foreground uppercase tracking-wider px-2">
              <div className="flex items-center gap-2">
                <span className="w-12">Pos</span>
                <span>Player</span>
              </div>
              <div className="flex items-center shrink-0 divide-x divide-border">
                <span className="w-10 text-center px-1.5">Team</span>
                <span className="w-10 text-right px-1.5">Avg</span>
                <span className="w-10 text-right px-1.5">L5</span>
                <span className="w-[4.5rem] text-right px-1.5">Value</span>
                <span className="w-5 pl-1.5"></span>
              </div>
            </div>
            <div className="flex items-center justify-between text-[10px] font-semibold text-muted-foreground uppercase tracking-wider px-2">
              <div className="flex items-center gap-2">
                <span className="w-12">Pos</span>
                <span>Player</span>
              </div>
              <div className="flex items-center shrink-0 divide-x divide-border">
                <span className="w-10 text-center px-1.5">Team</span>
                <span className="w-10 text-right px-1.5">Avg</span>
                <span className="w-10 text-right px-1.5">L5</span>
                <span className="w-[4.5rem] text-right px-1.5">Value</span>
                <span className="w-5 pl-1.5"></span>
              </div>
            </div>
          </div>

          {groups.map((group) => (
            <div key={group.name} className="mb-3">
              <div className="grid grid-cols-2 gap-2 mb-1">
                <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                  {group.name}
                </div>
                <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                  {group.name}
                </div>
              </div>
              <div className="space-y-0.5">
                {group.rows.map((row, i) => (
                  <div key={i} className="grid grid-cols-2 gap-2">
                    {renderSlot(row.senior, "SENIORS")}
                    {renderSlot(row.reserve, "RESERVES")}
                  </div>
                ))}
              </div>
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Bench & IL */}
      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Bench</CardTitle>
          </CardHeader>
          <CardContent className="space-y-0.5">
            {BENCH_SPOTS.map((spotConfig) => (
              <DashboardLineupSlot
                key={spotConfig.spot}
                spotConfig={spotConfig}
                clubId={clubId}
                assignedPlayer={rosterMap.get(spotConfig.spot)}
                availablePlayers={contracts}
                onPlayerClick={handlePlayerClick}
                playerStats={statsMap}
                captainRosterPlayerId={captaincy.seniorCaptainId}
                vcRosterPlayerId={captaincy.seniorVcId}
              />
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Injury List</CardTitle>
          </CardHeader>
          <CardContent className="space-y-0.5">
            {IL_SPOTS.map((spotConfig) => (
              <DashboardLineupSlot
                key={spotConfig.spot}
                spotConfig={spotConfig}
                clubId={clubId}
                assignedPlayer={rosterMap.get(spotConfig.spot)}
                availablePlayers={contracts}
                onPlayerClick={handlePlayerClick}
                playerStats={statsMap}
                captainRosterPlayerId={captaincy.seniorCaptainId}
                vcRosterPlayerId={captaincy.seniorVcId}
              />
            ))}
          </CardContent>
        </Card>
      </div>

      <PlayerDetailPanel
        contract={selectedContract}
        open={sheetOpen}
        onOpenChange={setSheetOpen}
        playerStats={statsMap}
      />
    </>
  );
}
