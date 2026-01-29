"use client";

import { useState, useMemo, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { RosterSpot } from "@prisma/client";
import { LineupDndProvider } from "./dnd-context";
import { DraggablePlayer } from "./draggable-player";
import { DroppableSlot } from "./droppable-slot";
import { PlayerDetailPanel } from "../player-detail-panel";
import { assignPlayerToRoster, removePlayerFromRoster } from "../roster/actions";
import { Shield, Users, Target, CircleDot, Armchair, Cross } from "lucide-react";
import type {
  SerializedContract,
  SerializedRosterPlayer,
  SpotConfig,
  PlayerStats,
  CaptaincyInfo,
} from "../types";

// Group icons and colors
const GROUP_CONFIG: Record<string, { icon: typeof Shield; position: string }> = {
  Defenders: { icon: Shield, position: "DEF" },
  Midfielders: { icon: Users, position: "MID" },
  Ruck: { icon: CircleDot, position: "RUC" },
  Forwards: { icon: Target, position: "FWD" },
  Bench: { icon: Armchair, position: "BENCH" },
  "Injury List": { icon: Cross, position: "IL" },
};

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

type Props = {
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

export function DraggableLineup({
  clubId,
  clubName,
  reservesName,
  primaryColor,
  secondaryColor,
  rosterPlayers: initialRosterPlayers,
  contracts,
  playerStats,
  captaincy,
}: Props) {
  const [selectedContract, setSelectedContract] = useState<SerializedContract | null>(null);
  const [sheetOpen, setSheetOpen] = useState(false);
  // Local optimistic state for instant updates
  const [localRoster, setLocalRoster] = useState<SerializedRosterPlayer[]>(initialRosterPlayers);

  const rosterMap = useMemo(() => {
    const map = new Map<RosterSpot, SerializedRosterPlayer>();
    for (const rp of localRoster) {
      map.set(rp.rosterSpot, rp);
    }
    return map;
  }, [localRoster]);

  const statsMap = useMemo(() => {
    const map = new Map<string, PlayerStats>();
    for (const s of playerStats) {
      map.set(s.contractId, s);
    }
    return map;
  }, [playerStats]);

  // Find unassigned players (have contract but not on roster)
  const assignedContractIds = useMemo(() => {
    return new Set(localRoster.map(rp => rp.contractId));
  }, [localRoster]);

  const unassignedContracts = useMemo(() => {
    return contracts.filter(c => !assignedContractIds.has(c.id));
  }, [contracts, assignedContractIds]);

  const handleDragEnd = useCallback(async (
    contractId: string,
    sourceSpot: RosterSpot | "pool",
    targetSpot: RosterSpot | "pool"
  ) => {
    if (sourceSpot === targetSpot) return;

    const isReservesSpot = (spot: string) => spot.startsWith("R") && spot !== "RUC";

    // OPTIMISTIC UPDATE - update local state immediately
    setLocalRoster(prev => {
      const newRoster = [...prev];
      const movingPlayer = newRoster.find(rp => rp.contractId === contractId);
      const playerInTargetSpot = targetSpot !== "pool"
        ? newRoster.find(rp => rp.rosterSpot === targetSpot)
        : null;

      if (targetSpot === "pool") {
        // Remove from roster
        return newRoster.filter(rp => rp.contractId !== contractId);
      }

      if (movingPlayer && playerInTargetSpot) {
        // Swap positions
        const tempSpot = movingPlayer.rosterSpot;
        const tempSquad = movingPlayer.squad;
        movingPlayer.rosterSpot = targetSpot as RosterSpot;
        movingPlayer.squad = isReservesSpot(targetSpot) ? "RESERVES" : "SENIORS";
        playerInTargetSpot.rosterSpot = tempSpot;
        playerInTargetSpot.squad = tempSquad;
      } else if (movingPlayer) {
        // Just move the player
        movingPlayer.rosterSpot = targetSpot as RosterSpot;
        movingPlayer.squad = isReservesSpot(targetSpot) ? "RESERVES" : "SENIORS";
      } else {
        // New player from pool
        const contract = contracts.find(c => c.id === contractId);
        if (contract) {
          newRoster.push({
            id: `temp-${Date.now()}`,
            contractId,
            rosterSpot: targetSpot as RosterSpot,
            squad: isReservesSpot(targetSpot) ? "RESERVES" : "SENIORS",
            contract,
          });
        }
      }

      return newRoster;
    });

    // BACKGROUND SERVER UPDATE - don't await, fire and forget
    if (targetSpot === "pool") {
      const rosterPlayer = localRoster.find(rp => rp.contractId === contractId);
      if (rosterPlayer) {
        removePlayerFromRoster(rosterPlayer.id).catch(console.error);
      }
    } else {
      const squad = isReservesSpot(targetSpot) ? "RESERVES" : "SENIORS";
      assignPlayerToRoster(contractId, clubId, squad, targetSpot as RosterSpot).catch(console.error);
    }
  }, [clubId, contracts, localRoster]);

  const handlePlayerClick = (contract: SerializedContract) => {
    setSelectedContract(contract);
    setSheetOpen(true);
  };

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

  const renderSlot = (spotConfig: SpotConfig | null, squad: "SENIORS" | "RESERVES") => {
    if (!spotConfig) {
      return <div className="py-1" />;
    }

    const assigned = rosterMap.get(spotConfig.spot);
    const captainId = squad === "SENIORS" ? captaincy.seniorCaptainId : captaincy.reservesCaptainId;
    const vcId = squad === "SENIORS" ? captaincy.seniorVcId : captaincy.reservesVcId;

    return (
      <DroppableSlot
        spot={spotConfig.spot}
        label={spotConfig.label}
        isEmpty={!assigned}
      >
        {assigned && (
          <div onClick={() => handlePlayerClick(assigned.contract)}>
            <DraggablePlayer
              contract={assigned.contract}
              sourceSpot={spotConfig.spot}
              sourceSquad={squad}
              stats={statsMap.get(assigned.contractId)}
              isCaptain={assigned.id === captainId}
              isVc={assigned.id === vcId}
              compact
            />
          </div>
        )}
      </DroppableSlot>
    );
  };

  // Column header component to reduce repetition
  const ColumnHeader = () => (
    <div className="flex items-center gap-2 px-3 py-2 text-[10px] font-bold text-muted-foreground uppercase tracking-wider bg-muted/30">
      <span className="w-6 text-center"></span>
      <span className="flex-1">Player</span>
      <span className="w-10 text-center hidden md:inline">Team</span>
      <span className="w-14 text-center">Pos</span>
      <span className="w-10 text-right font-black">AVG</span>
      <span className="w-10 text-right hidden md:inline">L5</span>
      <span className="w-14 text-right hidden lg:inline">Salary</span>
    </div>
  );

  return (
    <LineupDndProvider onDragEnd={handleDragEnd}>
      {/* Main lineup */}
      <Card className="overflow-hidden border-0 shadow-lg">
        {/* Header with team badges */}
        <CardHeader className="pb-0 pt-4 px-0">
          <div className="grid grid-cols-2">
            <div
              className="px-4 py-3 border-b-4"
              style={{
                borderColor: primaryColor || 'hsl(var(--primary))',
                background: `linear-gradient(135deg, ${primaryColor}15 0%, transparent 100%)`
              }}
            >
              <CardTitle className="text-lg font-black tracking-tight uppercase">
                {clubName}
              </CardTitle>
              <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold">Seniors</p>
            </div>
            <div
              className="px-4 py-3 border-b-4 border-l"
              style={{
                borderBottomColor: primaryColor || 'hsl(var(--primary))',
                background: `linear-gradient(135deg, ${primaryColor}10 0%, transparent 100%)`
              }}
            >
              <CardTitle className="text-lg font-black tracking-tight uppercase">
                {reservesName}
              </CardTitle>
              <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold">Reserves</p>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {/* Column Headers */}
          <div className="grid grid-cols-2 border-b">
            <ColumnHeader />
            <div className="border-l">
              <ColumnHeader />
            </div>
          </div>

          {groups.map((group) => {
            const config = GROUP_CONFIG[group.name];
            const Icon = config?.icon;

            return (
              <div key={group.name} className="border-b last:border-b-0">
                {/* Position group header */}
                <div className="grid grid-cols-2 bg-muted/40">
                  <div className="flex items-center gap-2 px-3 py-1.5">
                    {Icon && <Icon className="h-3.5 w-3.5 text-muted-foreground" />}
                    <span className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
                      {group.name}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 px-3 py-1.5 border-l">
                    {Icon && <Icon className="h-3.5 w-3.5 text-muted-foreground" />}
                    <span className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
                      {group.name}
                    </span>
                  </div>
                </div>
                {/* Position slots */}
                <div>
                  {group.rows.map((row, i) => (
                    <div key={i} className="grid grid-cols-2 border-t border-muted/50">
                      <div>
                        {renderSlot(row.senior, "SENIORS")}
                      </div>
                      <div className="border-l">
                        {renderSlot(row.reserve, "RESERVES")}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </CardContent>
      </Card>

      {/* Bench & IL */}
      <div className="grid gap-4 md:grid-cols-2">
        <Card className="overflow-hidden border-0 shadow-lg">
          <CardHeader className="pb-0 pt-0 px-0">
            <div className="flex items-center gap-2 px-4 py-2 bg-muted/40 border-b">
              <Armchair className="h-4 w-4 text-muted-foreground" />
              <CardTitle className="text-sm font-bold tracking-tight uppercase text-muted-foreground">Bench</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            <div>
              {BENCH_SPOTS.map((spotConfig, i) => (
                <div key={spotConfig.spot} className={i > 0 ? 'border-t border-muted/50' : ''}>
                  <DroppableSlot
                    spot={spotConfig.spot}
                    label={spotConfig.label}
                    isEmpty={!rosterMap.get(spotConfig.spot)}
                  >
                    {rosterMap.get(spotConfig.spot) && (
                      <div onClick={() => handlePlayerClick(rosterMap.get(spotConfig.spot)!.contract)}>
                        <DraggablePlayer
                          contract={rosterMap.get(spotConfig.spot)!.contract}
                          sourceSpot={spotConfig.spot}
                          sourceSquad="SENIORS"
                          stats={statsMap.get(rosterMap.get(spotConfig.spot)!.contractId)}
                          compact
                        />
                      </div>
                    )}
                  </DroppableSlot>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card className="overflow-hidden border-0 shadow-lg">
          <CardHeader className="pb-0 pt-0 px-0">
            <div className="flex items-center gap-2 px-4 py-2 bg-muted/40 border-b">
              <Cross className="h-4 w-4 text-muted-foreground" />
              <CardTitle className="text-sm font-bold tracking-tight uppercase text-muted-foreground">Injury List</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            <div>
              {IL_SPOTS.map((spotConfig, i) => (
                <div key={spotConfig.spot} className={i > 0 ? 'border-t border-muted/50' : ''}>
                  <DroppableSlot
                    spot={spotConfig.spot}
                    label={spotConfig.label}
                    isEmpty={!rosterMap.get(spotConfig.spot)}
                  >
                    {rosterMap.get(spotConfig.spot) && (
                      <div onClick={() => handlePlayerClick(rosterMap.get(spotConfig.spot)!.contract)}>
                        <DraggablePlayer
                          contract={rosterMap.get(spotConfig.spot)!.contract}
                          sourceSpot={spotConfig.spot}
                          sourceSquad="SENIORS"
                          stats={statsMap.get(rosterMap.get(spotConfig.spot)!.contractId)}
                          compact
                        />
                      </div>
                    )}
                  </DroppableSlot>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Unassigned Player Pool */}
      {unassignedContracts.length > 0 && (
        <Card className="overflow-hidden border-0 shadow-lg">
          <CardHeader className="pb-0 pt-0 px-0">
            <div className="flex items-center justify-between px-4 py-2 bg-muted/40 border-b">
              <div className="flex items-center gap-2">
                <Users className="h-4 w-4 text-muted-foreground" />
                <CardTitle className="text-sm font-bold tracking-tight uppercase text-muted-foreground">Unassigned Players</CardTitle>
              </div>
              <Badge variant="secondary" className="font-bold">
                {unassignedContracts.length}
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            <div>
              {unassignedContracts.map((contract, i) => (
                <div
                  key={contract.id}
                  className={i > 0 ? 'border-t border-muted/50' : ''}
                  onClick={() => handlePlayerClick(contract)}
                >
                  <DraggablePlayer
                    contract={contract}
                    sourceSpot="pool"
                    sourceSquad={null}
                    stats={statsMap.get(contract.id)}
                    compact
                  />
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      <PlayerDetailPanel
        contract={selectedContract}
        open={sheetOpen}
        onOpenChange={setSheetOpen}
        playerStats={statsMap}
      />
    </LineupDndProvider>
  );
}
