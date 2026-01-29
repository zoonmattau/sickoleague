"use server";

import prisma from "@/lib/prisma";
import { revalidatePath } from "next/cache";

export async function updateMatchResult(
  matchId: string,
  homeScore: number,
  awayScore: number
) {
  try {
    await prisma.match.update({
      where: { id: matchId },
      data: {
        homeScore: homeScore,
        awayScore: awayScore,
        status: "COMPLETED"
      }
    });

    revalidatePath("/admin");
    revalidatePath("/");

    return { success: true };
  } catch (error) {
    console.error("Failed to update match:", error);
    return { success: false, error: "Failed to update match result" };
  }
}

export async function recalculateStandings() {
  try {
    // Get all completed matches
    const matches = await prisma.match.findMany({
      where: { status: "COMPLETED" },
      include: {
        homeClub: true,
        awayClub: true
      }
    });

    // Get all clubs
    const clubs = await prisma.club.findMany();

    // Initialize standings data
    const standingsData: Record<string, {
      clubId: string;
      competition: "SENIORS" | "RESERVES";
      played: number;
      wins: number;
      losses: number;
      draws: number;
      pointsFor: number;
      pointsAgainst: number;
    }> = {};

    // Initialize all clubs with zero stats
    for (const club of clubs) {
      standingsData[`${club.id}-SENIORS`] = {
        clubId: club.id,
        competition: "SENIORS",
        played: 0,
        wins: 0,
        losses: 0,
        draws: 0,
        pointsFor: 0,
        pointsAgainst: 0
      };
      standingsData[`${club.id}-RESERVES`] = {
        clubId: club.id,
        competition: "RESERVES",
        played: 0,
        wins: 0,
        losses: 0,
        draws: 0,
        pointsFor: 0,
        pointsAgainst: 0
      };
    }

    // Calculate standings from matches
    for (const match of matches) {
      if (match.homeScore === null || match.awayScore === null) continue;

      const homeKey = `${match.homeClubId}-${match.matchType}`;
      const awayKey = `${match.awayClubId}-${match.matchType}`;

      // Update games played
      standingsData[homeKey].played++;
      standingsData[awayKey].played++;

      // Update points for/against
      const homeScore = Number(match.homeScore ?? 0);
      const awayScore = Number(match.awayScore ?? 0);
      standingsData[homeKey].pointsFor += homeScore;
      standingsData[homeKey].pointsAgainst += awayScore;
      standingsData[awayKey].pointsFor += awayScore;
      standingsData[awayKey].pointsAgainst += homeScore;

      // Update wins/losses/draws
      if (homeScore > awayScore) {
        standingsData[homeKey].wins++;
        standingsData[awayKey].losses++;
      } else if (awayScore > homeScore) {
        standingsData[awayKey].wins++;
        standingsData[homeKey].losses++;
      } else {
        standingsData[homeKey].draws++;
        standingsData[awayKey].draws++;
      }
    }

    // Update all standings in database
    for (const key of Object.keys(standingsData)) {
      const data = standingsData[key];
      const percentage = data.pointsAgainst === 0
        ? (data.pointsFor > 0 ? 999.9 : 100.0)
        : (data.pointsFor / data.pointsAgainst) * 100;

      await prisma.standing.updateMany({
        where: {
          clubId: data.clubId,
          competition: data.competition
        },
        data: {
          played: data.played,
          wins: data.wins,
          losses: data.losses,
          draws: data.draws,
          pointsFor: data.pointsFor,
          pointsAgainst: data.pointsAgainst,
          percentage: percentage
        }
      });
    }

    revalidatePath("/admin");
    revalidatePath("/");

    return { success: true };
  } catch (error) {
    console.error("Failed to recalculate standings:", error);
    return { success: false, error: "Failed to recalculate standings" };
  }
}

// ============================================================================
// CLUB MANAGEMENT
// ============================================================================

export async function getAllClubsWithCoaches() {
  const clubs = await prisma.club.findMany({
    include: {
      coach: true,
      _count: {
        select: { contracts: true },
      },
    },
    orderBy: { name: "asc" },
  });

  return clubs.map(club => ({
    id: club.id,
    name: club.name,
    abbreviation: club.abbreviation,
    reservesName: club.reservesName,
    reservesAbbreviation: club.reservesAbbreviation,
    primaryColor: club.primaryColor,
    secondaryColor: club.secondaryColor,
    coachId: club.coachId,
    coachName: club.coach?.displayName ?? null,
    coachEmail: club.coach?.email ?? null,
    contractCount: club._count.contracts,
  }));
}

export async function getAllCoaches() {
  const coaches = await prisma.coach.findMany({
    include: {
      club: {
        select: { id: true, name: true },
      },
    },
    orderBy: { displayName: "asc" },
  });

  return coaches.map(coach => ({
    id: coach.id,
    displayName: coach.displayName,
    email: coach.email,
    discordId: coach.discordId,
    avatarUrl: coach.avatarUrl,
    isCommissioner: coach.isCommissioner,
    clubId: coach.club?.id ?? null,
    clubName: coach.club?.name ?? null,
  }));
}

export async function updateClub(
  clubId: string,
  data: {
    name?: string;
    abbreviation?: string;
    reservesName?: string;
    reservesAbbreviation?: string;
    primaryColor?: string;
    secondaryColor?: string;
  }
) {
  try {
    await prisma.club.update({
      where: { id: clubId },
      data,
    });
    revalidatePath("/admin");
    return { success: true };
  } catch (error) {
    console.error("Failed to update club:", error);
    return { success: false, error: "Failed to update club" };
  }
}

