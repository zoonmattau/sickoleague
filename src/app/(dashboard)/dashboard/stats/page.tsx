import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getAllTeamStats, getAllPlayerStats } from "./actions";
import { TeamsStats } from "./teams-stats";
import { PlayersStats } from "./players-stats";
import prisma from "@/lib/prisma";

export default async function StatsPage() {
  const [teamStats, playerStats, clubs] = await Promise.all([
    getAllTeamStats(),
    getAllPlayerStats(),
    prisma.club.findMany({
      select: {
        id: true,
        name: true,
        abbreviation: true,
      },
      orderBy: { name: "asc" },
    }),
  ]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Statistics</h1>
        <p className="text-muted-foreground">
          League-wide team and player statistics
        </p>
      </div>

      <Card>
        <CardContent className="pt-6">
          <Tabs defaultValue="teams">
            <TabsList>
              <TabsTrigger value="teams">Teams</TabsTrigger>
              <TabsTrigger value="players">Players</TabsTrigger>
            </TabsList>

            <TabsContent value="teams" className="mt-6">
              <TeamsStats stats={teamStats} />
            </TabsContent>

            <TabsContent value="players" className="mt-6">
              <PlayersStats stats={playerStats} clubs={clubs} />
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}
