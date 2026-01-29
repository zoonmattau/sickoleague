"use client";

import { useState, useEffect } from "react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import {
  ResponsiveContainer,
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  Cell,
} from "recharts";
import {
  toggleTradeBlock,
  releaseContract,
  getPlayerRosterHistory,
  getPlayerScoreHistory,
  getPlayerSeasonAverages,
  getPlayerContractHistory,
} from "./roster/actions";
import { getPositionCombinedClasses } from "@/lib/position-colors";
import type { SerializedContract, PlayerStats } from "./types";

function formatSalary(value: number): string {
  return `$${(value * 1000).toLocaleString()}`;
}

function PositionBadge({ pos }: { pos: string }) {
  const colors = getPositionCombinedClasses(pos);
  return (
    <span className={`inline-flex items-center rounded-md border font-medium text-xs px-1.5 py-0 h-5 ${colors}`}>
      {pos}
    </span>
  );
}

type HistoryEntry = {
  id: string;
  previousSquad: string | null;
  previousSpot: string | null;
  newSquad: string;
  newSpot: string;
  changedAt: string;
  roundNumber: number;
  seasonYear: number;
};

type ScoreEntry = {
  roundNumber: number;
  seasonYear: number;
  score: number;
  matchType: string;
};

type SeasonAvg = {
  season: number;
  avgScore: number;
  gamesPlayed: number;
};

type ContractYearEntry = {
  season: number;
  value: number;
  clubName: string;
  clubAbbr: string;
  clubColor: string | null;
  contractType: string;
};

type PlayerDetailPanelProps = {
  contract: SerializedContract | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  playerStats: Map<string, PlayerStats>;
  myClubId?: string | null;
  playerClubId?: string | null;
  playerClubName?: string | null;
  onProposeTrade?: (contractId: string) => void;
  onToggleShortlist?: (contractId: string) => void;
  isOnShortlist?: boolean;
};

