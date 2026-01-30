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
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { Search, ChevronDown, ChevronRight, TrendingUp, Users, ClipboardList } from "lucide-react";
import type { FreeAgentStaff } from "./actions";
import Link from "next/link";
import { StaffDetailDialog } from "./staff-detail-dialog";

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
  const [roleFilter, setRoleFilter] = useState<string>("ASSISTANT_COACH");
  const [expandedLeagues, setExpandedLeagues] = useState<Set<string>>(
    new Set(["AFL"])
  );
  const [detailStaffId, setDetailStaffId] = useState<string | null>(null);
  const [detailDialogOpen, setDetailDialogOpen] = useState(false);

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
      {/* Role Toggle Tabs */}
      <div className="flex gap-2 p-1 bg-muted rounded-lg w-fit">
        <button
          onClick={() => setRoleFilter("ASSISTANT_COACH")}
          className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-colors ${
            roleFilter === "ASSISTANT_COACH"
              ? "bg-background text-foreground shadow-sm"
              : "text-muted-foreground hover:text-foreground"
          }`}
        >
          <Users className="h-4 w-4" />
          Coaches
        </button>
        <button
          onClick={() => setRoleFilter("LIST_MANAGER")}
          className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-colors ${
            roleFilter === "LIST_MANAGER"
              ? "bg-background text-foreground shadow-sm"
              : "text-muted-foreground hover:text-foreground"
          }`}
        >
          <ClipboardList className="h-4 w-4" />
          List Managers
        </button>
      </div>

      {/* Search */}
      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          placeholder="Search staff..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-9"
        />
      </div>

      {/* Info box - context-aware based on selected role */}
      <div className="p-4 bg-muted/50 rounded-lg space-y-2">
        <h4 className="font-semibold flex items-center gap-2">
          <TrendingUp className="h-4 w-4" />
          {roleFilter === "ASSISTANT_COACH" ? "Coach Bonuses" : "List Manager Bonuses"}
        </h4>
        {roleFilter === "ASSISTANT_COACH" ? (
          <ul className="text-sm text-muted-foreground space-y-1">
            <li>
              <strong>AFL Coaches:</strong> Your team score gets +margin/10 when
              their AFL team wins
            </li>
            <li>
              <strong>State League Coaches:</strong> Half bonus (margin/20)
            </li>
          </ul>
        ) : (
          <ul className="text-sm text-muted-foreground space-y-1">
            <li>
              <strong>Contract Discounts:</strong> Based on their AFL
              team&apos;s ladder position
            </li>
            <li>
              <strong>Formula:</strong> (19 - ladder position) / 3 = discount %
            </li>
            <li>
              <strong>Example:</strong> 1st place = 6% discount, 10th = 3% discount
            </li>
          </ul>
        )}
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
                            <button
                              onClick={() => {
                                setDetailStaffId(s.id);
                                setDetailDialogOpen(true);
                              }}
                              className="hover:underline text-left"
                            >
                              {s.name}
                            </button>
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
                                  href={`/dashboard/negotiate/staff/${s.id}`}
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

      {/* Staff detail dialog */}
      <StaffDetailDialog
        staffId={detailStaffId}
        open={detailDialogOpen}
        onOpenChange={setDetailDialogOpen}
      />
    </div>
  );
}
