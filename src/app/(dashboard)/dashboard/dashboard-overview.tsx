"use client";

import { useState } from "react";
import { SalaryDetailDialog } from "./dialogs/salary-detail-dialog";
import { RosterDetailDialog } from "./dialogs/roster-detail-dialog";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Trophy, Users, DollarSign, UserCheck, TrendingUp, Calendar } from "lucide-react";
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

  // Format spot name for display
  const formatSpot = (spot: string) => {
    const clean = spot.replace(/^R/, "");
    const match = clean.match(/^([A-Z]+)(\d+)$/);
    if (match) return `${match[1]}${match[2]}`;
    return clean;
  };

  const getFormColor = (result: "W" | "L" | "D") => {
    if (result === "W") return "bg-green-500";
    if (result === "L") return "bg-red-500";
    return "bg-yellow-500";
  };

  const getOrdinal = (n: number) => {
    if (n === 1) return "1st";
    if (n === 2) return "2nd";
    if (n === 3) return "3rd";
    return `${n}th`;
  };

  return (
    <>
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
        {/* Salary Cap Card */}
        <Card
          className="cursor-pointer hover:shadow-lg transition-all group relative overflow-hidden"
          onClick={() => setSalaryDialogOpen(true)}
        >
          <div className="absolute left-0 top-0 bottom-0 w-1 bg-primary" />
          <CardContent className="pt-4 pb-4 pl-5">
            <div className="flex items-center gap-2 mb-3">
              <DollarSign className="h-4 w-4 text-primary" />
              <span className="stat-label">Salary Cap</span>
            </div>
            <div className="stat-number text-3xl mb-3">
              ${Math.round(salaryUsed)}K
            </div>
            <Progress
              value={salaryPercent}
              className={`h-2 mb-3 ${salaryPercent > 95 ? '[&>div]:bg-red-500' : salaryPercent > 85 ? '[&>div]:bg-yellow-500' : '[&>div]:bg-primary'}`}
            />
            <div className="flex justify-between items-center">
              <span className="text-xs text-muted-foreground">${Math.round(salaryRemaining)}K remaining</span>
              <Badge variant={salaryPercent > 95 ? "destructive" : "secondary"} className="text-[10px]">
                {salaryPercent.toFixed(0)}%
              </Badge>
            </div>
          </CardContent>
        </Card>

        {/* Roster/Lineup Card */}
        <Card
          className="cursor-pointer hover:shadow-lg transition-all group relative overflow-hidden"
          onClick={() => setRosterDialogOpen(true)}
        >
          <div className="absolute left-0 top-0 bottom-0 w-1 bg-accent" />
          <CardContent className="pt-4 pb-4 pl-5">
            <div className="flex items-center gap-2 mb-3">
              <UserCheck className="h-4 w-4 text-accent" />
              <span className="stat-label">Lineup Status</span>
            </div>
            <div className="space-y-3">
              {/* Seniors */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Trophy className="h-4 w-4 text-amber-500" />
                  <span className="text-sm font-semibold">Seniors</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="stat-number-sm">{SENIORS_SPOTS.length - emptySeniorsSpots.length}</span>
                  <span className="text-muted-foreground">/11</span>
                </div>
              </div>
              {emptySeniorsSpots.length > 0 && (
                <div className="flex flex-wrap gap-1">
                  {emptySeniorsSpots.slice(0, 4).map(spot => (
                    <Badge key={spot} variant="destructive" className="text-[9px] px-1.5 py-0">
                      {formatSpot(spot)}
                    </Badge>
                  ))}
                  {emptySeniorsSpots.length > 4 && (
                    <Badge variant="destructive" className="text-[9px] px-1.5 py-0">
                      +{emptySeniorsSpots.length - 4}
                    </Badge>
                  )}
                </div>
              )}
              {/* Reserves */}
              <div className="flex items-center justify-between pt-2 border-t">
                <div className="flex items-center gap-2">
                  <Users className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm font-semibold">Reserves</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="stat-number-sm">{RESERVES_SPOTS.length - emptyReservesSpots.length}</span>
                  <span className="text-muted-foreground">/8</span>
                </div>
              </div>
              {emptyReservesSpots.length > 0 && (
                <div className="flex flex-wrap gap-1">
                  {emptyReservesSpots.slice(0, 4).map(spot => (
                    <Badge key={spot} variant="destructive" className="text-[9px] px-1.5 py-0">
                      {formatSpot(spot)}
                    </Badge>
                  ))}
                  {emptyReservesSpots.length > 4 && (
                    <Badge variant="destructive" className="text-[9px] px-1.5 py-0">
                      +{emptyReservesSpots.length - 4}
                    </Badge>
                  )}
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Season Record Card */}
        <Card className="relative overflow-hidden">
          <div className="absolute left-0 top-0 bottom-0 w-1 bg-green-500" />
          <CardContent className="pt-4 pb-4 pl-5">
            <div className="flex items-center gap-2 mb-3">
              <TrendingUp className="h-4 w-4 text-green-500" />
              <span className="stat-label">Season Record</span>
            </div>
            <div className="space-y-3">
              {/* Seniors */}
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <Trophy className="h-3.5 w-3.5 text-amber-500" />
                  <span className="text-xs font-bold uppercase tracking-wide">{clubName}</span>
                </div>
                {record && record.seniors.played > 0 ? (
                  <div className="flex items-baseline gap-2">
                    <span className="stat-number">{record.seniors.wins * 4 + record.seniors.draws * 2}</span>
                    <span className="text-xs text-muted-foreground">PTS</span>
                    <div className="ml-auto flex items-center gap-1.5">
                      <span className="text-sm font-bold text-green-500">{record.seniors.wins}W</span>
                      <span className="text-sm font-bold text-red-500">{record.seniors.losses}L</span>
                      {record.seniors.ladderPosition > 0 && (
                        <Badge className="bg-primary/20 text-primary text-[10px] ml-1">
                          {getOrdinal(record.seniors.ladderPosition)}
                        </Badge>
                      )}
                    </div>
                  </div>
                ) : (
                  <span className="text-sm text-muted-foreground">No games</span>
                )}
              </div>
              {/* Reserves */}
              <div className="pt-2 border-t">
                <div className="flex items-center gap-2 mb-1">
                  <Users className="h-3.5 w-3.5 text-muted-foreground" />
                  <span className="text-xs font-bold uppercase tracking-wide">{reservesName}</span>
                </div>
                {record && record.reserves.played > 0 ? (
                  <div className="flex items-baseline gap-2">
                    <span className="stat-number">{record.reserves.wins * 4 + record.reserves.draws * 2}</span>
                    <span className="text-xs text-muted-foreground">PTS</span>
                    <div className="ml-auto flex items-center gap-1.5">
                      <span className="text-sm font-bold text-green-500">{record.reserves.wins}W</span>
                      <span className="text-sm font-bold text-red-500">{record.reserves.losses}L</span>
                      {record.reserves.ladderPosition > 0 && (
                        <Badge className="bg-primary/20 text-primary text-[10px] ml-1">
                          {getOrdinal(record.reserves.ladderPosition)}
                        </Badge>
                      )}
                    </div>
                  </div>
                ) : (
                  <span className="text-sm text-muted-foreground">No games</span>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Captains Card */}
        <Card className="relative overflow-hidden">
          <div className="absolute left-0 top-0 bottom-0 w-1 bg-amber-500" />
          <CardContent className="pt-4 pb-4 pl-5">
            <div className="flex items-center gap-2 mb-3">
              <Trophy className="h-4 w-4 text-amber-500" />
              <span className="stat-label">Leadership</span>
            </div>
            <div className="space-y-3">
              {/* Seniors */}
              <div>
                <div className="text-[10px] font-bold uppercase tracking-wide text-muted-foreground mb-1.5">Seniors</div>
                <div className="flex flex-wrap gap-1.5">
                  {captains.seniorCaptain ? (
                    <div className="flex items-center gap-1.5 bg-amber-500/15 border border-amber-500/30 rounded px-2 py-1">
                      <span className="w-5 h-5 rounded bg-amber-500 text-white text-[10px] font-black flex items-center justify-center">C</span>
                      <span className="text-xs font-semibold">{captains.seniorCaptain.name}</span>
                    </div>
                  ) : (
                    <Badge variant="destructive" className="text-[10px]">Need Captain</Badge>
                  )}
                  {captains.seniorVc ? (
                    <div className="flex items-center gap-1.5 bg-amber-400/10 border border-amber-400/20 rounded px-2 py-1">
                      <span className="w-5 h-5 rounded bg-amber-400 text-white text-[10px] font-black flex items-center justify-center">V</span>
                      <span className="text-xs">{captains.seniorVc.name}</span>
                    </div>
                  ) : (
                    <Badge variant="secondary" className="text-[10px]">Need VC</Badge>
                  )}
                </div>
              </div>
              {/* Reserves */}
              <div className="pt-2 border-t">
                <div className="text-[10px] font-bold uppercase tracking-wide text-muted-foreground mb-1.5">Reserves</div>
                <div className="flex flex-wrap gap-1.5">
                  {captains.reservesCaptain ? (
                    <div className="flex items-center gap-1.5 bg-amber-500/15 border border-amber-500/30 rounded px-2 py-1">
                      <span className="w-5 h-5 rounded bg-amber-500 text-white text-[10px] font-black flex items-center justify-center">C</span>
                      <span className="text-xs font-semibold">{captains.reservesCaptain.name}</span>
                    </div>
                  ) : (
                    <Badge variant="destructive" className="text-[10px]">Need Captain</Badge>
                  )}
                  {captains.reservesVc ? (
                    <div className="flex items-center gap-1.5 bg-amber-400/10 border border-amber-400/20 rounded px-2 py-1">
                      <span className="w-5 h-5 rounded bg-amber-400 text-white text-[10px] font-black flex items-center justify-center">V</span>
                      <span className="text-xs">{captains.reservesVc.name}</span>
                    </div>
                  ) : (
                    <Badge variant="secondary" className="text-[10px]">Need VC</Badge>
                  )}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Form Card */}
        <Card className="relative overflow-hidden">
          <div className="absolute left-0 top-0 bottom-0 w-1 bg-blue-500" />
          <CardContent className="pt-4 pb-4 pl-5">
            <div className="flex items-center gap-2 mb-3">
              <Calendar className="h-4 w-4 text-blue-500" />
              <span className="stat-label">Recent Form</span>
            </div>
            <div className="space-y-3">
              {/* Seniors form */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[10px] font-bold uppercase tracking-wide text-muted-foreground">Seniors</span>
                  {form?.seniors.streak && form.seniors.streak > 1 && (
                    <Badge
                      className={`text-[9px] px-1.5 py-0 ${
                        form.seniors.streakType === "W"
                          ? "bg-green-500"
                          : form.seniors.streakType === "L"
                          ? "bg-red-500"
                          : "bg-yellow-500"
                      }`}
                    >
                      {form.seniors.streak}{form.seniors.streakType} STREAK
                    </Badge>
                  )}
                </div>
                <div className="flex gap-1">
                  {form?.seniors.last5 && form.seniors.last5.length > 0 ? (
                    form.seniors.last5.map((r, i) => (
                      <div
                        key={i}
                        className={`w-7 h-7 rounded ${getFormColor(r)} flex items-center justify-center text-[11px] font-black text-white shadow-sm`}
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
              <div className="pt-2 border-t">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[10px] font-bold uppercase tracking-wide text-muted-foreground">Reserves</span>
                  {form?.reserves.streak && form.reserves.streak > 1 && (
                    <Badge
                      className={`text-[9px] px-1.5 py-0 ${
                        form.reserves.streakType === "W"
                          ? "bg-green-500"
                          : form.reserves.streakType === "L"
                          ? "bg-red-500"
                          : "bg-yellow-500"
                      }`}
                    >
                      {form.reserves.streak}{form.reserves.streakType} STREAK
                    </Badge>
                  )}
                </div>
                <div className="flex gap-1">
                  {form?.reserves.last5 && form.reserves.last5.length > 0 ? (
                    form.reserves.last5.map((r, i) => (
                      <div
                        key={i}
                        className={`w-7 h-7 rounded ${getFormColor(r)} flex items-center justify-center text-[11px] font-black text-white shadow-sm`}
                      >
                        {r}
                      </div>
                    ))
                  ) : (
                    <span className="text-xs text-muted-foreground">No games yet</span>
                  )}
                </div>
              </div>
              {/* Next match teaser */}
              {upcomingMatch && (
                <div className="flex items-center gap-2 pt-2 border-t">
                  <span className="ticker-text text-muted-foreground">NEXT:</span>
                  <span className="ticker-text">R{upcomingMatch.roundNumber}</span>
                  <span className="ticker-text text-muted-foreground">{upcomingMatch.isHome ? "VS" : "@"}</span>
                  <span
                    className="px-2 py-0.5 rounded text-[10px] font-black"
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
