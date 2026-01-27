"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight } from "lucide-react";
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
  ReferenceLine,
} from "recharts";
import { getClubMatchHistory, getClubHfaHistory, getClubLadderHistory } from "./roster/actions";

type MatchEntry = {
  roundNumber: number;
  seasonYear: number;
  matchType: string;
  myScore: number;
  oppScore: number;
  margin: number;
  opponentName: string;
  opponentAbbr: string;
  isHome: boolean;
};

type HfaEntry = {
  gameNumber: number;
  matchType: string;
  margin: number;
  roundNumber: number;
  seasonYear: number;
};

type LadderEntry = {
  roundNumber: number;
  seasonYear: number;
  matchType: string;
  wins: number;
  losses: number;
  draws: number;
  ladderPosition: number | null;
};

type Screen = "position" | "scores" | "hfa";

const SCREENS: { key: Screen; label: string }[] = [
  { key: "position", label: "Ladder Position" },
  { key: "scores", label: "Match Scores" },
  { key: "hfa", label: "Home Field Advantage" },
];

type TeamGraphsProps = {
  clubId: string;
  clubName: string;
  reservesName: string;
};

export function TeamGraphs({ clubId, clubName, reservesName }: TeamGraphsProps) {
  const [matches, setMatches] = useState<MatchEntry[]>([]);
  const [hfa, setHfa] = useState<HfaEntry[]>([]);
  const [ladder, setLadder] = useState<LadderEntry[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [seniorsScreen, setSeniorsScreen] = useState<Screen>("position");
  const [reservesScreen, setReservesScreen] = useState<Screen>("position");

  useEffect(() => {
    Promise.all([
      getClubMatchHistory(clubId),
      getClubHfaHistory(clubId),
      getClubLadderHistory(clubId),
    ]).then(([m, h, l]) => {
      setMatches(m);
      setHfa(h);
      setLadder(l);
      setLoaded(true);
    });
  }, [clubId]);

  const seniorsMatches = matches.filter((m) => m.matchType === "SENIORS");
  const reservesMatches = matches.filter((m) => m.matchType === "RESERVES");
  const seniorsHfa = hfa.filter((h) => h.matchType === "SENIORS");
  const reservesHfa = hfa.filter((h) => h.matchType === "RESERVES");
  const seniorsLadder = ladder.filter((l) => l.matchType === "SENIORS");
  const reservesLadder = ladder.filter((l) => l.matchType === "RESERVES");

  function cycleScreen(current: Screen, direction: number): Screen {
    const idx = SCREENS.findIndex((s) => s.key === current);
    const next = (idx + direction + SCREENS.length) % SCREENS.length;
    return SCREENS[next].key;
  }

  function renderGraph(
    matchType: string,
    screen: Screen,
    matchData: MatchEntry[],
    hfaData: HfaEntry[],
    ladderData: LadderEntry[]
  ) {
    if (!loaded) {
      return <p className="text-xs text-muted-foreground py-6 text-center">Loading...</p>;
    }

    if (screen === "position") {
      if (ladderData.length === 0) {
        return <p className="text-xs text-muted-foreground py-6 text-center">No matches played yet</p>;
      }

      // Show W-L record per round as a line chart. Y-axis = wins, X-axis = round.
      // If ladder position available, show that (inverted so 1st is top)
      const hasPosition = ladderData.some((l) => l.ladderPosition !== null);

      const chartData = ladderData.map((l) => ({
        round: `R${l.roundNumber}`,
        wins: l.wins,
        record: `${l.wins}-${l.losses}${l.draws > 0 ? `-${l.draws}` : ""}`,
        position: l.ladderPosition,
      }));

      return (
        <div className="h-44">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
              <XAxis dataKey="round" tick={{ fontSize: 10 }} />
              <YAxis
                tick={{ fontSize: 10 }}
                reversed={hasPosition}
                domain={hasPosition ? [1, "auto"] : [0, "auto"]}
                label={hasPosition ? { value: "Pos", angle: -90, position: "insideLeft", style: { fontSize: 10 } } : undefined}
              />
              <Tooltip
                content={({ active, payload }) => {
                  if (!active || !payload?.length) return null;
                  const d = payload[0].payload;
                  return (
                    <div className="bg-popover border rounded-md p-2 text-xs shadow-md">
                      <div className="font-medium">{d.round}</div>
                      <div>Record: {d.record}</div>
                      {d.position && <div>Position: {d.position}</div>}
                    </div>
                  );
                }}
              />
              {hasPosition ? (
                <Line
                  type="monotone"
                  dataKey="position"
                  stroke="hsl(var(--primary))"
                  strokeWidth={2}
                  dot={{ r: 3 }}
                />
              ) : (
                <Line
                  type="monotone"
                  dataKey="wins"
                  stroke="hsl(var(--primary))"
                  strokeWidth={2}
                  dot={{ r: 3 }}
                />
              )}
            </LineChart>
          </ResponsiveContainer>
        </div>
      );
    }

    if (screen === "scores") {
      if (matchData.length === 0) {
        return <p className="text-xs text-muted-foreground py-6 text-center">No matches played yet</p>;
      }

      const chartData = matchData.map((m) => ({
        round: `R${m.roundNumber}`,
        margin: m.margin,
        myScore: m.myScore,
        oppScore: m.oppScore,
        opponent: m.opponentAbbr,
      }));

      return (
        <div className="h-44">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
              <XAxis dataKey="round" tick={{ fontSize: 10 }} />
              <YAxis tick={{ fontSize: 10 }} />
              <ReferenceLine y={0} className="stroke-muted-foreground" />
              <Tooltip
                content={({ active, payload }) => {
                  if (!active || !payload?.length) return null;
                  const d = payload[0].payload;
                  return (
                    <div className="bg-popover border rounded-md p-2 text-xs shadow-md">
                      <div className="font-medium">{d.round} vs {d.opponent}</div>
                      <div>You: {d.myScore} — Opp: {d.oppScore}</div>
                      <div className={d.margin >= 0 ? "text-green-600" : "text-red-600"}>
                        {d.margin >= 0 ? "+" : ""}{d.margin}
                      </div>
                    </div>
                  );
                }}
              />
              <Bar dataKey="margin" radius={[4, 4, 0, 0]}>
                {chartData.map((entry, index) => (
                  <Cell
                    key={index}
                    fill={entry.margin >= 0 ? "hsl(var(--chart-2))" : "hsl(var(--destructive))"}
                  />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      );
    }

    if (screen === "hfa") {
      if (hfaData.length === 0) {
        return <p className="text-xs text-muted-foreground py-6 text-center">No home games played yet</p>;
      }

      // Compute running HFA: sum of last 10 margins
      const running = hfaData.map((_, i) => {
        const window = hfaData.slice(Math.max(0, i - 9), i + 1);
        const avg = window.reduce((s, h) => s + h.margin, 0) / window.length;
        return {
          game: `G${hfaData[i].gameNumber}`,
          hfa: Math.round(avg * 100) / 100,
          roundNumber: hfaData[i].roundNumber,
        };
      });

      return (
        <div className="h-44">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={running}>
              <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
              <XAxis dataKey="game" tick={{ fontSize: 10 }} />
              <YAxis tick={{ fontSize: 10 }} />
              <ReferenceLine y={0} className="stroke-muted-foreground" />
              <Tooltip
                formatter={(v) => [`${v}`, "HFA"]}
                contentStyle={{ fontSize: 12 }}
              />
              <Line
                type="monotone"
                dataKey="hfa"
                stroke="hsl(var(--primary))"
                strokeWidth={2}
                dot={{ r: 2 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      );
    }

    return null;
  }

  return (
    <div className="grid gap-4 md:grid-cols-2">
      {/* Seniors */}
      <Card>
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <CardTitle className="text-base">{clubName}</CardTitle>
            <div className="flex items-center gap-1">
              <Button
                variant="ghost"
                size="icon-sm"
                className="h-6 w-6"
                onClick={() => setSeniorsScreen(cycleScreen(seniorsScreen, -1))}
              >
                <ChevronLeft className="h-3.5 w-3.5" />
              </Button>
              <span className="text-xs text-muted-foreground min-w-[100px] text-center">
                {SCREENS.find((s) => s.key === seniorsScreen)?.label}
              </span>
              <Button
                variant="ghost"
                size="icon-sm"
                className="h-6 w-6"
                onClick={() => setSeniorsScreen(cycleScreen(seniorsScreen, 1))}
              >
                <ChevronRight className="h-3.5 w-3.5" />
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {renderGraph("SENIORS", seniorsScreen, seniorsMatches, seniorsHfa, seniorsLadder)}
        </CardContent>
      </Card>

      {/* Reserves */}
      <Card>
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <CardTitle className="text-base">{reservesName}</CardTitle>
            <div className="flex items-center gap-1">
              <Button
                variant="ghost"
                size="icon-sm"
                className="h-6 w-6"
                onClick={() => setReservesScreen(cycleScreen(reservesScreen, -1))}
              >
                <ChevronLeft className="h-3.5 w-3.5" />
              </Button>
              <span className="text-xs text-muted-foreground min-w-[100px] text-center">
                {SCREENS.find((s) => s.key === reservesScreen)?.label}
              </span>
              <Button
                variant="ghost"
                size="icon-sm"
                className="h-6 w-6"
                onClick={() => setReservesScreen(cycleScreen(reservesScreen, 1))}
              >
                <ChevronRight className="h-3.5 w-3.5" />
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {renderGraph("RESERVES", reservesScreen, reservesMatches, reservesHfa, reservesLadder)}
        </CardContent>
      </Card>
    </div>
  );
}
