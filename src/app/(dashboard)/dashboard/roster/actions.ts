"use server";

import prisma from "@/lib/prisma";
import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { RosterSpot, Squad, Position } from "@prisma/client";

// Get the current user's club with roster data
export async function getMyClubWithRoster() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return null;
  }

  // Find the coach by their Discord ID (Supabase user ID)
  const coach = await prisma.coach.findFirst({
    where: {
      OR: [
        { discordId: user.id },
        { email: user.email ?? "" },
      ],
    },
    include: {
      club: {
        include: {
          contracts: {
            where: { status: "ACTIVE" },
            include: {
              aflPlayer: {
                include: {
                  aflTeam: true,
                },
              },
              rosterPlayers: {
                where: { roundId: null }, // Current roster (not round-specific)
              },
            },
          },
          rosterPlayers: {
            where: { roundId: null },
            include: {
              contract: {
                include: {
                  aflPlayer: {
                    include: {
                      aflTeam: true,
                    },
                  },
                },
              },
            },
          },
        },
      },
    },
  });

  return coach?.club ?? null;
}

// Get all available AFL players (for drafting/free agency - not contracted)
export async function getAvailablePlayers() {
  const players = await prisma.aflPlayer.findMany({
    where: {
      isAvailable: true,
      status: "ACTIVE",
      contracts: {
        none: {
          status: "ACTIVE",
        },
      },
    },
    include: {
      aflTeam: true,
    },
    orderBy: [
      { lastName: "asc" },
      { firstName: "asc" },
    ],
  });

  return players;
}

// Get contracted players for a club (for roster assignment)
export async function getContractedPlayers(clubId: string) {
  const contracts = await prisma.contract.findMany({
    where: {
      clubId,
      status: "ACTIVE",
    },
    include: {
      aflPlayer: {
        include: {
          aflTeam: true,
        },
      },
      rosterPlayers: {
        where: { roundId: null },
      },
    },
  });

  return contracts;
}

// Assign a player to a roster spot
export async function assignPlayerToRoster(
  contractId: string,
  clubId: string,
  squad: Squad,
  rosterSpot: RosterSpot
) {
  // First, verify the contract belongs to the club
  const contract = await prisma.contract.findFirst({
    where: {
      id: contractId,
      clubId,
      status: "ACTIVE",
    },
    include: {
      aflPlayer: true,
    },
  });

  if (!contract) {
    return { error: "Contract not found or doesn't belong to your club" };
  }

  // Validate position eligibility
  const validPositions = getValidPositionsForSpot(rosterSpot);
  if (validPositions.length > 0) {
    const playerPositions = contract.aflPlayer.positions;
    const hasValidPosition = playerPositions.some(p => validPositions.includes(p));
    if (!hasValidPosition) {
      return { error: `Player doesn't have a valid position for ${rosterSpot}` };
    }
  }

  // Remove any existing roster assignment for this contract
  await prisma.rosterPlayer.deleteMany({
    where: {
      contractId,
      roundId: null,
    },
  });

  // Remove any existing player in the target spot
  await prisma.rosterPlayer.deleteMany({
    where: {
      clubId,
      squad,
      rosterSpot,
      roundId: null,
    },
  });

  // Create the new roster assignment
  await prisma.rosterPlayer.create({
    data: {
      clubId,
      contractId,
      squad,
      rosterSpot,
    },
  });

  revalidatePath("/dashboard/roster");
  revalidatePath("/dashboard");
  return { success: true };
}

// Remove a player from roster
export async function removePlayerFromRoster(rosterPlayerId: string) {
  await prisma.rosterPlayer.delete({
    where: { id: rosterPlayerId },
  });

  revalidatePath("/dashboard/roster");
  revalidatePath("/dashboard");
  return { success: true };
}

// Toggle trade block status for a contract
export async function toggleTradeBlock(contractId: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Not authenticated" };

  const coach = await prisma.coach.findFirst({
    where: {
      OR: [
        { discordId: user.id },
        { email: user.email ?? "" },
      ],
    },
    include: { club: true },
  });

  if (!coach?.club) return { error: "No club found" };

  const contract = await prisma.contract.findFirst({
    where: { id: contractId, clubId: coach.club.id, status: "ACTIVE" },
  });

  if (!contract) return { error: "Contract not found or doesn't belong to your club" };

  await prisma.contract.update({
    where: { id: contractId },
    data: { tradeBlock: !contract.tradeBlock },
  });

  revalidatePath("/dashboard/roster");
  revalidatePath("/dashboard");
  return { success: true, tradeBlock: !contract.tradeBlock };
}