export async function assignCoachToClub(coachId: string | null, clubId: string) {
  try {
    // First, unassign the current coach if any
    await prisma.club.update({
      where: { id: clubId },
      data: { coachId: null },
    });

    // If we're assigning a new coach
    if (coachId) {
      // Check if this coach is already assigned to another club
      const existingClub = await prisma.club.findFirst({
        where: { coachId },
      });

      if (existingClub) {
        // Unassign from the other club
        await prisma.club.update({
          where: { id: existingClub.id },
          data: { coachId: null },
        });
      }

      // Assign to the new club
      await prisma.club.update({
        where: { id: clubId },
        data: { coachId },
      });
    }

    revalidatePath("/admin");
    return { success: true };
  } catch (error) {
    console.error("Failed to assign coach:", error);
    return { success: false, error: "Failed to assign coach" };
  }
}

// ============================================================================
// CONTRACT MANAGEMENT
// ============================================================================

export async function getAllContracts() {
  const contracts = await prisma.contract.findMany({
    where: { status: "ACTIVE" },
    include: {
      aflPlayer: {
        include: { aflTeam: true },
      },
      club: {
        select: { id: true, name: true, abbreviation: true },
      },
    },
    orderBy: [
      { club: { name: "asc" } },
      { aflPlayer: { lastName: "asc" } },
    ],
  });

  const currentYear = new Date().getFullYear();

  return contracts.map(c => {
    const breakdown = c.yearBreakdown as { season: number; value: number }[];
    const currentYearSalary = breakdown.find(y => y.season === currentYear)?.value ?? 0;

    return {
      id: c.id,
      playerId: c.aflPlayerId,
      playerName: `${c.aflPlayer.firstName} ${c.aflPlayer.lastName}`,
      positions: c.aflPlayer.positions,
      aflTeam: c.aflPlayer.aflTeam?.abbreviation ?? null,
      clubId: c.club.id,
      clubName: c.club.name,
      clubAbbr: c.club.abbreviation,
      startSeason: c.startSeason,
      endSeason: c.endSeason,
      totalValue: Number(c.totalValue),
      currentYearSalary,
      contractType: c.contractType,
      tradeBlock: c.tradeBlock,
      yearBreakdown: breakdown,
    };
  });
}

export async function updateContract(
  contractId: string,
  data: {
    startSeason?: number;
    endSeason?: number;
    totalValue?: number;
    yearBreakdown?: { season: number; value: number }[];
    tradeBlock?: boolean;
  }
) {
  try {
    await prisma.contract.update({
      where: { id: contractId },
      data: {
        startSeason: data.startSeason,
        endSeason: data.endSeason,
        totalValue: data.totalValue,
        yearBreakdown: data.yearBreakdown,
        tradeBlock: data.tradeBlock,
      },
    });
    revalidatePath("/admin");
    return { success: true };
  } catch (error) {
    console.error("Failed to update contract:", error);
    return { success: false, error: "Failed to update contract" };
  }
}

export async function transferContract(contractId: string, newClubId: string) {
  try {
    // Remove from roster
    await prisma.rosterPlayer.deleteMany({
      where: { contractId },
    });

    // Update club
    await prisma.contract.update({
      where: { id: contractId },
      data: { clubId: newClubId },
    });

    revalidatePath("/admin");
    return { success: true };
  } catch (error) {
    console.error("Failed to transfer contract:", error);
    return { success: false, error: "Failed to transfer contract" };
  }
}

export async function terminateContract(contractId: string) {
  try {
    // Remove from roster
    await prisma.rosterPlayer.deleteMany({
      where: { contractId },
    });

    // Mark as released
    await prisma.contract.update({
      where: { id: contractId },
      data: { status: "RELEASED" },
    });

    revalidatePath("/admin");
    return { success: true };
  } catch (error) {
    console.error("Failed to terminate contract:", error);
    return { success: false, error: "Failed to terminate contract" };
  }
}

// ============================================================================
// PLAYER MANAGEMENT
// ============================================================================

export async function getAllAflPlayers() {
  const players = await prisma.aflPlayer.findMany({
    include: {
      aflTeam: true,
      contracts: {
        where: { status: "ACTIVE" },
        include: {
          club: { select: { name: true, abbreviation: true } },
        },
      },
    },
    orderBy: [
      { lastName: "asc" },
      { firstName: "asc" },
    ],
  });

  return players.map(p => ({
    id: p.id,
    firstName: p.firstName,
    lastName: p.lastName,
    positions: p.positions,
    aflTeam: p.aflTeam?.abbreviation ?? null,
    aflTeamName: p.aflTeam?.name ?? null,
    isAvailable: p.isAvailable,
    status: p.status,
    currentClub: p.contracts[0]?.club?.name ?? null,
    currentClubAbbr: p.contracts[0]?.club?.abbreviation ?? null,
  }));
}

export async function updateAflPlayer(
  playerId: string,
  data: {
    firstName?: string;
    lastName?: string;
    positions?: string[];
    isAvailable?: boolean;
  }
) {
  try {
    await prisma.aflPlayer.update({
      where: { id: playerId },
      data: {
        ...data,
        positions: data.positions as ("DEF" | "MID" | "RUC" | "FWD")[] | undefined,
      },
    });
    revalidatePath("/admin");
    return { success: true };
  } catch (error) {
    console.error("Failed to update player:", error);
    return { success: false, error: "Failed to update player" };
  }
}
