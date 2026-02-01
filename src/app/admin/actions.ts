"use server";

import prisma from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import {
  fetchAflRoundResults,
  fetchAflLadder,
  mapSquiggleTeamName,
} from "@/lib/afl-api";

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

// ============================================================================
// AFL DATA SYNC
// ============================================================================

/**
 * Sync AFL match results from Squiggle API for a specific round
 */
export async function syncAflResults(round: number, year: number) {
  try {
    const results = await fetchAflRoundResults(round, year);

    if (results.length === 0) {
      return { success: false, error: "No results found for this round" };
    }

    let synced = 0;

    for (const result of results) {
      if (!result.complete) continue;

      // Sync home team result
      const homeTeamName = mapSquiggleTeamName(result.homeTeam);
      const homeTeam = await prisma.aflTeam.findFirst({
        where: { name: homeTeamName },
      });

      if (homeTeam) {
        await prisma.aflMatchResult.upsert({
          where: {
            aflTeamId_season_roundNumber: {
              aflTeamId: homeTeam.id,
              season: year,
              roundNumber: round,
            },
          },
          create: {
            aflTeamId: homeTeam.id,
            season: year,
            roundNumber: round,
            margin: result.margin,
          },
          update: { margin: result.margin },
        });
        synced++;
      }

      // Sync away team result (negative margin)
      const awayTeamName = mapSquiggleTeamName(result.awayTeam);
      const awayTeam = await prisma.aflTeam.findFirst({
        where: { name: awayTeamName },
      });

      if (awayTeam) {
        await prisma.aflMatchResult.upsert({
          where: {
            aflTeamId_season_roundNumber: {
              aflTeamId: awayTeam.id,
              season: year,
              roundNumber: round,
            },
          },
          create: {
            aflTeamId: awayTeam.id,
            season: year,
            roundNumber: round,
            margin: -result.margin,
          },
          update: { margin: -result.margin },
        });
        synced++;
      }
    }

    revalidatePath("/admin");
    return { success: true, synced };
  } catch (error) {
    console.error("Failed to sync AFL results:", error);
    return { success: false, error: "Failed to sync AFL results" };
  }
}

/**
 * Sync AFL ladder standings from Squiggle API
 */
export async function syncAflLadder(year: number) {
  try {
    const standings = await fetchAflLadder(year);

    if (standings.length === 0) {
      return { success: false, error: "No standings found for this year" };
    }

    let synced = 0;

    for (const standing of standings) {
      const teamName = mapSquiggleTeamName(standing.name);
      const result = await prisma.aflTeam.updateMany({
        where: { name: teamName },
        data: { currentLadderPos: standing.rank },
      });
      if (result.count > 0) synced++;
    }

    revalidatePath("/admin");
    return { success: true, synced };
  } catch (error) {
    console.error("Failed to sync AFL ladder:", error);
    return { success: false, error: "Failed to sync AFL ladder" };
  }
}

// ============================================================================
// STAFF BONUS CALCULATION
// ============================================================================

/**
 * Calculate staff bonus for a club's match score
 * AFL coaches: margin / 10
 * State league coaches: margin / 20
 */
export async function calculateStaffBonus(
  clubId: string,
  matchType: "SENIORS" | "RESERVES",
  roundNumber: number,
  season: number
): Promise<number> {
  // Determine which staff role to use
  const staffRole = matchType === "SENIORS" ? "SENIOR_ASSISTANT" : "RESERVES_ASSISTANT";

  // Get club's staff contract for this match type
  const staffContract = await prisma.staffContract.findFirst({
    where: {
      clubId,
      staffRole,
      status: "ACTIVE",
    },
    include: {
      staff: { include: { aflTeam: true } },
    },
  });

  if (!staffContract?.staff.aflTeamId) return 0;

  // Get the AFL team's result this round
  const aflResult = await prisma.aflMatchResult.findFirst({
    where: {
      aflTeamId: staffContract.staff.aflTeamId,
      roundNumber,
      season,
    },
  });

  if (!aflResult) return 0;

  // Calculate bonus (half for state league coaches)
  const isStateLeague = staffContract.staff.league !== "AFL";
  const divisor = isStateLeague ? 20 : 10;

  return aflResult.margin / divisor;
}

/**
 * Process match scores with staff bonuses
 * Call this when processing a round's results
 */
