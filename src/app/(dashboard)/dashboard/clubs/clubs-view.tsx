"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Progress } from "@/components/ui/progress";
import {
  ChevronDown,
  ChevronRight,
  Users,
  Swords,
  AlertTriangle,
  X,
} from "lucide-react";

type Club = {
  id: string;
  name: string;
  abbreviation: string;
  reservesName: string | null;
  primaryColor: string | null;
  secondaryColor: string | null;
  coach: {
    id: string;
    displayName: string;
    discordId: string | null;
  } | null;
  contracts: {
    id: string;
    startSeason: number;
    endSeason: number;
    totalValue: number;
    yearBreakdown: { season: number; value: number }[];
    contractType: string;
    tradeBlock: boolean;
    aflPlayer: {
      id: string;
      firstName: string;
      lastName: string;
      positions: string[];
      photoUrl: string | null;
      aflTeam: {
        name: string;
        abbreviation: string;
      } | null;
    };
  }[];
  salaryByYear: Record<number, number>;
  rivals: {
    club: {
      id: string;
      name: string;
      abbreviation: string;
      primaryColor: string | null;
      secondaryColor: string | null;
    };
    reason: string;
    seasonYear: number;
  }[];
};

type Season = {
  year: number;
  salaryCap: number;
};

interface ClubsViewProps {
  clubs: Club[];
  season: Season;
  myClubId: string | null;
}

function formatSalary(value: number): string {
  return `$${value}k`;
}

// Get color based on cap usage percentage (green = far from cap, red = close/over)
function getCapColor(usage: number): string {
  if (usage > 100) return "bg-red-700 text-white font-bold"; // Over cap - dark red
  if (usage >= 100) return "bg-red-500/80 text-white";
  if (usage >= 95) return "bg-red-500/60 text-white";
  if (usage >= 90) return "bg-orange-500/60 text-white";
  if (usage >= 80) return "bg-yellow-500/50";
  if (usage >= 60) return "bg-lime-500/30";
  return "bg-green-500/30";
}