// Release a contract — removes roster assignments and marks as RELEASED
export async function releaseContract(contractId: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Not authenticated" };

  const coach = await prisma.coach.findFirst({
    where: {
      OR: [
        { discordId: user.id },
        { email: user.email ?? "" },
      ],
    },
    include: { club: true },
  });

  if (!coach?.club) return { error: "No club found" };

  const contract = await prisma.contract.findFirst({
    where: { id: contractId, clubId: coach.club.id, status: "ACTIVE" },
  });

  if (!contract) return { error: "Contract not found or doesn't belong to your club" };

  // Compute released debt from remaining seasons in year breakdown
  const currentYear = new Date().getFullYear();
  const breakdown = contract.yearBreakdown as { season: number; value: number }[];
  const remainingSeasons = breakdown.filter((y) => y.season >= currentYear);
  const releasedDebt = remainingSeasons.reduce((sum, y) => sum + y.value, 0);
  const releasedDebtYears = remainingSeasons.length;

  // Remove all roster assignments
  await prisma.rosterPlayer.deleteMany({
    where: { contractId },
  });

  // Mark contract as released
  await prisma.contract.update({
    where: { id: contractId },
    data: {
      status: "RELEASED",
      releasedDebt,
      releasedDebtYears,
    },
  });

  revalidatePath("/dashboard/roster");
  revalidatePath("/dashboard");
  return { success: true };
}

// Get roster history for a contract's roster players
export async function getPlayerRosterHistory(contractId: string) {
  const rosterPlayers = await prisma.rosterPlayer.findMany({
    where: { contractId },
    select: { id: true },
  });

  const rosterPlayerIds = rosterPlayers.map((rp) => rp.id);

  const history = await prisma.rosterHistory.findMany({
    where: {
      rosterPlayerId: { in: rosterPlayerIds },
    },
    include: {
      round: {
        include: {
          season: true,
        },
      },
    },
    orderBy: { changedAt: "desc" },
  });

  return history.map((h) => ({
    id: h.id,
    previousSquad: h.previousSquad,
    previousSpot: h.previousSpot,
    newSquad: h.newSquad,
    newSpot: h.newSpot,
    changedAt: h.changedAt.toISOString(),
    roundNumber: h.round.roundNumber,
    seasonYear: h.round.season.year,
  }));
}

// Get average fantasy scores per contract for a club's roster players
export async function getClubPlayerStats(clubId: string) {
  const scores = await prisma.matchPlayerScore.findMany({
    where: {
      rosterPlayer: {
        clubId,
      },
      played: true,
      aflFantasyScore: { not: null },
    },
    select: {
      rosterPlayer: {
        select: { contractId: true },
      },
      aflFantasyScore: true,
      match: {
        select: {
          round: {
            select: {
              roundNumber: true,
              season: { select: { year: true } },
            },
          },
        },
      },
    },
  });

  // Sort by season year then round number
  scores.sort((a, b) => {
    const yearDiff = a.match.round.season.year - b.match.round.season.year;
    if (yearDiff !== 0) return yearDiff;
    return a.match.round.roundNumber - b.match.round.roundNumber;
  });

  // Aggregate by contractId — track ordered scores for last-5 calculation
  const scoresMap = new Map<string, number[]>();
  for (const s of scores) {
    const cid = s.rosterPlayer.contractId;
    const arr = scoresMap.get(cid) ?? [];
    arr.push(s.aflFantasyScore!);
    scoresMap.set(cid, arr);
  }

  return Array.from(scoresMap.entries()).map(([contractId, allScores]) => {
    const total = allScores.reduce((sum, v) => sum + v, 0);
    const last5 = allScores.slice(-5);
    const last5Total = last5.reduce((sum, v) => sum + v, 0);
    return {
      contractId,
      avgScore: allScores.length > 0 ? Math.round((total / allScores.length) * 10) / 10 : null,
      last5Avg: last5.length > 0 ? Math.round((last5Total / last5.length) * 10) / 10 : null,
      gamesPlayed: allScores.length,
    };
  });
}