export async function processMatchWithStaffBonus(
  matchId: string,
  roundNumber: number,
  season: number
) {
  try {
    const match = await prisma.match.findUnique({
      where: { id: matchId },
      include: {
        homeClub: true,
        awayClub: true,
      },
    });

    if (!match) return { success: false, error: "Match not found" };

    // Calculate staff bonuses for both clubs
    const homeStaffBonus = await calculateStaffBonus(
      match.homeClubId,
      match.matchType,
      roundNumber,
      season
    );

    const awayStaffBonus = await calculateStaffBonus(
      match.awayClubId,
      match.matchType,
      roundNumber,
      season
    );

    // Update match with staff bonuses
    await prisma.match.update({
      where: { id: matchId },
      data: {
        homeStaffBonus,
        awayStaffBonus,
      },
    });

    revalidatePath("/admin");
    return {
      success: true,
      homeStaffBonus,
      awayStaffBonus,
    };
  } catch (error) {
    console.error("Failed to process match with staff bonus:", error);
    return { success: false, error: "Failed to process match" };
  }
}

/**
 * Get all AFL match results for a round
 */
export async function getAflResultsForRound(round: number, season: number) {
  const results = await prisma.aflMatchResult.findMany({
    where: {
      roundNumber: round,
      season,
    },
    include: {
      aflTeam: {
        select: { name: true, abbreviation: true },
      },
    },
    orderBy: { aflTeam: { name: "asc" } },
  });

  return results.map((r) => ({
    id: r.id,
    teamName: r.aflTeam.name,
    teamAbbr: r.aflTeam.abbreviation,
    margin: r.margin,
    result: r.margin > 0 ? "WIN" : r.margin < 0 ? "LOSS" : "DRAW",
  }));
}

/**
 * Sync salary records for all clubs
 * Updates the club_salaries table with current salary data from contracts
 */
export async function syncClubSalaries() {
  const { syncAllClubSalaries } = await import("@/lib/salary-cap");

  try {
    const result = await syncAllClubSalaries();
    revalidatePath("/admin");
    revalidatePath("/dashboard");
    return { success: true, clubsUpdated: result.updated };
  } catch (error) {
    console.error("Failed to sync club salaries:", error);
    return { success: false, error: "Failed to sync club salaries" };
  }
}

/**
 * Get all club salary records for admin view
 */
export async function getAllClubSalaries() {
  const currentYear = new Date().getFullYear();

  const salaries = await prisma.clubSalary.findMany({
    where: {
      season: {
        gte: currentYear,
        lte: currentYear + 4,
      },
    },
    include: {
      club: {
        select: { name: true, abbreviation: true },
      },
    },
    orderBy: [{ club: { name: "asc" } }, { season: "asc" }],
  });

  return salaries.map((s) => ({
    id: s.id,
    clubName: s.club.name,
    clubAbbr: s.club.abbreviation,
    season: s.season,
    playerSalary: Number(s.playerSalary),
    staffSalary: Number(s.staffSalary),
    releasedDebt: Number(s.releasedDebt),
    totalSalary: Number(s.totalSalary),
    salaryCap: Number(s.salaryCap),
    capRoom: Number(s.capRoom),
    isOverCap: s.isOverCap,
  }));
}

// ============================================================================
// FINALS GENERATION
// ============================================================================

/**
 * Generate finals matches based on ladder positions
 *
 * Finals format:
 * - Week 1: 1v2 (1st hosts), 3v4 (3rd hosts)
 * - Week 2 (Preliminary Final): Loser 1v2 vs Winner 3v4 (Loser 1v2 hosts)
 * - Week 3 (Grand Final): Winner 1v2 vs Winner Prelim (Winner 1v2 hosts)
 */
