"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { RefreshCw, Flame } from "lucide-react";
import { getLiveMatchScores } from "../fixture/actions";

type MatchData = {
  id: string;
  matchType: "SENIORS" | "RESERVES";
  status: string;
  homeScore: number | null;
  awayScore: number | null;
  isRivalMatch: boolean;
  homeClub: {
    id: string;
    name: string;
    abbreviation: string;
    reservesName: string | null;
    primaryColor: string | null;
    secondaryColor: string | null;
    ladderPosition: number;
  };
  awayClub: {
    id: string;
    name: string;
    abbreviation: string;
    reservesName: string | null;
    primaryColor: string | null;
    secondaryColor: string | null;
    ladderPosition: number;
  };
};

type CurrentRoundData = {
  round: {
    id: string;
    roundNumber: number;
    roundType: string;
    status: string;
    lockoutTime: string | null;
    seasonYear: number;
  };
  matches: MatchData[];
} | null;

type Props = {
  data: CurrentRoundData;
};

type RoundInfo = {
  id: string;
  roundNumber: number;
  roundType: string;
  status: string;
  lockoutTime: string | null;
  seasonYear: number;
};

function getRoundName(round: RoundInfo | null | undefined): string {
  if (!round) return "";
  if (round.roundNumber === 0) return "Opening Round";
  if (round.roundType === "FINALS_WK1") return "Finals Week 1";
  if (round.roundType === "FINALS_WK2") return "Preliminary Final";
  if (round.roundType === "FINALS_WK3") return "Grand Final";
  return `Round ${round.roundNumber}`;
}

function MatchRow({
  match,
  isReserves,
  liveScores,
}: {
  match: MatchData;
  isReserves: boolean;
  liveScores: Map<string, { homeTotal: number; awayTotal: number }>;
}) {
  const live = liveScores.get(match.id);
  const homeScore = live?.homeTotal ?? match.homeScore ?? 0;
  const awayScore = live?.awayTotal ?? match.awayScore ?? 0;
  const isLive = match.status === "IN_PROGRESS";
  const isCompleted = match.status === "COMPLETED";
  const homeWon = isCompleted && homeScore > awayScore;
  const awayWon = isCompleted && awayScore > homeScore;

  const homeName = isReserves
    ? match.homeClub.reservesName ?? match.homeClub.name
    : match.homeClub.name;
  const awayName = isReserves
    ? match.awayClub.reservesName ?? match.awayClub.name
    : match.awayClub.name;

  return (
    <div className={`flex items-center justify-between p-4 rounded-lg border bg-card hover:bg-muted/50 transition-colors ${match.isRivalMatch ? "border-orange-500/50 bg-orange-500/5" : ""}`}>
      {/* Rivalry indicator */}
      {match.isRivalMatch && (
        <div className="flex items-center gap-1 mr-3" title="Rivalry Match">
          <Flame className="h-5 w-5 text-orange-500" />
        </div>
      )}
      {/* Home Team */}
      <div className={`flex items-center gap-3 flex-1 ${homeWon ? "font-bold" : ""}`}>
        <div className="flex flex-col items-start gap-1">
          <div className="flex items-center gap-2">
            <span
              className="px-2 py-0.5 rounded text-xs font-semibold"
              style={{
                backgroundColor: match.homeClub.primaryColor || "#6b7280",
                color: match.homeClub.secondaryColor || "#ffffff",
              }}
            >
              {match.homeClub.abbreviation}
            </span>
            <span className="text-sm font-medium">{homeName}</span>
          </div>
          <span className="text-xs text-muted-foreground">
            #{match.homeClub.ladderPosition} {match.status === "SCHEDULED" ? "(Home)" : ""}
          </span>
        </div>
      </div>

      {/* Score */}
      <div className="flex items-center gap-3 px-4">
        {isCompleted || isLive ? (
          <>
            <span className={`text-2xl font-bold w-10 text-right ${homeWon ? "" : "text-muted-foreground"}`}>
              {homeScore}
            </span>
            <span className="text-muted-foreground">-</span>
            <span className={`text-2xl font-bold w-10 ${awayWon ? "" : "text-muted-foreground"}`}>
              {awayScore}
            </span>
          </>
        ) : (
          <span className="text-muted-foreground px-4">vs</span>
        )}
        {isLive && (
          <Badge className="bg-green-600 animate-pulse ml-2">LIVE</Badge>
        )}
      </div>

      {/* Away Team */}
      <div className={`flex items-center gap-3 flex-1 justify-end ${awayWon ? "font-bold" : ""}`}>
        <div className="flex flex-col items-end gap-1">
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium">{awayName}</span>
            <span
              className="px-2 py-0.5 rounded text-xs font-semibold"
              style={{
                backgroundColor: match.awayClub.primaryColor || "#6b7280",
                color: match.awayClub.secondaryColor || "#ffffff",
              }}
            >
              {match.awayClub.abbreviation}
            </span>
          </div>
          <span className="text-xs text-muted-foreground">
            #{match.awayClub.ladderPosition}
          </span>
        </div>
      </div>
    </div>
  );
}