// Get per-round fantasy scores for a player's contract (for charts)
export async function getPlayerScoreHistory(contractId: string) {
  const scores = await prisma.matchPlayerScore.findMany({
    where: {
      rosterPlayer: { contractId },
      played: true,
      aflFantasyScore: { not: null },
    },
    include: {
      match: {
        include: {
          round: {
            include: { season: true },
          },
        },
      },
    },
    orderBy: {
      match: {
        round: { roundNumber: "asc" },
      },
    },
  });

  return scores.map((s) => ({
    roundNumber: s.match.round.roundNumber,
    seasonYear: s.match.round.season.year,
    score: s.aflFantasyScore!,
    matchType: s.match.matchType,
  }));
}

// Get season-level averages for a player across all their contracts
export async function getPlayerSeasonAverages(aflPlayerId: string) {
  const scores = await prisma.matchPlayerScore.findMany({
    where: {
      aflPlayerId,
      played: true,
      aflFantasyScore: { not: null },
    },
    include: {
      match: {
        include: {
          round: {
            include: { season: true },
          },
        },
      },
    },
  });

  // Group by season year
  const seasonMap = new Map<number, { total: number; count: number }>();
  for (const s of scores) {
    const year = s.match.round.season.year;
    const existing = seasonMap.get(year) ?? { total: 0, count: 0 };
    existing.total += s.aflFantasyScore!;
    existing.count += 1;
    seasonMap.set(year, existing);
  }

  return Array.from(seasonMap.entries())
    .sort(([a], [b]) => a - b)
    .map(([year, data]) => ({
      season: year,
      avgScore: Math.round((data.total / data.count) * 10) / 10,
      gamesPlayed: data.count,
    }));
}

// Get contract value history for a player across all their contracts, broken down by year
export async function getPlayerContractHistory(aflPlayerId: string) {
  const contracts = await prisma.contract.findMany({
    where: { aflPlayerId },
    orderBy: { startSeason: "asc" },
    include: {
      club: {
        select: {
          name: true,
          abbreviation: true,
          primaryColor: true,
          secondaryColor: true,
        },
      },
    },
  });

  const years: {
    season: number;
    value: number;
    clubName: string;
    clubAbbr: string;
    clubColor: string | null;
    contractType: string;
  }[] = [];

  for (const c of contracts) {
    const breakdown = c.yearBreakdown as { season: number; value: number }[];
    for (const yr of breakdown) {
      years.push({
        season: yr.season,
        value: yr.value,
        clubName: c.club.name,
        clubAbbr: c.club.abbreviation,
        clubColor: c.club.primaryColor,
        contractType: c.contractType,
      });
    }
  }

  years.sort((a, b) => a.season - b.season);
  return years;
}

// Get week-by-week match results for a club (scores, margins, opponent)
export async function getClubMatchHistory(clubId: string) {
  const matches = await prisma.match.findMany({
    where: {
      OR: [{ homeClubId: clubId }, { awayClubId: clubId }],
      status: "COMPLETED",
    },
    include: {
      round: { include: { season: true } },
      homeClub: { select: { name: true, abbreviation: true } },
      awayClub: { select: { name: true, abbreviation: true } },
    },
    orderBy: { round: { roundNumber: "asc" } },
  });

  return matches.map((m) => {
    const isHome = m.homeClubId === clubId;
    const myScore = isHome ? Number(m.homeScore ?? 0) : Number(m.awayScore ?? 0);
    const oppScore = isHome ? Number(m.awayScore ?? 0) : Number(m.homeScore ?? 0);
    const opponent = isHome ? m.awayClub : m.homeClub;

    return {
      roundNumber: m.round.roundNumber,
      seasonYear: m.round.season.year,
      matchType: m.matchType,
      myScore,
      oppScore,
      margin: myScore - oppScore,
      opponentName: opponent.name,
      opponentAbbr: opponent.abbreviation,
      isHome,
    };
  });
}

// Get week-by-week HFA for a club
export async function getClubHfaHistory(clubId: string) {
  const results = await prisma.homeGameResult.findMany({
    where: { clubId },
    include: {
      match: {
        include: {
          round: { include: { season: true } },
        },
      },
    },
    orderBy: { gameNumber: "asc" },
  });

  return results.map((r) => ({
    gameNumber: r.gameNumber,
    matchType: r.matchType,
    margin: r.margin,
    roundNumber: r.match.round.roundNumber,
    seasonYear: r.match.round.season.year,
  }));
}

