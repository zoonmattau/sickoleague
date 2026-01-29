"use client";

import { useState } from "react";
import { SalaryDetailDialog } from "./dialogs/salary-detail-dialog";
import { RosterDetailDialog } from "./dialogs/roster-detail-dialog";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Trophy, Users } from "lucide-react";
import type { SerializedContract, SerializedRosterPlayer } from "./types";

type RecordSummary = {
  seniors: { wins: number; losses: number; draws: number; played: number; percentage: number; pointsFor: number; pointsAgainst: number; ladderPosition: number };
  reserves: { wins: number; losses: number; draws: number; played: number; percentage: number; pointsFor: number; pointsAgainst: number; ladderPosition: number };
  totalTeams: number;
} | null;

type FormSummary = {
  seniors: { streak: number; streakType: "W" | "L" | "D" | null; last5: ("W" | "L" | "D")[] };
  reserves: { streak: number; streakType: "W" | "L" | "D" | null; last5: ("W" | "L" | "D")[] };
} | null;

type UpcomingMatch = {
  roundNumber: number;
  matchType: string;
  isHome: boolean;
  opponent: { abbreviation: string; primaryColor: string | null; secondaryColor: string | null };
} | null;

type CaptainInfo = { name: string; contractId: string } | null;

type CaptainDisplay = {
  seniorCaptain: CaptainInfo;
  seniorVc: CaptainInfo;
  reservesCaptain: CaptainInfo;
  reservesVc: CaptainInfo;
};

type DashboardOverviewProps = {
  clubId: string;
  clubName: string;
  reservesName: string;
  contracts: SerializedContract[];
  rosterPlayers: SerializedRosterPlayer[];
  salaryUsed: number;
  salaryCap: number;
  seniorsCount: number;
  reservesCount: number;
  record: RecordSummary;
  form: FormSummary;
  upcomingMatch: UpcomingMatch;
  captains: CaptainDisplay;
};

