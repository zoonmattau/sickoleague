"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { RosterSpot } from "@prisma/client";
import { CircleCheck, Circle, AlertTriangle } from "lucide-react";
import type {
  SerializedRosterPlayer,
  SerializedContract,
  CaptaincyInfo,
} from "./types";

const SENIORS_SPOTS: RosterSpot[] = [
  "DEF1", "DEF2", "DEF3", "MID1", "MID2", "MID3", "MID4", "RUC", "FWD1", "FWD2", "FWD3",
];
const RESERVES_SPOTS: RosterSpot[] = [
  "RDEF1", "RDEF2", "RMID1", "RMID2", "RMID3", "RRUC", "RFWD1", "RFWD2",
];
const BENCH_SPOTS: RosterSpot[] = ["BENCH1", "BENCH2"];
const IL_SPOTS: RosterSpot[] = ["IL1", "IL2"];
const ACTIVE_SPOTS = [...SENIORS_SPOTS, ...RESERVES_SPOTS];

type ChecklistItem = {
  label: string;
  done: boolean;
  warning?: boolean;
  detail?: string;
};

type WeekendChecklistProps = {
  rosterPlayers: SerializedRosterPlayer[];
  contracts: SerializedContract[];
  captaincy: CaptaincyInfo;
  realCaptaincy: CaptaincyInfo;
};

export function WeekendChecklist({
  rosterPlayers,
  contracts,
  captaincy,
  realCaptaincy,
}: WeekendChecklistProps) {
  const rosterMap = new Map(rosterPlayers.map((rp) => [rp.rosterSpot, rp]));

  const items: ChecklistItem[] = [];

  // 1. Captaincy checks
  const hasSeniorCaptain = !!realCaptaincy.seniorCaptainId;
  const hasSeniorVc = !!realCaptaincy.seniorVcId;
  const hasReservesCaptain = !!realCaptaincy.reservesCaptainId;
  const hasReservesVc = !!realCaptaincy.reservesVcId;

  if (!hasSeniorCaptain) {
    items.push({ label: "Select a Seniors Captain", done: false });
  }
  if (!hasSeniorVc) {
    items.push({ label: "Select a Seniors Vice-Captain", done: false });
  }
  if (!hasReservesCaptain) {
    items.push({ label: "Select a Reserves Captain", done: false });
  }
  if (!hasReservesVc) {
    items.push({ label: "Select a Reserves Vice-Captain", done: false });
  }

  // 2. Empty lineup spot checks
  const emptySeniorsSpots = SENIORS_SPOTS.filter((s) => !rosterMap.has(s));
  const emptyReservesSpots = RESERVES_SPOTS.filter((s) => !rosterMap.has(s));

  if (emptySeniorsSpots.length > 0) {
    items.push({
      label: "Fill empty Seniors lineup spots",
      done: false,
      detail: `${emptySeniorsSpots.length} spot${emptySeniorsSpots.length > 1 ? "s" : ""} unfilled`,
    });
  }
  if (emptyReservesSpots.length > 0) {
    items.push({
      label: "Fill empty Reserves lineup spots",
      done: false,
      detail: `${emptyReservesSpots.length} spot${emptyReservesSpots.length > 1 ? "s" : ""} unfilled`,
    });
  }

  // 3. Unavailable players in active spots (should be on bench/IL)
  const unavailableInActive = rosterPlayers.filter((rp) => {
    const inActiveSpot = ACTIVE_SPOTS.includes(rp.rosterSpot);
    return inActiveSpot && !rp.contract.aflPlayer.isAvailable;
  });

  if (unavailableInActive.length > 0) {
    for (const rp of unavailableInActive) {
      const p = rp.contract.aflPlayer;
      items.push({
        label: `Move ${p.firstName} ${p.lastName} to Bench or IL`,
        done: false,
        warning: true,
        detail: "Player marked unavailable",
      });
    }
  }

  // If nothing to do, don't render
  if (items.length === 0) return null;

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-base flex items-center gap-2">
          Weekend Checklist
          <span className="text-xs font-normal text-muted-foreground">
            {items.filter((i) => i.done).length}/{items.length} done
          </span>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-1.5">
          {items.map((item, i) => (
            <div
              key={i}
              className="flex items-start gap-2 text-sm py-1"
            >
              {item.done ? (
                <CircleCheck className="h-4 w-4 text-green-500 mt-0.5 shrink-0" />
              ) : item.warning ? (
                <AlertTriangle className="h-4 w-4 text-amber-500 mt-0.5 shrink-0" />
              ) : (
                <Circle className="h-4 w-4 text-muted-foreground mt-0.5 shrink-0" />
              )}
              <div className="min-w-0">
                <span className={item.done ? "line-through text-muted-foreground" : ""}>
                  {item.label}
                </span>
                {item.detail && (
                  <span className="text-xs text-muted-foreground ml-1.5">
                    — {item.detail}
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
