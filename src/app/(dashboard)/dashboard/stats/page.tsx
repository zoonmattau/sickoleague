import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent } from "@/components/ui/card";
import { getAllTeamStats, getAllPlayerStats } from "./actions";
import { TeamsStats } from "./teams-stats";
import { PlayersStatsWrapper } from "./players-stats-wrapper";
import prisma from "@/lib/prisma";
import { createClient } from "@/lib/supabase/server";

export default async function StatsPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  const [teamStats, playerStats, clubs, myClub] = await Promise.all([
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
    user ? prisma.club.findFirst({
      where: { coach: { discordId: user.user_metadata?.provider_id } },
      select: { id: true },
    }) : null,
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
              <PlayersStatsWrapper stats={playerStats} clubs={clubs} myClubId={myClub?.id ?? null} />
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}
