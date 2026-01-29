"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Trophy,
  Calendar,
  Save,
  RefreshCw,
  CheckCircle,
  AlertCircle,
  Users,
  FileText,
  Palette,
  UserCog,
  Search,
} from "lucide-react";
import {
  updateMatchResult,
  recalculateStandings,
  updateClub,
  assignCoachToClub,
  updateContract,
  transferContract,
  terminateContract,
  updateAflPlayer,
} from "@/app/admin/actions";
import { getPositionColorClasses } from "@/lib/position-colors";

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

interface ClubWithCoach {
  id: string;
  name: string;
  abbreviation: string;
  reservesName: string | null;
  reservesAbbreviation: string | null;
  primaryColor: string | null;
  secondaryColor: string | null;
  coachId: string | null;
  coachName: string | null;
  coachEmail: string | null;
  contractCount: number;
}

interface Coach {
  id: string;
  displayName: string;
  email: string;
  discordId: string | null;
  avatarUrl: string | null;
  isCommissioner: boolean;
  clubId: string | null;
  clubName: string | null;
}

interface Contract {
  id: string;
  playerId: string;
  playerName: string;
  positions: string[];
  aflTeam: string | null;
  clubId: string;
  clubName: string;
  clubAbbr: string;
  startSeason: number;
  endSeason: number;
  totalValue: number;
  currentYearSalary: number;
  contractType: string;
  tradeBlock: boolean;
  yearBreakdown: { season: number; value: number }[];
}

interface AflPlayer {
  id: string;
  firstName: string;
  lastName: string;
  positions: string[];
  aflTeam: string | null;
  aflTeamName: string | null;
  isAvailable: boolean;
  status: string;
  currentClub: string | null;
  currentClubAbbr: string | null;
}

interface AdminDashboardProps {
  rounds: Round[];
  clubs: Club[];
  standings: Standing[];
  clubsWithCoaches: ClubWithCoach[];
  coaches: Coach[];
  contracts: Contract[];
  aflPlayers: AflPlayer[];
}

