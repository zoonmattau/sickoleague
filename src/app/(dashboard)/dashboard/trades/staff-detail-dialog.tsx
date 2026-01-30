"use client";

import { useEffect, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import { getStaffDetail, type StaffDetail } from "./actions";

interface StaffDetailDialogProps {
  staffId: string | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const roleLabels: Record<string, string> = {
  ASSISTANT_COACH: "Assistant Coach",
  LIST_MANAGER: "List Manager",
};

const leagueColors: Record<string, string> = {
  AFL: "bg-blue-600",
  VFL: "bg-purple-600",
  SANFL: "bg-red-600",
  WAFL: "bg-yellow-600",
  NTFL: "bg-green-600",
};

export function StaffDetailDialog({
  staffId,
  open,
  onOpenChange,
}: StaffDetailDialogProps) {
  const [staff, setStaff] = useState<StaffDetail | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (staffId && open) {
      setLoading(true);
      getStaffDetail(staffId)
        .then(setStaff)
        .finally(() => setLoading(false));
    }
  }, [staffId, open]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        {loading ? (
          <div className="space-y-4">
            <Skeleton className="h-8 w-48" />
            <Skeleton className="h-24 w-full" />
            <Skeleton className="h-32 w-full" />
          </div>
        ) : staff ? (
          <>
            <DialogHeader>
              <DialogTitle className="flex items-center gap-3">
                <span className="text-2xl">{staff.name}</span>
                <Badge className={`${leagueColors[staff.league]} text-white`}>
                  {staff.league}
                </Badge>
              </DialogTitle>
              <div className="flex items-center gap-2">
                <Badge variant="outline">{roleLabels[staff.role]}</Badge>
                {staff.aflTeam && (
                  <span className="text-muted-foreground">
                    {staff.aflTeam.name} ({staff.aflTeam.abbreviation})
                  </span>
                )}
              </div>
            </DialogHeader>

            <Tabs defaultValue="info" className="mt-4">
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="info">Info</TabsTrigger>
                <TabsTrigger value="contract">Contract</TabsTrigger>
                <TabsTrigger value="history">History</TabsTrigger>
              </TabsList>

              <TabsContent value="info" className="space-y-4 mt-4">
                {/* Key info */}
                <div className="grid grid-cols-2 gap-4">
                  {staff.aflTeam && (
                    <div className="p-3 bg-muted rounded-lg">
                      <p className="text-sm text-muted-foreground">AFL Team</p>
                      <p className="font-semibold">{staff.aflTeam.name}</p>
                      {staff.aflTeam.currentLadderPos && (
                        <p className="text-sm">
                          Ladder Position: {staff.aflTeam.currentLadderPos}
                        </p>
                      )}
                    </div>
                  )}

                  {staff.role === "LIST_MANAGER" && staff.listManagerDiscount !== null && (
                    <div className="p-3 bg-green-50 dark:bg-green-950/20 rounded-lg">
                      <p className="text-sm text-muted-foreground">Contract Discount</p>
                      <p className="text-2xl font-bold text-green-600">
                        {staff.listManagerDiscount}%
                      </p>
                      <p className="text-xs text-muted-foreground">
                        Based on {staff.aflTeam?.name}&apos;s ladder position
                      </p>
                    </div>
                  )}

                  {staff.role === "ASSISTANT_COACH" && (
                    <div className="p-3 bg-blue-50 dark:bg-blue-950/20 rounded-lg">
                      <p className="text-sm text-muted-foreground">Scoring Bonus</p>
                      <p className="font-semibold">
                        {staff.league === "AFL" ? "0.5x" : "0.25x"} AFL Team Margin
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {staff.league === "AFL"
                          ? "Full bonus from AFL results"
                          : "Half bonus (state league)"}
                      </p>
                    </div>
                  )}
                </div>

                {/* AFL Team Results */}
                {staff.aflTeamResults.length > 0 && (
                  <div>
                    <h4 className="font-semibold mb-2">
                      {staff.aflTeam?.name} Season Results
                    </h4>
                    <div className="space-y-2">
                      {staff.aflTeamResults.slice(0, 3).map((season) => (
                        <div
                          key={season.season}
                          className="flex justify-between items-center p-2 border rounded"
                        >
                          <span className="font-medium">{season.season}</span>
                          <div className="flex gap-4 text-sm">
                            <span className="text-green-600">
                              {season.wins}W
                            </span>
                            <span className="text-red-600">{season.losses}L</span>
                            {season.draws > 0 && (
                              <span className="text-muted-foreground">
                                {season.draws}D
                              </span>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </TabsContent>

              <TabsContent value="contract" className="space-y-4 mt-4">
                {staff.currentContract ? (
                  <div className="p-4 border rounded-lg bg-green-50 dark:bg-green-950/20">
                    <h4 className="font-semibold text-green-700 dark:text-green-400 mb-2">
                      Current Contract
                    </h4>
                    <div className="grid grid-cols-2 gap-2 text-sm">
                      <div>
                        <span className="text-muted-foreground">Club:</span>{" "}
                        <span className="font-medium">
                          {staff.currentContract.clubName}
                        </span>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Value:</span>{" "}
                        <span className="font-medium">
                          ${staff.currentContract.salary}k
                        </span>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Started:</span>{" "}
                        {staff.currentContract.startSeason}
                      </div>
                      <div>
                        <span className="text-muted-foreground">Ends:</span>{" "}
                        {staff.currentContract.endSeason}
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="p-4 border rounded-lg text-center">
                    <Badge variant="secondary" className="bg-green-100 text-green-800">
                      Available
                    </Badge>
                    <p className="text-sm text-muted-foreground mt-2">
                      This staff member is available for signing
                    </p>
                  </div>
                )}
              </TabsContent>

              <TabsContent value="history" className="space-y-4 mt-4">
                <h4 className="font-semibold">Sicko League Contract History</h4>
                {staff.contractHistory.length === 0 ? (
                  <p className="text-muted-foreground text-sm py-4 text-center">
                    No previous contracts in Sicko League
                  </p>
                ) : (
                  <div className="space-y-2">
                    {staff.contractHistory.map((contract, i) => (
                      <div
                        key={i}
                        className="flex justify-between items-center p-3 border rounded"
                      >
                        <div>
                          <p className="font-medium">{contract.clubName}</p>
                          <p className="text-sm text-muted-foreground">
                            {contract.startSeason} - {contract.endSeason}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="font-medium">${contract.totalValue}k</p>
                          <Badge variant="outline" className="text-xs">
                            {roleLabels[contract.role]}
                          </Badge>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </TabsContent>
            </Tabs>
          </>
        ) : (
          <p className="text-muted-foreground py-8 text-center">
            Staff member not found
          </p>
        )}
      </DialogContent>
    </Dialog>
  );
}
