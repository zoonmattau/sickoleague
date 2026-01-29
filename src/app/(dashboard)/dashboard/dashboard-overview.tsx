"use client";

import { useState } from "react";
import { ClickableStatCard } from "./stat-card";
import { SalaryDetailDialog } from "./dialogs/salary-detail-dialog";
import { RosterDetailDialog } from "./dialogs/roster-detail-dialog";
import { Card, CardContent } from "@/components/ui/card";
import type { SerializedContract, SerializedRosterPlayer } from "./types";

type RecordSummary = {
  seniors: { wins: number; losses: number; draws: number; played: number; percentage: number };
  reserves: { wins: number; losses: number; draws: number; played: number; percentage: number };
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

  const formatRecord = (r: { wins: number; losses: number; draws: number }) => {
    if (r.draws > 0) return `${r.wins}-${r.losses}-${r.draws}`;
    return `${r.wins}-${r.losses}`;
  };

  const getFormColor = (result: "W" | "L" | "D") => {
    if (result === "W") return "bg-green-500";
    if (result === "L") return "bg-red-500";
    return "bg-yellow-500";
  };

  return (
    <>
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
        <ClickableStatCard
          title="Salary Cap"
          badge="$750k"
          value={`$${(salaryUsed * 1000).toLocaleString()}`}
          subtitle={`$${(salaryRemaining * 1000).toLocaleString()} remaining`}
          onClick={() => setSalaryDialogOpen(true)}
        />

        <ClickableStatCard
          title="Roster Size"
          badge="19-21"
          value={`${totalContracts}/21`}
          subtitle={`${seniorsCount} seniors, ${reservesCount} reserves`}
          onClick={() => setRosterDialogOpen(true)}
        />

        {/* W/L Record Card */}
        <Card className="cursor-default">
          <CardContent className="pt-4 pb-3">
            <div className="text-sm font-medium text-muted-foreground mb-3">Season Record</div>
            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <span className="text-xs text-muted-foreground w-10">Sen</span>
                <div className="flex-1 flex items-center gap-2">
                  <span className="font-bold text-xl tabular-nums">
                    {record ? formatRecord(record.seniors) : "--"}
                  </span>
                  {record && record.seniors.played > 0 && (
                    <span className="text-xs px-1.5 py-0.5 rounded bg-muted">
                      {record.seniors.percentage.toFixed(0)}%
                    </span>
                  )}
                </div>
              </div>
              <div className="flex items-center gap-3">
                <span className="text-xs text-muted-foreground w-10">Res</span>
                <div className="flex-1 flex items-center gap-2">
                  <span className="font-bold text-xl tabular-nums">
                    {record ? formatRecord(record.reserves) : "--"}
                  </span>
                  {record && record.reserves.played > 0 && (
                    <span className="text-xs px-1.5 py-0.5 rounded bg-muted">
                      {record.reserves.percentage.toFixed(0)}%
                    </span>
                  )}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Captains Card */}
        <Card className="cursor-default">
          <CardContent className="pt-4 pb-3">
            <div className="text-sm font-medium text-muted-foreground mb-3">Captains</div>
            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <span className="text-xs text-muted-foreground w-10">Sen</span>
                <div className="flex items-center gap-2 flex-1">
                  {captains.seniorCaptain ? (
                    <div className="flex items-center gap-1.5">
                      <span className="w-5 h-5 rounded bg-amber-500 text-white text-[10px] font-bold flex items-center justify-center shadow-sm">C</span>
                      <span className="text-sm font-medium">{captains.seniorCaptain.name}</span>
                    </div>
                  ) : (
                    <span className="text-sm text-muted-foreground">--</span>
                  )}
                  {captains.seniorVc && (
                    <div className="flex items-center gap-1.5 ml-2">
                      <span className="w-5 h-5 rounded bg-amber-400 text-white text-[10px] font-bold flex items-center justify-center shadow-sm">VC</span>
                      <span className="text-sm">{captains.seniorVc.name}</span>
                    </div>
                  )}
                </div>
              </div>
              <div className="flex items-center gap-3">
                <span className="text-xs text-muted-foreground w-10">Res</span>
                <div className="flex items-center gap-2 flex-1">
                  {captains.reservesCaptain ? (
                    <div className="flex items-center gap-1.5">
                      <span className="w-5 h-5 rounded bg-amber-500 text-white text-[10px] font-bold flex items-center justify-center shadow-sm">C</span>
                      <span className="text-sm font-medium">{captains.reservesCaptain.name}</span>
                    </div>
                  ) : (
                    <span className="text-sm text-muted-foreground">--</span>
                  )}
                  {captains.reservesVc && (
                    <div className="flex items-center gap-1.5 ml-2">
                      <span className="w-5 h-5 rounded bg-amber-400 text-white text-[10px] font-bold flex items-center justify-center shadow-sm">VC</span>
                      <span className="text-sm">{captains.reservesVc.name}</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Form & Upcoming Card */}
        <Card className="cursor-default">
          <CardContent className="pt-4 pb-3">
            <div className="text-sm font-medium text-muted-foreground mb-3">Form</div>
            <div className="space-y-3">
              {/* Seniors form */}
              <div className="flex items-center gap-3">
                <span className="text-xs text-muted-foreground w-10">Sen</span>
                <div className="flex gap-1">
                  {form?.seniors.last5.map((r, i) => (
                    <div
                      key={i}
                      className={`w-5 h-5 rounded ${getFormColor(r)} flex items-center justify-center text-[10px] font-bold text-white shadow-sm`}
                    >
                      {r}
                    </div>
                  ))}
                  {(!form || form.seniors.last5.length === 0) && (
                    <span className="text-sm text-muted-foreground">--</span>
                  )}
                </div>
                {form?.seniors.streak && form.seniors.streak > 1 && (
                  <span className={`text-xs font-bold px-1.5 py-0.5 rounded ${form.seniors.streakType === "W" ? "bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300" : form.seniors.streakType === "L" ? "bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300" : "bg-muted"}`}>
                    {form.seniors.streak}{form.seniors.streakType}
                  </span>
                )}
              </div>
              {/* Reserves form */}
              <div className="flex items-center gap-3">
                <span className="text-xs text-muted-foreground w-10">Res</span>
                <div className="flex gap-1">
                  {form?.reserves.last5.map((r, i) => (
                    <div
                      key={i}
                      className={`w-5 h-5 rounded ${getFormColor(r)} flex items-center justify-center text-[10px] font-bold text-white shadow-sm`}
                    >
                      {r}
                    </div>
                  ))}
                  {(!form || form.reserves.last5.length === 0) && (
                    <span className="text-sm text-muted-foreground">--</span>
                  )}
                </div>
                {form?.reserves.streak && form.reserves.streak > 1 && (
                  <span className={`text-xs font-bold px-1.5 py-0.5 rounded ${form.reserves.streakType === "W" ? "bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300" : form.reserves.streakType === "L" ? "bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300" : "bg-muted"}`}>
                    {form.reserves.streak}{form.reserves.streakType}
                  </span>
                )}
              </div>
              {/* Next match */}
              {upcomingMatch && (
                <div className="flex items-center gap-2 pt-2 mt-1 border-t">
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