export async function generateFinalsMatches(seasonYear: number) {
  try {
    const season = await prisma.season.findUnique({
      where: { year: seasonYear },
    });

    if (!season) {
      return { success: false, error: "Season not found" };
    }

    // Get standings sorted by ladder position
    const getTop4 = async (competition: "SENIORS" | "RESERVES") => {
      const standings = await prisma.standing.findMany({
        where: {
          seasonId: season.id,
          competition,
        },
        orderBy: [
          { wins: "desc" },
          { percentage: "desc" },
        ],
        take: 4,
        include: {
          club: { select: { id: true, name: true, abbreviation: true } },
        },
      });
      return standings.map((s) => s.club);
    };

    const seniorsTop4 = await getTop4("SENIORS");
    const reservesTop4 = await getTop4("RESERVES");

    if (seniorsTop4.length < 4 || reservesTop4.length < 4) {
      return { success: false, error: "Need at least 4 teams in standings for each competition" };
    }

    // Get finals rounds
    const finalsRounds = await prisma.round.findMany({
      where: {
        seasonId: season.id,
        roundType: { in: ["FINALS_WK1", "FINALS_WK2", "FINALS_WK3"] },
      },
      orderBy: { roundNumber: "asc" },
    });

    if (finalsRounds.length !== 3) {
      return { success: false, error: "Missing finals rounds - expected 3 finals rounds" };
    }

    const [week1Round, week2Round, week3Round] = finalsRounds;

    // Delete existing finals matches
    await prisma.match.deleteMany({
      where: {
        roundId: { in: finalsRounds.map((r) => r.id) },
      },
    });

    // Create Week 1 matches: 1v2 (1 hosts) and 3v4 (3 hosts)
    const week1Matches = [
      // Seniors 1v2
      { roundId: week1Round.id, homeClubId: seniorsTop4[0].id, awayClubId: seniorsTop4[1].id, matchType: "SENIORS" as const },
      // Seniors 3v4
      { roundId: week1Round.id, homeClubId: seniorsTop4[2].id, awayClubId: seniorsTop4[3].id, matchType: "SENIORS" as const },
      // Reserves 1v2
      { roundId: week1Round.id, homeClubId: reservesTop4[0].id, awayClubId: reservesTop4[1].id, matchType: "RESERVES" as const },
      // Reserves 3v4
      { roundId: week1Round.id, homeClubId: reservesTop4[2].id, awayClubId: reservesTop4[3].id, matchType: "RESERVES" as const },
    ];

    await prisma.match.createMany({
      data: week1Matches.map((m) => ({ ...m, status: "SCHEDULED" })),
    });

    // Week 2 and Week 3 matches will be created after Week 1 results are in
    // For now, create placeholder matches that will be updated
    // Week 2: Loser 1v2 hosts Winner 3v4
    // Using 2nd place as placeholder home (loser of 1v2) and 3rd as away (winner of 3v4)
    const week2Matches = [
      { roundId: week2Round.id, homeClubId: seniorsTop4[1].id, awayClubId: seniorsTop4[2].id, matchType: "SENIORS" as const },
      { roundId: week2Round.id, homeClubId: reservesTop4[1].id, awayClubId: reservesTop4[2].id, matchType: "RESERVES" as const },
    ];

    await prisma.match.createMany({
      data: week2Matches.map((m) => ({ ...m, status: "SCHEDULED" })),
    });

    // Week 3: Winner 1v2 hosts Winner Prelim
    // Using 1st place as placeholder home and 2nd as away
    const week3Matches = [
      { roundId: week3Round.id, homeClubId: seniorsTop4[0].id, awayClubId: seniorsTop4[1].id, matchType: "SENIORS" as const },
      { roundId: week3Round.id, homeClubId: reservesTop4[0].id, awayClubId: reservesTop4[1].id, matchType: "RESERVES" as const },
    ];

    await prisma.match.createMany({
      data: week3Matches.map((m) => ({ ...m, status: "SCHEDULED" })),
    });

    revalidatePath("/admin");
    revalidatePath("/dashboard/fixture");
    revalidatePath("/dashboard/standings");

    return {
      success: true,
      message: `Generated finals matches for ${seasonYear}. Week 2 and 3 matchups will update based on Week 1 results.`,
      seniorsTop4: seniorsTop4.map((c) => c.abbreviation),
      reservesTop4: reservesTop4.map((c) => c.abbreviation),
    };
  } catch (error) {
    console.error("Failed to generate finals:", error);
    return { success: false, error: "Failed to generate finals matches" };
  }
}

/**
 * Update Week 2 finals matchup after Week 1 results
 * Call this after Week 1 matches are completed
 */
