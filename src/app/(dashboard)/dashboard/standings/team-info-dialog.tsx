"use client";

import { useEffect, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { TrendingUp, TrendingDown, Minus, Home } from "lucide-react";
import {
  getTeamBestPlayers,
  getTeamRecentGames,
  getTeamFormAnalysis,
} from "./actions";
import { getClubHfaSummary } from "../roster/actions";
import { getPositionColorClasses } from "@/lib/position-colors";

type Standing = {
  id: string;
  played: number;
  wins: number;
  losses: number;
  draws: number;
  pointsFor: number;
  pointsAgainst: number;
  percentage: number;
  club: {
    id: string;
    name: string;
    abbreviation: string;
    reservesName: string | null;
    primaryColor: string | null;
    secondaryColor: string | null;
  };
};

type BestPlayer = {
  contractId: string;
  playerName: string;
  positions: string[];
  aflTeam: string | null;
  avgScore: number;
  gamesPlayed: number;
};

type RecentGame = {
  roundNumber: number;
  seasonYear: number;
  matchType: string;
  myScore: number;
  oppScore: number;
  margin: number;
  result: string;
  opponent: {
    id: string;
    name: string;
    abbreviation: string;
    primaryColor: string | null;
    secondaryColor: string | null;
  };
  isHome: boolean;
};

type FormAnalysis = {
  streak: number;
  streakType: "W" | "L" | "D" | null;
  last5: ("W" | "L" | "D")[];
  winRate: number;
  avgMargin: number;
  trend: "up" | "down" | "neutral";
};

type HfaSummary = {
  seniors: { current: number; change: number; gamesPlayed: number };
  reserves: { current: number; change: number; gamesPlayed: number };
};

type Props = {
  standing: Standing | null;
  standings: Standing[];
  isReserves: boolean;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onPlayerClick?: (contractId: string, playerName: string) => void;
};

export function TeamInfoDialog({
  standing,
  standings,
  isReserves,
  open,
  onOpenChange,
  onPlayerClick,
}: Props) {
  const [loading, setLoading] = useState(false);
  const [bestPlayers, setBestPlayers] = useState<BestPlayer[]>([]);
  const [recentGames, setRecentGames] = useState<RecentGame[]>([]);
  const [formAnalysis, setFormAnalysis] = useState<{
    seniors: FormAnalysis;
    reserves: FormAnalysis;
  } | null>(null);
  const [hfaSummary, setHfaSummary] = useState<HfaSummary | null>(null);

  useEffect(() => {
    if (open && standing) {
      setLoading(true);
      Promise.all([
        getTeamBestPlayers(standing.club.id, 5),
        getTeamRecentGames(standing.club.id, 5),
        getTeamFormAnalysis(standing.club.id),
        getClubHfaSummary(standing.club.id),
      ]).then(([players, games, form, hfa]) => {
        setBestPlayers(players);
        setRecentGames(games);
        setFormAnalysis(form);
        setHfaSummary(hfa);
        setLoading(false);
      });
    }
  }, [open, standing]);

  if (!standing) return null;

  const position = standings.findIndex((s) => s.id === standing.id) + 1;
  const points = standing.wins * 4 + standing.draws * 2;
  const matchType = isReserves ? "RESERVES" : "SENIORS";
  const filteredGames = recentGames.filter((g) => g.matchType === matchType);
  const form = formAnalysis ? (isReserves ? formAnalysis.reserves : formAnalysis.seniors) : null;

  const TrendIcon = form?.trend === "up" ? TrendingUp : form?.trend === "down" ? TrendingDown : Minus;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <span
              className="px-3 py-1 rounded font-semibold"
              style={{
                backgroundColor: standing.club.primaryColor || "#6b7280",
                color: standing.club.secondaryColor || "#ffffff",
              }}
            >
              {isReserves
                ? (standing.club.reservesName ?? standing.club.name)
                : standing.club.name}
            </span>
          </DialogTitle>
        </DialogHeader>

        <Tabs defaultValue="overview">
          <TabsList className="w-full">
            <TabsTrigger value="overview" className="flex-1">Overview</TabsTrigger>
            <TabsTrigger value="players" className="flex-1">Top Players</TabsTrigger>
            <TabsTrigger value="form" className="flex-1">Form</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="mt-4 space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <div className="text-xs text-muted-foreground">Position</div>
                <div className="text-2xl font-bold">
                  {position}
                  <span className="text-sm text-muted-foreground ml-1">
                    {position <= 4 ? " (Finals)" : ""}
                  </span>
                </div>
              </div>
              <div className="space-y-1">
                <div className="text-xs text-muted-foreground">Points</div>
                <div className="text-2xl font-bold">{points}</div>
              </div>
            </div>

            <div className="grid grid-cols-4 gap-2 text-center">
              <div className="p-2 bg-muted rounded">
                <div className="text-xs text-muted-foreground">Played</div>
                <div className="font-semibold">{standing.played}</div>
              </div>
              <div className="p-2 bg-green-500/10 rounded">
                <div className="text-xs text-muted-foreground">Wins</div>
                <div className="font-semibold text-green-600">{standing.wins}</div>
              </div>
              <div className="p-2 bg-yellow-500/10 rounded">
                <div className="text-xs text-muted-foreground">Draws</div>
                <div className="font-semibold text-yellow-600">{standing.draws}</div>
              </div>
              <div className="p-2 bg-red-500/10 rounded">
                <div className="text-xs text-muted-foreground">Losses</div>
                <div className="font-semibold text-red-600">{standing.losses}</div>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-2 text-center">
              <div className="p-2 bg-muted rounded">
                <div className="text-xs text-muted-foreground">Points For</div>
                <div className="font-semibold">{standing.pointsFor}</div>
              </div>
              <div className="p-2 bg-muted rounded">
                <div className="text-xs text-muted-foreground">Points Against</div>
                <div className="font-semibold">{standing.pointsAgainst}</div>
              </div>
              <div className="p-2 bg-muted rounded">
                <div className="text-xs text-muted-foreground">Percentage</div>
                <div className="font-semibold">{standing.percentage.toFixed(1)}%</div>
              </div>
            </div>

            <div className="text-xs text-muted-foreground text-center pt-2 border-t">
              Win Rate: {standing.played > 0 ? ((standing.wins / standing.played) * 100).toFixed(0) : 0}%
            </div>
          </TabsContent>

          <TabsContent value="players" className="mt-4">
            {loading ? (
              <div className="py-8 text-center text-muted-foreground">Loading...</div>
            ) : bestPlayers.length > 0 ? (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>#</TableHead>
                    <TableHead>Player</TableHead>
                    <TableHead>Position</TableHead>
                    <TableHead className="text-right">Avg</TableHead>
                    <TableHead className="text-right">Games</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {bestPlayers.map((player, idx) => (
                    <TableRow
                      key={player.contractId}
                      className={onPlayerClick ? "cursor-pointer hover:bg-muted/50" : ""}
                      onClick={() => onPlayerClick?.(player.contractId, player.playerName)}
                    >
                      <TableCell className="font-medium">{idx + 1}</TableCell>
                      <TableCell>
                        <div>
                          <div className="font-medium hover:underline">{player.playerName}</div>
                          <div className="text-xs text-muted-foreground">{player.aflTeam || "-"}</div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-1">
                          {player.positions.map((pos) => (
                            <Badge
                              key={pos}
                              variant="outline"
                              className={`text-xs border-0 ${getPositionColorClasses(pos)}`}
                            >
                              {pos}
                            </Badge>
                          ))}
                        </div>
                      </TableCell>
                      <TableCell className="text-right font-semibold">
                        {player.avgScore.toFixed(1)}
                      </TableCell>
                      <TableCell className="text-right text-muted-foreground">
                        {player.gamesPlayed}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            ) : (
              <div className="py-8 text-center text-muted-foreground">No player data yet</div>
            )}
          </TabsContent>

          <TabsContent value="form" className="mt-4 space-y-4">
            {loading ? (
              <div className="py-8 text-center text-muted-foreground">Loading...</div>
            ) : form ? (
              <>
                {/* Form Summary with HFA */}
                <div className="grid grid-cols-4 gap-3">
                  <div className="p-3 rounded-lg bg-muted/50 text-center">
                    <div className="text-xl font-bold">
                      {form.streak > 0 && form.streakType ? (
                        <span className={
                          form.streakType === "W" ? "text-green-600" :
                          form.streakType === "L" ? "text-red-600" : ""
                        }>
                          {form.streak}{form.streakType}
                        </span>
                      ) : "-"}
                    </div>
                    <div className="text-xs text-muted-foreground">Streak</div>
                  </div>
                  <div className="p-3 rounded-lg bg-muted/50 text-center">
                    <div className="text-xl font-bold">{form.winRate}%</div>
                    <div className="text-xs text-muted-foreground">Win Rate</div>
                  </div>
                  <div className="p-3 rounded-lg bg-muted/50 text-center">
                    <div className="flex items-center justify-center gap-1">
                      <TrendIcon className={`h-4 w-4 ${
                        form.trend === "up" ? "text-green-600" :
                        form.trend === "down" ? "text-red-600" : "text-muted-foreground"
                      }`} />
                      <span className={`text-xl font-bold ${
                        form.avgMargin >= 0 ? "text-green-600" : "text-red-600"
                      }`}>
                        {form.avgMargin >= 0 ? "+" : ""}{form.avgMargin}
                      </span>
                    </div>
                    <div className="text-xs text-muted-foreground">Avg Margin</div>
                  </div>
                  <div className="p-3 rounded-lg bg-muted/50 text-center">
                    {hfaSummary && (
                      <>
                        <div className="flex items-center justify-center gap-1">
                          <Home className="h-4 w-4 text-muted-foreground" />
                          <span className={`text-xl font-bold ${
                            (isReserves ? hfaSummary.reserves.current : hfaSummary.seniors.current) >= 0
                              ? "text-green-600" : "text-red-600"
                          }`}>
                            {(isReserves ? hfaSummary.reserves.current : hfaSummary.seniors.current) >= 0 ? "+" : ""}
                            {isReserves ? hfaSummary.reserves.current : hfaSummary.seniors.current}
                          </span>
                        </div>
                        <div className="text-xs text-muted-foreground">HFA</div>
                      </>
                    )}
                    {!hfaSummary && <div className="text-xl font-bold">-</div>}
                  </div>
                </div>

                {/* Last 5 Results with tooltips */}
                <div>
                  <h4 className="text-sm font-semibold mb-2">Last 5 Results</h4>
                  <div className="flex gap-2">
                    {form.last5.map((result, idx) => {
                      const game = filteredGames[idx];
                      return (
                        <div
                          key={idx}
                          className={`w-10 h-10 rounded-lg flex items-center justify-center font-bold cursor-default ${
                            result === "W" ? "bg-green-500/20 text-green-600" :
                            result === "L" ? "bg-red-500/20 text-red-600" :
                            "bg-yellow-500/20 text-yellow-600"
                          }`}
                          title={game ? `vs ${game.opponent.name} (${game.isHome ? "H" : "A"})\n${game.myScore.toFixed(0)} - ${game.oppScore.toFixed(0)}` : ""}
                        >
                          {result}
                        </div>
                      );
                    })}
                    {form.last5.length === 0 && (
                      <span className="text-muted-foreground text-sm">No games played</span>
                    )}
                  </div>
                </div>

                {/* Recent Games */}
                <div>
                  <h4 className="text-sm font-semibold mb-2">Recent Games</h4>
                  {filteredGames.length > 0 ? (
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Round</TableHead>
                          <TableHead>Opponent</TableHead>
                          <TableHead className="text-center">Score</TableHead>
                          <TableHead className="text-right">Result</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {filteredGames.slice(0, 5).map((game, idx) => (
                          <TableRow key={idx}>
                            <TableCell className="text-muted-foreground">
                              R{game.roundNumber}
                            </TableCell>
                            <TableCell>
                              <div className="flex items-center gap-2">
                                <span
                                  className="px-2 py-0.5 rounded text-xs font-semibold"
                                  style={{
                                    backgroundColor: game.opponent.primaryColor || "#6b7280",
                                    color: game.opponent.secondaryColor || "#ffffff",
                                  }}
                                >
                                  {game.opponent.abbreviation}
                                </span>
                                <span className="text-xs text-muted-foreground">
                                  ({game.isHome ? "H" : "A"})
                                </span>
                              </div>
                            </TableCell>
                            <TableCell className="text-center font-medium">
                              {game.myScore.toFixed(0)} - {game.oppScore.toFixed(0)}
                            </TableCell>
                            <TableCell className="text-right">
                              <Badge
                                variant={game.result === "W" ? "default" : game.result === "L" ? "destructive" : "secondary"}
                                className={game.result === "W" ? "bg-green-600" : ""}
                              >
                                {game.result}
                              </Badge>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  ) : (
                    <div className="text-muted-foreground text-sm">No games played yet</div>
                  )}
                </div>
              </>
            ) : (
              <div className="py-8 text-center text-muted-foreground">No form data available</div>
            )}
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
