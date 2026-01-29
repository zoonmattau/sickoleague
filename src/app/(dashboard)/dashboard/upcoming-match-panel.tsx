"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Swords, Home, MapPin, Clock, Trophy } from "lucide-react";
import { getUpcomingMatch, getOpponentLineup } from "./upcoming-match/actions";
import { LineupComparison } from "./lineup-comparison";
import type { SerializedContract, SerializedRosterPlayer, PlayerStats, CaptaincyInfo } from "./types";

type UpcomingMatchData = Awaited<ReturnType<typeof getUpcomingMatch>>;
type OpponentLineupData = Awaited<ReturnType<typeof getOpponentLineup>>;

type Props = {
  clubId: string;
  clubName: string;
  reservesName: string;
  primaryColor: string | null;
  secondaryColor: string | null;
  rosterPlayers: SerializedRosterPlayer[];
  contracts: SerializedContract[];
  playerStats: PlayerStats[];
  captaincy: CaptaincyInfo;
};

export function UpcomingMatchPanel({
  clubId,
  clubName,
  reservesName,
  primaryColor,
  secondaryColor,
  rosterPlayers,
  contracts,
  playerStats,
  captaincy,
}: Props) {
  const [matchData, setMatchData] = useState<UpcomingMatchData>(null);
  const [opponentLineup, setOpponentLineup] = useState<OpponentLineupData>(null);
  const [loading, setLoading] = useState(true);
  const [activeMatch, setActiveMatch] = useState<"SENIORS" | "RESERVES">("SENIORS");

  useEffect(() => {
    setLoading(true);
    getUpcomingMatch(clubId).then((data) => {
      setMatchData(data);
      setLoading(false);
    });
  }, [clubId]);

  // Fetch opponent lineup when match data is available
  useEffect(() => {
    if (matchData?.round && matchData.matches.length > 0) {
      const match = matchData.matches.find(m => m.matchType === activeMatch);
      if (match) {
        getOpponentLineup(match.opponent.id, matchData.round.id).then(setOpponentLineup);
      }
    }
  }, [matchData, activeMatch]);

  if (loading) {
    return (
      <Card>
        <CardContent className="py-8 text-center text-muted-foreground">
          Loading upcoming match...
        </CardContent>
      </Card>
    );
  }

  if (!matchData || matchData.matches.length === 0) {
    return (
      <Card>
        <CardContent className="py-8 text-center text-muted-foreground">
          No upcoming matches scheduled
        </CardContent>
      </Card>
    );
  }

  const { round, matches } = matchData;
  const currentMatch = matches.find(m => m.matchType === activeMatch);

  if (!currentMatch) {
    return (
      <Card>
        <CardContent className="py-8 text-center text-muted-foreground">
          No {activeMatch.toLowerCase()} match this round
        </CardContent>
      </Card>
    );
  }

  const { opponent, myClub, isHome, hfa, isRivalMatch, status } = currentMatch;

  const statusColors = {
    UPCOMING: "bg-blue-500/10 text-blue-600 border-blue-500/30",
    LOCKED: "bg-yellow-500/10 text-yellow-600 border-yellow-500/30",
    IN_PROGRESS: "bg-green-500/10 text-green-600 border-green-500/30",
    COMPLETED: "bg-muted text-muted-foreground",
    SCHEDULED: "bg-muted text-muted-foreground",
  };

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg flex items-center gap-2">
            <Trophy className="h-5 w-5" />
            Round {round.roundNumber}
          </CardTitle>
          <div className="flex items-center gap-2">
            <Badge variant="outline" className={statusColors[round.status]}>
              {round.status === "UPCOMING" && <Clock className="h-3 w-3 mr-1" />}
              {round.status}
            </Badge>
            {isRivalMatch && (
              <Badge variant="outline" className="bg-orange-500/10 text-orange-600 border-orange-500/30">
                <Swords className="h-3 w-3 mr-1" />
                Rivalry
              </Badge>
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Match Type Tabs */}
        <Tabs value={activeMatch} onValueChange={(v) => setActiveMatch(v as typeof activeMatch)}>
          <TabsList className="w-full">
            <TabsTrigger value="SENIORS" className="flex-1">Seniors</TabsTrigger>
            <TabsTrigger value="RESERVES" className="flex-1">Reserves</TabsTrigger>
          </TabsList>

          <TabsContent value={activeMatch} className="mt-4 space-y-4">
            {/* Matchup Display */}
            <div className="flex items-center justify-center gap-4 py-4">
              {/* My Team */}
              <div className="text-center">
                <div
                  className="w-16 h-16 rounded-lg flex items-center justify-center text-xl font-bold mx-auto mb-2"
                  style={{
                    backgroundColor: myClub.primaryColor || "#6b7280",
                    color: myClub.secondaryColor || "#ffffff",
                  }}
                >
                  {myClub.abbreviation}
                </div>
                <div className="font-medium">
                  {activeMatch === "RESERVES"
                    ? (myClub.reservesName ?? myClub.name)
                    : myClub.name}
                </div>
                <div className="text-sm text-muted-foreground">
                  #{myClub.ladderPosition}
                </div>
                {isHome && (
                  <Badge variant="outline" className="mt-1">
                    <Home className="h-3 w-3 mr-1" />
                    Home
                  </Badge>
                )}
              </div>

              {/* VS */}
              <div className="text-center px-4">
                <div className="text-2xl font-bold text-muted-foreground">vs</div>
                {hfa !== null && isHome && (
                  <div className={`text-sm font-medium mt-1 ${hfa >= 0 ? "text-green-600" : "text-red-600"}`}>
                    HFA: {hfa >= 0 ? "+" : ""}{hfa}
                  </div>
                )}
              </div>

              {/* Opponent */}
              <div className="text-center">
                <div
                  className="w-16 h-16 rounded-lg flex items-center justify-center text-xl font-bold mx-auto mb-2"
                  style={{
                    backgroundColor: opponent.primaryColor || "#6b7280",
                    color: opponent.secondaryColor || "#ffffff",
                  }}
                >
                  {opponent.abbreviation}
                </div>
                <div className="font-medium">
                  {activeMatch === "RESERVES"
                    ? (opponent.reservesName ?? opponent.name)
                    : opponent.name}
                </div>
                <div className="text-sm text-muted-foreground">
                  #{opponent.ladderPosition}
                </div>
                {!isHome && (
                  <Badge variant="outline" className="mt-1">
                    <MapPin className="h-3 w-3 mr-1" />
                    Away
                  </Badge>
                )}
              </div>
            </div>

            {/* Scores (if in progress or completed) */}
            {(status === "IN_PROGRESS" || status === "COMPLETED") && currentMatch.homeScore !== null && (
              <div className="flex items-center justify-center gap-8 py-2 bg-muted/50 rounded-lg">
                <div className="text-3xl font-bold">
                  {isHome ? currentMatch.homeScore : currentMatch.awayScore}
                </div>
                <div className="text-muted-foreground">-</div>
                <div className="text-3xl font-bold">
                  {isHome ? currentMatch.awayScore : currentMatch.homeScore}
                </div>
              </div>
            )}

            {/* Lineup Comparison */}
            {opponentLineup && (
              <LineupComparison
                clubId={clubId}
                myRosterPlayers={rosterPlayers}
                myContracts={contracts}
                myPlayerStats={playerStats}
                myCaptaincy={captaincy}
                opponentLineup={opponentLineup}
                matchType={activeMatch}
                isLocked={round.status !== "UPCOMING"}
                isProjected={opponentLineup.isProjected}
              />
            )}
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}
