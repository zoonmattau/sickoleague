"use client";

import { useEffect, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Swords, Handshake, Trophy } from "lucide-react";
import { getRivalryDetails } from "./rivalry-actions";

type RivalryDetailsData = Awaited<ReturnType<typeof getRivalryDetails>>;

type Props = {
  clubAId: string;
  clubBId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

export function RivalryDetailDialog({ clubAId, clubBId, open, onOpenChange }: Props) {
  const [data, setData] = useState<RivalryDetailsData>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (open) {
      setLoading(true);
      getRivalryDetails(clubAId, clubBId).then((d) => {
        setData(d);
        setLoading(false);
      });
    }
  }, [open, clubAId, clubBId]);

  if (!data && !loading) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {data?.clubA && (
              <>
                <span
                  className="px-2 py-1 rounded text-sm font-semibold"
                  style={{
                    backgroundColor: data.clubA.primaryColor || "#6b7280",
                    color: data.clubA.secondaryColor || "#ffffff",
                  }}
                >
                  {data.clubA.abbreviation}
                </span>
                <span className="text-muted-foreground">vs</span>
                <span
                  className="px-2 py-1 rounded text-sm font-semibold"
                  style={{
                    backgroundColor: data.clubB.primaryColor || "#6b7280",
                    color: data.clubB.secondaryColor || "#ffffff",
                  }}
                >
                  {data.clubB.abbreviation}
                </span>
                {data.isRivals && (
                  <Badge variant="outline" className="bg-orange-500/10 text-orange-600 border-orange-500/30 ml-2">
                    <Swords className="h-3 w-3 mr-1" />
                    Rivals
                  </Badge>
                )}
              </>
            )}
          </DialogTitle>
        </DialogHeader>

        {loading ? (
          <div className="py-8 text-center text-muted-foreground">Loading...</div>
        ) : data ? (
          <div className="space-y-6">
            {/* Head to Head Summary */}
            <div className="grid grid-cols-3 gap-4">
              <div className="p-4 rounded-lg bg-muted/50 text-center">
                <div className="text-3xl font-bold text-green-600">{data.headToHead.winsA}</div>
                <div className="text-sm text-muted-foreground">{data.clubA.name} Wins</div>
              </div>
              <div className="p-4 rounded-lg bg-muted/50 text-center">
                <div className="text-3xl font-bold">{data.headToHead.draws}</div>
                <div className="text-sm text-muted-foreground">Draws</div>
              </div>
              <div className="p-4 rounded-lg bg-muted/50 text-center">
                <div className="text-3xl font-bold text-blue-600">{data.headToHead.winsB}</div>
                <div className="text-sm text-muted-foreground">{data.clubB.name} Wins</div>
              </div>
            </div>

            {/* Rivalry status */}
            {data.isRivals && (
              <div className="p-3 rounded-lg bg-orange-500/10 border border-orange-500/30">
                <div className="flex items-center gap-2 text-orange-600 font-medium">
                  <Swords className="h-4 w-4" />
                  Official Rivals since {data.rivalSeason}
                </div>
                <div className="text-sm text-muted-foreground mt-1">
                  Reason: {data.rivalReason === "FINALS_OPPONENT" ? "Met in Finals" : "Nominated rivalry"}
                </div>
              </div>
            )}

            {/* Tension breakdown */}
            {data.tension && (
              <div className="grid grid-cols-4 gap-2 text-center text-sm">
                <div className="p-2 rounded bg-muted/30">
                  <div className="font-bold text-lg">{data.tension.score}</div>
                  <div className="text-xs text-muted-foreground">Tension Score</div>
                </div>
                <div className="p-2 rounded bg-muted/30">
                  <div className="font-bold">{data.tension.closeMatches}</div>
                  <div className="text-xs text-muted-foreground">Close Matches</div>
                </div>
                <div className="p-2 rounded bg-muted/30">
                  <div className="font-bold">{data.tension.trades}</div>
                  <div className="text-xs text-muted-foreground">Trades</div>
                </div>
                <div className="p-2 rounded bg-muted/30">
                  <div className="font-bold">{data.tension.ladderBattles}</div>
                  <div className="text-xs text-muted-foreground">Ladder Battles</div>
                </div>
              </div>
            )}

            <Tabs defaultValue="matches">
              <TabsList className="w-full">
                <TabsTrigger value="matches" className="flex-1">
                  <Trophy className="h-4 w-4 mr-1" />
                  Matches
                </TabsTrigger>
                <TabsTrigger value="trades" className="flex-1">
                  <Handshake className="h-4 w-4 mr-1" />
                  Trades
                </TabsTrigger>
              </TabsList>

              <TabsContent value="matches" className="mt-4">
                {data.matchHistory.length > 0 ? (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Season</TableHead>
                        <TableHead>Round</TableHead>
                        <TableHead>Type</TableHead>
                        <TableHead className="text-center">Score</TableHead>
                        <TableHead className="text-right">Result</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {data.matchHistory.map((m, idx) => (
                        <TableRow key={idx}>
                          <TableCell className="text-muted-foreground">{m.seasonYear}</TableCell>
                          <TableCell>R{m.roundNumber}</TableCell>
                          <TableCell>
                            <Badge variant="outline" className="text-xs">
                              {m.matchType === "SENIORS" ? "S" : "R"}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-center font-medium">
                            <span className={m.margin > 0 ? "text-green-600" : m.margin < 0 ? "text-blue-600" : ""}>
                              {m.clubAScore.toFixed(0)}
                            </span>
                            <span className="text-muted-foreground mx-1">-</span>
                            <span className={m.margin < 0 ? "text-green-600" : m.margin > 0 ? "text-blue-600" : ""}>
                              {m.clubBScore.toFixed(0)}
                            </span>
                            {Math.abs(m.margin) < 20 && (
                              <Badge variant="secondary" className="ml-2 text-[10px]">Close</Badge>
                            )}
                          </TableCell>
                          <TableCell className="text-right">
                            {m.margin > 0 ? (
                              <span
                                className="px-1.5 py-0.5 rounded text-xs font-semibold"
                                style={{
                                  backgroundColor: data.clubA.primaryColor || "#6b7280",
                                  color: data.clubA.secondaryColor || "#ffffff",
                                }}
                              >
                                {data.clubA.abbreviation}
                              </span>
                            ) : m.margin < 0 ? (
                              <span
                                className="px-1.5 py-0.5 rounded text-xs font-semibold"
                                style={{
                                  backgroundColor: data.clubB.primaryColor || "#6b7280",
                                  color: data.clubB.secondaryColor || "#ffffff",
                                }}
                              >
                                {data.clubB.abbreviation}
                              </span>
                            ) : (
                              <Badge variant="secondary">Draw</Badge>
                            )}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                ) : (
                  <div className="py-8 text-center text-muted-foreground">
                    No match history between these clubs
                  </div>
                )}
              </TabsContent>

              <TabsContent value="trades" className="mt-4">
                {data.trades.length > 0 ? (
                  <div className="space-y-3">
                    {data.trades.map((trade) => (
                      <div key={trade.id} className="p-3 rounded-lg border bg-muted/30">
                        <div className="text-xs text-muted-foreground mb-2">
                          {trade.completedAt
                            ? new Date(trade.completedAt).toLocaleDateString()
                            : "Date unknown"}
                        </div>
                        <div className="space-y-1">
                          {trade.assets.map((asset, idx) => (
                            <div key={idx} className="flex items-center gap-2 text-sm">
                              <span
                                className="px-1.5 py-0.5 rounded text-[10px] font-semibold"
                                style={{
                                  backgroundColor: asset.fromClubId === data.clubA.id
                                    ? data.clubA.primaryColor || "#6b7280"
                                    : data.clubB.primaryColor || "#6b7280",
                                  color: asset.fromClubId === data.clubA.id
                                    ? data.clubA.secondaryColor || "#ffffff"
                                    : data.clubB.secondaryColor || "#ffffff",
                                }}
                              >
                                {asset.fromClubId === data.clubA.id
                                  ? data.clubA.abbreviation
                                  : data.clubB.abbreviation}
                              </span>
                              <span className="text-muted-foreground">sends</span>
                              <span className="font-medium">
                                {asset.playerName || asset.draftPick || asset.type}
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="py-8 text-center text-muted-foreground">
                    No trades between these clubs
                  </div>
                )}
              </TabsContent>
            </Tabs>
          </div>
        ) : null}
      </DialogContent>
    </Dialog>
  );
}
