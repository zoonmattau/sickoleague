import { createClient } from "@/lib/supabase/server";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { getMyClubWithRoster, getClubPlayerStats } from "@/app/(dashboard)/dashboard/roster/actions";
import { DashboardLineup } from "./dashboard-lineup";
import { WeekendChecklist } from "./weekend-checklist";
import { TeamGraphs } from "./team-graphs";
import type { SerializedContract, SerializedRosterPlayer, PlayerStats, CaptaincyInfo } from "./types";

export default async function DashboardPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  const club = await getMyClubWithRoster();

  // Compute stat card data
  const salaryUsed = club?.contracts
    ? club.contracts.reduce((sum, c) => sum + Number(c.totalValue), 0)
    : 0;
  const salaryCap = 750;
  const salaryRemaining = salaryCap - salaryUsed;
  const totalContracts = club?.contracts?.length ?? 0;

  const seniorsCount = club?.rosterPlayers
    ? club.rosterPlayers.filter((rp) => rp.squad === "SENIORS").length
    : 0;
  const reservesCount = club?.rosterPlayers
    ? club.rosterPlayers.filter((rp) => rp.squad === "RESERVES").length
    : 0;

  // Serialize data for client components
  let serializedContracts: SerializedContract[] = [];
  let serializedRosterPlayers: SerializedRosterPlayer[] = [];
  let playerStats: PlayerStats[] = [];
  let captaincy: CaptaincyInfo = {
    seniorCaptainId: null,
    seniorVcId: null,
    reservesCaptainId: null,
    reservesVcId: null,
  };
  let realCaptaincy: CaptaincyInfo = {
    seniorCaptainId: null,
    seniorVcId: null,
    reservesCaptainId: null,
    reservesVcId: null,
  };

  if (club) {
    serializedContracts = club.contracts.map((c) => ({
      id: c.id,
      startSeason: c.startSeason,
      endSeason: c.endSeason,
      totalValue: Number(c.totalValue),
      yearBreakdown: c.yearBreakdown as { season: number; value: number }[],
      isMinimum: c.isMinimum,
      contractType: c.contractType,
      status: c.status,
      tradeBlock: (c as Record<string, unknown>).tradeBlock as boolean ?? false,
      aflPlayer: {
        id: c.aflPlayer.id,
        firstName: c.aflPlayer.firstName,
        lastName: c.aflPlayer.lastName,
        positions: c.aflPlayer.positions,
        photoUrl: c.aflPlayer.photoUrl,
        isAvailable: c.aflPlayer.isAvailable,
        aflTeam: c.aflPlayer.aflTeam
          ? {
              id: c.aflPlayer.aflTeam.id,
              name: c.aflPlayer.aflTeam.name,
              abbreviation: c.aflPlayer.aflTeam.abbreviation,
            }
          : null,
      },
      rosterPlayers: c.rosterPlayers.map((rp) => ({
        id: rp.id,
        rosterSpot: rp.rosterSpot,
        squad: rp.squad,
      })),
    }));

    // Build a lookup from contract id -> serialized contract
    const contractLookup = new Map(serializedContracts.map((sc) => [sc.id, sc]));

    serializedRosterPlayers = club.rosterPlayers.map((rp) => {
      // Use the already-serialized contract (which includes rosterPlayers)
      const serializedContract = contractLookup.get(rp.contractId);
      const c = rp.contract;

      return {
        id: rp.id,
        squad: rp.squad,
        rosterSpot: rp.rosterSpot,
        contractId: rp.contractId,
        contract: serializedContract ?? {
          id: c.id,
          startSeason: c.startSeason,
          endSeason: c.endSeason,
          totalValue: Number(c.totalValue),
          yearBreakdown: c.yearBreakdown as { season: number; value: number }[],
          isMinimum: c.isMinimum,
          contractType: c.contractType,
          status: c.status,
          tradeBlock: (c as Record<string, unknown>).tradeBlock as boolean ?? false,
          aflPlayer: {
            id: c.aflPlayer.id,
            firstName: c.aflPlayer.firstName,
            lastName: c.aflPlayer.lastName,
            positions: c.aflPlayer.positions,
            photoUrl: c.aflPlayer.photoUrl,
            isAvailable: c.aflPlayer.isAvailable,
            aflTeam: c.aflPlayer.aflTeam
              ? {
                  id: c.aflPlayer.aflTeam.id,
                  name: c.aflPlayer.aflTeam.name,
                  abbreviation: c.aflPlayer.aflTeam.abbreviation,
                }
              : null,
          },
          rosterPlayers: [],
        },
      };
    });

    playerStats = await getClubPlayerStats(club.id);

    // Track the real DB values for the checklist
    realCaptaincy = {
      seniorCaptainId: club.seniorCaptainId,
      seniorVcId: club.seniorVcId,
      reservesCaptainId: club.reservesCaptainId,
      reservesVcId: club.reservesVcId,
    };

    captaincy = {
      seniorCaptainId: club.seniorCaptainId,
      seniorVcId: club.seniorVcId,
      reservesCaptainId: club.reservesCaptainId,
      reservesVcId: club.reservesVcId,
    };
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Welcome back</h1>
        <p className="text-muted-foreground">
          {user?.user_metadata?.full_name || user?.email}
        </p>
      </div>

      {/* Club Overview */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Salary Cap</CardTitle>
            <Badge variant="outline">$750k</Badge>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{club ? `$${(salaryUsed * 1000).toLocaleString()}` : "--"}</div>
            <p className="text-xs text-muted-foreground">
              {club ? `$${(salaryRemaining * 1000).toLocaleString()} remaining` : "-- remaining"}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Roster Size</CardTitle>
            <Badge variant="outline">19-21</Badge>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{club ? `${totalContracts}/21` : "--/21"}</div>
            <p className="text-xs text-muted-foreground">
              {club ? `${seniorsCount} seniors, ${reservesCount} reserves` : "-- seniors, -- reserves"}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Seniors HFA</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">+0</div>
            <p className="text-xs text-muted-foreground">
              Based on last 10 home games
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Reserves HFA</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">+0</div>
            <p className="text-xs text-muted-foreground">
              Based on last 10 home games
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Weekend Checklist + Team Graphs */}
      {club && (
        <div className="grid gap-4 lg:grid-cols-[1fr_2fr]">
          <WeekendChecklist
            rosterPlayers={serializedRosterPlayers}
            contracts={serializedContracts}
            captaincy={captaincy}
            realCaptaincy={realCaptaincy}
          />
          <TeamGraphs
            clubId={club.id}
            clubName={club.name}
            reservesName={club.reservesName ?? club.name + " Reserves"}
          />
        </div>
      )}

      {/* Main content tabs */}
      {club ? (
        <Tabs defaultValue="lineups" className="space-y-4">
          <TabsList>
            <TabsTrigger value="lineups">Lineups</TabsTrigger>
            <TabsTrigger value="overview">Overview</TabsTrigger>
          </TabsList>

          <TabsContent value="lineups">
            <DashboardLineup
              clubId={club.id}
              clubName={club.name}
              reservesName={club.reservesName ?? club.name + " Reserves"}
              primaryColor={club.primaryColor}
              secondaryColor={club.secondaryColor}
              rosterPlayers={serializedRosterPlayers}
              contracts={serializedContracts}
              playerStats={playerStats}
              captaincy={captaincy}
            />
          </TabsContent>

          <TabsContent value="overview" className="space-y-4">
            {/* Quick Links */}
            <div className="grid gap-4 md:grid-cols-2">
              <Card>
                <CardHeader>
                  <CardTitle>Upcoming Match</CardTitle>
                  <CardDescription>Next round fixture</CardDescription>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground">No upcoming matches scheduled</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Recent Activity</CardTitle>
                  <CardDescription>Latest league activity</CardDescription>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground">No recent activity</p>
                </CardContent>
              </Card>
            </div>

            {/* Standings Preview */}
            <div className="grid gap-4 md:grid-cols-2">
              <Card>
                <CardHeader>
                  <CardTitle>Seniors Ladder</CardTitle>
                  <CardDescription>Current season standings</CardDescription>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground">Season not started</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Reserves Ladder</CardTitle>
                  <CardDescription>Current season standings</CardDescription>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground">Season not started</p>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      ) : (
        <Card>
          <CardContent className="py-6">
            <p className="text-muted-foreground text-center">
              No club assigned. Contact a league admin to get started.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
