"use client";

import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { RosterSlot } from "./roster-slot";
import { RosterTable, RosterPlayer } from "./roster-table";
import { RosterSpot, Position } from "@prisma/client";
import { List, LayoutGrid, AlertTriangle, GripVertical } from "lucide-react";
import { PlayerDetailPanel } from "../player-detail-panel";
import { DraggableLineup } from "../lineup/draggable-lineup";
import type { SerializedContract, SerializedRosterPlayer, PlayerStats, CaptaincyInfo } from "../types";

// Rule 9 eligibility threshold (players with fewer than this many senior games are eligible)
const RULE9_GAMES_THRESHOLD = 5;

type ContractedPlayer = {
  id: string;
  aflPlayer: {
    id: string;
    firstName: string;
    lastName: string;
    positions: Position[];
    aflTeam: {
      abbreviation: string;
    } | null;
  };
  rosterPlayers: { id: string; rosterSpot: RosterSpot }[];
};

type RosterPlayerData = {
  id: string;
  rosterSpot: RosterSpot;
  squad: string;
  isCaptain?: boolean;
  isViceCaptain?: boolean;
  contract: {
    id: string;
    aflPlayer: {
      firstName: string;
      lastName: string;
      positions: Position[];
      aflTeam: {
        abbreviation: string;
      } | null;
    };
  };
};

type ClubData = {
  id: string;
  name: string;
  reservesName: string;
  primaryColor: string | null;
  secondaryColor: string | null;
  contracts: ContractedPlayer[];
  rosterPlayers: RosterPlayerData[];
};

type RosterViewProps = {
  club: ClubData;
  rosterStats: RosterPlayer[];
  serializedContracts: SerializedContract[];
};

