"use client";

import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { Search, ChevronDown, ChevronRight, TrendingUp } from "lucide-react";
import type { FreeAgentStaff } from "./actions";
import Link from "next/link";

interface StaffTabProps {
  staff: FreeAgentStaff[];
  myClubId: string | null;
}

const roleLabels: Record<string, string> = {
  ASSISTANT_COACH: "Coach",
  LIST_MANAGER: "List Manager",
};

const leagueLabels: Record<string, string> = {
  AFL: "AFL",
  VFL: "VFL (Victoria)",
  SANFL: "SANFL (South Australia)",
  WAFL: "WAFL (Western Australia)",
  NTFL: "NTFL (Northern Territory)",
};

const leagueColors: Record<string, string> = {
  AFL: "bg-blue-600",
  VFL: "bg-purple-600",
  SANFL: "bg-red-600",
  WAFL: "bg-yellow-600",
  NTFL: "bg-green-600",
};

function getListManagerDiscount(ladderPos: number | null): string | null {
  if (!ladderPos) return null;
  const discount = (19 - ladderPos) / 3;
  return discount > 0 ? `${discount.toFixed(1)}%` : null;
}

export function StaffTab({ staff, myClubId }: StaffTabProps) {
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState<string>("all");
  const [expandedLeagues, setExpandedLeagues] = useState<Set<string>>(
    new Set(["AFL"])
  );

  // Filter staff
  const filteredStaff = staff.filter((s) => {
    const matchesSearch = s.name.toLowerCase().includes(search.toLowerCase());
    const matchesRole = roleFilter === "all" || s.role === roleFilter;
    return matchesSearch && matchesRole;
  });

  // Group by league
  const staffByLeague = filteredStaff.reduce(
    (acc, s) => {
      if (!acc[s.league]) acc[s.league] = [];
      acc[s.league].push(s);
      return acc;
    },
    {} as Record<string, FreeAgentStaff[]>
  );

  const toggleLeague = (league: string) => {
    const newExpanded = new Set(expandedLeagues);
    if (newExpanded.has(league)) {
      newExpanded.delete(league);
    } else {
      newExpanded.add(league);
    }
    setExpandedLeagues(newExpanded);
  };

  const leagueOrder = ["AFL", "VFL", "SANFL", "WAFL", "NTFL"];

  return (
    <div className="space-y-4">
      {/* Filters */}
      <div className="flex flex-wrap gap-4">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search staff..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>

        <Select value={roleFilter} onValueChange={setRoleFilter}>
          <SelectTrigger className="w-[160px]">
            <SelectValue placeholder="Role" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Roles</SelectItem>
            <SelectItem value="ASSISTANT_COACH">Coaches</SelectItem>
            <SelectItem value="LIST_MANAGER">List Managers</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Info box */}
      <div className="p-4 bg-muted/50 rounded-lg space-y-2">
        <h4 className="font-semibold flex items-center gap-2">
          <TrendingUp className="h-4 w-4" />
          Staff Bonuses
        </h4>
        <ul className="text-sm text-muted-foreground space-y-1">
          <li>
            <strong>AFL Coaches:</strong> Your team score gets +margin/10 when
            their AFL team wins
          </li>
          <li>
            <strong>State League Coaches:</strong> Half bonus (margin/20)
          </li>
          <li>
            <strong>List Managers:</strong> Contract discount based on their AFL
            team&apos;s ladder position
          </li>
        </ul>
      </div>

      {/* Staff by league */}
      <div className="space-y-4">
        {leagueOrder.map((league) => {
          const leagueStaff = staffByLeague[league];
          if (!leagueStaff || leagueStaff.length === 0) return null;

          const isExpanded = expandedLeagues.has(league);
          const availableCount = leagueStaff.filter(
            (s) => !s.currentContract
          ).length;

          return (
            <Collapsible
              key={league}
              open={isExpanded}
              onOpenChange={() => toggleLeague(league)}
            >
              <CollapsibleTrigger asChild>
                <button className="flex items-center gap-2 w-full p-3 rounded-lg bg-muted hover:bg-muted/80 transition-colors">
                  {isExpanded ? (
                    <ChevronDown className="h-4 w-4" />
                  ) : (
                    <ChevronRight className="h-4 w-4" />
                  )}
                  <Badge className={`${leagueColors[league]} text-white`}>
                    {league}
                  </Badge>
                  <span className="font-medium">{leagueLabels[league]}</span>
                  <span className="text-sm text-muted-foreground ml-auto">
                    {availableCount} available / {leagueStaff.length} total
                  </span>
                </button>
              </CollapsibleTrigger>
              <CollapsibleContent>
                <div className="mt-2 rounded-md border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Name</TableHead>
                        <TableHead>Role</TableHead>
                        {league === "AFL" && <TableHead>AFL Team</TableHead>}
                        {league === "AFL" && (
                          <TableHead className="text-center">
                            Ladder Pos
                          </TableHead>
                        )}
                        <TableHead>Status</TableHead>
                        {league === "AFL" && (
                          <TableHead className="text-center">
                            Discount
                          </TableHead>
                        )}
                        <TableHead></TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {leagueStaff.map((s) => (
                        <TableRow
                          key={s.id}
                          className={
                            s.currentContract?.clubId === myClubId
                              ? "bg-green-500/10"
                              : ""
                          }
                        >
                          <TableCell className="font-medium">
                            {s.name}
                          </TableCell>
                          <TableCell>
                            <Badge variant="outline">
                              {roleLabels[s.role]}
                            </Badge>
                          </TableCell>
                          {league === "AFL" && (
                            <TableCell>
                              {s.aflTeam?.abbreviation ?? "-"}
                            </TableCell>
                          )}
                          {league === "AFL" && (
                            <TableCell className="text-center">
                              {s.aflTeam?.currentLadderPos ?? "-"}
                            </TableCell>
                          )}
                          <TableCell>
                            {s.currentContract ? (
                              <div className="text-sm">
                                <span
                                  className={
                                    s.currentContract.clubId === myClubId
                                      ? "text-green-600 font-medium"
                                      : ""
                                  }
                                >
                                  {s.currentContract.clubName}
                                </span>
                                <span className="text-muted-foreground">
                                  {" "}
                                  (until {s.currentContract.endSeason})
                                </span>
                              </div>
                            ) : (
                              <Badge
                                variant="secondary"
                                className="bg-green-100 text-green-800"
                              >
                                Available
                              </Badge>
                            )}
                          </TableCell>
                          {league === "AFL" && s.role === "LIST_MANAGER" && (
                            <TableCell className="text-center">
                              {s.aflTeam?.currentLadderPos ? (
                                <span className="text-green-600 font-medium">
                                  {getListManagerDiscount(
                                    s.aflTeam.currentLadderPos
                                  )}
                                </span>
                              ) : (
                                "-"
                              )}
                            </TableCell>
                          )}
                          {league === "AFL" && s.role !== "LIST_MANAGER" && (
                            <TableCell className="text-center text-muted-foreground">
                              -
                            </TableCell>
                          )}
                          <TableCell>
                            {!s.currentContract && s.isAvailable ? (
                              <Button size="sm" asChild>
                                <Link
                                  href={`/dashboard/negotiate?type=staff&id=${s.id}`}
                                >
                                  Negotiate
                                </Link>
                              </Button>
                            ) : s.currentContract?.clubId === myClubId ? (
                              <Badge variant="outline" className="bg-green-50">
                                Yours
                              </Badge>
                            ) : (
                              <Badge variant="secondary">Signed</Badge>
                            )}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </CollapsibleContent>
            </Collapsible>
          );
        })}
      </div>
    </div>
  );
}
