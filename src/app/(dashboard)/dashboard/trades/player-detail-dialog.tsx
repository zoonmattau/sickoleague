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
import { getPlayerDetail, type PlayerDetail } from "./actions";

interface PlayerDetailDialogProps {
  playerId: string | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const positionColors: Record<string, string> = {
  DEF: "bg-blue-600",
  MID: "bg-green-600",
  RUC: "bg-purple-600",
  FWD: "bg-red-600",
};

export function PlayerDetailDialog({
  playerId,
  open,
  onOpenChange,
}: PlayerDetailDialogProps) {
  const [player, setPlayer] = useState<PlayerDetail | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (playerId && open) {
      setLoading(true);
      getPlayerDetail(playerId)
        .then(setPlayer)
        .finally(() => setLoading(false));
    }
  }, [playerId, open]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        {loading ? (
          <div className="space-y-4">
            <Skeleton className="h-8 w-48" />
            <Skeleton className="h-24 w-full" />
            <Skeleton className="h-32 w-full" />
          </div>
        ) : player ? (
          <>
            <DialogHeader>
              <DialogTitle className="flex items-center gap-3">
                <span className="text-2xl">
                  {player.firstName} {player.lastName}
                </span>
                <div className="flex gap-1">
                  {player.positions.map((pos) => (
                    <Badge
                      key={pos}
                      className={`${positionColors[pos]} text-white`}
                    >
                      {pos}
                    </Badge>
                  ))}
                </div>
              </DialogTitle>
              {player.aflTeam && (
                <p className="text-muted-foreground">
                  {player.aflTeam.name} ({player.aflTeam.abbreviation})
                </p>
              )}
            </DialogHeader>

            <Tabs defaultValue="stats" className="mt-4">
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="stats">Stats</TabsTrigger>
                <TabsTrigger value="contract">Contract</TabsTrigger>
                <TabsTrigger value="history">History</TabsTrigger>
              </TabsList>

              <TabsContent value="stats" className="space-y-4 mt-4">
                {/* Key stats */}
                <div className="grid grid-cols-4 gap-4">
                  <div className="text-center p-3 bg-muted rounded-lg">
                    <p className="text-2xl font-bold">
                      {player.averagePoints?.toFixed(1) ?? "-"}
                    </p>
                    <p className="text-xs text-muted-foreground">Avg Points</p>
                  </div>
                  <div className="text-center p-3 bg-muted rounded-lg">
                    <p className="text-2xl font-bold">{player.highScore ?? "-"}</p>
                    <p className="text-xs text-muted-foreground">High</p>
                  </div>
                  <div className="text-center p-3 bg-muted rounded-lg">
                    <p className="text-2xl font-bold">{player.lowScore ?? "-"}</p>
                    <p className="text-xs text-muted-foreground">Low</p>
                  </div>
                  <div className="text-center p-3 bg-muted rounded-lg">
                    <p className="text-2xl font-bold">{player.gamesPlayed}</p>
                    <p className="text-xs text-muted-foreground">Games</p>
                  </div>
                </div>

                {player.last5Avg && (
                  <div className="p-3 bg-muted/50 rounded-lg">
                    <p className="text-sm">
                      <span className="text-muted-foreground">Last 5 Average:</span>{" "}
                      <span className="font-semibold">{player.last5Avg.toFixed(1)}</span>
                    </p>
                  </div>
                )}

                {/* Season breakdown */}
                {player.seasonStats.length > 0 && (
                  <div>
                    <h4 className="font-semibold mb-2">Season Breakdown</h4>
                    <div className="space-y-2">
                      {player.seasonStats.map((season) => (
                        <div
                          key={season.season}
                          className="flex justify-between items-center p-2 border rounded"
                        >
                          <span className="font-medium">{season.season}</span>
                          <div className="flex gap-4 text-sm">
                            <span>{season.gamesPlayed} games</span>
                            <span>{season.averagePoints.toFixed(1)} avg</span>
                            <span className="text-muted-foreground">
                              {season.totalPoints} total
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </TabsContent>

              <TabsContent value="contract" className="space-y-4 mt-4">
                {player.currentContract ? (
                  <div className="p-4 border rounded-lg bg-green-50 dark:bg-green-950/20">
                    <h4 className="font-semibold text-green-700 dark:text-green-400 mb-2">
                      Current Contract
                    </h4>
                    <div className="grid grid-cols-2 gap-2 text-sm">
                      <div>
                        <span className="text-muted-foreground">Club:</span>{" "}
                        <span className="font-medium">
                          {player.currentContract.clubName}
                        </span>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Value:</span>{" "}
                        <span className="font-medium">
                          ${player.currentContract.salary}k
                        </span>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Started:</span>{" "}
                        {player.currentContract.startSeason}
                      </div>
                      <div>
                        <span className="text-muted-foreground">Ends:</span>{" "}
                        {player.currentContract.endSeason}
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="p-4 border rounded-lg text-center">
                    <Badge variant="secondary" className="bg-green-100 text-green-800">
                      Free Agent
                    </Badge>
                    <p className="text-sm text-muted-foreground mt-2">
                      This player is available for signing
                    </p>
                  </div>
                )}
              </TabsContent>

              <TabsContent value="history" className="space-y-4 mt-4">
                <h4 className="font-semibold">Sicko League Contract History</h4>
                {player.contractHistory.length === 0 ? (
                  <p className="text-muted-foreground text-sm py-4 text-center">
                    No previous contracts in Sicko League
                  </p>
                ) : (
                  <div className="space-y-2">
                    {player.contractHistory.map((contract, i) => (
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
                          <p className="text-sm text-muted-foreground">
                            {contract.gamesPlayed} games
                          </p>
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
            Player not found
          </p>
        )}
      </DialogContent>
    </Dialog>
  );
}