export function RosterView({ club, rosterStats, serializedContracts }: RosterViewProps) {
  const [selectedPlayer, setSelectedPlayer] = useState<RosterPlayer | null>(null);
  const [panelOpen, setPanelOpen] = useState(false);
  const [rule9DialogOpen, setRule9DialogOpen] = useState(false);
  const [selectedRule9Player, setSelectedRule9Player] = useState<RosterPlayer | null>(null);

  // Build a map of roster spot -> roster player
  const rosterMap = new Map(
    club.rosterPlayers.map((rp) => [rp.rosterSpot, rp])
  );

  // Build player stats map for the detail panel
  const playerStatsMap = new Map<string, PlayerStats>();
  for (const player of rosterStats) {
    playerStatsMap.set(player.contractId, {
      avgScore: player.avgScore,
      last5Avg: player.last5Avg,
      gamesPlayed: player.gamesPlayed,
    });
  }

  // Count assigned players (excluding bench and IL from seniors count)
  const seniorPlayingSpots = ["DEF1", "DEF2", "DEF3", "MID1", "MID2", "MID3", "MID4", "RUC", "FWD1", "FWD2", "FWD3"];
  const seniorsCount = club.rosterPlayers.filter(
    (rp) => rp.squad === "SENIORS" && seniorPlayingSpots.includes(rp.rosterSpot)
  ).length;
  const reservesCount = club.rosterPlayers.filter(
    (rp) => rp.squad === "RESERVES"
  ).length;

  // Find Rule 9 eligible players (fewer than threshold senior games)
  const rule9Players = rosterStats.filter(p => p.seniorsGames < RULE9_GAMES_THRESHOLD);

  const handlePlayerClick = (player: RosterPlayer) => {
    // Find the serialized contract for the detail panel
    const contract = serializedContracts.find(c => c.id === player.contractId);
    if (contract) {
      setSelectedPlayer(player);
      setPanelOpen(true);
    }
  };

  // Handler for when a player name is clicked in the slot view
  const handleSlotPlayerClick = (contractId: string) => {
    const player = rosterStats.find(p => p.contractId === contractId);
    if (player) {
      handlePlayerClick(player);
    }
  };

  // Compute captaincy info for DraggableLineup
  const captaincy: CaptaincyInfo = {
    seniorCaptainId: club.rosterPlayers.find(rp => rp.isCaptain && rp.squad === "SENIORS")?.id ?? null,
    seniorVcId: club.rosterPlayers.find(rp => rp.isViceCaptain && rp.squad === "SENIORS")?.id ?? null,
    reservesCaptainId: club.rosterPlayers.find(rp => rp.isCaptain && rp.squad === "RESERVES")?.id ?? null,
    reservesVcId: club.rosterPlayers.find(rp => rp.isViceCaptain && rp.squad === "RESERVES")?.id ?? null,
  };

  // Transform roster players for DraggableLineup
  const draggableRosterPlayers: SerializedRosterPlayer[] = club.rosterPlayers.map(rp => ({
    id: rp.id,
    squad: rp.squad as "SENIORS" | "RESERVES",
    rosterSpot: rp.rosterSpot,
    contractId: rp.contract.id,
    contract: serializedContracts.find(c => c.id === rp.contract.id) ?? {
      id: rp.contract.id,
      startSeason: 0,
      endSeason: 0,
      totalValue: 0,
      yearBreakdown: [],
      isMinimum: false,
      contractType: "DRAFT" as const,
      status: "ACTIVE" as const,
      tradeBlock: false,
      aflPlayer: {
        id: "",
        firstName: rp.contract.aflPlayer.firstName,
        lastName: rp.contract.aflPlayer.lastName,
        positions: rp.contract.aflPlayer.positions,
        photoUrl: null,
        isAvailable: true,
        aflTeam: rp.contract.aflPlayer.aflTeam ? {
          id: "",
          name: rp.contract.aflPlayer.aflTeam.abbreviation,
          abbreviation: rp.contract.aflPlayer.aflTeam.abbreviation,
        } : null,
      },
      rosterPlayers: [],
    },
  }));

  // Transform player stats for DraggableLineup
  const draggablePlayerStats = rosterStats.map(p => ({
    contractId: p.contractId,
    avgScore: p.avgScore,
    last5Avg: p.last5Avg,
    gamesPlayed: p.gamesPlayed,
  }));

  const handleRule9Click = (player: RosterPlayer) => {
    setSelectedRule9Player(player);
    setRule9DialogOpen(true);
  };

  // Get serialized contract for detail panel
  const selectedContract = selectedPlayer
    ? serializedContracts.find(c => c.id === selectedPlayer.contractId) ?? null
    : null;

  return (
    <>
      <Tabs defaultValue="table" className="space-y-4">
        <TabsList>
          <TabsTrigger value="table" className="gap-2">
            <List className="h-4 w-4" />
            All Players
          </TabsTrigger>
          <TabsTrigger value="lineup" className="gap-2">
            <GripVertical className="h-4 w-4" />
            Lineup
          </TabsTrigger>
          <TabsTrigger value="seniors" className="gap-2">
            <LayoutGrid className="h-4 w-4" />
            Seniors ({seniorsCount}/11)
          </TabsTrigger>
          <TabsTrigger value="reserves">Reserves ({reservesCount}/8)</TabsTrigger>
          <TabsTrigger value="bench">Bench & IL</TabsTrigger>
        </TabsList>

        {/* Table View - All Players */}
        <TabsContent value="table">
          <Card>
            <CardHeader>
              <CardTitle>All Contracted Players</CardTitle>
              <CardDescription>
                Sort and filter your roster by any attribute. Click a name to view details, click Squad to reassign.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <RosterTable
                players={rosterStats.map(p => ({
                  ...p,
                  // Add Rule 9 indicator
                  isRule9Eligible: p.seniorsGames < RULE9_GAMES_THRESHOLD,
                }))}
                clubId={club.id}
                onPlayerClick={handlePlayerClick}
              />
            </CardContent>
          </Card>

          {/* Rule 9 Warning Section */}
          {rule9Players.length > 0 && (
            <Card className="mt-4 border-amber-500/50">
              <CardHeader className="pb-2">
                <CardTitle className="text-lg flex items-center gap-2">
                  <AlertTriangle className="h-5 w-5 text-amber-500" />
                  Rule 9 Eligible Players ({rule9Players.length})
                </CardTitle>
                <CardDescription>
                  These players have fewer than {RULE9_GAMES_THRESHOLD} senior games and can be claimed by other clubs.
                  Click a player to see how to protect them.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-2">
                  {rule9Players.map(p => (
                    <button
                      key={p.contractId}
                      onClick={() => handleRule9Click(p)}
                      className="flex items-center gap-2 px-3 py-1.5 rounded-md border bg-amber-500/10 hover:bg-amber-500/20 transition-colors text-sm"
                    >
                      <span className="font-medium">{p.firstName.charAt(0)}. {p.lastName}</span>
                      <Badge variant="outline" className="text-[10px]">
                        {p.seniorsGames} games
                      </Badge>
                    </button>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* Drag-and-Drop Lineup View */}
        <TabsContent value="lineup" className="space-y-4">
          <DraggableLineup
            clubId={club.id}
            clubName={club.name}
            reservesName={club.reservesName}
            primaryColor={club.primaryColor}
            secondaryColor={club.secondaryColor}
            rosterPlayers={draggableRosterPlayers}
            contracts={serializedContracts}
            playerStats={draggablePlayerStats}
            captaincy={captaincy}
          />
        </TabsContent>

        {/* Seniors Slots */}
        <TabsContent value="seniors" className="space-y-4">
          <div className="grid gap-4">
            {/* Defenders */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-lg flex items-center gap-2">
                  Defenders
                  <Badge>3 spots</Badge>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid gap-2">
                  {(["DEF1", "DEF2", "DEF3"] as RosterSpot[]).map((spot) => (
                    <RosterSlot
                      key={spot}
                      position="DEF"
                      rosterSpot={spot}
                      squad="SENIORS"
                      clubId={club.id}
                      assignedPlayer={rosterMap.get(spot)}
                      availablePlayers={club.contracts}
                      playerStats={playerStatsMap}
                      onPlayerClick={handleSlotPlayerClick}
                    />
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Midfielders */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-lg flex items-center gap-2">
                  Midfielders
                  <Badge>4 spots</Badge>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid gap-2">
                  {(["MID1", "MID2", "MID3", "MID4"] as RosterSpot[]).map((spot) => (
                    <RosterSlot
                      key={spot}
                      position="MID"
                      rosterSpot={spot}
                      squad="SENIORS"
                      clubId={club.id}
                      assignedPlayer={rosterMap.get(spot)}
                      availablePlayers={club.contracts}
                      playerStats={playerStatsMap}
                      onPlayerClick={handleSlotPlayerClick}
                    />
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Ruck */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-lg flex items-center gap-2">
                  Ruck
                  <Badge>1 spot</Badge>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <RosterSlot
                  position="RUC"
                  rosterSpot="RUC"
                  squad="SENIORS"
                  clubId={club.id}
                  assignedPlayer={rosterMap.get("RUC")}
                  availablePlayers={club.contracts}
                  playerStats={playerStatsMap}
                  onPlayerClick={handleSlotPlayerClick}
                />
              </CardContent>
            </Card>

            {/* Forwards */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-lg flex items-center gap-2">
                  Forwards
                  <Badge>3 spots</Badge>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid gap-2">
                  {(["FWD1", "FWD2", "FWD3"] as RosterSpot[]).map((spot) => (
                    <RosterSlot
                      key={spot}
                      position="FWD"
                      rosterSpot={spot}
                      squad="SENIORS"
                      clubId={club.id}
                      assignedPlayer={rosterMap.get(spot)}
                      availablePlayers={club.contracts}
                      playerStats={playerStatsMap}
                      onPlayerClick={handleSlotPlayerClick}
                    />
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Reserves Slots */}
        <TabsContent value="reserves" className="space-y-4">
          <div className="grid gap-4">
            {/* Defenders */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-lg flex items-center gap-2">
                  Defenders
                  <Badge>2 spots</Badge>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid gap-2">
                  {(["RDEF1", "RDEF2"] as RosterSpot[]).map((spot) => (
                    <RosterSlot
                      key={spot}
                      position="DEF"
                      rosterSpot={spot}
                      squad="RESERVES"
                      clubId={club.id}
                      assignedPlayer={rosterMap.get(spot)}
                      availablePlayers={club.contracts}
                      playerStats={playerStatsMap}
                      onPlayerClick={handleSlotPlayerClick}
                    />
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Midfielders */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-lg flex items-center gap-2">
                  Midfielders
                  <Badge>3 spots</Badge>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid gap-2">
                  {(["RMID1", "RMID2", "RMID3"] as RosterSpot[]).map((spot) => (
                    <RosterSlot
                      key={spot}
                      position="MID"
                      rosterSpot={spot}
                      squad="RESERVES"
                      clubId={club.id}
                      assignedPlayer={rosterMap.get(spot)}
                      availablePlayers={club.contracts}
                      playerStats={playerStatsMap}
                      onPlayerClick={handleSlotPlayerClick}
                    />
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Ruck */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-lg flex items-center gap-2">
                  Ruck
                  <Badge>1 spot</Badge>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <RosterSlot
                  position="RUC"
                  rosterSpot="RRUC"
                  squad="RESERVES"
                  clubId={club.id}
                  assignedPlayer={rosterMap.get("RRUC")}
                  availablePlayers={club.contracts}
                  playerStats={playerStatsMap}
                  onPlayerClick={handleSlotPlayerClick}
                />
              </CardContent>
            </Card>

            {/* Forwards */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-lg flex items-center gap-2">
                  Forwards
                  <Badge>2 spots</Badge>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid gap-2">
                  {(["RFWD1", "RFWD2"] as RosterSpot[]).map((spot) => (
                    <RosterSlot
                      key={spot}
                      position="FWD"
                      rosterSpot={spot}
                      squad="RESERVES"
                      clubId={club.id}
                      assignedPlayer={rosterMap.get(spot)}
                      availablePlayers={club.contracts}
                      playerStats={playerStatsMap}
                      onPlayerClick={handleSlotPlayerClick}
                    />
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Bench & IL */}
        <TabsContent value="bench" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-lg flex items-center gap-2">
                  Bench
                  <Badge>2 spots</Badge>
                </CardTitle>
                <CardDescription>
                  Bench players can be any position
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid gap-2">
                  {(["BENCH1", "BENCH2"] as RosterSpot[]).map((spot) => (
                    <RosterSlot
                      key={spot}
                      position="BENCH"
                      rosterSpot={spot}
                      squad="SENIORS"
                      clubId={club.id}
                      assignedPlayer={rosterMap.get(spot)}
                      availablePlayers={club.contracts}
                      playerStats={playerStatsMap}
                      onPlayerClick={handleSlotPlayerClick}
                    />
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-lg flex items-center gap-2">
                  Injury List
                  <Badge>2 spots</Badge>
                </CardTitle>
                <CardDescription>
                  Players must be unavailable per AFL website
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid gap-2">
                  {(["IL1", "IL2"] as RosterSpot[]).map((spot) => (
                    <RosterSlot
                      key={spot}
                      position="IL"
                      rosterSpot={spot}
                      squad="SENIORS"
                      clubId={club.id}
                      assignedPlayer={rosterMap.get(spot)}
                      availablePlayers={club.contracts}
                      playerStats={playerStatsMap}
                      onPlayerClick={handleSlotPlayerClick}
                    />
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>

      {/* Player Detail Panel */}
      <PlayerDetailPanel
        contract={selectedContract}
        open={panelOpen}
        onOpenChange={setPanelOpen}
        playerStats={playerStatsMap}
        myClubId={club.id}
        playerClubId={club.id}
      />

      {/* Rule 9 Explanation Dialog */}
      <Dialog open={rule9DialogOpen} onOpenChange={setRule9DialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-amber-500" />
              Rule 9 Eligibility
            </DialogTitle>
            <DialogDescription>
              {selectedRule9Player && `${selectedRule9Player.firstName} ${selectedRule9Player.lastName}`} is Rule 9 eligible
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="p-3 rounded-md bg-muted">
              <p className="text-sm">
                <strong>What is Rule 9?</strong>
              </p>
              <p className="text-sm text-muted-foreground mt-1">
                Players who have played fewer than {RULE9_GAMES_THRESHOLD} senior games are eligible
                to be claimed by other clubs during the Rule 9 draft period.
              </p>
            </div>

            {selectedRule9Player && (
              <div className="p-3 rounded-md border">
                <p className="text-sm font-medium">Current Status</p>
                <p className="text-sm text-muted-foreground mt-1">
                  {selectedRule9Player.firstName} has played {selectedRule9Player.seniorsGames} senior games.
                  They need {RULE9_GAMES_THRESHOLD - selectedRule9Player.seniorsGames} more senior game(s) to be protected.
                </p>
              </div>
            )}

            <div className="p-3 rounded-md bg-green-500/10 border border-green-500/30">
              <p className="text-sm font-medium text-green-700 dark:text-green-400">
                How to Protect This Player
              </p>
              <ul className="text-sm text-muted-foreground mt-1 list-disc list-inside space-y-1">
                <li>Play them in {RULE9_GAMES_THRESHOLD - (selectedRule9Player?.seniorsGames ?? 0)} more senior matches</li>
                <li>Ensure they are in your senior lineup before round lock</li>
                <li>Once they reach {RULE9_GAMES_THRESHOLD} senior games, they are protected from Rule 9 claims</li>
              </ul>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
