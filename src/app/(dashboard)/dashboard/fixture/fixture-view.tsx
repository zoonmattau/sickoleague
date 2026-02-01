"use client";

import { useState, useMemo } from "react";
import { Card, CardContent } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

type FixtureMatch = {
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

type FixtureRound = {
  id: string;
  roundNumber: number;
  roundType: string;
  status: string;
  lockoutTime: string | null;
  matches: FixtureMatch[];
};

type Props = {
  rounds: FixtureRound[];
  clubs: { id: string; name: string; abbreviation: string }[];
};

function getRoundName(round: FixtureRound): string {
  if (round.roundNumber === 0) return "Opening Round";
  if (round.roundType === "FINALS_WK1") return "Finals Week 1";
  if (round.roundType === "FINALS_WK2") return "Preliminary Final";
  if (round.roundType === "FINALS_WK3") return "Grand Final";
  return `Round ${round.roundNumber}`;
}

function getStatusBadge(status: string) {
  switch (status) {
    case "COMPLETED":
      return <Badge variant="secondary">Completed</Badge>;
    case "IN_PROGRESS":
      return <Badge className="bg-green-600">Live</Badge>;
    case "LOCKED":
      return <Badge variant="outline">Locked</Badge>;
    default:
      return null;
  }
}

function MatchCard({ match, isReserves }: { match: FixtureMatch; isReserves: boolean }) {
  const homeWon = match.homeScore !== null && match.awayScore !== null && match.homeScore > match.awayScore;
  const awayWon = match.homeScore !== null && match.awayScore !== null && match.awayScore > match.homeScore;
  const isDraw = match.homeScore !== null && match.awayScore !== null && match.homeScore === match.awayScore;

  const homeName = isReserves
    ? match.homeClub.reservesName ?? match.homeClub.name
    : match.homeClub.name;
  const awayName = isReserves
    ? match.awayClub.reservesName ?? match.awayClub.name
    : match.awayClub.name;

  return (
    <div className="flex items-center justify-between p-3 rounded-lg border bg-card hover:bg-muted/50 transition-colors">
      <div className="flex items-center gap-3 flex-1">
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
          {match.status === "COMPLETED" || match.status === "IN_PROGRESS" ? (
            <>
              <span className={`text-lg font-bold w-8 text-right ${homeWon ? "" : "text-muted-foreground"}`}>
                {match.homeScore ?? 0}
              </span>
              <span className="text-muted-foreground">-</span>
              <span className={`text-lg font-bold w-8 ${awayWon ? "" : "text-muted-foreground"}`}>
                {match.awayScore ?? 0}
              </span>
            </>
          ) : (
            <span className="text-muted-foreground text-sm">vs</span>
          )}
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

      {match.status === "IN_PROGRESS" && (
        <Badge className="ml-2 bg-green-600 animate-pulse">LIVE</Badge>
      )}
    </div>
  );
}

export function FixtureView({ rounds, clubs }: Props) {
  const [selectedRound, setSelectedRound] = useState<string>("all");
  const [selectedClub, setSelectedClub] = useState<string>("all");
  const [matchType, setMatchType] = useState<"SENIORS" | "RESERVES">("SENIORS");

  const filteredRounds = useMemo(() => {
    let filtered = rounds;

    // Filter by round
    if (selectedRound !== "all") {
      filtered = filtered.filter((r) => r.id === selectedRound);
    }

    // Filter by club
    if (selectedClub !== "all") {
      filtered = filtered.map((r) => ({
        ...r,
        matches: r.matches.filter(
          (m) =>
            m.homeClub.id === selectedClub || m.awayClub.id === selectedClub
        ),
      })).filter((r) => r.matches.length > 0);
    }

    // Filter by match type
    filtered = filtered.map((r) => ({
      ...r,
      matches: r.matches.filter((m) => m.matchType === matchType),
    }));

    return filtered;
  }, [rounds, selectedRound, selectedClub, matchType]);

  return (
    <div className="space-y-4">
      {/* Filters */}
      <div className="flex flex-wrap gap-4">
        <Select value={selectedRound} onValueChange={setSelectedRound}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="All Rounds" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Rounds</SelectItem>
            {rounds.map((r) => (
              <SelectItem key={r.id} value={r.id}>
                {getRoundName(r)}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select value={selectedClub} onValueChange={setSelectedClub}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="All Clubs" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Clubs</SelectItem>
            {clubs.map((c) => (
              <SelectItem key={c.id} value={c.id}>
                {c.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Tabs value={matchType} onValueChange={(v) => setMatchType(v as typeof matchType)}>
          <TabsList>
            <TabsTrigger value="SENIORS">Seniors</TabsTrigger>
            <TabsTrigger value="RESERVES">Reserves</TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      {/* Fixture Display */}
      <div className="space-y-6">
        {filteredRounds.length === 0 ? (
          <Card>
            <CardContent className="py-8 text-center text-muted-foreground">
              No matches found for the selected filters
            </CardContent>
          </Card>
        ) : (
          filteredRounds.map((round) => (
            <Card key={round.id}>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-semibold text-lg">{getRoundName(round)}</h3>
                  {getStatusBadge(round.status)}
                </div>
                <div className="space-y-2">
                  {round.matches.map((match) => (
                    <MatchCard
                      key={match.id}
                      match={match}
                      isReserves={matchType === "RESERVES"}
                    />
                  ))}
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}
