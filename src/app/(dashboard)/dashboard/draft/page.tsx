import { Suspense } from "react";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import prisma from "@/lib/prisma";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { DraftBoardClient } from "./draft-board-client";
import { getCurrentSeason, getDraftState, getDraftEligiblePlayers, getMyDraftPicks } from "./actions";

async function getUser() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  return user;
}

async function getMyClub(user: { id: string; email?: string | null }) {
  const coach = await prisma.coach.findFirst({
    where: {
      OR: [{ discordId: user.id }, { email: user.email ?? "" }],
    },
    include: { club: true },
  });
  return coach?.club ?? null;
}

export default async function DraftPage() {
  const user = await getUser();
  if (!user) {
    redirect("/login");
  }

  const myClub = await getMyClub(user);
  const season = await getCurrentSeason();

  if (!season) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Draft</h1>
          <p className="text-muted-foreground">
            No active or upcoming season found.
          </p>
        </div>
      </div>
    );
  }

  const [draftState, eligiblePlayers, myPicks] = await Promise.all([
    getDraftState(season.id),
    getDraftEligiblePlayers(season.id),
    myClub ? getMyDraftPicks(season.id) : [],
  ]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Draft</h1>
        <p className="text-muted-foreground">
          {season.year} Annual Draft
          {draftState?.draftStatus === "NOT_STARTED" && " - Not Yet Started"}
          {draftState?.draftStatus === "PAUSED" && " - Paused"}
          {draftState?.draftStatus === "COMPLETED" && " - Complete"}
        </p>
      </div>

      <Tabs defaultValue="board" className="space-y-4">
        <TabsList>
          <TabsTrigger value="board">Draft Board</TabsTrigger>
          <TabsTrigger value="picks">My Picks</TabsTrigger>
          <TabsTrigger value="history">Draft History</TabsTrigger>
          <TabsTrigger value="rule9">Rule 9</TabsTrigger>
        </TabsList>

        <TabsContent value="board" className="space-y-4">
          {draftState ? (
            <DraftBoardClient
              initialState={draftState}
              eligiblePlayers={eligiblePlayers}
              myClubId={myClub?.id ?? null}
              seasonId={season.id}
            />
          ) : (
            <Card>
              <CardHeader>
                <CardTitle>Draft Board</CardTitle>
                <CardDescription>
                  No draft picks have been generated yet.
                </CardDescription>
              </CardHeader>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="picks" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Your Draft Picks</CardTitle>
              <CardDescription>
                {myClub ? `Picks owned by ${myClub.name}` : "Sign in with a club to view your picks"}
              </CardDescription>
            </CardHeader>
            <CardContent>
              {!myClub ? (
                <p className="text-muted-foreground text-center py-8">
                  You must be assigned to a club to view your picks.
                </p>
              ) : myPicks.length === 0 ? (
                <p className="text-muted-foreground text-center py-8">
                  No draft picks assigned yet.
                </p>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Round</TableHead>
                      <TableHead>Pick #</TableHead>
                      <TableHead>Original Owner</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Selection</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {myPicks.map((pick) => (
                      <TableRow key={pick.id}>
                        <TableCell>{pick.round}</TableCell>
                        <TableCell>#{pick.pickNumber}</TableCell>
                        <TableCell>
                          {pick.originalClub.abbreviation}
                          {pick.originalClub.abbreviation !== myClub.abbreviation && (
                            <span className="text-muted-foreground text-xs ml-1">(traded)</span>
                          )}
                        </TableCell>
                        <TableCell>
                          {pick.used ? (
                            <Badge>Used</Badge>
                          ) : pick.passed ? (
                            <Badge variant="secondary">Passed</Badge>
                          ) : (
                            <Badge variant="outline">Available</Badge>
                          )}
                        </TableCell>
                        <TableCell>
                          {pick.player ? (
                            <span>
                              {pick.player.name}
                              <span className="text-muted-foreground text-xs ml-1">
                                ({pick.player.positions.join("/")})
                              </span>
                            </span>
                          ) : (
                            <span className="text-muted-foreground">-</span>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="history" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Draft History</CardTitle>
              <CardDescription>
                All selections made in this draft
              </CardDescription>
            </CardHeader>
            <CardContent>
              {draftState && draftState.picks.filter((p) => p.used || p.passed).length > 0 ? (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Pick</TableHead>
                      <TableHead>Round</TableHead>
                      <TableHead>Team</TableHead>
                      <TableHead>Selection</TableHead>
                      <TableHead>Positions</TableHead>
                      <TableHead>Avg</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {draftState.picks
                      .filter((p) => p.used || p.passed)
                      .sort((a, b) => a.pickNumber - b.pickNumber)
                      .map((pick) => (
                        <TableRow key={pick.id}>
                          <TableCell className="font-mono">#{pick.pickNumber}</TableCell>
                          <TableCell>R{pick.round}</TableCell>
                          <TableCell>
                            <Badge
                              style={{
                                backgroundColor: pick.club.primaryColor || undefined,
                                color: pick.club.secondaryColor || undefined,
                              }}
                            >
                              {pick.club.abbreviation}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            {pick.passed ? (
                              <span className="text-muted-foreground italic">Passed</span>
                            ) : pick.player ? (
                              pick.player.name
                            ) : (
                              "-"
                            )}
                          </TableCell>
                          <TableCell>
                            {pick.player?.positions.join(", ") || "-"}
                          </TableCell>
                          <TableCell className="font-mono">
                            {pick.player?.avgPoints?.toFixed(1) || "-"}
                          </TableCell>
                        </TableRow>
                      ))}
                  </TableBody>
                </Table>
              ) : (
                <p className="text-muted-foreground text-center py-8">
                  No picks have been made yet.
                </p>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="rule9" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Rule 9 Draft</CardTitle>
              <CardDescription>
                Mid-season draft for players stashed in reserves
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="p-4 bg-muted rounded-lg">
                <h4 className="font-medium mb-2">Eligibility Requirements</h4>
                <ul className="text-sm text-muted-foreground space-y-1">
                  <li>Majority of games played for reserves</li>
                  <li>Has a senior squad contract</li>
                  <li>Not a rookie in current or prior year</li>
                  <li>Not on the injured list</li>
                </ul>
              </div>
              <p className="text-muted-foreground">
                The Rule 9 Draft takes place between Round 13 and Round 14
              </p>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
