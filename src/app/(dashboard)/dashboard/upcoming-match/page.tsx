import { getMyClubWithRoster, getClubPlayerStats } from "../roster/actions";
import { UpcomingMatchPanel } from "../upcoming-match-panel";
import { Card, CardContent } from "@/components/ui/card";
import type { SerializedContract, SerializedRosterPlayer, PlayerStats, CaptaincyInfo } from "../types";

export default async function UpcomingMatchPage() {
  const club = await getMyClubWithRoster();

  if (!club) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Upcoming Match</h1>
          <p className="text-muted-foreground">Your next matchup breakdown</p>
        </div>
        <Card>
          <CardContent className="py-6 text-center text-muted-foreground">
            No club assigned. Contact a league admin to get started.
          </CardContent>
        </Card>
      </div>
    );
  }

  const serializedContracts: SerializedContract[] = club.contracts.map((c) => ({
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

  const contractLookup = new Map(serializedContracts.map((sc) => [sc.id, sc]));

  const serializedRosterPlayers: SerializedRosterPlayer[] = club.rosterPlayers.map((rp) => {
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

  const playerStats = await getClubPlayerStats(club.id);

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

  const captaincy: CaptaincyInfo = {
    seniorCaptainId: seniorCaptainRpId,
    seniorVcId: seniorVcRpId,
    reservesCaptainId: reservesCaptainRpId,
    reservesVcId: reservesVcRpId,
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Upcoming Match</h1>
        <p className="text-muted-foreground">Your next matchup breakdown</p>
      </div>
      <div className="max-w-2xl">
        <UpcomingMatchPanel
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
      </div>
    </div>
  );
}