export function DashboardOverview({
  clubId,
  clubName,
  reservesName,
  contracts,
  rosterPlayers,
  salaryUsed,
  salaryCap,
  seniorsCount,
  reservesCount,
  record,
  form,
  upcomingMatch,
  captains,
}: DashboardOverviewProps) {
  const [salaryDialogOpen, setSalaryDialogOpen] = useState(false);
  const [rosterDialogOpen, setRosterDialogOpen] = useState(false);

  const salaryRemaining = salaryCap - salaryUsed;
  const totalContracts = contracts.length;
  const salaryPercent = Math.min(100, (salaryUsed / salaryCap) * 100);

  // Define lineup spots
  const SENIORS_SPOTS = ["DEF1", "DEF2", "DEF3", "MID1", "MID2", "MID3", "MID4", "RUC", "FWD1", "FWD2", "FWD3"];
  const RESERVES_SPOTS = ["RDEF1", "RDEF2", "RMID1", "RMID2", "RMID3", "RRUC", "RFWD1", "RFWD2"];

  // Build a set of filled spots (as strings for comparison)
  const filledSpots = new Set(rosterPlayers.map(rp => String(rp.rosterSpot)));

  // Find empty spots
  const emptySeniorsSpots = SENIORS_SPOTS.filter(s => !filledSpots.has(s));
  const emptyReservesSpots = RESERVES_SPOTS.filter(s => !filledSpots.has(s));

  // Format spot name for display (DEF1 -> DEF 1, RDEF1 -> DEF 1)
  const formatSpot = (spot: string) => {
    const clean = spot.replace(/^R/, ""); // Remove R prefix for reserves
    const match = clean.match(/^([A-Z]+)(\d+)$/);
    if (match) return `${match[1]}${match[2]}`;
    return clean;
  };

  // Calculate roster needs
  const minRoster = 19;
  const maxRoster = 21;
  const spotsNeeded = Math.max(0, minRoster - totalContracts);
  const spotsAvailable = maxRoster - totalContracts;

  const getFormColor = (result: "W" | "L" | "D") => {
    if (result === "W") return "bg-green-500";
    if (result === "L") return "bg-red-500";
    return "bg-yellow-500";
  };

  const getLadderBadgeColor = (pos: number, total: number) => {
    if (pos === 0) return "bg-muted text-muted-foreground";
    if (pos <= 4) return "bg-green-500/20 text-green-600 dark:text-green-400";
    if (pos <= total / 2) return "bg-blue-500/20 text-blue-600 dark:text-blue-400";
    return "bg-orange-500/20 text-orange-600 dark:text-orange-400";
  };

  return (
    <>
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
        {/* Salary Cap Card */}
        <Card className="cursor-pointer hover:bg-muted/50 transition-colors" onClick={() => setSalaryDialogOpen(true)}>
          <CardContent className="pt-4 pb-3">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-muted-foreground">Salary Cap</span>
              <Badge variant="outline" className="text-xs">$750k</Badge>
            </div>
            <div className="text-2xl font-bold mb-2">
              ${(salaryUsed * 1000).toLocaleString()}
            </div>
            <Progress
              value={salaryPercent}
              className={`h-2 mb-2 ${salaryPercent > 95 ? '[&>div]:bg-red-500' : salaryPercent > 85 ? '[&>div]:bg-yellow-500' : ''}`}
            />
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>${(salaryRemaining * 1000).toLocaleString()} left</span>
              <span>{salaryPercent.toFixed(0)}% used</span>
            </div>
          </CardContent>
        </Card>

        {/* Roster Size Card */}
        <Card className="cursor-pointer hover:bg-muted/50 transition-colors" onClick={() => setRosterDialogOpen(true)}>
          <CardContent className="pt-4 pb-3">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-muted-foreground">Lineup</span>
              <Badge variant="outline" className="text-xs">{totalContracts} players</Badge>
            </div>
            {/* Seniors lineup */}
            <div className="space-y-1.5 mb-3">
              <div className="flex items-center gap-2">
                <Trophy className="h-3 w-3 text-amber-500" />
                <span className="text-xs font-medium">Seniors</span>
                <span className="text-xs text-muted-foreground ml-auto">
                  {SENIORS_SPOTS.length - emptySeniorsSpots.length}/{SENIORS_SPOTS.length}
                </span>
              </div>
              {emptySeniorsSpots.length > 0 ? (
                <div className="flex flex-wrap gap-1">
                  {emptySeniorsSpots.map(spot => (
                    <span key={spot} className="text-[10px] px-1.5 py-0.5 rounded bg-red-500/20 text-red-600 dark:text-red-400 font-medium">
                      {formatSpot(spot)}
                    </span>
                  ))}
                </div>
              ) : (
                <span className="text-[10px] text-green-600 dark:text-green-400">Full</span>
              )}
            </div>
            {/* Reserves lineup */}
            <div className="space-y-1.5 pt-2 border-t">
              <div className="flex items-center gap-2">
                <Users className="h-3 w-3 text-muted-foreground" />
                <span className="text-xs font-medium">Reserves</span>
                <span className="text-xs text-muted-foreground ml-auto">
                  {RESERVES_SPOTS.length - emptyReservesSpots.length}/{RESERVES_SPOTS.length}
                </span>
              </div>
              {emptyReservesSpots.length > 0 ? (
                <div className="flex flex-wrap gap-1">
                  {emptyReservesSpots.map(spot => (
                    <span key={spot} className="text-[10px] px-1.5 py-0.5 rounded bg-red-500/20 text-red-600 dark:text-red-400 font-medium">
                      {formatSpot(spot)}
                    </span>
                  ))}
                </div>
              ) : (
                <span className="text-[10px] text-green-600 dark:text-green-400">Full</span>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Season Record Card */}
        <Card className="cursor-default">
          <CardContent className="pt-4 pb-3">
            <div className="text-sm font-medium text-muted-foreground mb-3">Season Record</div>
            <div className="space-y-3">
              {/* Seniors */}
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <Trophy className="h-3.5 w-3.5 text-amber-500" />
                  <span className="text-xs font-medium truncate flex-1">{clubName}</span>
                  {record && record.seniors.ladderPosition > 0 && (
                    <Badge className={`text-[10px] px-1.5 py-0 ${getLadderBadgeColor(record.seniors.ladderPosition, record.totalTeams)}`}>
                      {record.seniors.ladderPosition}{record.seniors.ladderPosition === 1 ? "st" : record.seniors.ladderPosition === 2 ? "nd" : record.seniors.ladderPosition === 3 ? "rd" : "th"}
                    </Badge>
                  )}
                </div>
                {record && record.seniors.played > 0 ? (
                  <div className="flex items-center gap-3">
                    <span className="text-xl font-bold">{record.seniors.wins * 4 + record.seniors.draws * 2}</span>
                    <span className="text-xs text-muted-foreground">pts</span>
                    <div className="flex items-center gap-1 text-xs ml-auto">
                      <span className="text-green-600 dark:text-green-400 font-medium">{record.seniors.wins}W</span>
                      <span className="text-red-500 font-medium">{record.seniors.losses}L</span>
                      {record.seniors.draws > 0 && (
                        <span className="text-yellow-500 font-medium">{record.seniors.draws}D</span>
                      )}
                      <span className="text-muted-foreground">({record.seniors.percentage.toFixed(0)}%)</span>
                    </div>
                  </div>
                ) : (
                  <span className="text-sm text-muted-foreground">No games yet</span>
                )}
              </div>
              {/* Reserves */}
              <div className="space-y-1 pt-2 border-t">
                <div className="flex items-center gap-2">
                  <Users className="h-3.5 w-3.5 text-muted-foreground" />
                  <span className="text-xs font-medium truncate flex-1">{reservesName}</span>
                  {record && record.reserves.ladderPosition > 0 && (
                    <Badge className={`text-[10px] px-1.5 py-0 ${getLadderBadgeColor(record.reserves.ladderPosition, record.totalTeams)}`}>
                      {record.reserves.ladderPosition}{record.reserves.ladderPosition === 1 ? "st" : record.reserves.ladderPosition === 2 ? "nd" : record.reserves.ladderPosition === 3 ? "rd" : "th"}
                    </Badge>
                  )}
                </div>
                {record && record.reserves.played > 0 ? (
                  <div className="flex items-center gap-3">
                    <span className="text-xl font-bold">{record.reserves.wins * 4 + record.reserves.draws * 2}</span>
                    <span className="text-xs text-muted-foreground">pts</span>
                    <div className="flex items-center gap-1 text-xs ml-auto">
                      <span className="text-green-600 dark:text-green-400 font-medium">{record.reserves.wins}W</span>
                      <span className="text-red-500 font-medium">{record.reserves.losses}L</span>
                      {record.reserves.draws > 0 && (
                        <span className="text-yellow-500 font-medium">{record.reserves.draws}D</span>
                      )}
                      <span className="text-muted-foreground">({record.reserves.percentage.toFixed(0)}%)</span>
                    </div>
                  </div>
                ) : (
                  <span className="text-sm text-muted-foreground">No games yet</span>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Captains Card */}
        <Card className="cursor-default">
          <CardContent className="pt-4 pb-3">
            <div className="text-sm font-medium text-muted-foreground mb-3">Captains</div>
            <div className="space-y-3">
              {/* Seniors */}
              <div className="space-y-1.5">
                <div className="text-xs text-muted-foreground flex items-center gap-1">
                  <Trophy className="h-3 w-3 text-amber-500" />
                  Seniors
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {captains.seniorCaptain ? (
                    <div className="flex items-center gap-1 bg-amber-500/10 rounded px-1.5 py-0.5">
                      <span className="w-4 h-4 rounded bg-amber-500 text-white text-[9px] font-bold flex items-center justify-center">C</span>
                      <span className="text-xs font-medium">{captains.seniorCaptain.name}</span>
                    </div>
                  ) : (
                    <span className="text-xs text-red-500">No captain</span>
                  )}
                  {captains.seniorVc ? (
                    <div className="flex items-center gap-1 bg-amber-400/10 rounded px-1.5 py-0.5">
                      <span className="w-4 h-4 rounded bg-amber-400 text-white text-[9px] font-bold flex items-center justify-center">V</span>
                      <span className="text-xs">{captains.seniorVc.name}</span>
                    </div>
                  ) : (
                    <span className="text-xs text-muted-foreground">No VC</span>
                  )}
                </div>
              </div>
              {/* Reserves */}
              <div className="space-y-1.5 pt-2 border-t">
                <div className="text-xs text-muted-foreground flex items-center gap-1">
                  <Users className="h-3 w-3" />
                  Reserves
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {captains.reservesCaptain ? (
                    <div className="flex items-center gap-1 bg-amber-500/10 rounded px-1.5 py-0.5">
                      <span className="w-4 h-4 rounded bg-amber-500 text-white text-[9px] font-bold flex items-center justify-center">C</span>
                      <span className="text-xs font-medium">{captains.reservesCaptain.name}</span>
                    </div>
                  ) : (
                    <span className="text-xs text-red-500">No captain</span>
                  )}
                  {captains.reservesVc ? (
                    <div className="flex items-center gap-1 bg-amber-400/10 rounded px-1.5 py-0.5">
                      <span className="w-4 h-4 rounded bg-amber-400 text-white text-[9px] font-bold flex items-center justify-center">V</span>
                      <span className="text-xs">{captains.reservesVc.name}</span>
                    </div>
                  ) : (
                    <span className="text-xs text-muted-foreground">No VC</span>
                  )}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Form Card */}
        <Card className="cursor-default">
          <CardContent className="pt-4 pb-3">
            <div className="text-sm font-medium text-muted-foreground mb-3">Form</div>
            <div className="space-y-3">
              {/* Seniors form */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <div className="text-xs text-muted-foreground flex items-center gap-1">
                    <Trophy className="h-3 w-3 text-amber-500" />
                    Seniors
                  </div>
                  {form?.seniors.streak && form.seniors.streak > 1 && (
                    <Badge
                      variant="outline"
                      className={`text-[10px] px-1.5 py-0 ${
                        form.seniors.streakType === "W"
                          ? "border-green-500 text-green-600 dark:text-green-400"
                          : form.seniors.streakType === "L"
                          ? "border-red-500 text-red-500"
                          : ""
                      }`}
                    >
                      {form.seniors.streak}{form.seniors.streakType} streak
                    </Badge>
                  )}
                </div>
                <div className="flex gap-1">
                  {form?.seniors.last5 && form.seniors.last5.length > 0 ? (
                    form.seniors.last5.map((r, i) => (
                      <div
                        key={i}
                        className={`w-6 h-6 rounded ${getFormColor(r)} flex items-center justify-center text-[10px] font-bold text-white shadow-sm`}
                      >
                        {r}
                      </div>
                    ))
                  ) : (
                    <span className="text-xs text-muted-foreground">No games yet</span>
                  )}
                </div>
              </div>
              {/* Reserves form */}
              <div className="space-y-1.5 pt-2 border-t">
                <div className="flex items-center justify-between">
                  <div className="text-xs text-muted-foreground flex items-center gap-1">
                    <Users className="h-3 w-3" />
                    Reserves
                  </div>
                  {form?.reserves.streak && form.reserves.streak > 1 && (
                    <Badge
                      variant="outline"
                      className={`text-[10px] px-1.5 py-0 ${
                        form.reserves.streakType === "W"
                          ? "border-green-500 text-green-600 dark:text-green-400"
                          : form.reserves.streakType === "L"
                          ? "border-red-500 text-red-500"
                          : ""
                      }`}
                    >
                      {form.reserves.streak}{form.reserves.streakType} streak
                    </Badge>
                  )}
                </div>
                <div className="flex gap-1">
                  {form?.reserves.last5 && form.reserves.last5.length > 0 ? (
                    form.reserves.last5.map((r, i) => (
                      <div
                        key={i}
                        className={`w-6 h-6 rounded ${getFormColor(r)} flex items-center justify-center text-[10px] font-bold text-white shadow-sm`}
                      >
                        {r}
                      </div>
                    ))
                  ) : (
                    <span className="text-xs text-muted-foreground">No games yet</span>
                  )}
                </div>
              </div>
              {/* Next match */}
              {upcomingMatch && (
                <div className="flex items-center gap-2 pt-2 border-t">
                  <span className="text-xs text-muted-foreground">Next:</span>
                  <span className="text-xs font-medium">R{upcomingMatch.roundNumber}</span>
                  <span className="text-xs text-muted-foreground">{upcomingMatch.isHome ? "vs" : "@"}</span>
                  <span
                    className="px-2 py-0.5 rounded text-xs font-bold"
                    style={{
                      backgroundColor: upcomingMatch.opponent.primaryColor || "#6b7280",
                      color: upcomingMatch.opponent.secondaryColor || "#ffffff",
                    }}
                  >
                    {upcomingMatch.opponent.abbreviation}
                  </span>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      <SalaryDetailDialog
        open={salaryDialogOpen}
        onOpenChange={setSalaryDialogOpen}
        contracts={contracts}
        salaryUsed={salaryUsed}
        salaryCap={salaryCap}
      />

      <RosterDetailDialog
        open={rosterDialogOpen}
        onOpenChange={setRosterDialogOpen}
        contracts={contracts}
        rosterPlayers={rosterPlayers}
        seniorsCount={seniorsCount}
        reservesCount={reservesCount}
      />
    </>
  );
}
