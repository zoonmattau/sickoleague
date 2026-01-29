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
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
} from "recharts";
import { getClubHfaHistory, getClubMatchHistory } from "../roster/actions";

type HfaSummary = {
  current: number;
  change: number;
  gamesPlayed: number;
};

type MatchHistory = {
  roundNumber: number;
  seasonYear: number;
  matchType: string;
  myScore: number;
  oppScore: number;
  margin: number;
  opponentName: string;
  opponentAbbr: string;
  opponentPrimaryColor: string | null;
  opponentSecondaryColor: string | null;
  isHome: boolean;
};

type HfaHistory = {
  gameNumber: number;
  matchType: string;
  margin: number;
  roundNumber: number;
  seasonYear: number;
};

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  clubId: string;
  matchType: "SENIORS" | "RESERVES";
  hfaSummary: HfaSummary;
};

export function HfaDetailDialog({
  open,
  onOpenChange,
  clubId,
  matchType,
  hfaSummary,
}: Props) {
  const [hfaHistory, setHfaHistory] = useState<HfaHistory[]>([]);
  const [matchHistory, setMatchHistory] = useState<MatchHistory[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (open && clubId) {
      setLoading(true);
      Promise.all([
        getClubHfaHistory(clubId),
        getClubMatchHistory(clubId),
      ]).then(([hfa, matches]) => {
        setHfaHistory(hfa);
        setMatchHistory(matches);
        setLoading(false);
      });
    }
  }, [open, clubId]);

  const filteredHfaHistory = hfaHistory.filter(h => h.matchType === matchType);
  const filteredMatchHistory = matchHistory.filter(m => m.matchType === matchType && m.isHome);

  // Calculate running HFA for chart
  const calcHfaValue = (margin: number) => margin < 0 ? margin / 2 : margin;
  const chartData = filteredHfaHistory.map((h, idx) => {
    const last10 = filteredHfaHistory.slice(Math.max(0, idx - 9), idx + 1);
    const hfa = last10.reduce((sum, r) => sum + calcHfaValue(r.margin), 0) / last10.length;
    return {
      game: h.gameNumber,
      round: `R${h.roundNumber}`,
      margin: h.margin,
      hfa: Math.round(hfa * 10) / 10,
    };
  });

  // Last 10 home games for table
  const last10Games = filteredMatchHistory.slice(-10).reverse();

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {matchType === "SENIORS" ? "Seniors" : "Reserves"} Home Field Advantage
          </DialogTitle>
        </DialogHeader>

        {loading ? (
          <div className="py-8 text-center text-muted-foreground">Loading...</div>
        ) : (
          <div className="space-y-6">
            {/* Summary Stats */}
            <div className="grid grid-cols-3 gap-4">
              <div className="p-4 rounded-lg bg-muted/50 text-center">
                <div className={`text-2xl font-bold ${hfaSummary.current >= 0 ? "text-green-500" : "text-red-500"}`}>
                  {hfaSummary.current >= 0 ? "+" : ""}{hfaSummary.current}
                </div>
                <div className="text-sm text-muted-foreground">Current HFA</div>
              </div>
              <div className="p-4 rounded-lg bg-muted/50 text-center">
                <div className={`text-2xl font-bold ${hfaSummary.change >= 0 ? "text-green-500" : "text-red-500"}`}>
                  {hfaSummary.change >= 0 ? "+" : ""}{hfaSummary.change}
                </div>
                <div className="text-sm text-muted-foreground">Last Change</div>
              </div>
              <div className="p-4 rounded-lg bg-muted/50 text-center">
                <div className="text-2xl font-bold">{hfaSummary.gamesPlayed}</div>
                <div className="text-sm text-muted-foreground">Home Games</div>
              </div>
            </div>

            {/* HFA Calculation Explanation */}
            <div className="p-3 rounded-lg bg-muted/30 text-sm">
              <p className="font-medium mb-1">How HFA is calculated:</p>
              <ul className="text-muted-foreground space-y-0.5 text-xs">
                <li>Average of last 10 home game margins</li>
                <li>Wins count full margin (+X points)</li>
                <li>Losses count half margin (-X/2 points) to not punish losing teams too harshly</li>
              </ul>
            </div>

            <Tabs defaultValue="chart">
              <TabsList>
                <TabsTrigger value="chart">Trend</TabsTrigger>
                <TabsTrigger value="games">Last 10 Games</TabsTrigger>
              </TabsList>

              <TabsContent value="chart" className="mt-4">
                {chartData.length > 0 ? (
                  <div className="h-64">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={chartData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                        <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                        <XAxis dataKey="round" className="text-xs" />
                        <YAxis className="text-xs" />
                        <Tooltip
                          contentStyle={{ backgroundColor: "hsl(var(--background))", border: "1px solid hsl(var(--border))" }}
                          formatter={(value: number, name: string) => [
                            name === "hfa" ? `${value >= 0 ? "+" : ""}${value}` : value,
                            name === "hfa" ? "HFA" : "Margin",
                          ]}
                        />
                        <ReferenceLine y={0} stroke="hsl(var(--muted-foreground))" />
                        <Line
                          type="monotone"
                          dataKey="hfa"
                          stroke="hsl(var(--primary))"
                          strokeWidth={2}
                          dot={false}
                        />
                        <Line
                          type="monotone"
                          dataKey="margin"
                          stroke="hsl(var(--muted-foreground))"
                          strokeWidth={1}
                          strokeDasharray="3 3"
                          dot={false}
                        />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                ) : (
                  <div className="py-8 text-center text-muted-foreground">No home games yet</div>
                )}
              </TabsContent>

              <TabsContent value="games" className="mt-4">
                {last10Games.length > 0 ? (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Round</TableHead>
                        <TableHead>Opponent</TableHead>
                        <TableHead className="text-center">Score</TableHead>
                        <TableHead className="text-right">Margin</TableHead>
                        <TableHead className="text-right">Result</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {last10Games.map((game, idx) => (
                        <TableRow key={idx}>
                          <TableCell className="text-muted-foreground">
                            R{game.roundNumber}
                          </TableCell>
                          <TableCell>
                            <span
                              className="px-2 py-0.5 rounded text-xs font-semibold"
                              style={{
                                backgroundColor: game.opponentPrimaryColor || "#6b7280",
                                color: game.opponentSecondaryColor || "#ffffff",
                              }}
                            >
                              {game.opponentAbbr}
                            </span>
                          </TableCell>
                          <TableCell className="text-center font-medium">
                            {game.myScore.toFixed(0)} - {game.oppScore.toFixed(0)}
                          </TableCell>
                          <TableCell className={`text-right font-semibold ${game.margin >= 0 ? "text-green-600" : "text-red-600"}`}>
                            {game.margin >= 0 ? "+" : ""}{game.margin.toFixed(0)}
                          </TableCell>
                          <TableCell className="text-right">
                            {game.margin > 0 ? (
                              <Badge variant="default" className="bg-green-600">W</Badge>
                            ) : game.margin < 0 ? (
                              <Badge variant="destructive">L</Badge>
                            ) : (
                              <Badge variant="secondary">D</Badge>
                            )}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                ) : (
                  <div className="py-8 text-center text-muted-foreground">No home games yet</div>
                )}
              </TabsContent>
            </Tabs>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
