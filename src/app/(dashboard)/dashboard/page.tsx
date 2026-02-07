import { createClient } from "@/lib/supabase/server";
import { Card, CardContent } from "@/components/ui/card";
import { getMyClubWithRoster, getClubPlayerStats } from "@/app/(dashboard)/dashboard/roster/actions";
import { getClubRecord, getClubUpcomingMatch, getTeamFormAnalysis } from "@/app/(dashboard)/dashboard/standings/actions";
import Link from "next/link";
import { DraggableLineup } from "./lineup/draggable-lineup";
import { DashboardOverview } from "./dashboard-overview";
import { WeekendChecklist } from "./weekend-checklist";
import { TeamGraphs } from "./team-graphs";
import { LeagueGraphs } from "./league-graphs";
import type { SerializedContract, SerializedRosterPlayer, PlayerStats, CaptaincyInfo } from "./types";

export default async function DashboardPage() {
  // Run auth and club fetch in parallel
  const [supabase, club] = await Promise.all([
    createClient(),
    getMyClubWithRoster(),
  ]);
  const { data: { user } } = await supabase.auth.getUser();

  // Compute stat card data - use current year's salary, not total contract value
  const currentYear = new Date().getFullYear();
  const salaryUsed = club?.contracts
    ? club.contracts.reduce((sum, c) => {
        const breakdown = c.yearBreakdown as { season: number; value: number }[];
        const currentYearValue = breakdown.find(y => y.season === currentYear)?.value ?? 0;
        return sum + currentYearValue;
      }, 0)
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
  }

  // Find captains and vice-captains from roster player boolean flags
  type CaptainInfo = { name: string; contractId: string } | null;
  let seniorCaptain: CaptainInfo = null;
  let seniorVc: CaptainInfo = null;
  let reservesCaptain: CaptainInfo = null;
  let reservesVc: CaptainInfo = null;

  if (club) {
    // Captain flags are boolean fields on RosterPlayer
    for (const rp of club.rosterPlayers) {
      const playerName = `${rp.contract.aflPlayer.firstName.charAt(0)}. ${rp.contract.aflPlayer.lastName}`;

      if (rp.squad === "SENIORS" && rp.isCaptain) {
        seniorCaptain = { name: playerName, contractId: rp.contract.id };
      }
      if (rp.squad === "SENIORS" && rp.isViceCaptain) {
        seniorVc = { name: playerName, contractId: rp.contract.id };
      }
      if (rp.squad === "RESERVES" && rp.isCaptain) {
        reservesCaptain = { name: playerName, contractId: rp.contract.id };
      }
      if (rp.squad === "RESERVES" && rp.isViceCaptain) {
        reservesVc = { name: playerName, contractId: rp.contract.id };
      }
    }
  }

  const captainDisplay = {
    seniorCaptain,
    seniorVc,
    reservesCaptain,
    reservesVc,
  };

  // Fetch record, form, and upcoming match data
  const [record, form, upcomingMatch] = club
    ? await Promise.all([
        getClubRecord(club.id),
        getTeamFormAnalysis(club.id),
        getClubUpcomingMatch(club.id),
      ])
    : [null, null, null];

  if (club) {
    // Find captains from roster player boolean flags
    let seniorCaptainRpId: string | null = null;
    let seniorVcRpId: string | null = null;
    let reservesCaptainRpId: string | null = null;
    let reservesVcRpId: string | null = null;

    for (const rp of club.rosterPlayers) {
      if (rp.squad === "SENIORS" && rp.isCaptain) seniorCaptainRpId = rp.id;
      if (rp.squad === "SENIORS" && rp.isViceCaptain) seniorVcRpId = rp.id;
      if (rp.squad === "RESERVES" && rp.isCaptain) reservesCaptainRpId = rp.id;
      if (rp.squad === "RESERVES" && rp.isViceCaptain) reservesVcRpId = rp.id;
    }

    realCaptaincy = {
      seniorCaptainId: seniorCaptainRpId,
      seniorVcId: seniorVcRpId,
      reservesCaptainId: reservesCaptainRpId,
      reservesVcId: reservesVcRpId,
    };

    captaincy = {
      seniorCaptainId: seniorCaptainRpId,
      seniorVcId: seniorVcRpId,
      reservesCaptainId: reservesCaptainRpId,
      reservesVcId: reservesVcRpId,
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
      {club ? (
        <DashboardOverview
          clubId={club.id}
          clubName={club.name}
          reservesName={club.reservesName ?? club.name + " Reserves"}
          contracts={serializedContracts}
          rosterPlayers={serializedRosterPlayers}
          salaryUsed={salaryUsed}
          salaryCap={salaryCap}
          seniorsCount={seniorsCount}
          reservesCount={reservesCount}
          record={record}
          form={form}
          upcomingMatch={upcomingMatch}
          captains={captainDisplay}
        />
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card><CardContent className="py-6 text-center text-muted-foreground">--</CardContent></Card>
          <Card><CardContent className="py-6 text-center text-muted-foreground">--</CardContent></Card>
          <Card><CardContent className="py-6 text-center text-muted-foreground">--</CardContent></Card>
          <Card><CardContent className="py-6 text-center text-muted-foreground">--</CardContent></Card>
        </div>
      )}

      {/* Upcoming Match Link + Weekend Checklist */}
      {club && (
        <div className="grid gap-4 lg:grid-cols-2">
          {upcomingMatch ? (
            <Link href="/dashboard/upcoming-match">
              <Card className="hover:bg-muted/50 transition-colors cursor-pointer h-full">
                <CardContent className="py-6 flex items-center justify-between">
                  <div>
                    <div className="text-sm text-muted-foreground">Next Match - Round {upcomingMatch.roundNumber}</div>
                    <div className="text-xl font-bold mt-1 flex items-center gap-2">
                      vs
                      <span
                        className="px-2 py-0.5 rounded text-sm"
                        style={{
                          backgroundColor: upcomingMatch.opponent.primaryColor || "#6b7280",
                          color: upcomingMatch.opponent.secondaryColor || "#ffffff",
                        }}
                      >
                        {upcomingMatch.opponent.abbreviation}
                      </span>
                      {upcomingMatch.opponent.name}
                    </div>
                    <div className="text-sm text-muted-foreground mt-1">
                      {upcomingMatch.isHome ? "Home" : "Away"}
                    </div>
                  </div>
                  <div className="text-muted-foreground text-sm">View details &rarr;</div>
                </CardContent>
              </Card>
            </Link>
          ) : (
            <Card>
              <CardContent className="py-6 text-center text-muted-foreground">
                No upcoming matches
              </CardContent>
            </Card>
          )}
          <WeekendChecklist
            rosterPlayers={serializedRosterPlayers}
            contracts={serializedContracts}
            captaincy={captaincy}
            realCaptaincy={realCaptaincy}
          />
        </div>
      )}

      {/* Team Graphs */}
      {club && (
        <TeamGraphs
          clubId={club.id}
          clubName={club.name}
          reservesName={club.reservesName ?? club.name + " Reserves"}
          primaryColor={club.primaryColor}
          secondaryColor={club.secondaryColor}
        />
      )}

      {/* League-wide Graphs */}
      <LeagueGraphs myClubId={club?.id} />

      {/* Lineups */}
      {club ? (
        <DraggableLineup
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