export function PlayerDetailPanel({
  contract,
  open,
  onOpenChange,
  playerStats,
  myClubId,
  playerClubId,
  playerClubName,
  onProposeTrade,
  onToggleShortlist,
  isOnShortlist,
}: PlayerDetailPanelProps) {
  const isForeignPlayer = myClubId && playerClubId && myClubId !== playerClubId;
  const [tradeBlockState, setTradeBlockState] = useState(false);
  const [history, setHistory] = useState<HistoryEntry[]>([]);
  const [historyLoaded, setHistoryLoaded] = useState(false);
  const [loadingHistory, setLoadingHistory] = useState(false);
  const [confirmRelease, setConfirmRelease] = useState(false);
  const [releasing, setReleasing] = useState(false);
  const [toggling, setToggling] = useState(false);

  // Chart data
  const [scoreHistory, setScoreHistory] = useState<ScoreEntry[]>([]);
  const [seasonAverages, setSeasonAverages] = useState<SeasonAvg[]>([]);
  const [contractHistory, setContractHistory] = useState<ContractYearEntry[]>([]);
  const [chartsLoaded, setChartsLoaded] = useState(false);
  const [loadingCharts, setLoadingCharts] = useState(false);

  // Reset state when contract changes
  useEffect(() => {
    if (contract) {
      setTradeBlockState(contract.tradeBlock);
      setHistoryLoaded(false);
      setHistory([]);
      setConfirmRelease(false);
      setChartsLoaded(false);
      setScoreHistory([]);
      setSeasonAverages([]);
      setContractHistory([]);
    }
  }, [contract?.id]);

  // Load chart data when panel opens
  useEffect(() => {
    if (open && contract && !chartsLoaded && !loadingCharts) {
      setLoadingCharts(true);
      Promise.all([
        getPlayerScoreHistory(contract.id),
        getPlayerSeasonAverages(contract.aflPlayer.id),
        getPlayerContractHistory(contract.aflPlayer.id),
      ]).then(([scores, averages, contracts]) => {
        setScoreHistory(scores);
        setSeasonAverages(averages);
        setContractHistory(contracts);
        setChartsLoaded(true);
        setLoadingCharts(false);
      });
    }
  }, [open, contract?.id]);

  if (!contract) return null;

  const player = contract.aflPlayer;
  const stats = playerStats.get(contract.id);
  const breakdown = contract.yearBreakdown;

  const handleToggleTradeBlock = async () => {
    setToggling(true);
    const optimistic = !tradeBlockState;
    setTradeBlockState(optimistic);

    const result = await toggleTradeBlock(contract.id);
    if (result.error) {
      setTradeBlockState(!optimistic);
      toast.error(result.error);
    } else {
      toast.success(optimistic ? "Player added to trade block" : "Player removed from trade block");
    }
    setToggling(false);
  };

  const handleRelease = async () => {
    if (!confirmRelease) {
      setConfirmRelease(true);
      return;
    }
    setReleasing(true);
    const result = await releaseContract(contract.id);
    if (result.error) {
      toast.error(result.error);
    } else {
      toast.success("Contract released");
      onOpenChange(false);
    }
    setReleasing(false);
    setConfirmRelease(false);
  };

  const loadHistory = async () => {
    if (historyLoaded) return;
    setLoadingHistory(true);
    const data = await getPlayerRosterHistory(contract.id);
    setHistory(data);
    setHistoryLoaded(true);
    setLoadingHistory(false);
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-full sm:max-w-lg overflow-y-auto">
        <SheetHeader>
          <SheetTitle>
            {player.firstName} {player.lastName}
          </SheetTitle>
          <SheetDescription>
            {player.aflTeam?.name ?? "No AFL team"} — {player.positions.join(", ")}
          </SheetDescription>
        </SheetHeader>

        <Tabs defaultValue="overview" className="mt-4 px-4">
          <TabsList className="w-full">
            <TabsTrigger value="overview" className="flex-1">Overview</TabsTrigger>
            <TabsTrigger value="stats" className="flex-1">Stats</TabsTrigger>
            <TabsTrigger value="history" className="flex-1" onClick={loadHistory}>
              History
            </TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-4 mt-4">
            {/* Player Info */}
            <div className="space-y-2">
              <div className="flex items-center gap-2 flex-wrap">
                {player.positions.map((pos) => (
                  <PositionBadge key={pos} pos={pos} />
                ))}
                <Badge variant="outline">{contract.contractType}</Badge>
                {tradeBlockState && (
                  <Badge variant="destructive">Trade Block</Badge>
                )}
              </div>
            </div>

            {/* Performance summary */}
            <div className="rounded-md border p-3">
              <div className="text-sm font-medium mb-1">Performance</div>
              <div className="flex gap-4 text-sm">
                <div>
                  <span className="text-muted-foreground">Avg Score: </span>
                  <span className="font-medium">
                    {stats && stats.gamesPlayed > 0 ? stats.avgScore : "—"}
                  </span>
                </div>
                <div>
                  <span className="text-muted-foreground">Games: </span>
                  <span className="font-medium">
                    {stats ? stats.gamesPlayed : 0}
                  </span>
                </div>
              </div>
            </div>

            {/* Contract Details */}
            <div className="rounded-md border p-3 space-y-2">
              <div className="text-sm font-medium">Contract Details</div>
              <div className="grid grid-cols-2 gap-2 text-sm">
                <div>
                  <span className="text-muted-foreground">Total Value</span>
                  <div className="font-medium">{formatSalary(contract.totalValue)}</div>
                </div>
                <div>
                  <span className="text-muted-foreground">Duration</span>
                  <div className="font-medium">
                    {contract.startSeason}–{contract.endSeason}
                  </div>
                </div>
                <div>
                  <span className="text-muted-foreground">Type</span>
                  <div className="font-medium">{contract.contractType}</div>
                </div>
                <div>
                  <span className="text-muted-foreground">Minimum</span>
                  <div className="font-medium">{contract.isMinimum ? "Yes" : "No"}</div>
                </div>
              </div>
            </div>

            {/* Year Breakdown */}
            <div className="rounded-md border p-3 space-y-2">
              <div className="text-sm font-medium">Year Breakdown</div>
              <div className="space-y-1">
                {breakdown.map((yr) => (
                  <div
                    key={yr.season}
                    className="flex justify-between text-sm py-1 px-2 rounded bg-muted/50"
                  >
                    <span>{yr.season}</span>
                    <span className="font-mono">{formatSalary(yr.value)}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Actions - Different for foreign vs own players */}
            {isForeignPlayer ? (
              <div className="space-y-2 pt-2">
                {playerClubName && (
                  <div className="text-sm text-muted-foreground text-center mb-2">
                    Owned by {playerClubName}
                  </div>
                )}
                <Button
                  variant="default"
                  className="w-full"
                  onClick={() => onProposeTrade?.(contract.id)}
                >
                  Propose Trade
                </Button>
                <Button
                  variant={isOnShortlist ? "outline" : "secondary"}
                  className="w-full"
                  onClick={() => onToggleShortlist?.(contract.id)}
                >
                  {isOnShortlist ? "Remove from Shortlist" : "Add to Shortlist"}
                </Button>
              </div>
            ) : (
              <div className="space-y-2 pt-2">
                <Button
                  variant={tradeBlockState ? "outline" : "secondary"}
                  className="w-full"
                  onClick={handleToggleTradeBlock}
                  disabled={toggling}
                >
                  {tradeBlockState ? "Remove from Trade Block" : "Add to Trade Block"}
                </Button>
                <Button
                  variant="destructive"
                  className="w-full"
                  onClick={handleRelease}
                  disabled={releasing}
                >
                  {confirmRelease
                    ? "Confirm Release — This cannot be undone"
                    : "Release Player"}
                </Button>
                {confirmRelease && (
                  <Button
                    variant="ghost"
                    className="w-full"
                    onClick={() => setConfirmRelease(false)}
                  >
                    Cancel
                  </Button>
                )}
              </div>
            )}
          </TabsContent>

          <TabsContent value="stats" className="space-y-4 mt-4">
            {loadingCharts ? (
              <p className="text-muted-foreground text-center py-4 text-sm">
                Loading stats...
              </p>
            ) : (
              <>
                {/* Current season round-by-round scores */}
                <div className="rounded-md border p-3 space-y-2">
                  <div className="text-sm font-medium">Current Season Scores</div>
                  {scoreHistory.length === 0 ? (
                    <p className="text-xs text-muted-foreground py-2">No scores recorded yet</p>
                  ) : (
                    <div className="h-40">
                      <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={scoreHistory}>
                          <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                          <XAxis
                            dataKey="roundNumber"
                            tick={{ fontSize: 11 }}
                            tickFormatter={(v) => `R${v}`}
                          />
                          <YAxis tick={{ fontSize: 11 }} domain={[0, "auto"]} />
                          <Tooltip
                            labelFormatter={(v) => `Round ${v}`}
                            formatter={(v) => [`${v}`, "Score"]}
                            contentStyle={{ fontSize: 12 }}
                          />
                          <Line
                            type="monotone"
                            dataKey="score"
                            stroke="hsl(var(--primary))"
                            strokeWidth={2}
                            dot={{ r: 3 }}
                          />
                        </LineChart>
                      </ResponsiveContainer>
                    </div>
                  )}
                </div>

                {/* Season averages */}
                <div className="rounded-md border p-3 space-y-2">
                  <div className="text-sm font-medium">Season Averages</div>
                  {seasonAverages.length === 0 ? (
                    <p className="text-xs text-muted-foreground py-2">No season data</p>
                  ) : (
                    <div className="h-40">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={seasonAverages}>
                          <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                          <XAxis dataKey="season" tick={{ fontSize: 11 }} />
                          <YAxis tick={{ fontSize: 11 }} domain={[0, "auto"]} />
                          <Tooltip
                            formatter={(v, name) => {
                              if (name === "avgScore") return [`${v}`, "Avg Score"];
                              return [`${v}`, name];
                            }}
                            contentStyle={{ fontSize: 12 }}
                          />
                          <Bar dataKey="avgScore" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  )}
                </div>

                {/* Contract value history — per year, coloured by team */}
                <div className="rounded-md border p-3 space-y-2">
                  <div className="text-sm font-medium">Contract History (per year)</div>
                  {contractHistory.length === 0 ? (
                    <p className="text-xs text-muted-foreground py-2">No contract history</p>
                  ) : (
                    <>
                      <div className="h-44">
                        <ResponsiveContainer width="100%" height="100%">
                          <BarChart
                            data={contractHistory.map((c) => ({
                              season: String(c.season),
                              value: c.value * 1000,
                              clubColor: c.clubColor ?? "hsl(var(--chart-2))",
                              clubAbbr: c.clubAbbr,
                            }))}
                          >
                            <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                            <XAxis dataKey="season" tick={{ fontSize: 10 }} />
                            <YAxis
                              tick={{ fontSize: 11 }}
                              tickFormatter={(v) => `$${(v / 1000).toFixed(0)}k`}
                            />
                            <Tooltip
                              content={({ active, payload }) => {
                                if (!active || !payload?.length) return null;
                                const d = payload[0].payload;
                                return (
                                  <div className="bg-popover border rounded-md p-2 text-xs shadow-md">
                                    <div className="font-medium">{d.season} — {d.clubAbbr}</div>
                                    <div>${Number(d.value).toLocaleString()}</div>
                                  </div>
                                );
                              }}
                            />
                            <Bar dataKey="value" radius={[4, 4, 0, 0]}>
                              {contractHistory.map((c, i) => (
                                <Cell
                                  key={i}
                                  fill={c.clubColor ?? "hsl(var(--chart-2))"}
                                />
                              ))}
                            </Bar>
                          </BarChart>
                        </ResponsiveContainer>
                      </div>
                      {/* Legend */}
                      <div className="flex flex-wrap gap-2 mt-1">
                        {Array.from(new Set(contractHistory.map((c) => c.clubAbbr))).map((abbr) => {
                          const entry = contractHistory.find((c) => c.clubAbbr === abbr)!;
                          return (
                            <div key={abbr} className="flex items-center gap-1 text-xs">
                              <div
                                className="h-3 w-3 rounded-sm"
                                style={{ backgroundColor: entry.clubColor ?? "hsl(var(--chart-2))" }}
                              />
                              <span>{entry.clubName}</span>
                            </div>
                          );
                        })}
                      </div>
                    </>
                  )}
                </div>
              </>
            )}
          </TabsContent>

          <TabsContent value="history" className="mt-4">
            {loadingHistory ? (
              <p className="text-muted-foreground text-center py-4 text-sm">
                Loading history...
              </p>
            ) : history.length === 0 ? (
              <p className="text-muted-foreground text-center py-4 text-sm">
                No roster history recorded
              </p>
            ) : (
              <div className="space-y-2">
                {history.map((h) => (
                  <div
                    key={h.id}
                    className="text-sm py-2 px-3 rounded-md border"
                  >
                    <div className="font-medium">
                      S{h.seasonYear} Round {h.roundNumber}
                    </div>
                    <div className="text-muted-foreground">
                      {h.previousSpot
                        ? `${h.previousSpot} → ${h.newSpot}`
                        : `Assigned to ${h.newSpot}`}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </SheetContent>
    </Sheet>
  );
}
