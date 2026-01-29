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
import { getClubMatchHistory, getClubHfaHistory, getClubLadderPositionHistory } from "./roster/actions";

type MatchEntry = {
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
  position: number;
  wins: number;
  losses: number;
  draws: number;
  record: string;
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
  primaryColor: string | null;
  secondaryColor: string | null;
};

export function TeamGraphs({ clubId, clubName, reservesName, primaryColor, secondaryColor }: TeamGraphsProps) {
  const [matches, setMatches] = useState<MatchEntry[]>([]);
  const [hfa, setHfa] = useState<HfaEntry[]>([]);
  const [ladder, setLadder] = useState<LadderEntry[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [seniorsScreen, setSeniorsScreen] = useState<Screen>("scores");
  const [reservesScreen, setReservesScreen] = useState<Screen>("scores");

  useEffect(() => {
    Promise.all([
      getClubMatchHistory(clubId),
      getClubHfaHistory(clubId),
      getClubLadderPositionHistory(clubId),
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

      const teamColor = primaryColor || "#3b82f6";
      const teamSecondary = secondaryColor || "#ffffff";

      const chartData = ladderData.map((l) => ({
        round: `R${l.roundNumber}`,
        position: l.position,
        record: l.record,
      }));

      return (
        <div className="h-44">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={chartData} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
              <XAxis dataKey="round" tick={{ fontSize: 10 }} stroke="#6b7280" />
              <YAxis
                tick={{ fontSize: 10 }}
                reversed
                domain={[1, 12]}
                stroke="#6b7280"
              />
              <Tooltip
                content={({ active, payload }) => {
                  if (!active || !payload?.length) return null;
                  const d = payload[0].payload;
                  return (
                    <div className="bg-popover border rounded-md p-2 text-xs shadow-md">
                      <div className="font-medium">{d.round}</div>
                      <div>Position: {d.position}</div>
                      <div>Record: {d.record}</div>
                    </div>
                  );
                }}
              />
              <Line
                type="linear"
                dataKey="position"
                stroke={teamColor}
                strokeWidth={3}
                dot={{ r: 5, fill: teamColor, stroke: teamSecondary, strokeWidth: 2 }}
                activeDot={{ r: 7, fill: teamColor }}
                connectNulls
              />
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
        opponent: m.opponentName,
        opponentAbbr: m.opponentAbbr,
        opponentPrimaryColor: m.opponentPrimaryColor,
        opponentSecondaryColor: m.opponentSecondaryColor,
        isHome: m.isHome,
        isWin: m.margin > 0,
        isDraw: m.margin === 0,
      }));

      return (
        <div className="h-44">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
              <XAxis dataKey="opponentAbbr" tick={{ fontSize: 9 }} interval={0} />
              <YAxis tick={{ fontSize: 10 }} />
              <ReferenceLine y={0} className="stroke-muted-foreground" />
              <Tooltip
                content={({ active, payload }) => {
                  if (!active || !payload?.length) return null;
                  const d = payload[0].payload;
                  const absMargin = Math.abs(d.margin);
                  return (
                    <div className="bg-popover border rounded-md p-2 text-xs shadow-md">
                      <div className="flex items-center gap-1.5">
                        <span className="font-medium">{d.isHome ? "Home" : "Away"} v</span>
                        <span
                          className="px-1.5 py-0.5 rounded text-[10px] font-semibold"
                          style={{
                            backgroundColor: d.opponentPrimaryColor || "#6b7280",
                            color: d.opponentSecondaryColor || "#ffffff",
                          }}
                        >
                          {d.opponent}
                        </span>
                      </div>
                      <div className="mt-1">{d.myScore} v {d.oppScore}</div>
                      <div className={d.isWin ? "text-green-600 font-semibold" : d.isDraw ? "text-yellow-600" : "text-red-600 font-semibold"}>
                        {d.isWin ? `Won by ${absMargin}` : d.isDraw ? "Draw" : `Lost by ${absMargin}`}
                      </div>
                    </div>
                  );
                }}
              />
              <Bar dataKey="margin" radius={[4, 4, 0, 0]}>
                {chartData.map((entry, index) => (
                  <Cell
                    key={index}
                    fill={entry.isWin ? "#22c55e" : entry.isDraw ? "#eab308" : "#ef4444"}
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

      // HFA calculation: negative margins count as half (to not punish bad teams too harshly)
      const calcHfaValue = (margin: number) => margin < 0 ? margin / 2 : margin;

      // Group by round and compute running HFA at end of each round
      const roundsMap = new Map<number, number[]>();
      for (const h of hfaData) {
        const margins = roundsMap.get(h.roundNumber) ?? [];
        margins.push(h.margin);
        roundsMap.set(h.roundNumber, margins);
      }

      // Build cumulative data by round
      const rounds = Array.from(roundsMap.keys()).sort((a, b) => a - b);
      let allMargins: number[] = [];
      const chartData = rounds.map((roundNum) => {
        allMargins = [...allMargins, ...roundsMap.get(roundNum)!];
        const last10 = allMargins.slice(-10);
        const hfa = last10.reduce((s, m) => s + calcHfaValue(m), 0) / last10.length;
        return {
          round: `R${roundNum}`,
          hfa: Math.round(hfa * 10) / 10,
          gamesPlayed: allMargins.length,
        };
      });

      return (
        <div className="h-44">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={chartData} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
              <XAxis dataKey="round" tick={{ fontSize: 10 }} stroke="#6b7280" />
              <YAxis tick={{ fontSize: 10 }} stroke="#6b7280" />
              <ReferenceLine y={0} stroke="#9ca3af" />
              <Tooltip
                content={({ active, payload }) => {
                  if (!active || !payload?.length) return null;
                  const d = payload[0].payload;
                  return (
                    <div className="bg-popover border rounded-md p-2 text-xs shadow-md">
                      <div className="font-medium">{d.round}</div>
                      <div>HFA: {d.hfa >= 0 ? "+" : ""}{d.hfa}</div>
                      <div className="text-muted-foreground">{d.gamesPlayed} home game{d.gamesPlayed !== 1 ? "s" : ""}</div>
                    </div>
                  );
                }}
              />
              <Line
                type="linear"
                dataKey="hfa"
                stroke={primaryColor || "#3b82f6"}
                strokeWidth={3}
                dot={{ r: 5, fill: primaryColor || "#3b82f6", stroke: secondaryColor || "#ffffff", strokeWidth: 2 }}
                activeDot={{ r: 7, fill: primaryColor || "#3b82f6" }}
                connectNulls
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