export function AdminDashboard({
  rounds,
  clubs,
  standings,
  clubsWithCoaches,
  coaches,
  contracts,
  aflPlayers,
}: AdminDashboardProps) {
  const [selectedRound, setSelectedRound] = useState<string>(rounds[0]?.id || "");
  const [matchScores, setMatchScores] = useState<Record<string, { home: string; away: string }>>({});
  const [saving, setSaving] = useState<string | null>(null);
  const [recalculating, setRecalculating] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  // Club editing state (dialog)
  const [editingClub, setEditingClub] = useState<ClubWithCoach | null>(null);
  const [clubForm, setClubForm] = useState({
    name: "",
    abbreviation: "",
    reservesName: "",
    reservesAbbreviation: "",
    primaryColor: "",
    secondaryColor: "",
  });

  // Inline club editing state
  const [inlineEditingClubId, setInlineEditingClubId] = useState<string | null>(null);
  const [inlineClubValues, setInlineClubValues] = useState<Record<string, {
    name: string;
    abbreviation: string;
    reservesName: string;
  }>>({});

  // Contract editing state
  const [contractSearch, setContractSearch] = useState("");
  const [contractClubFilter, setContractClubFilter] = useState("all");
  const [editingContract, setEditingContract] = useState<Contract | null>(null);

  // Player editing state
  const [playerSearch, setPlayerSearch] = useState("");
  const [editingPlayer, setEditingPlayer] = useState<AflPlayer | null>(null);
  const [playerPositions, setPlayerPositions] = useState<string[]>([]);

  const currentRound = rounds.find(r => r.id === selectedRound);
  const seniorsStandings = standings.filter(s => s.competition === "SENIORS");
  const reservesStandings = standings.filter(s => s.competition === "RESERVES");

  // Filter contracts
  const filteredContracts = contracts.filter(c => {
    const matchesSearch = contractSearch === "" ||
      c.playerName.toLowerCase().includes(contractSearch.toLowerCase());
    const matchesClub = contractClubFilter === "all" || c.clubId === contractClubFilter;
    return matchesSearch && matchesClub;
  });

  // Filter players
  const filteredPlayers = aflPlayers.filter(p => {
    return playerSearch === "" ||
      `${p.firstName} ${p.lastName}`.toLowerCase().includes(playerSearch.toLowerCase()) ||
      (p.aflTeam?.toLowerCase().includes(playerSearch.toLowerCase()) ?? false);
  });

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

  const handleEditClub = (club: ClubWithCoach) => {
    setEditingClub(club);
    setClubForm({
      name: club.name,
      abbreviation: club.abbreviation,
      reservesName: club.reservesName || "",
      reservesAbbreviation: club.reservesAbbreviation || "",
      primaryColor: club.primaryColor || "#000000",
      secondaryColor: club.secondaryColor || "#ffffff",
    });
  };

  const handleSaveClub = async () => {
    if (!editingClub) return;
    setSaving(editingClub.id);
    const result = await updateClub(editingClub.id, {
      name: clubForm.name,
      abbreviation: clubForm.abbreviation,
      reservesName: clubForm.reservesName || undefined,
      reservesAbbreviation: clubForm.reservesAbbreviation || undefined,
      primaryColor: clubForm.primaryColor,
      secondaryColor: clubForm.secondaryColor,
    });
    if (result.success) {
      setMessage({ type: "success", text: "Club updated!" });
      setEditingClub(null);
      window.location.reload();
    } else {
      setMessage({ type: "error", text: result.error || "Failed to update" });
    }
    setSaving(null);
  };

  // Inline editing functions
  const startInlineEdit = (club: ClubWithCoach) => {
    setInlineEditingClubId(club.id);
    setInlineClubValues(prev => ({
      ...prev,
      [club.id]: {
        name: club.name,
        abbreviation: club.abbreviation,
        reservesName: club.reservesName || "",
      }
    }));
  };

  const cancelInlineEdit = () => {
    setInlineEditingClubId(null);
  };

  const handleInlineSave = async (clubId: string) => {
    const values = inlineClubValues[clubId];
    if (!values) return;

    setSaving(clubId);
    const result = await updateClub(clubId, {
      name: values.name,
      abbreviation: values.abbreviation,
      reservesName: values.reservesName || undefined,
    });

    if (result.success) {
      setMessage({ type: "success", text: "Club updated!" });
      setInlineEditingClubId(null);
      window.location.reload();
    } else {
      setMessage({ type: "error", text: result.error || "Failed to update" });
    }
    setSaving(null);
  };

  const updateInlineValue = (clubId: string, field: string, value: string) => {
    setInlineClubValues(prev => ({
      ...prev,
      [clubId]: {
        ...prev[clubId],
        [field]: value,
      }
    }));
  };

  const handleAssignCoach = async (clubId: string, coachId: string | null) => {
    const result = await assignCoachToClub(coachId === "none" ? null : coachId, clubId);
    if (result.success) {
      setMessage({ type: "success", text: "Coach assigned!" });
      window.location.reload();
    } else {
      setMessage({ type: "error", text: result.error || "Failed to assign" });
    }
  };

  const handleTransferContract = async (contractId: string, newClubId: string) => {
    const result = await transferContract(contractId, newClubId);
    if (result.success) {
      setMessage({ type: "success", text: "Contract transferred!" });
      window.location.reload();
    } else {
      setMessage({ type: "error", text: result.error || "Failed to transfer" });
    }
  };

  const handleTerminateContract = async (contractId: string) => {
    if (!confirm("Are you sure you want to terminate this contract?")) return;
    const result = await terminateContract(contractId);
    if (result.success) {
      setMessage({ type: "success", text: "Contract terminated!" });
      window.location.reload();
    } else {
      setMessage({ type: "error", text: result.error || "Failed to terminate" });
    }
  };

  const handleEditPlayer = (player: AflPlayer) => {
    setEditingPlayer(player);
    setPlayerPositions(player.positions);
  };

  const handleSavePlayer = async () => {
    if (!editingPlayer) return;
    const result = await updateAflPlayer(editingPlayer.id, {
      positions: playerPositions,
      isAvailable: editingPlayer.isAvailable,
    });
    if (result.success) {
      setMessage({ type: "success", text: "Player updated!" });
      setEditingPlayer(null);
      window.location.reload();
    } else {
      setMessage({ type: "error", text: result.error || "Failed to update" });
    }
  };

  const togglePosition = (pos: string) => {
    setPlayerPositions(prev =>
      prev.includes(pos) ? prev.filter(p => p !== pos) : [...prev, pos]
    );
  };

  return (
    <Tabs defaultValue="clubs" className="space-y-6">
      <TabsList className="flex-wrap">
        <TabsTrigger value="clubs" className="gap-2">
          <Users className="h-4 w-4" />
          Clubs & Coaches
        </TabsTrigger>
        <TabsTrigger value="contracts" className="gap-2">
          <FileText className="h-4 w-4" />
          Contracts
        </TabsTrigger>
        <TabsTrigger value="players" className="gap-2">
          <UserCog className="h-4 w-4" />
          Players
        </TabsTrigger>
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

      {/* CLUBS & COACHES TAB */}
      <TabsContent value="clubs" className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Club Management</CardTitle>
            <CardDescription>Edit club details and assign coaches</CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Club</TableHead>
                  <TableHead>Reserves Name</TableHead>
                  <TableHead>Colors</TableHead>
                  <TableHead>Coach</TableHead>
                  <TableHead>Players</TableHead>
                  <TableHead></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {clubsWithCoaches.map(club => {
                  const isEditing = inlineEditingClubId === club.id;
                  const editValues = inlineClubValues[club.id];

                  return (
                  <TableRow key={club.id}>
                    <TableCell>
                      {isEditing ? (
                        <div className="flex items-center gap-2">
                          <Input
                            value={editValues?.abbreviation || ""}
                            onChange={(e) => updateInlineValue(club.id, "abbreviation", e.target.value)}
                            className="w-16 h-8 text-sm"
                            placeholder="Abbr"
                          />
                          <Input
                            value={editValues?.name || ""}
                            onChange={(e) => updateInlineValue(club.id, "name", e.target.value)}
                            className="w-40 h-8"
                            placeholder="Club name"
                          />
                        </div>
                      ) : (
                        <div className="flex items-center gap-2 cursor-pointer" onClick={() => startInlineEdit(club)}>
                          <span
                            className="px-2 py-1 rounded text-sm font-semibold"
                            style={{
                              backgroundColor: club.primaryColor || "#666",
                              color: club.secondaryColor || "#fff",
                            }}
                          >
                            {club.abbreviation}
                          </span>
                          <span className="font-medium hover:underline">{club.name}</span>
                        </div>
                      )}
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {isEditing ? (
                        <Input
                          value={editValues?.reservesName || ""}
                          onChange={(e) => updateInlineValue(club.id, "reservesName", e.target.value)}
                          className="w-40 h-8"
                          placeholder="Reserves name"
                        />
                      ) : (
                        <span className="cursor-pointer hover:underline" onClick={() => startInlineEdit(club)}>
                          {club.reservesName || "-"}
                        </span>
                      )}
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-1">
                        <div
                          className="w-6 h-6 rounded border"
                          style={{ backgroundColor: club.primaryColor || "#666" }}
                          title="Primary"
                        />
                        <div
                          className="w-6 h-6 rounded border"
                          style={{ backgroundColor: club.secondaryColor || "#fff" }}
                          title="Secondary"
                        />
                      </div>
                    </TableCell>
                    <TableCell>
                      <Select
                        value={club.coachId || "none"}
                        onValueChange={(value) => handleAssignCoach(club.id, value)}
                      >
                        <SelectTrigger className="w-[180px]">
                          <SelectValue placeholder="No coach" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="none">No coach</SelectItem>
                          {coaches.map(coach => (
                            <SelectItem key={coach.id} value={coach.id}>
                              {coach.displayName}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">{club.contractCount}</Badge>
                    </TableCell>
                    <TableCell>
                      {isEditing ? (
                        <div className="flex gap-1">
                          <Button
                            variant="default"
                            size="sm"
                            onClick={() => handleInlineSave(club.id)}
                            disabled={saving === club.id}
                          >
                            {saving === club.id ? "Saving..." : "Save"}
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={cancelInlineEdit}
                          >
                            Cancel
                          </Button>
                        </div>
                      ) : (
                        <Button variant="ghost" size="sm" onClick={() => handleEditClub(club)} title="Edit colors">
                          <Palette className="h-4 w-4" />
                        </Button>
                      )}
                    </TableCell>
                  </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        {/* Unassigned Coaches */}
        <Card>
          <CardHeader>
            <CardTitle>Unassigned Coaches</CardTitle>
            <CardDescription>Users who have signed up but aren't assigned to a club</CardDescription>
          </CardHeader>
          <CardContent>
            {coaches.filter(c => !c.clubId).length === 0 ? (
              <p className="text-muted-foreground text-center py-4">All coaches are assigned</p>
            ) : (
              <div className="space-y-2">
                {coaches.filter(c => !c.clubId).map(coach => (
                  <div key={coach.id} className="flex items-center justify-between p-2 rounded border">
                    <div>
                      <div className="font-medium">{coach.displayName}</div>
                      <div className="text-sm text-muted-foreground">{coach.email}</div>
                    </div>
                    {coach.isCommissioner && <Badge>Commissioner</Badge>}
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </TabsContent>

      {/* CONTRACTS TAB */}
      <TabsContent value="contracts" className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Contract Management</CardTitle>
            <CardDescription>View, transfer, and terminate contracts</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex gap-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search players..."
                  value={contractSearch}
                  onChange={(e) => setContractSearch(e.target.value)}
                  className="pl-9"
                />
              </div>
              <Select value={contractClubFilter} onValueChange={setContractClubFilter}>
                <SelectTrigger className="w-[200px]">
                  <SelectValue placeholder="All clubs" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Clubs</SelectItem>
                  {clubsWithCoaches.map(c => (
                    <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Player</TableHead>
                  <TableHead>Positions</TableHead>
                  <TableHead>Club</TableHead>
                  <TableHead>Years</TableHead>
                  <TableHead>Salary</TableHead>
                  <TableHead>Transfer To</TableHead>
                  <TableHead></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredContracts.slice(0, 50).map(contract => (
                  <TableRow key={contract.id}>
                    <TableCell>
                      <div>
                        <div className="font-medium">{contract.playerName}</div>
                        <div className="text-xs text-muted-foreground">{contract.aflTeam}</div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-1">
                        {contract.positions.map(pos => (
                          <span
                            key={pos}
                            className={`text-[10px] px-1 rounded font-medium ${getPositionColorClasses(pos)}`}
                          >
                            {pos}
                          </span>
                        ))}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">{contract.clubAbbr}</Badge>
                    </TableCell>
                    <TableCell className="text-sm">
                      {contract.startSeason}-{contract.endSeason}
                    </TableCell>
                    <TableCell className="text-sm">
                      ${contract.currentYearSalary}k
                    </TableCell>
                    <TableCell>
                      <Select onValueChange={(val) => handleTransferContract(contract.id, val)}>
                        <SelectTrigger className="w-[140px]">
                          <SelectValue placeholder="Transfer..." />
                        </SelectTrigger>
                        <SelectContent>
                          {clubsWithCoaches
                            .filter(c => c.id !== contract.clubId)
                            .map(c => (
                              <SelectItem key={c.id} value={c.id}>{c.abbreviation}</SelectItem>
                            ))}
                        </SelectContent>
                      </Select>
                    </TableCell>
                    <TableCell>
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={() => handleTerminateContract(contract.id)}
                      >
                        Terminate
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
            {filteredContracts.length > 50 && (
              <p className="text-sm text-muted-foreground text-center">
                Showing first 50 of {filteredContracts.length} contracts
              </p>
            )}
          </CardContent>
        </Card>
      </TabsContent>

      {/* PLAYERS TAB */}
      <TabsContent value="players" className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Player Management</CardTitle>
            <CardDescription>Edit player positions and availability</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="relative max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search players..."
                value={playerSearch}
                onChange={(e) => setPlayerSearch(e.target.value)}
                className="pl-9"
              />
            </div>

            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Player</TableHead>
                  <TableHead>AFL Team</TableHead>
                  <TableHead>Positions</TableHead>
                  <TableHead>Contracted To</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredPlayers.slice(0, 50).map(player => (
                  <TableRow key={player.id}>
                    <TableCell className="font-medium">
                      {player.firstName} {player.lastName}
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {player.aflTeam || "-"}
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-1">
                        {player.positions.map(pos => (
                          <span
                            key={pos}
                            className={`text-[10px] px-1 rounded font-medium ${getPositionColorClasses(pos)}`}
                          >
                            {pos}
                          </span>
                        ))}
                      </div>
                    </TableCell>
                    <TableCell>
                      {player.currentClubAbbr ? (
                        <Badge variant="outline">{player.currentClubAbbr}</Badge>
                      ) : (
                        <span className="text-muted-foreground">Free Agent</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <Badge variant={player.isAvailable ? "default" : "destructive"}>
                        {player.isAvailable ? "Available" : "Unavailable"}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Button variant="ghost" size="sm" onClick={() => handleEditPlayer(player)}>
                        Edit
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
            {filteredPlayers.length > 50 && (
              <p className="text-sm text-muted-foreground text-center">
                Showing first 50 of {filteredPlayers.length} players
              </p>
            )}
          </CardContent>
        </Card>
      </TabsContent>

      {/* MATCHES TAB */}
      <TabsContent value="matches" className="space-y-6">
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

      {/* STANDINGS TAB */}
      <TabsContent value="standings" className="space-y-6">
        <div className="grid lg:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle>Seniors Ladder</CardTitle>
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

          <Card>
            <CardHeader>
              <CardTitle>Reserves Ladder</CardTitle>
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

      {/* EDIT CLUB DIALOG */}
      <Dialog open={!!editingClub} onOpenChange={() => setEditingClub(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Club</DialogTitle>
            <DialogDescription>Update club name and colors</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium">Seniors Name</label>
                <Input
                  value={clubForm.name}
                  onChange={(e) => setClubForm({ ...clubForm, name: e.target.value })}
                />
              </div>
              <div>
                <label className="text-sm font-medium">Abbreviation</label>
                <Input
                  value={clubForm.abbreviation}
                  onChange={(e) => setClubForm({ ...clubForm, abbreviation: e.target.value })}
                  maxLength={5}
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium">Reserves Name</label>
                <Input
                  value={clubForm.reservesName}
                  onChange={(e) => setClubForm({ ...clubForm, reservesName: e.target.value })}
                  placeholder="Optional"
                />
              </div>
              <div>
                <label className="text-sm font-medium">Reserves Abbr</label>
                <Input
                  value={clubForm.reservesAbbreviation}
                  onChange={(e) => setClubForm({ ...clubForm, reservesAbbreviation: e.target.value })}
                  maxLength={5}
                  placeholder="Optional"
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium">Primary Color (Background)</label>
                <div className="flex gap-2">
                  <Input
                    type="color"
                    value={clubForm.primaryColor}
                    onChange={(e) => setClubForm({ ...clubForm, primaryColor: e.target.value })}
                    className="w-12 h-10 p-1"
                  />
                  <Input
                    value={clubForm.primaryColor}
                    onChange={(e) => setClubForm({ ...clubForm, primaryColor: e.target.value })}
                    placeholder="#000000"
                  />
                </div>
              </div>
              <div>
                <label className="text-sm font-medium">Secondary Color (Text)</label>
                <div className="flex gap-2">
                  <Input
                    type="color"
                    value={clubForm.secondaryColor}
                    onChange={(e) => setClubForm({ ...clubForm, secondaryColor: e.target.value })}
                    className="w-12 h-10 p-1"
                  />
                  <Input
                    value={clubForm.secondaryColor}
                    onChange={(e) => setClubForm({ ...clubForm, secondaryColor: e.target.value })}
                    placeholder="#ffffff"
                  />
                </div>
              </div>
            </div>
            <div>
              <label className="text-sm font-medium">Preview</label>
              <div className="mt-2">
                <span
                  className="px-3 py-1.5 rounded font-semibold"
                  style={{
                    backgroundColor: clubForm.primaryColor,
                    color: clubForm.secondaryColor,
                  }}
                >
                  {clubForm.abbreviation || "ABC"} - {clubForm.name || "Club Name"}
                </span>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditingClub(null)}>Cancel</Button>
            <Button onClick={handleSaveClub} disabled={saving === editingClub?.id}>
              {saving === editingClub?.id ? "Saving..." : "Save"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* EDIT PLAYER DIALOG */}
      <Dialog open={!!editingPlayer} onOpenChange={() => setEditingPlayer(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Player</DialogTitle>
            <DialogDescription>
              {editingPlayer?.firstName} {editingPlayer?.lastName} ({editingPlayer?.aflTeam})
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div>
              <label className="text-sm font-medium">Positions</label>
              <div className="flex gap-2 mt-2">
                {["DEF", "MID", "RUC", "FWD"].map(pos => (
                  <Button
                    key={pos}
                    variant={playerPositions.includes(pos) ? "default" : "outline"}
                    size="sm"
                    onClick={() => togglePosition(pos)}
                    className={playerPositions.includes(pos) ? getPositionColorClasses(pos) : ""}
                  >
                    {pos}
                  </Button>
                ))}
              </div>
            </div>
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={editingPlayer?.isAvailable ?? false}
                onChange={(e) => setEditingPlayer(prev => prev ? { ...prev, isAvailable: e.target.checked } : null)}
                id="available"
              />
              <label htmlFor="available" className="text-sm">Available for selection</label>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditingPlayer(null)}>Cancel</Button>
            <Button onClick={handleSavePlayer}>Save</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Tabs>
  );
}
