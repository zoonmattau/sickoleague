"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { RosterSpot } from "@prisma/client";
import { CircleCheck, Circle, AlertTriangle, CheckCircle2 } from "lucide-react";
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

  // 1. Captaincy checks - use realCaptaincy for actual DB state
  const hasSeniorCaptain = !!realCaptaincy.seniorCaptainId;
  const hasSeniorVc = !!realCaptaincy.seniorVcId;
  const hasReservesCaptain = !!realCaptaincy.reservesCaptainId;
  const hasReservesVc = !!realCaptaincy.reservesVcId;

  // Only show captain items if they're missing
  if (!hasSeniorCaptain || !hasSeniorVc) {
    items.push({
      label: "Seniors leadership",
      done: hasSeniorCaptain && hasSeniorVc,
      detail: !hasSeniorCaptain && !hasSeniorVc ? "Need C & VC" : !hasSeniorCaptain ? "Need Captain" : "Need Vice-Captain",
    });
  }
  if (!hasReservesCaptain || !hasReservesVc) {
    items.push({
      label: "Reserves leadership",
      done: hasReservesCaptain && hasReservesVc,
      detail: !hasReservesCaptain && !hasReservesVc ? "Need C & VC" : !hasReservesCaptain ? "Need Captain" : "Need Vice-Captain",
    });
  }

  // 2. Empty lineup spot checks
  const emptySeniorsSpots = SENIORS_SPOTS.filter((s) => !rosterMap.has(s));
  const emptyReservesSpots = RESERVES_SPOTS.filter((s) => !rosterMap.has(s));

  if (emptySeniorsSpots.length > 0) {
    items.push({
      label: "Seniors lineup",
      done: false,
      detail: `${emptySeniorsSpots.length} empty`,
    });
  }
  if (emptyReservesSpots.length > 0) {
    items.push({
      label: "Reserves lineup",
      done: false,
      detail: `${emptyReservesSpots.length} empty`,
    });
  }

  // 3. Unavailable players in active spots
  const unavailableInActive = rosterPlayers.filter((rp) => {
    const inActiveSpot = ACTIVE_SPOTS.includes(rp.rosterSpot);
    return inActiveSpot && !rp.contract.aflPlayer.isAvailable;
  });

  if (unavailableInActive.length > 0) {
    items.push({
      label: "Unavailable players",
      done: false,
      warning: true,
      detail: `${unavailableInActive.length} in lineup`,
    });
  }

  // If nothing to do, show all done message
  if (items.length === 0) {
    return (
      <Card className="border-green-500/30 bg-green-500/5">
        <CardContent className="py-4">
          <div className="flex items-center gap-3">
            <CheckCircle2 className="h-5 w-5 text-green-500" />
            <div>
              <div className="text-sm font-medium">Ready for the weekend</div>
              <div className="text-xs text-muted-foreground">All lineups set</div>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  const doneCount = items.filter((i) => i.done).length;

  return (
    <Card>
      <CardHeader className="py-3 px-4">
        <CardTitle className="text-sm flex items-center gap-2">
          To Do
          <span className="text-xs font-normal px-1.5 py-0.5 rounded bg-muted text-muted-foreground">
            {items.length - doneCount}
          </span>
        </CardTitle>
      </CardHeader>
      <CardContent className="py-0 px-4 pb-3">
        <div className="space-y-1">
          {items.map((item, i) => (
            <div
              key={i}
              className="flex items-center gap-2 text-sm py-1"
            >
              {item.done ? (
                <CircleCheck className="h-4 w-4 text-green-500 shrink-0" />
              ) : item.warning ? (
                <AlertTriangle className="h-4 w-4 text-amber-500 shrink-0" />
              ) : (
                <Circle className="h-4 w-4 text-muted-foreground shrink-0" />
              )}
              <span className={item.done ? "line-through text-muted-foreground" : ""}>
                {item.label}
              </span>
              {item.detail && (
                <span className="text-xs text-muted-foreground ml-auto">
                  {item.detail}
                </span>
              )}
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