export async function updateWeek2FinalsMatchup(seasonYear: number) {
  try {
    const season = await prisma.season.findUnique({
      where: { year: seasonYear },
    });

    if (!season) {
      return { success: false, error: "Season not found" };
    }

    // Get Week 1 round and matches
    const week1Round = await prisma.round.findFirst({
      where: { seasonId: season.id, roundType: "FINALS_WK1" },
      include: {
        matches: {
          where: { status: "COMPLETED" },
          include: {
            homeClub: true,
            awayClub: true,
          },
        },
      },
    });

    if (!week1Round || week1Round.matches.length < 4) {
      return { success: false, error: "Week 1 matches not completed" };
    }

    // Get Week 2 round
    const week2Round = await prisma.round.findFirst({
      where: { seasonId: season.id, roundType: "FINALS_WK2" },
      include: { matches: true },
    });

    if (!week2Round) {
      return { success: false, error: "Week 2 round not found" };
    }

    // Process each competition
    for (const matchType of ["SENIORS", "RESERVES"] as const) {
      const week1Matches = week1Round.matches.filter((m) => m.matchType === matchType);

      // Find 1v2 match (teams ranked 1 and 2)
      const standings = await prisma.standing.findMany({
        where: { seasonId: season.id, competition: matchType },
        orderBy: [{ wins: "desc" }, { percentage: "desc" }],
        take: 4,
      });

      const top2Ids = new Set([standings[0]?.clubId, standings[1]?.clubId]);
      const match1v2 = week1Matches.find(
        (m) => top2Ids.has(m.homeClubId) && top2Ids.has(m.awayClubId)
      );

      // 3v4 match
      const bottom2Ids = new Set([standings[2]?.clubId, standings[3]?.clubId]);
      const match3v4 = week1Matches.find(
        (m) => bottom2Ids.has(m.homeClubId) && bottom2Ids.has(m.awayClubId)
      );

      if (!match1v2 || !match3v4) continue;

      // Determine winners and losers
      const homeScore1v2 = Number(match1v2.homeScore ?? 0);
      const awayScore1v2 = Number(match1v2.awayScore ?? 0);
      const loser1v2 = homeScore1v2 > awayScore1v2 ? match1v2.awayClubId : match1v2.homeClubId;

      const homeScore3v4 = Number(match3v4.homeScore ?? 0);
      const awayScore3v4 = Number(match3v4.awayScore ?? 0);
      const winner3v4 = homeScore3v4 > awayScore3v4 ? match3v4.homeClubId : match3v4.awayClubId;

      // Update Week 2 match: Loser 1v2 hosts Winner 3v4
      await prisma.match.updateMany({
        where: {
          roundId: week2Round.id,
          matchType,
        },
        data: {
          homeClubId: loser1v2,
          awayClubId: winner3v4,
        },
      });
    }

    revalidatePath("/admin");
    revalidatePath("/dashboard/fixture");

    return { success: true, message: "Week 2 matchups updated based on Week 1 results" };
  } catch (error) {
    console.error("Failed to update Week 2 matchups:", error);
    return { success: false, error: "Failed to update Week 2 matchups" };
  }
}

/**
 * Update Grand Final matchup after Preliminary Final results
 * Call this after Week 2 matches are completed
 */
// ============================================================================
// SEASON SETTINGS
// ============================================================================

/**
 * Get current season settings
 */
export async function getSeasonSettings() {
  const season = await prisma.season.findFirst({
    where: { status: { in: ["ACTIVE", "UPCOMING"] } },
    orderBy: { year: "desc" },
    select: {
      id: true,
      year: true,
      coachSigningEnabled: true,
      draftStatus: true,
      status: true,
    },
  });

  return season;
}

/**
 * Toggle coach signing enabled/disabled
 */
export async function toggleCoachSigning(enabled: boolean) {
  try {
    const season = await prisma.season.findFirst({
      where: { status: { in: ["ACTIVE", "UPCOMING"] } },
      orderBy: { year: "desc" },
    });

    if (!season) {
      return { success: false, error: "No active season found" };
    }

    await prisma.season.update({
      where: { id: season.id },
      data: { coachSigningEnabled: enabled },
    });

    revalidatePath("/admin");
    revalidatePath("/dashboard");

    return { success: true, enabled };
  } catch (error) {
    console.error("Failed to toggle coach signing:", error);
    return { success: false, error: "Failed to toggle coach signing" };
  }
}

// ============================================================================
// RIVALRY SYNC
// ============================================================================

/**
 * Sync rivalry status on matches based on club tension scores
 * Marks matches as rivalries if tension score >= threshold (default 10)
 */
