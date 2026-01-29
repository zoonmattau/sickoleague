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
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
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
            <div className="text-sm font-medium text-muted-foreground mb-2">Season Record</div>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs text-muted-foreground">Seniors</span>
                <span className="font-bold text-lg">
                  {record ? formatRecord(record.seniors) : "--"}
                </span>
                {record && record.seniors.played > 0 && (
                  <span className="text-xs text-muted-foreground">
                    {record.seniors.percentage.toFixed(0)}%
                  </span>
                )}
              </div>
              <div className="flex items-center justify-between">
                <span className="text-xs text-muted-foreground">Reserves</span>
                <span className="font-bold text-lg">
                  {record ? formatRecord(record.reserves) : "--"}
                </span>
                {record && record.reserves.played > 0 && (
                  <span className="text-xs text-muted-foreground">
                    {record.reserves.percentage.toFixed(0)}%
                  </span>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Form & Upcoming Card */}
        <Card className="cursor-default">
          <CardContent className="pt-4 pb-3">
            <div className="text-sm font-medium text-muted-foreground mb-2">Form & Next Up</div>
            <div className="space-y-2">
              {/* Form indicators */}
              <div className="flex items-center gap-2">
                <span className="text-xs text-muted-foreground w-12">Sen:</span>
                <div className="flex gap-0.5">
                  {form?.seniors.last5.map((r, i) => (
                    <div
                      key={i}
                      className={`w-4 h-4 rounded-sm ${getFormColor(r)} flex items-center justify-center text-[9px] font-bold text-white`}
                    >
                      {r}
                    </div>
                  ))}
                  {(!form || form.seniors.last5.length === 0) && (
                    <span className="text-xs text-muted-foreground">--</span>
                  )}
                </div>
                {form?.seniors.streak && form.seniors.streak > 1 && (
                  <span className={`text-xs font-medium ${form.seniors.streakType === "W" ? "text-green-600" : form.seniors.streakType === "L" ? "text-red-600" : ""}`}>
                    {form.seniors.streak}{form.seniors.streakType}
                  </span>
                )}
              </div>
              <div className="flex items-center gap-2">
                <span className="text-xs text-muted-foreground w-12">Res:</span>
                <div className="flex gap-0.5">
                  {form?.reserves.last5.map((r, i) => (
                    <div
                      key={i}
                      className={`w-4 h-4 rounded-sm ${getFormColor(r)} flex items-center justify-center text-[9px] font-bold text-white`}
                    >
                      {r}
                    </div>
                  ))}
                  {(!form || form.reserves.last5.length === 0) && (
                    <span className="text-xs text-muted-foreground">--</span>
                  )}
                </div>
                {form?.reserves.streak && form.reserves.streak > 1 && (
                  <span className={`text-xs font-medium ${form.reserves.streakType === "W" ? "text-green-600" : form.reserves.streakType === "L" ? "text-red-600" : ""}`}>
                    {form.reserves.streak}{form.reserves.streakType}
                  </span>
                )}
              </div>
              {/* Next match */}
              {upcomingMatch && (
                <div className="flex items-center gap-2 pt-1 border-t">
                  <span className="text-xs text-muted-foreground">R{upcomingMatch.roundNumber}:</span>
                  <span className="text-xs">{upcomingMatch.isHome ? "vs" : "@"}</span>
                  <span
                    className="px-1.5 py-0.5 rounded text-[10px] font-bold"
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
