"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Swords, Home, MapPin, Clock, Trophy, Users, Building2 } from "lucide-react";
import { getUpcomingMatch, getOpponentLineup, getMatchStaffComparison } from "./upcoming-match/actions";
import { LineupComparison } from "./lineup-comparison";
import type { SerializedContract, SerializedRosterPlayer, PlayerStats, CaptaincyInfo } from "./types";

type UpcomingMatchData = Awaited<ReturnType<typeof getUpcomingMatch>>;
type OpponentLineupData = Awaited<ReturnType<typeof getOpponentLineup>>;
type StaffComparisonData = Awaited<ReturnType<typeof getMatchStaffComparison>>;

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
  const [staffData, setStaffData] = useState<StaffComparisonData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeMatch, setActiveMatch] = useState<"SENIORS" | "RESERVES">("SENIORS");

  useEffect(() => {
    setLoading(true);
    setError(null);
    getUpcomingMatch(clubId)
      .then((data) => {
        setMatchData(data);
        setLoading(false);
      })
      .catch((err) => {
        console.error("Failed to fetch upcoming match:", err);
        setError("Failed to load match data");
        setLoading(false);
      });
  }, [clubId]);

  // Fetch opponent lineup and staff when match data is available
  useEffect(() => {
    if (matchData?.round && matchData.matches.length > 0) {
      const match = matchData.matches.find(m => m.matchType === activeMatch);
      if (match) {
        getOpponentLineup(match.opponent.id, matchData.round.id)
          .then(setOpponentLineup)
          .catch((err) => {
            console.error("Failed to fetch opponent lineup:", err);
            setOpponentLineup(null);
          });
        getMatchStaffComparison(clubId, match.opponent.id)
          .then(setStaffData)
          .catch((err) => {
            console.error("Failed to fetch staff data:", err);
            setStaffData(null);
          });
      }
    }
  }, [matchData, activeMatch, clubId]);

  if (loading) {
    return (
      <Card>
        <CardContent className="py-8 text-center text-muted-foreground">
          Loading upcoming match...
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <CardContent className="py-8 text-center text-red-500">
          {error}
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

            {/* Venue & HFA */}
            <div className="p-3 rounded-lg bg-muted/30 space-y-2">
              <div className="flex items-center gap-2 text-sm font-medium">
                <Building2 className="h-4 w-4" />
                Match Details
              </div>
              <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-xs">
                {currentMatch.venue ? (
                  <>
                    <div className="text-muted-foreground">Venue</div>
                    <div className="font-medium">{currentMatch.venue.name}</div>
                    <div className="text-muted-foreground">Capacity</div>
                    <div>{currentMatch.venue.capacity.toLocaleString()}</div>
                    <div className="text-muted-foreground">Class</div>
                    <div>{currentMatch.venue.venueClass.replace(/_/g, " ")}</div>
                    {currentMatch.venue.atmosphereBonus !== 0 && (
                      <>
                        <div className="text-muted-foreground">Atmosphere</div>
                        <div className={currentMatch.venue.atmosphereBonus > 0 ? "text-green-600" : "text-red-600"}>
                          {currentMatch.venue.atmosphereBonus > 0 ? "+" : ""}{currentMatch.venue.atmosphereBonus}
                        </div>
                      </>
                    )}
                  </>
                ) : (
                  <>
                    <div className="text-muted-foreground">Venue</div>
                    <div className="text-muted-foreground italic">Not set</div>
                  </>
                )}
                <div className="text-muted-foreground">{isHome ? "Your HFA" : "Opponent HFA"}</div>
                {hfa !== null ? (
                  <div className={`font-semibold ${isHome ? (hfa >= 0 ? "text-green-600" : "text-red-600") : (hfa > 0 ? "text-red-600" : "text-green-600")}`}>
                    {hfa >= 0 ? "+" : ""}{hfa}
                  </div>
                ) : (
                  <div className="text-muted-foreground italic">Not calculated</div>
                )}
                <div className="text-muted-foreground">Your Staff Bonus</div>
                {(isHome ? currentMatch.homeStaffBonus : currentMatch.awayStaffBonus) !== null ? (
                  <div className={`font-medium ${(isHome ? currentMatch.homeStaffBonus! : currentMatch.awayStaffBonus!) >= 0 ? "text-green-600" : "text-red-600"}`}>
                    {(isHome ? currentMatch.homeStaffBonus! : currentMatch.awayStaffBonus!) >= 0 ? "+" : ""}
                    {isHome ? currentMatch.homeStaffBonus : currentMatch.awayStaffBonus}
                  </div>
                ) : (
                  <div className="text-muted-foreground italic">TBD</div>
                )}
                <div className="text-muted-foreground">Opponent Staff Bonus</div>
                {(isHome ? currentMatch.awayStaffBonus : currentMatch.homeStaffBonus) !== null ? (
                  <div className={`font-medium ${(isHome ? currentMatch.awayStaffBonus! : currentMatch.homeStaffBonus!) >= 0 ? "text-green-600" : "text-red-600"}`}>
                    {(isHome ? currentMatch.awayStaffBonus! : currentMatch.homeStaffBonus!) >= 0 ? "+" : ""}
                    {isHome ? currentMatch.awayStaffBonus : currentMatch.homeStaffBonus}
                  </div>
                ) : (
                  <div className="text-muted-foreground italic">TBD</div>
                )}
              </div>
            </div>

            {/* Coaching Staff Comparison */}
            {staffData && (
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-sm font-medium">
                  <Users className="h-4 w-4" />
                  Coaching Staff
                </div>
                <div className="grid grid-cols-[1fr_auto_1fr] gap-2">
                  {/* Headers */}
                  <div className="text-xs font-medium text-muted-foreground text-center">You</div>
                  <div className="text-xs font-medium text-muted-foreground text-center">Role</div>
                  <div className="text-xs font-medium text-muted-foreground text-center">Opponent</div>

                  {/* Staff rows by role */}
                  {([activeMatch === "SENIORS" ? "SENIOR_ASSISTANT" : "RESERVES_ASSISTANT", "LIST_MANAGER"] as const).map(role => {
                    const mine = staffData.myStaff.find(s => s.staffRole === role);
                    const theirs = staffData.opponentStaff.find(s => s.staffRole === role);
                    const roleLabel = role === "SENIOR_ASSISTANT" ? "Sr. Asst."
                      : role === "RESERVES_ASSISTANT" ? "Res. Asst."
                      : "List Mgr.";
                    return (
                      <div key={role} className="contents">
                        <div className={`text-xs p-1.5 rounded ${mine ? "bg-muted/50" : "bg-muted/20"}`}>
                          {mine ? (
                            <div className="text-center">
                              <div className="font-medium truncate">{mine.name}</div>
                              <div className="text-muted-foreground">
                                {mine.aflTeam ?? mine.league}
                              </div>
                            </div>
                          ) : (
                            <div className="text-center text-muted-foreground italic">Vacant</div>
                          )}
                        </div>
                        <div className="flex items-center justify-center">
                          <Badge variant="outline" className="text-[10px] px-1.5 whitespace-nowrap">
                            {roleLabel}
                          </Badge>
                        </div>
                        <div className={`text-xs p-1.5 rounded ${theirs ? "bg-muted/50" : "bg-muted/20"}`}>
                          {theirs ? (
                            <div className="text-center">
                              <div className="font-medium truncate">{theirs.name}</div>
                              <div className="text-muted-foreground">
                                {theirs.aflTeam ?? theirs.league}
                              </div>
                            </div>
                          ) : (
                            <div className="text-center text-muted-foreground italic">Vacant</div>
                          )}
                        </div>
                      </div>
                    );
                  })}
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
