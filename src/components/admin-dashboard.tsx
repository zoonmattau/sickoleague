"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Trophy,
  Calendar,
  Save,
  RefreshCw,
  CheckCircle,
  AlertCircle
} from "lucide-react";
import { updateMatchResult, recalculateStandings } from "@/app/admin/actions";

interface Club {
  id: string;
  name: string;
  reservesName: string | null;
  primaryColor: string | null;
  secondaryColor: string | null;
}

interface Match {
  id: string;
  homeClub: Club;
  awayClub: Club;
  homeScore: number | null;
  awayScore: number | null;
  matchType: string;
  status: string;
}

interface Round {
  id: string;
  roundNumber: number;
  roundType: string;
  matches: Match[];
}

interface Standing {
  id: string;
  club: Club;
  competition: string;
  played: number;
  wins: number;
  losses: number;
  draws: number;
  pointsFor: number;
  pointsAgainst: number;
  percentage: number;
}

interface AdminDashboardProps {
  rounds: Round[];
  clubs: Club[];
  standings: Standing[];
}

export function AdminDashboard({ rounds, clubs, standings }: AdminDashboardProps) {
  const [selectedRound, setSelectedRound] = useState<string>(rounds[0]?.id || "");
  const [matchScores, setMatchScores] = useState<Record<string, { home: string; away: string }>>({});
  const [saving, setSaving] = useState<string | null>(null);
  const [recalculating, setRecalculating] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  const currentRound = rounds.find(r => r.id === selectedRound);
  const seniorsStandings = standings.filter(s => s.competition === "SENIORS");
  const reservesStandings = standings.filter(s => s.competition === "RESERVES");

  const handleScoreChange = (matchId: string, team: "home" | "away", value: string) => {
    setMatchScores(prev => ({
      ...prev,
      [matchId]: {
        ...prev[matchId],
        [team]: value
      }
    }));
  };

  const handleSaveMatch = async (match: Match) => {
    const scores = matchScores[match.id];
    if (!scores?.home || !scores?.away) {
      setMessage({ type: "error", text: "Please enter both scores" });
      return;
    }

    setSaving(match.id);
    setMessage(null);

    try {
      const result = await updateMatchResult(
        match.id,
        parseInt(scores.home),
        parseInt(scores.away)
      );

      if (result.success) {
        setMessage({ type: "success", text: "Match result saved!" });
      } else {
        setMessage({ type: "error", text: result.error || "Failed to save" });
      }
    } catch {
      setMessage({ type: "error", text: "Failed to save match result" });
    } finally {
      setSaving(null);
    }
  };

  const handleRecalculate = async () => {
    setRecalculating(true);
    setMessage(null);

    try {
      const result = await recalculateStandings();
      if (result.success) {
        setMessage({ type: "success", text: "Standings recalculated!" });
        // Refresh the page to show updated standings
        window.location.reload();
      } else {
        setMessage({ type: "error", text: result.error || "Failed to recalculate" });
      }
    } catch {
      setMessage({ type: "error", text: "Failed to recalculate standings" });
    } finally {
      setRecalculating(false);
    }
  };

  return (
    <Tabs defaultValue="matches" className="space-y-6">
      <TabsList>
        <TabsTrigger value="matches" className="gap-2">
          <Calendar className="h-4 w-4" />
          Match Results
        </TabsTrigger>
        <TabsTrigger value="standings" className="gap-2">
          <Trophy className="h-4 w-4" />
          Standings
        </TabsTrigger>
      </TabsList>

      {message && (
        <div className={`flex items-center gap-2 p-3 rounded-md ${
          message.type === "success"
            ? "bg-green-50 text-green-700 dark:bg-green-950 dark:text-green-300"
            : "bg-red-50 text-red-700 dark:bg-red-950 dark:text-red-300"
        }`}>
          {message.type === "success" ? (
            <CheckCircle className="h-4 w-4" />
          ) : (
            <AlertCircle className="h-4 w-4" />
          )}
          {message.text}
        </div>
      )}

      <TabsContent value="matches" className="space-y-6">
        {/* Round Selector */}
        <Card>
          <CardHeader>
            <CardTitle>Select Round</CardTitle>
          </CardHeader>
          <CardContent>
            <select
              value={selectedRound}
              onChange={(e) => setSelectedRound(e.target.value)}
              className="w-full px-3 py-2 border rounded-md bg-background"
            >
              {rounds.map(round => (
                <option key={round.id} value={round.id}>
                  Round {round.roundNumber} {round.roundType === "BYE" ? "(Bye)" : ""}
                </option>
              ))}
            </select>
          </CardContent>
        </Card>

        {/* Match Entry */}
        {currentRound && (
          <div className="grid gap-4">
            <h3 className="text-lg font-semibold">
              Round {currentRound.roundNumber} Matches
            </h3>

            {currentRound.roundType === "BYE" ? (
              <Card>
                <CardContent className="py-8 text-center text-muted-foreground">
                  This is a bye round - no matches to enter.
                </CardContent>
              </Card>
            ) : currentRound.matches.length === 0 ? (
              <Card>
                <CardContent className="py-8 text-center text-muted-foreground">
                  No matches scheduled for this round yet.
                </CardContent>
              </Card>
            ) : (
              currentRound.matches.map(match => (
                <Card key={match.id}>
                  <CardContent className="pt-6">
                    <div className="flex flex-col sm:flex-row items-center gap-4">
                      {/* Home Team */}
                      <div className="flex-1 text-center sm:text-right">
                        <span
                          className="px-2 py-1 rounded text-sm font-semibold"
                          style={{
                            backgroundColor: match.homeClub.primaryColor || '#666',
                            color: match.homeClub.secondaryColor || '#fff'
                          }}
                        >
                          {match.matchType === "RESERVES"
                            ? (match.homeClub.reservesName || match.homeClub.name)
                            : match.homeClub.name
                          }
                        </span>
                      </div>

                      {/* Score Inputs */}
                      <div className="flex items-center gap-2">
                        <input
                          type="number"
                          min="0"
                          placeholder={match.homeScore?.toString() || "0"}
                          value={matchScores[match.id]?.home || ""}
                          onChange={(e) => handleScoreChange(match.id, "home", e.target.value)}
                          className="w-20 px-3 py-2 border rounded-md text-center bg-background"
                        />
                        <span className="text-muted-foreground">vs</span>
                        <input
                          type="number"
                          min="0"
                          placeholder={match.awayScore?.toString() || "0"}
                          value={matchScores[match.id]?.away || ""}
                          onChange={(e) => handleScoreChange(match.id, "away", e.target.value)}
                          className="w-20 px-3 py-2 border rounded-md text-center bg-background"
                        />
                      </div>

                      {/* Away Team */}
                      <div className="flex-1 text-center sm:text-left">
                        <span
                          className="px-2 py-1 rounded text-sm font-semibold"
                          style={{
                            backgroundColor: match.awayClub.primaryColor || '#666',
                            color: match.awayClub.secondaryColor || '#fff'
                          }}
                        >
                          {match.matchType === "RESERVES"
                            ? (match.awayClub.reservesName || match.awayClub.name)
                            : match.awayClub.name
                          }
                        </span>
                      </div>

                      {/* Save Button */}
                      <Button
                        onClick={() => handleSaveMatch(match)}
                        disabled={saving === match.id}
                        size="sm"
                        className="gap-2"
                      >
                        <Save className="h-4 w-4" />
                        {saving === match.id ? "Saving..." : "Save"}
                      </Button>
                    </div>

                    <div className="mt-2 text-center">
                      <span className="text-xs text-muted-foreground">
                        {match.matchType} • {match.status}
                      </span>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        )}

        {/* Recalculate Button */}
        <Card>
          <CardContent className="pt-6">
            <Button
              onClick={handleRecalculate}
              disabled={recalculating}
              className="w-full gap-2"
              variant="outline"
            >
              <RefreshCw className={`h-4 w-4 ${recalculating ? "animate-spin" : ""}`} />
              {recalculating ? "Recalculating..." : "Recalculate All Standings"}
            </Button>
            <p className="text-xs text-muted-foreground text-center mt-2">
              Updates all team standings based on match results
            </p>
          </CardContent>
        </Card>
      </TabsContent>

      <TabsContent value="standings" className="space-y-6">
        <div className="grid lg:grid-cols-2 gap-6">
          {/* Seniors Standings */}
          <Card>
            <CardHeader>
              <CardTitle>Seniors Ladder</CardTitle>
              <CardDescription>Current standings</CardDescription>
            </CardHeader>
            <CardContent>
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b">
                    <th className="pb-2 text-left">#</th>
                    <th className="pb-2 text-left">Club</th>
                    <th className="pb-2 text-center">P</th>
                    <th className="pb-2 text-center">W</th>
                    <th className="pb-2 text-center">L</th>
                    <th className="pb-2 text-right">%</th>
                  </tr>
                </thead>
                <tbody>
                  {seniorsStandings.map((standing, idx) => (
                    <tr key={standing.id} className="border-b last:border-0">
                      <td className="py-2">{idx + 1}</td>
                      <td className="py-2">
                        <span
                          className="px-2 py-0.5 rounded text-xs font-semibold"
                          style={{
                            backgroundColor: standing.club.primaryColor || '#666',
                            color: standing.club.secondaryColor || '#fff'
                          }}
                        >
                          {standing.club.name}
                        </span>
                      </td>
                      <td className="py-2 text-center">{standing.played}</td>
                      <td className="py-2 text-center text-green-500">{standing.wins}</td>
                      <td className="py-2 text-center text-red-500">{standing.losses}</td>
                      <td className="py-2 text-right">{Number(standing.percentage).toFixed(1)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </CardContent>
          </Card>

          {/* Reserves Standings */}
          <Card>
            <CardHeader>
              <CardTitle>Reserves Ladder</CardTitle>
              <CardDescription>Current standings</CardDescription>
            </CardHeader>
            <CardContent>
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b">
                    <th className="pb-2 text-left">#</th>
                    <th className="pb-2 text-left">Club</th>
                    <th className="pb-2 text-center">P</th>
                    <th className="pb-2 text-center">W</th>
                    <th className="pb-2 text-center">L</th>
                    <th className="pb-2 text-right">%</th>
                  </tr>
                </thead>
                <tbody>
                  {reservesStandings.map((standing, idx) => (
                    <tr key={standing.id} className="border-b last:border-0">
                      <td className="py-2">{idx + 1}</td>
                      <td className="py-2">
                        <span
                          className="px-2 py-0.5 rounded text-xs font-semibold"
                          style={{
                            backgroundColor: standing.club.primaryColor || '#666',
                            color: standing.club.secondaryColor || '#fff'
                          }}
                        >
                          {standing.club.reservesName || standing.club.name}
                        </span>
                      </td>
                      <td className="py-2 text-center">{standing.played}</td>
                      <td className="py-2 text-center text-green-500">{standing.wins}</td>
                      <td className="py-2 text-center text-red-500">{standing.losses}</td>
                      <td className="py-2 text-right">{Number(standing.percentage).toFixed(1)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </CardContent>
          </Card>
        </div>
      </TabsContent>
    </Tabs>
  );
}
