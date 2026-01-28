"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  ReferenceLine,
} from "recharts";
import { getAllClubsLadderHistory, getAllClubsHfaHistory } from "./roster/actions";

type Club = {
  id: string;
  name: string;
  abbreviation: string;
  primaryColor: string | null;
  secondaryColor: string | null;
};

type LadderData = {
  roundNumber: number;
  seasonYear: number;
  matchType: string;
  positions: { clubId: string; position: number; record: string }[];
};

type HfaData = {
  roundNumber: number;
  seasonYear: number;
  matchType: string;
  hfaValues: { clubId: string; hfa: number; gamesPlayed: number }[];
};

type Props = {
  myClubId?: string;
};

export function LeagueGraphs({ myClubId }: Props) {
  const [clubs, setClubs] = useState<Club[]>([]);
  const [ladderData, setLadderData] = useState<LadderData[]>([]);
  const [hfaClubs, setHfaClubs] = useState<Club[]>([]);
  const [hfaData, setHfaData] = useState<HfaData[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [selectedClubs, setSelectedClubs] = useState<Set<string>>(new Set());
  const [competition, setCompetition] = useState<"SENIORS" | "RESERVES">("SENIORS");

  useEffect(() => {
    Promise.all([getAllClubsLadderHistory(), getAllClubsHfaHistory()]).then(
      ([ladder, hfa]) => {
        setClubs(ladder.clubs);
        setLadderData(ladder.data);
        setHfaClubs(hfa.clubs);
        setHfaData(hfa.data);
        // Select all clubs by default
        const allClubIds = new Set(ladder.clubs.map((c) => c.id));
        setSelectedClubs(allClubIds);
        setLoaded(true);
      }
    );
  }, []);

  const toggleClub = (clubId: string) => {
    setSelectedClubs((prev) => {
      const next = new Set(prev);
      if (next.has(clubId)) {
        next.delete(clubId);
      } else {
        next.add(clubId);
      }
      return next;
    });
  };

  const selectAll = () => setSelectedClubs(new Set(clubs.map((c) => c.id)));
  const selectNone = () => setSelectedClubs(new Set());
  const selectOnlyMe = () => {
    if (myClubId) setSelectedClubs(new Set([myClubId]));
  };

  const currentLadder = ladderData.filter((d) => d.matchType === competition);
  const currentHfa = hfaData.filter((d) => d.matchType === competition);

  function renderLadderGraph(data: LadderData[]) {
    if (!loaded) {
      return <p className="text-xs text-muted-foreground py-6 text-center">Loading...</p>;
    }

    if (data.length === 0) {
      return <p className="text-xs text-muted-foreground py-6 text-center">No matches played yet</p>;
    }

    const chartData = data.map((d) => {
      const entry: Record<string, number | string> = { round: `R${d.roundNumber}` };
      for (const p of d.positions) {
        if (selectedClubs.has(p.clubId)) {
          entry[p.clubId] = p.position;
        }
      }
      return entry;
    });

    const visibleClubs = clubs.filter((c) => selectedClubs.has(c.id));

    return (
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm">Ladder Position</CardTitle>
        </CardHeader>
        <CardContent className="pt-0">
          <div className="h-56">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis dataKey="round" tick={{ fontSize: 9 }} stroke="#6b7280" />
                <YAxis
                  tick={{ fontSize: 9 }}
                  reversed
                  domain={[1, clubs.length || 12]}
                  stroke="#6b7280"
                  width={25}
                />
                <Tooltip
                  content={({ active, payload, label }) => {
                    if (!active || !payload?.length) return null;
                    const sorted = [...payload].sort(
                      (a, b) => (a.value as number) - (b.value as number)
                    );
                    return (
                      <div className="bg-popover border rounded-md p-2 text-xs shadow-md max-h-64 overflow-auto">
                        <div className="font-medium mb-1">{label}</div>
                        {sorted.map((p) => {
                          const club = clubs.find((c) => c.id === p.dataKey);
                          const isMe = club?.id === myClubId;
                          return (
                            <div
                              key={p.dataKey}
                              className={`flex items-center gap-2 ${isMe ? "font-bold" : ""}`}
                            >
                              <span
                                className="w-2 h-2 rounded-full flex-shrink-0"
                                style={{ backgroundColor: club?.primaryColor || "#6b7280" }}
                              />
                              <span className="w-4">{p.value}.</span>
                              <span>{club?.name}{isMe ? " (You)" : ""}</span>
                            </div>
                          );
                        })}
                      </div>
                    );
                  }}
                />
                {visibleClubs.map((club) => (
                  <Line
                    key={club.id}
                    type="linear"
                    dataKey={club.id}
                    stroke={club.primaryColor || "#6b7280"}
                    strokeWidth={club.id === myClubId ? 3 : 2}
                    dot={{ r: club.id === myClubId ? 3 : 2, fill: club.primaryColor || "#6b7280" }}
                    activeDot={{ r: 5 }}
                    connectNulls
                  />
                ))}
              </LineChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>
    );
  }

  function renderHfaGraph(data: HfaData[]) {
    if (!loaded) {
      return <p className="text-xs text-muted-foreground py-6 text-center">Loading...</p>;
    }

    if (data.length === 0) {
      return <p className="text-xs text-muted-foreground py-6 text-center">No home games yet</p>;
    }

    const chartData = data.map((d) => {
      const entry: Record<string, number | string> = { round: `R${d.roundNumber}` };
      for (const h of d.hfaValues) {
        if (selectedClubs.has(h.clubId)) {
          entry[h.clubId] = h.hfa;
        }
      }
      return entry;
    });

    const visibleClubs = hfaClubs.filter((c) => selectedClubs.has(c.id));

    return (
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm">Home Field Advantage</CardTitle>
        </CardHeader>
        <CardContent className="pt-0">
          <div className="h-56">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis dataKey="round" tick={{ fontSize: 9 }} stroke="#6b7280" />
                <YAxis tick={{ fontSize: 9 }} stroke="#6b7280" width={30} />
                <ReferenceLine y={0} stroke="#9ca3af" />
                <Tooltip
                  content={({ active, payload, label }) => {
                    if (!active || !payload?.length) return null;
                    const sorted = [...payload].sort(
                      (a, b) => (b.value as number) - (a.value as number)
                    );
                    return (
                      <div className="bg-popover border rounded-md p-2 text-xs shadow-md max-h-64 overflow-auto">
                        <div className="font-medium mb-1">{label}</div>
                        {sorted.map((p) => {
                          const club = hfaClubs.find((c) => c.id === p.dataKey);
                          const val = p.value as number;
                          const isMe = club?.id === myClubId;
                          return (
                            <div
                              key={p.dataKey}
                              className={`flex items-center gap-2 ${isMe ? "font-bold" : ""}`}
                            >
                              <span
                                className="w-2 h-2 rounded-full flex-shrink-0"
                                style={{ backgroundColor: club?.primaryColor || "#6b7280" }}
                              />
                              <span>{club?.name}{isMe ? " (You)" : ""}</span>
                              <span className={val >= 0 ? "text-green-600" : "text-red-600"}>
                                {val >= 0 ? "+" : ""}{val}
                              </span>
                            </div>
                          );
                        })}
                      </div>
                    );
                  }}
                />
                {visibleClubs.map((club) => (
                  <Line
                    key={club.id}
                    type="linear"
                    dataKey={club.id}
                    stroke={club.primaryColor || "#6b7280"}
                    strokeWidth={club.id === myClubId ? 3 : 2}
                    dot={{ r: club.id === myClubId ? 3 : 2, fill: club.primaryColor || "#6b7280" }}
                    activeDot={{ r: 5 }}
                    connectNulls
                  />
                ))}
              </LineChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!loaded) {
    return <p className="text-sm text-muted-foreground py-4">Loading league data...</p>;
  }

  return (
    <div className="space-y-4">
      {/* Competition toggle + Team selector */}
      <Card>
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between flex-wrap gap-2">
            <div className="flex items-center gap-2">
              <CardTitle className="text-sm">League Trends</CardTitle>
              <div className="flex rounded-md border">
                <Button
                  variant={competition === "SENIORS" ? "default" : "ghost"}
                  size="sm"
                  className="h-7 rounded-r-none text-xs"
                  onClick={() => setCompetition("SENIORS")}
                >
                  Seniors
                </Button>
                <Button
                  variant={competition === "RESERVES" ? "default" : "ghost"}
                  size="sm"
                  className="h-7 rounded-l-none text-xs"
                  onClick={() => setCompetition("RESERVES")}
                >
                  Reserves
                </Button>
              </div>
            </div>
            <div className="flex gap-2 text-xs">
              <button onClick={selectAll} className="text-primary hover:underline">All</button>
              <span className="text-muted-foreground">|</span>
              <button onClick={selectNone} className="text-primary hover:underline">None</button>
              {myClubId && (
                <>
                  <span className="text-muted-foreground">|</span>
                  <button onClick={selectOnlyMe} className="text-primary hover:underline">Only Me</button>
                </>
              )}
            </div>
          </div>
        </CardHeader>
        <CardContent className="pt-0">
          <div className="flex flex-wrap gap-2">
            {clubs.map((club) => {
              const isMe = club.id === myClubId;
              const isSelected = selectedClubs.has(club.id);
              return (
                <button
                  key={club.id}
                  onClick={() => toggleClub(club.id)}
                  className={`
                    flex items-center gap-1.5 px-2 py-1 rounded-md text-xs transition-all
                    ${isSelected ? "ring-2 ring-offset-1" : "opacity-40 hover:opacity-70"}
                    ${isMe ? "ring-primary" : "ring-gray-300"}
                  `}
                  style={{
                    backgroundColor: isSelected ? (club.primaryColor || "#6b7280") : "transparent",
                    color: isSelected ? (club.secondaryColor || "#ffffff") : (club.primaryColor || "#6b7280"),
                    borderColor: club.primaryColor || "#6b7280",
                  }}
                >
                  <span className="font-medium">{club.name}</span>
                  {isMe && <span className="text-[10px]">(You)</span>}
                </button>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Graphs */}
      <div className="grid gap-4 md:grid-cols-2">
        {renderLadderGraph(currentLadder)}
        {renderHfaGraph(currentHfa)}
      </div>
    </div>
  );
}