// Get week-by-week ladder position for a club (computed from match results)
export async function getClubLadderHistory(clubId: string) {
  // Get all completed matches involving this club, ordered by round
  const matches = await prisma.match.findMany({
    where: {
      OR: [{ homeClubId: clubId }, { awayClubId: clubId }],
      status: "COMPLETED",
    },
    include: {
      round: { include: { season: true } },
    },
    orderBy: { round: { roundNumber: "asc" } },
  });

  // For each match type (SENIORS/RESERVES), compute cumulative W/L and estimate position
  // We'll also pull the standing record if available
  const standings = await prisma.standing.findMany({
    where: { clubId },
    include: { season: true },
  });

  const standingMap = new Map(
    standings.map((s) => [`${s.season.year}-${s.competition}`, s])
  );

  // Group matches by type and compute running record
  const result: {
    roundNumber: number;
    seasonYear: number;
    matchType: string;
    wins: number;
    losses: number;
    draws: number;
    ladderPosition: number | null;
  }[] = [];

  for (const matchType of ["SENIORS", "RESERVES"] as const) {
    const typeMatches = matches.filter((m) => m.matchType === matchType);
    let wins = 0, losses = 0, draws = 0;

    for (const m of typeMatches) {
      const isHome = m.homeClubId === clubId;
      const myScore = isHome ? Number(m.homeScore ?? 0) : Number(m.awayScore ?? 0);
      const oppScore = isHome ? Number(m.awayScore ?? 0) : Number(m.homeScore ?? 0);

      if (myScore > oppScore) wins++;
      else if (myScore < oppScore) losses++;
      else draws++;

      // Try to get ladder position from standings
      const standing = standingMap.get(`${m.round.season.year}-${matchType}`);

      result.push({
        roundNumber: m.round.roundNumber,
        seasonYear: m.round.season.year,
        matchType,
        wins,
        losses,
        draws,
        ladderPosition: standing?.ladderPosition ?? null,
      });
    }
  }

  return result;
}

// Helper: Get valid positions for a roster spot
function getValidPositionsForSpot(spot: RosterSpot): Position[] {
  const positionMap: Record<string, Position[]> = {
    DEF1: ["DEF"],
    DEF2: ["DEF"],
    DEF3: ["DEF"],
    MID1: ["MID"],
    MID2: ["MID"],
    MID3: ["MID"],
    MID4: ["MID"],
    RUC: ["RUC"],
    FWD1: ["FWD"],
    FWD2: ["FWD"],
    FWD3: ["FWD"],
    RDEF1: ["DEF"],
    RDEF2: ["DEF"],
    RMID1: ["MID"],
    RMID2: ["MID"],
    RMID3: ["MID"],
    RRUC: ["RUC"],
    RFWD1: ["FWD"],
    RFWD2: ["FWD"],
    BENCH1: [], // Any position
    BENCH2: [], // Any position
    IL1: [], // Any position
    IL2: [], // Any position
  };

  return positionMap[spot] || [];
}

// Get roster spot display info (helper, not a server action)
function getRosterSpotInfo(spot: RosterSpot) {
  const info: Record<RosterSpot, { label: string; position: string }> = {
    DEF1: { label: "Defender 1", position: "DEF" },
    DEF2: { label: "Defender 2", position: "DEF" },
    DEF3: { label: "Defender 3", position: "DEF" },
    MID1: { label: "Midfielder 1", position: "MID" },
    MID2: { label: "Midfielder 2", position: "MID" },
    MID3: { label: "Midfielder 3", position: "MID" },
    MID4: { label: "Midfielder 4", position: "MID" },
    RUC: { label: "Ruck", position: "RUC" },
    FWD1: { label: "Forward 1", position: "FWD" },
    FWD2: { label: "Forward 2", position: "FWD" },
    FWD3: { label: "Forward 3", position: "FWD" },
    RDEF1: { label: "Reserve Defender 1", position: "DEF" },
    RDEF2: { label: "Reserve Defender 2", position: "DEF" },
    RMID1: { label: "Reserve Midfielder 1", position: "MID" },
    RMID2: { label: "Reserve Midfielder 2", position: "MID" },
    RMID3: { label: "Reserve Midfielder 3", position: "MID" },
    RRUC: { label: "Reserve Ruck", position: "RUC" },
    RFWD1: { label: "Reserve Forward 1", position: "FWD" },
    RFWD2: { label: "Reserve Forward 2", position: "FWD" },
    BENCH1: { label: "Bench 1", position: "ANY" },
    BENCH2: { label: "Bench 2", position: "ANY" },
    IL1: { label: "Injury List 1", position: "ANY" },
    IL2: { label: "Injury List 2", position: "ANY" },
  };

  return info[spot];
}
