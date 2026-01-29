import { Badge } from "@/components/ui/badge";
import { getMyClubWithRoster, getMyRosterWithStats } from "./actions";
import { RosterView } from "./roster-view";
import type { SerializedContract } from "../types";

export default async function RosterPage() {
  const [club, rosterStats] = await Promise.all([
    getMyClubWithRoster(),
    getMyRosterWithStats(),
  ]);

  // If no club, show a message or redirect
  if (!club) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Roster Management</h1>
          <p className="text-muted-foreground">
            You don&apos;t have a club assigned yet. Contact the commissioner to get started.
          </p>
        </div>
      </div>
    );
  }

  // Serialize contracts for the player detail panel
  const serializedContracts: SerializedContract[] = club.contracts.map(c => ({
    id: c.id,
    startSeason: 0, // We don't have this in the basic query
    endSeason: 0,
    totalValue: 0,
    yearBreakdown: [],
    contractType: "DRAFT",
    isMinimum: false,
    tradeBlock: false,
    aflPlayer: {
      id: c.aflPlayer.id,
      firstName: c.aflPlayer.firstName,
      lastName: c.aflPlayer.lastName,
      positions: c.aflPlayer.positions,
      aflTeam: c.aflPlayer.aflTeam ? {
        name: c.aflPlayer.aflTeam.abbreviation,
        abbreviation: c.aflPlayer.aflTeam.abbreviation,
      } : null,
    },
  }));

  // Serialize club data to avoid passing Decimal types to client
  const serializedClub = {
    id: club.id,
    name: club.name,
    reservesName: club.reservesName ?? `${club.name} Reserves`,
    primaryColor: club.primaryColor ?? null,
    secondaryColor: club.secondaryColor ?? null,
    contracts: club.contracts.map(c => ({
      id: c.id,
      aflPlayer: {
        id: c.aflPlayer.id,
        firstName: c.aflPlayer.firstName,
        lastName: c.aflPlayer.lastName,
        positions: c.aflPlayer.positions,
        aflTeam: c.aflPlayer.aflTeam ? {
          abbreviation: c.aflPlayer.aflTeam.abbreviation,
        } : null,
      },
      rosterPlayers: c.rosterPlayers.map(rp => ({
        id: rp.id,
        rosterSpot: rp.rosterSpot,
      })),
    })),
    rosterPlayers: club.rosterPlayers.map(rp => ({
      id: rp.id,
      rosterSpot: rp.rosterSpot,
      squad: rp.squad,
      isCaptain: rp.isCaptain,
      isViceCaptain: rp.isViceCaptain,
      contract: {
        id: rp.contract.id,
        aflPlayer: {
          firstName: rp.contract.aflPlayer.firstName,
          lastName: rp.contract.aflPlayer.lastName,
          positions: rp.contract.aflPlayer.positions,
          aflTeam: rp.contract.aflPlayer.aflTeam ? {
            abbreviation: rp.contract.aflPlayer.aflTeam.abbreviation,
          } : null,
        },
      },
    })),
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Roster Management</h1>
          <p className="text-muted-foreground">
            Manage your senior and reserve squads for {club.name}
          </p>
        </div>
        <div className="flex items-center gap-4">
          <Badge variant="outline" className="text-sm px-3 py-1">
            {club.contracts.length} Contracted Players
          </Badge>
        </div>
      </div>

      <RosterView
        club={serializedClub}
        rosterStats={rosterStats}
        serializedContracts={serializedContracts}
      />
    </div>
  );
}