export function CurrentRoundView({ data }: Props) {
  const [matchType, setMatchType] = useState<"SENIORS" | "RESERVES">("SENIORS");
  const [liveScores, setLiveScores] = useState<Map<string, { homeTotal: number; awayTotal: number }>>(new Map());
  const [refreshing, setRefreshing] = useState(false);

  const matches = data?.matches.filter((m) => m.matchType === matchType) ?? [];
  const hasLiveMatches = matches.some((m) => m.status === "IN_PROGRESS");

  // Auto-refresh live scores
  useEffect(() => {
    if (!hasLiveMatches) return;

    const refreshScores = async () => {
      const liveMatches = matches.filter((m) => m.status === "IN_PROGRESS");
      const scores = new Map<string, { homeTotal: number; awayTotal: number }>();

      for (const match of liveMatches) {
        const result = await getLiveMatchScores(match.id);
        if (result) {
          scores.set(match.id, {
            homeTotal: result.homeTotal,
            awayTotal: result.awayTotal,
          });
        }
      }

      setLiveScores(scores);
    };

    refreshScores();
    const interval = setInterval(refreshScores, 30000); // Refresh every 30 seconds

    return () => clearInterval(interval);
  }, [hasLiveMatches, matches]);

  const handleManualRefresh = async () => {
    setRefreshing(true);
    const liveMatches = matches.filter((m) => m.status === "IN_PROGRESS");
    const scores = new Map<string, { homeTotal: number; awayTotal: number }>();

    for (const match of liveMatches) {
      const result = await getLiveMatchScores(match.id);
      if (result) {
        scores.set(match.id, {
          homeTotal: result.homeTotal,
          awayTotal: result.awayTotal,
        });
      }
    }

    setLiveScores(scores);
    setRefreshing(false);
  };

  if (!data) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>No Upcoming Matches</CardTitle>
          <CardDescription>
            Matches will appear here once the season begins
          </CardDescription>
        </CardHeader>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>{getRoundName(data.round)}</CardTitle>
              <CardDescription>
                {data.round.status === "UPCOMING" && "Upcoming"}
                {data.round.status === "LOCKED" && "Lineups locked"}
                {data.round.status === "IN_PROGRESS" && "In Progress"}
                {data.round.status === "COMPLETED" && "Completed"}
                {data.round.lockoutTime && data.round.status === "UPCOMING" && (
                  <> - Lockout: {new Date(data.round.lockoutTime).toLocaleString()}</>
                )}
              </CardDescription>
            </div>
            <div className="flex items-center gap-2">
              {hasLiveMatches && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleManualRefresh}
                  disabled={refreshing}
                >
                  <RefreshCw className={`h-4 w-4 mr-1 ${refreshing ? "animate-spin" : ""}`} />
                  Refresh
                </Button>
              )}
              <Tabs value={matchType} onValueChange={(v) => setMatchType(v as typeof matchType)}>
                <TabsList>
                  <TabsTrigger value="SENIORS">Seniors</TabsTrigger>
                  <TabsTrigger value="RESERVES">Reserves</TabsTrigger>
                </TabsList>
              </Tabs>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {matches.length === 0 ? (
              <p className="text-center text-muted-foreground py-8">
                No {matchType.toLowerCase()} matches scheduled for this round
              </p>
            ) : (
              matches.map((match) => (
                <MatchRow
                  key={match.id}
                  match={match}
                  isReserves={matchType === "RESERVES"}
                  liveScores={liveScores}
                />
              ))
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
