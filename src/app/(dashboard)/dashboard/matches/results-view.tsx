"use client";

import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";

type MatchResult = {
  id: string;
  matchType: "SENIORS" | "RESERVES";
  status: string;
  homeScore: number | null;
  awayScore: number | null;
  homeClub: {
    id: string;
    name: string;
    abbreviation: string;
    reservesName: string | null;
    primaryColor: string | null;
    secondaryColor: string | null;
  };
  awayClub: {
    id: string;
    name: string;
    abbreviation: string;
    reservesName: string | null;
    primaryColor: string | null;
    secondaryColor: string | null;
  };
};

type RoundResult = {
  id: string;
  roundNumber: number;
  roundType: string;
  seasonYear: number;
  matches: MatchResult[];
};

type Props = {
  rounds: RoundResult[];
};

function getRoundName(round: RoundResult): string {
  if (round.roundNumber === 0) return "Opening Round";
  if (round.roundType === "FINALS_WK1") return "Finals Week 1";
  if (round.roundType === "FINALS_WK2") return "Preliminary Final";
  if (round.roundType === "FINALS_WK3") return "Grand Final";
  return `Round ${round.roundNumber}`;
}

function ResultCard({ match, isReserves }: { match: MatchResult; isReserves: boolean }) {
  const homeScore = match.homeScore ?? 0;
  const awayScore = match.awayScore ?? 0;
  const homeWon = homeScore > awayScore;
  const awayWon = awayScore > homeScore;

  const homeName = isReserves
    ? match.homeClub.reservesName ?? match.homeClub.name
    : match.homeClub.name;
  const awayName = isReserves
    ? match.awayClub.reservesName ?? match.awayClub.name
    : match.awayClub.name;

  return (
    <div className="flex items-center justify-between p-3 rounded-lg border bg-card">
      <div className={`flex items-center gap-2 flex-1 ${homeWon ? "font-bold" : ""}`}>
        <span
          className="px-2 py-0.5 rounded text-xs font-semibold min-w-[40px] text-center"
          style={{
            backgroundColor: match.homeClub.primaryColor || "#6b7280",
            color: match.homeClub.secondaryColor || "#ffffff",
          }}
        >
          {match.homeClub.abbreviation}
        </span>
        <span className="text-sm hidden sm:inline">{homeName}</span>
      </div>

      <div className="flex items-center gap-2 px-3">
        <span className={`text-lg font-bold w-8 text-right ${homeWon ? "" : "text-muted-foreground"}`}>
          {homeScore}
        </span>
        <span className="text-muted-foreground">-</span>
        <span className={`text-lg font-bold w-8 ${awayWon ? "" : "text-muted-foreground"}`}>
          {awayScore}
        </span>
      </div>

      <div className={`flex items-center gap-2 flex-1 justify-end ${awayWon ? "font-bold" : ""}`}>
        <span className="text-sm hidden sm:inline text-right">{awayName}</span>
        <span
          className="px-2 py-0.5 rounded text-xs font-semibold min-w-[40px] text-center"
          style={{
            backgroundColor: match.awayClub.primaryColor || "#6b7280",
            color: match.awayClub.secondaryColor || "#ffffff",
          }}
        >
          {match.awayClub.abbreviation}
        </span>
      </div>
    </div>
  );
}

export function ResultsView({ rounds }: Props) {
  const [matchType, setMatchType] = useState<"SENIORS" | "RESERVES">("SENIORS");

  if (rounds.length === 0) {
    return (
      <Card>
        <CardContent className="py-8 text-center text-muted-foreground">
          No completed rounds yet. Results will appear here after matches are played.
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <Tabs value={matchType} onValueChange={(v) => setMatchType(v as typeof matchType)}>
          <TabsList>
            <TabsTrigger value="SENIORS">Seniors</TabsTrigger>
            <TabsTrigger value="RESERVES">Reserves</TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      {rounds.map((round) => {
        const matches = round.matches.filter((m) => m.matchType === matchType);
        if (matches.length === 0) return null;

        return (
          <Card key={round.id}>
            <CardContent className="pt-6">
              <h3 className="font-semibold text-lg mb-4">{getRoundName(round)}</h3>
              <div className="space-y-2">
                {matches.map((match) => (
                  <ResultCard
                    key={match.id}
                    match={match}
                    isReserves={matchType === "RESERVES"}
                  />
                ))}
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