export function ClubsView({ clubs, season, myClubId }: ClubsViewProps) {
  const [selectedClub, setSelectedClub] = useState<string | null>(null);
  const [selectedCell, setSelectedCell] = useState<{ clubId: string; year: number } | null>(null);
  const [sortYear, setSortYear] = useState<number | null>(null);
  const [sortDir, setSortDir] = useState<"asc" | "desc">("desc");

  // Get all years we need to display (current year + 9 future years = 10 total)
  const years = Array.from({ length: 10 }, (_, i) => season.year + i);

  // Sort clubs by selected year's remaining cap space
  const sortedClubs = [...clubs].sort((a, b) => {
    if (sortYear === null) return a.name.localeCompare(b.name);
    const aRemaining = season.salaryCap - (a.salaryByYear[sortYear] || 0);
    const bRemaining = season.salaryCap - (b.salaryByYear[sortYear] || 0);
    // desc = most cap space first, asc = least cap space (most trouble) first
    return sortDir === "desc" ? bRemaining - aRemaining : aRemaining - bRemaining;
  });

  const handleSortClick = (year: number) => {
    if (sortYear === year) {
      if (sortDir === "desc") {
        setSortDir("asc");
      } else {
        setSortYear(null);
      }
    } else {
      setSortYear(year);
      setSortDir("desc");
    }
  };

  const selectedClubData = clubs.find((c) => c.id === selectedClub);

  return (
    <div className="space-y-6">
      {/* Salary Cap Matrix */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-lg">Salary Cap Overview</CardTitle>
        </CardHeader>
        <CardContent className="px-0">
          <div className="overflow-x-auto">
            <Table className="w-auto">
              <TableHeader>
                <TableRow>
                  <TableHead className="sticky left-0 bg-background z-10 whitespace-nowrap">Club</TableHead>
                  {years.map((year) => (
                    <TableHead key={year} className="text-center px-0.5 w-[52px]">
                      <button
                        onClick={() => handleSortClick(year)}
                        className={`w-full text-xs hover:bg-muted rounded px-1 py-0.5 transition-colors ${sortYear === year ? "bg-muted font-semibold" : ""}`}
                      >
                        {String(year).slice(-2)}
                        {sortYear === year && (
                          <span className="ml-0.5">{sortDir === "desc" ? "↓" : "↑"}</span>
                        )}
                      </button>
                    </TableHead>
                  ))}
                </TableRow>
              </TableHeader>
              <TableBody>
                {sortedClubs.map((club) => {
                  const isMyClub = club.id === myClubId;
                  return (
                    <TableRow key={club.id} className={isMyClub ? "bg-primary/5" : ""}>
                      <TableCell className="sticky left-0 bg-background z-10 py-1 px-2 whitespace-nowrap">
                        <button
                          onClick={() => setSelectedClub(selectedClub === club.id ? null : club.id)}
                          className="flex items-center gap-2 hover:underline text-left"
                        >
                          <div
                            className="w-6 h-6 rounded text-[10px] font-bold flex items-center justify-center flex-shrink-0"
                            style={{
                              backgroundColor: club.primaryColor || "#666",
                              color: club.secondaryColor || "#fff",
                            }}
                          >
                            {club.abbreviation}
                          </div>
                          <span className="text-sm font-medium">{club.name}</span>
                          {isMyClub && <Badge variant="default" className="text-[10px] px-1 py-0 h-4">You</Badge>}
                          {club.rivals.length > 0 && (
                            <Swords className="h-3 w-3 text-orange-500" title={`${club.rivals.length} rival(s)`} />
                          )}
                        </button>
                      </TableCell>
                      {years.map((year) => {
                        const salary = club.salaryByYear[year] || 0;
                        const remaining = season.salaryCap - salary;
                        const usage = (salary / season.salaryCap) * 100;

                        return (
                          <TableCell key={year} className="text-center p-0.5">
                            <button
                              onClick={() => setSelectedCell({ clubId: club.id, year })}
                              className={`w-full py-1 px-1 rounded text-xs font-medium transition-colors hover:ring-1 hover:ring-primary/50 ${getCapColor(usage)}`}
                              title={`Used: ${formatSalary(salary)} / Cap: ${formatSalary(season.salaryCap)}`}
                            >
                              {salary > 0 ? (remaining >= 0 ? remaining : remaining) : season.salaryCap}
                            </button>
                          </TableCell>
                        );
                      })}
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
          <div className="flex items-center gap-3 text-[10px] text-muted-foreground mt-3 px-4">
            <span>Cap {season.salaryCap}:</span>
            <div className="flex items-center gap-0.5">
              <div className="w-3 h-3 rounded-sm bg-green-500/30" />
              <span>&lt;60%</span>
            </div>
            <div className="flex items-center gap-0.5">
              <div className="w-3 h-3 rounded-sm bg-lime-500/30" />
              <span>60-80</span>
            </div>
            <div className="flex items-center gap-0.5">
              <div className="w-3 h-3 rounded-sm bg-yellow-500/50" />
              <span>80-90</span>
            </div>
            <div className="flex items-center gap-0.5">
              <div className="w-3 h-3 rounded-sm bg-orange-500/60" />
              <span>90-95</span>
            </div>
            <div className="flex items-center gap-0.5">
              <div className="w-3 h-3 rounded-sm bg-red-500/60" />
              <span>95-100</span>
            </div>
            <div className="flex items-center gap-0.5">
              <div className="w-3 h-3 rounded-sm bg-red-700" />
              <span>Over!</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Cell Detail Dialog */}
      <Dialog open={selectedCell !== null} onOpenChange={() => setSelectedCell(null)}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          {selectedCell && (() => {
            const club = clubs.find((c) => c.id === selectedCell.clubId);
            if (!club) return null;
            const year = selectedCell.year;
            const contractsForYear = club.contracts.filter((c) =>
              c.yearBreakdown.some((y) => y.season === year)
            );
            const salary = club.salaryByYear[year] || 0;

            return (
              <>
                <DialogHeader>
                  <DialogTitle className="flex items-center gap-2">
                    <div
                      className="w-8 h-8 rounded text-sm font-bold flex items-center justify-center"
                      style={{
                        backgroundColor: club.primaryColor || "#666",
                        color: club.secondaryColor || "#fff",
                      }}
                    >
                      {club.abbreviation}
                    </div>
                    {club.name} - {year} Salary
                  </DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  <div className="grid grid-cols-3 gap-4">
                    <div className="p-4 rounded-lg bg-muted/50 text-center">
                      <div className="text-2xl font-bold">{formatSalary(salary)}</div>
                      <div className="text-sm text-muted-foreground">Used</div>
                    </div>
                    <div className="p-4 rounded-lg bg-muted/50 text-center">
                      <div className="text-2xl font-bold">{formatSalary(season.salaryCap)}</div>
                      <div className="text-sm text-muted-foreground">Cap</div>
                    </div>
                    <div className="p-4 rounded-lg bg-muted/50 text-center">
                      <div className={`text-2xl font-bold ${salary > season.salaryCap ? "text-red-500" : "text-green-500"}`}>
                        {formatSalary(season.salaryCap - salary)}
                      </div>
                      <div className="text-sm text-muted-foreground">
                        {salary > season.salaryCap ? "Over" : "Remaining"}
                      </div>
                    </div>
                  </div>

                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Player</TableHead>
                        <TableHead>Position</TableHead>
                        <TableHead className="text-right">{year} Salary</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {contractsForYear
                        .sort((a, b) => {
                          const aVal = a.yearBreakdown.find((y) => y.season === year)?.value || 0;
                          const bVal = b.yearBreakdown.find((y) => y.season === year)?.value || 0;
                          return bVal - aVal;
                        })
                        .map((contract) => {
                          const yearValue = contract.yearBreakdown.find((y) => y.season === year)?.value || 0;
                          return (
                            <TableRow key={contract.id}>
                              <TableCell className="font-medium">
                                {contract.aflPlayer.lastName}, {contract.aflPlayer.firstName}
                                {contract.tradeBlock && (
                                  <Badge variant="destructive" className="ml-2 text-xs">Trade Block</Badge>
                                )}
                              </TableCell>
                              <TableCell>
                                <div className="flex gap-1">
                                  {contract.aflPlayer.positions.map((pos) => (
                                    <Badge key={pos} variant="outline" className="text-xs">{pos}</Badge>
                                  ))}
                                </div>
                              </TableCell>
                              <TableCell className="text-right font-semibold">
                                {formatSalary(yearValue)}
                              </TableCell>
                            </TableRow>
                          );
                        })}
                    </TableBody>
                  </Table>
                </div>
              </>
            );
          })()}
        </DialogContent>
      </Dialog>

      {/* Club Detail Panel */}
      {selectedClubData && (
        <Card className="ring-2 ring-primary">
          <CardHeader className="flex flex-row items-center justify-between py-4">
            <div className="flex items-center gap-3">
              <div
                className="w-10 h-10 rounded-md flex items-center justify-center text-sm font-bold"
                style={{
                  backgroundColor: selectedClubData.primaryColor || "#666",
                  color: selectedClubData.secondaryColor || "#fff",
                }}
              >
                {selectedClubData.abbreviation}
              </div>
              <div>
                <CardTitle className="text-lg">{selectedClubData.name}</CardTitle>
                <p className="text-sm text-muted-foreground">
                  {selectedClubData.coach ? `Coach: ${selectedClubData.coach.displayName}` : "No coach"}
                  {selectedClubData.reservesName && ` | Reserves: ${selectedClubData.reservesName}`}
                </p>
              </div>
            </div>
            <Button variant="ghost" size="icon" onClick={() => setSelectedClub(null)}>
              <X className="h-4 w-4" />
            </Button>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Salary Cap by Year */}
            <div>
              <h4 className="font-semibold mb-3">Salary Cap by Year</h4>
              <div className="grid grid-cols-5 lg:grid-cols-10 gap-2">
                {years.map((year) => {
                  const salary = selectedClubData.salaryByYear[year] || 0;
                  const usage = (salary / season.salaryCap) * 100;
                  const isOverCap = salary > season.salaryCap;
                  const remaining = season.salaryCap - salary;

                  return (
                    <div
                      key={year}
                      className={`p-2 rounded-lg border text-center ${
                        isOverCap ? "border-red-500/50 bg-red-500/10" : "bg-muted/30"
                      }`}
                    >
                      <div className="text-xs font-medium text-muted-foreground">{year}</div>
                      <div className="text-lg font-bold">{salary || "-"}</div>
                      <div className={`text-[10px] ${isOverCap ? "text-red-500" : "text-muted-foreground"}`}>
                        {salary > 0 ? (isOverCap ? `+${Math.abs(remaining)}` : `-${remaining}`) : ""}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Rivals */}
            {selectedClubData.rivals.length > 0 && (
              <div>
                <h4 className="font-semibold mb-3 flex items-center gap-2">
                  <Swords className="h-4 w-4" />
                  Rivalries
                </h4>
                <div className="flex flex-wrap gap-2">
                  {selectedClubData.rivals.map((rival, idx) => (
                    <div
                      key={idx}
                      className="flex items-center gap-2 px-3 py-2 rounded-lg border bg-orange-500/10 border-orange-500/30"
                    >
                      <div
                        className="w-6 h-6 rounded text-xs font-bold flex items-center justify-center"
                        style={{
                          backgroundColor: rival.club.primaryColor || "#666",
                          color: rival.club.secondaryColor || "#fff",
                        }}
                      >
                        {rival.club.abbreviation}
                      </div>
                      <span className="font-medium">{rival.club.name}</span>
                      <Badge variant="outline" className="text-xs">
                        {rival.reason === "FINALS_OPPONENT" ? "Finals" : "Nominated"}
                      </Badge>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Contracts Table */}
            <div>
              <h4 className="font-semibold mb-3 flex items-center gap-2">
                <Users className="h-4 w-4" />
                Contracts ({selectedClubData.contracts.length})
              </h4>
              {selectedClubData.contracts.length > 0 ? (
                <div className="rounded-lg border overflow-hidden">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Player</TableHead>
                        <TableHead>AFL Team</TableHead>
                        <TableHead>Position</TableHead>
                        <TableHead>Type</TableHead>
                        <TableHead className="text-center">Years</TableHead>
                        {years.map((year) => (
                          <TableHead key={year} className="text-right">{year}</TableHead>
                        ))}
                        <TableHead className="text-right">Total</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {selectedClubData.contracts
                        .sort((a, b) => {
                          const aValue = a.yearBreakdown.find((y) => y.season === season.year)?.value || 0;
                          const bValue = b.yearBreakdown.find((y) => y.season === season.year)?.value || 0;
                          return bValue - aValue;
                        })
                        .map((contract) => (
                          <TableRow key={contract.id}>
                            <TableCell className="font-medium">
                              <div className="flex items-center gap-2">
                                {contract.aflPlayer.lastName}, {contract.aflPlayer.firstName}
                                {contract.tradeBlock && (
                                  <Badge variant="destructive" className="text-xs">TB</Badge>
                                )}
                              </div>
                            </TableCell>
                            <TableCell className="text-muted-foreground">
                              {contract.aflPlayer.aflTeam?.abbreviation || "-"}
                            </TableCell>
                            <TableCell>
                              <div className="flex gap-1">
                                {contract.aflPlayer.positions.map((pos) => (
                                  <Badge key={pos} variant="outline" className="text-xs">{pos}</Badge>
                                ))}
                              </div>
                            </TableCell>
                            <TableCell>
                              <Badge variant="secondary" className="text-xs">{contract.contractType}</Badge>
                            </TableCell>
                            <TableCell className="text-center text-muted-foreground">
                              {contract.startSeason}-{contract.endSeason}
                            </TableCell>
                            {years.map((year) => {
                              const yearValue = contract.yearBreakdown.find((y) => y.season === year)?.value;
                              return (
                                <TableCell key={year} className="text-right">
                                  {yearValue !== undefined ? (
                                    <span className={year === season.year ? "font-semibold" : ""}>
                                      {formatSalary(yearValue)}
                                    </span>
                                  ) : (
                                    <span className="text-muted-foreground">-</span>
                                  )}
                                </TableCell>
                              );
                            })}
                            <TableCell className="text-right font-semibold">
                              {formatSalary(contract.totalValue)}
                            </TableCell>
                          </TableRow>
                        ))}
                    </TableBody>
                  </Table>
                </div>
              ) : (
                <p className="text-muted-foreground text-sm">No active contracts</p>
              )}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