export async function syncRivalryMatches(seasonYear?: number, threshold = 10) {
  try {
    const year = seasonYear ?? new Date().getFullYear();

    const season = await prisma.season.findUnique({
      where: { year },
      include: { rounds: { select: { id: true } } },
    });

    if (!season) {
      return { success: false, error: "Season not found" };
    }

    // Get all club tensions for this season
    let tensions: { clubAId: string; clubBId: string; score: number }[] = [];

    try {
      const dbTensions = await prisma.clubTension.findMany({
        where: { seasonId: season.id },
        select: { clubAId: true, clubBId: true, score: true },
      });
      tensions = dbTensions;
    } catch {
      // clubTension table might not exist, use fake tensions
      const { getAllClubTensions } = await import("@/app/(dashboard)/dashboard/clubs/rivalry-actions");
      const fakeTensions = await getAllClubTensions();
      tensions = fakeTensions.map((t) => ({
        clubAId: t.clubAId,
        clubBId: t.clubBId,
        score: t.score,
      }));
    }

    // Build a set of rival pairs (where tension >= threshold)
    const rivalPairs = new Set<string>();
    for (const tension of tensions) {
      if (tension.score >= threshold) {
        // Store both orderings for easy lookup
        rivalPairs.add(`${tension.clubAId}-${tension.clubBId}`);
        rivalPairs.add(`${tension.clubBId}-${tension.clubAId}`);
      }
    }

    // Get all matches for this season
    const roundIds = season.rounds.map((r) => r.id);
    const matches = await prisma.match.findMany({
      where: { roundId: { in: roundIds } },
      select: { id: true, homeClubId: true, awayClubId: true, isRivalMatch: true },
    });

    // Update rivalry status on each match
    let updated = 0;
    for (const match of matches) {
      const pairKey = `${match.homeClubId}-${match.awayClubId}`;
      const shouldBeRival = rivalPairs.has(pairKey);

      if (match.isRivalMatch !== shouldBeRival) {
        await prisma.match.update({
          where: { id: match.id },
          data: { isRivalMatch: shouldBeRival },
        });
        updated++;
      }
    }

    revalidatePath("/admin");
    revalidatePath("/dashboard/fixture");
    revalidatePath("/dashboard/matches");

    return {
      success: true,
      message: `Synced rivalry status. ${updated} matches updated, ${rivalPairs.size / 2} rivalry pairs found (threshold: ${threshold}).`,
    };
  } catch (error) {
    console.error("Failed to sync rivalry matches:", error);
    return { success: false, error: "Failed to sync rivalry matches" };
  }
}

export async function updateGrandFinalMatchup(seasonYear: number) {
  try {
    const season = await prisma.season.findUnique({
      where: { year: seasonYear },
    });

    if (!season) {
      return { success: false, error: "Season not found" };
    }

    // Get Week 1 matches to find Winner 1v2
    const week1Round = await prisma.round.findFirst({
      where: { seasonId: season.id, roundType: "FINALS_WK1" },
      include: {
        matches: {
          where: { status: "COMPLETED" },
        },
      },
    });

    // Get Week 2 matches to find Prelim winner
    const week2Round = await prisma.round.findFirst({
      where: { seasonId: season.id, roundType: "FINALS_WK2" },
      include: {
        matches: {
          where: { status: "COMPLETED" },
        },
      },
    });

    if (!week1Round || !week2Round) {
      return { success: false, error: "Finals rounds not found" };
    }

    // Get Week 3 round
    const week3Round = await prisma.round.findFirst({
      where: { seasonId: season.id, roundType: "FINALS_WK3" },
      include: { matches: true },
    });

    if (!week3Round) {
      return { success: false, error: "Grand Final round not found" };
    }

    // Process each competition
    for (const matchType of ["SENIORS", "RESERVES"] as const) {
      // Get standings to identify 1v2 match
      const standings = await prisma.standing.findMany({
        where: { seasonId: season.id, competition: matchType },
        orderBy: [{ wins: "desc" }, { percentage: "desc" }],
        take: 2,
      });

      const top2Ids = new Set([standings[0]?.clubId, standings[1]?.clubId]);

      // Find 1v2 match in Week 1
      const match1v2 = week1Round.matches.find(
        (m) => m.matchType === matchType && top2Ids.has(m.homeClubId) && top2Ids.has(m.awayClubId)
      );

      // Find Prelim match
      const prelimMatch = week2Round.matches.find((m) => m.matchType === matchType);

      if (!match1v2 || !prelimMatch) continue;

      // Determine winners
      const homeScore1v2 = Number(match1v2.homeScore ?? 0);
      const awayScore1v2 = Number(match1v2.awayScore ?? 0);
      const winner1v2 = homeScore1v2 > awayScore1v2 ? match1v2.homeClubId : match1v2.awayClubId;

      const homePrelim = Number(prelimMatch.homeScore ?? 0);
      const awayPrelim = Number(prelimMatch.awayScore ?? 0);
      const prelimWinner = homePrelim > awayPrelim ? prelimMatch.homeClubId : prelimMatch.awayClubId;

      // Update Grand Final: Winner 1v2 hosts Prelim winner
      await prisma.match.updateMany({
        where: {
          roundId: week3Round.id,
          matchType,
        },
        data: {
          homeClubId: winner1v2,
          awayClubId: prelimWinner,
        },
      });
    }

    revalidatePath("/admin");
    revalidatePath("/dashboard/fixture");

    return { success: true, message: "Grand Final matchups updated based on Preliminary Final results" };
  } catch (error) {
    console.error("Failed to update Grand Final matchups:", error);
    return { success: false, error: "Failed to update Grand Final matchups" };
  }
}
