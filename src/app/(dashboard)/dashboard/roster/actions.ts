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

// Assign a player to a roster spot (optimized for speed)
export async function assignPlayerToRoster(
  contractId: string,
  clubId: string,
  squad: Squad,
  rosterSpot: RosterSpot
) {
  // Single query to get roster state
  const allRosterPlayers = await prisma.rosterPlayer.findMany({
    where: { clubId, roundId: null },
    select: { id: true, contractId: true, squad: true, rosterSpot: true },
  });

  const existingAssignment = allRosterPlayers.find(rp => rp.contractId === contractId);
  const existingInSpot = allRosterPlayers.find(
    rp => rp.squad === squad && rp.rosterSpot === rosterSpot && rp.contractId !== contractId
  );

  // Use a transaction for atomic updates
  await prisma.$transaction(async (tx) => {
    if (existingInSpot && existingAssignment) {
      // Swap: update both in transaction
      await tx.rosterPlayer.update({
        where: { id: existingInSpot.id },
        data: { squad: existingAssignment.squad, rosterSpot: existingAssignment.rosterSpot },
      });
    } else if (existingInSpot) {
      // Move displaced player to bench
      const benchSpots: RosterSpot[] = ["BENCH1", "BENCH2", "IL1", "IL2"];
      const usedSpots = new Set(allRosterPlayers.filter(rp => rp.squad === "SENIORS").map(rp => rp.rosterSpot));
      const emptySpot = benchSpots.find(s => !usedSpots.has(s));
      if (emptySpot) {
        await tx.rosterPlayer.update({
          where: { id: existingInSpot.id },
          data: { rosterSpot: emptySpot },
        });
      }
    }

    if (existingAssignment) {
      await tx.rosterPlayer.update({
        where: { id: existingAssignment.id },
        data: { squad, rosterSpot },
      });
    } else {
      await tx.rosterPlayer.create({
        data: { clubId, contractId, squad, rosterSpot },
      });
    }
  });

  // Don't block on revalidation - let it happen in background
  revalidatePath("/dashboard");
  return { success: true };
}

// Remove a player from roster (move to unassigned pool)
export async function removePlayerFromRoster(rosterPlayerId: string) {
  // Check if there are any match player scores linked to this roster player
  const hasScores = await prisma.matchPlayerScore.findFirst({
    where: { rosterPlayerId },
  });

  if (hasScores) {
    // Can't delete - there are scores linked.
    // Instead, we'll move them to a "holding" spot or just leave them unassigned
    // For now, return an error asking user to handle differently
    // Actually, let's just mark the roster player as unassigned by clearing the spot
    // But we can't have null rosterSpot...
    // The safest thing is to NOT allow removal if there are scores.
    // The user should just drag the player to a different spot instead.
    return { error: "Cannot remove player with match history. Drag them to a different spot instead." };
  }

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
      homeClub: { select: { name: true, abbreviation: true, primaryColor: true, secondaryColor: true } },
      awayClub: { select: { name: true, abbreviation: true, primaryColor: true, secondaryColor: true } },
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
      opponentPrimaryColor: opponent.primaryColor,
      opponentSecondaryColor: opponent.secondaryColor,
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

// Get HFA summary for dashboard cards (current value and change)
export async function getClubHfaSummary(clubId: string) {
  const results = await prisma.homeGameResult.findMany({
    where: { clubId },
    orderBy: { gameNumber: "asc" },
  });

  // HFA calculation: negative margins count as half (to not punish bad teams too harshly)
  const calcHfaValue = (margin: number) => margin < 0 ? margin / 2 : margin;

  const calcHfa = (data: typeof results) => {
    if (data.length === 0) return { current: 0, previous: 0, change: 0, gamesPlayed: 0 };

    // Current HFA: average of last 10 (or all if less than 10)
    const last10 = data.slice(-10);
    const current = last10.reduce((sum, r) => sum + calcHfaValue(r.margin), 0) / last10.length;

    // Previous HFA: average of games before the last one (last 10 of those)
    let previous = 0;
    if (data.length > 1) {
      const beforeLast = data.slice(0, -1).slice(-10);
      previous = beforeLast.reduce((sum, r) => sum + calcHfaValue(r.margin), 0) / beforeLast.length;
    }

    return {
      current: Math.round(current * 10) / 10,
      previous: Math.round(previous * 10) / 10,
      change: Math.round((current - previous) * 10) / 10,
      gamesPlayed: data.length,
    };
  };

  const seniorsData = results.filter((r) => r.matchType === "SENIORS");
  const reservesData = results.filter((r) => r.matchType === "RESERVES");

  return {
    seniors: calcHfa(seniorsData),
    reserves: calcHfa(reservesData),
  };
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

// Get dynamic ladder position history - calculates position at end of each round
export async function getClubLadderPositionHistory(clubId: string) {
  // Get all completed matches with their clubs
  const matches = await prisma.match.findMany({
    where: { status: "COMPLETED" },
    include: {
      round: { include: { season: true } },
    },
    orderBy: [
      { round: { season: { year: "asc" } } },
      { round: { roundNumber: "asc" } },
    ],
  });

  if (matches.length === 0) return [];

  // Group matches by matchType and track cumulative records per club per round
  const result: {
    roundNumber: number;
    seasonYear: number;
    matchType: string;
    position: number;
    wins: number;
    losses: number;
    draws: number;
    record: string;
  }[] = [];

  for (const matchType of ["SENIORS", "RESERVES"] as const) {
    const typeMatches = matches.filter((m) => m.matchType === matchType);
    if (typeMatches.length === 0) continue;

    // Get unique rounds in order
    const roundsSet = new Map<string, { roundNumber: number; seasonYear: number }>();
    for (const m of typeMatches) {
      const key = `${m.round.season.year}-${m.round.roundNumber}`;
      if (!roundsSet.has(key)) {
        roundsSet.set(key, { roundNumber: m.round.roundNumber, seasonYear: m.round.season.year });
      }
    }
    const rounds = Array.from(roundsSet.values());

    // Track cumulative W/L/D per club
    const clubRecords = new Map<string, { wins: number; losses: number; draws: number; pointsFor: number; pointsAgainst: number }>();

    for (const round of rounds) {
      // Process all matches for this round
      const roundMatches = typeMatches.filter(
        (m) => m.round.roundNumber === round.roundNumber && m.round.season.year === round.seasonYear
      );

      for (const m of roundMatches) {
        const homeScore = Number(m.homeScore ?? 0);
        const awayScore = Number(m.awayScore ?? 0);

        // Update home club
        const homeRec = clubRecords.get(m.homeClubId) ?? { wins: 0, losses: 0, draws: 0, pointsFor: 0, pointsAgainst: 0 };
        homeRec.pointsFor += homeScore;
        homeRec.pointsAgainst += awayScore;
        if (homeScore > awayScore) homeRec.wins++;
        else if (homeScore < awayScore) homeRec.losses++;
        else homeRec.draws++;
        clubRecords.set(m.homeClubId, homeRec);

        // Update away club
        const awayRec = clubRecords.get(m.awayClubId) ?? { wins: 0, losses: 0, draws: 0, pointsFor: 0, pointsAgainst: 0 };
        awayRec.pointsFor += awayScore;
        awayRec.pointsAgainst += homeScore;
        if (awayScore > homeScore) awayRec.wins++;
        else if (awayScore < homeScore) awayRec.losses++;
        else awayRec.draws++;
        clubRecords.set(m.awayClubId, awayRec);
      }

      // Calculate ladder position for our club at this round
      if (!clubRecords.has(clubId)) continue;

      // Rank all clubs by points (4*W + 2*D) then percentage
      const ranked = Array.from(clubRecords.entries())
        .map(([cid, rec]) => {
          const points = rec.wins * 4 + rec.draws * 2;
          const percentage = rec.pointsAgainst > 0 ? (rec.pointsFor / rec.pointsAgainst) * 100 : 100;
          return { clubId: cid, points, percentage, ...rec };
        })
        .sort((a, b) => {
          if (b.points !== a.points) return b.points - a.points;
          return b.percentage - a.percentage;
        });

      const position = ranked.findIndex((r) => r.clubId === clubId) + 1;
      const ourRecord = clubRecords.get(clubId)!;

      result.push({
        roundNumber: round.roundNumber,
        seasonYear: round.seasonYear,
        matchType,
        position,
        wins: ourRecord.wins,
        losses: ourRecord.losses,
        draws: ourRecord.draws,
        record: `${ourRecord.wins}-${ourRecord.losses}${ourRecord.draws > 0 ? `-${ourRecord.draws}` : ""}`,
      });
    }
  }

  return result;
}

// Get ladder position history for ALL clubs (for league-wide graph)
export async function getAllClubsLadderHistory() {
  const matches = await prisma.match.findMany({
    where: { status: "COMPLETED" },
    include: {
      round: { include: { season: true } },
      homeClub: { select: { id: true, name: true, abbreviation: true, primaryColor: true, secondaryColor: true } },
      awayClub: { select: { id: true, name: true, abbreviation: true, primaryColor: true, secondaryColor: true } },
    },
    orderBy: [
      { round: { season: { year: "asc" } } },
      { round: { roundNumber: "asc" } },
    ],
  });

  if (matches.length === 0) return { clubs: [], data: [] };

  // Collect all clubs
  const clubsMap = new Map<string, { id: string; name: string; abbreviation: string; primaryColor: string | null; secondaryColor: string | null }>();
  for (const m of matches) {
    if (!clubsMap.has(m.homeClub.id)) clubsMap.set(m.homeClub.id, m.homeClub);
    if (!clubsMap.has(m.awayClub.id)) clubsMap.set(m.awayClub.id, m.awayClub);
  }
  const clubs = Array.from(clubsMap.values());

  const result: {
    roundNumber: number;
    seasonYear: number;
    matchType: string;
    positions: { clubId: string; position: number; record: string }[];
  }[] = [];

  for (const matchType of ["SENIORS", "RESERVES"] as const) {
    const typeMatches = matches.filter((m) => m.matchType === matchType);
    if (typeMatches.length === 0) continue;

    const roundsSet = new Map<string, { roundNumber: number; seasonYear: number }>();
    for (const m of typeMatches) {
      const key = `${m.round.season.year}-${m.round.roundNumber}`;
      if (!roundsSet.has(key)) {
        roundsSet.set(key, { roundNumber: m.round.roundNumber, seasonYear: m.round.season.year });
      }
    }
    const rounds = Array.from(roundsSet.values());

    const clubRecords = new Map<string, { wins: number; losses: number; draws: number; pointsFor: number; pointsAgainst: number }>();

    for (const round of rounds) {
      const roundMatches = typeMatches.filter(
        (m) => m.round.roundNumber === round.roundNumber && m.round.season.year === round.seasonYear
      );

      for (const m of roundMatches) {
        const homeScore = Number(m.homeScore ?? 0);
        const awayScore = Number(m.awayScore ?? 0);

        const homeRec = clubRecords.get(m.homeClubId) ?? { wins: 0, losses: 0, draws: 0, pointsFor: 0, pointsAgainst: 0 };
        homeRec.pointsFor += homeScore;
        homeRec.pointsAgainst += awayScore;
        if (homeScore > awayScore) homeRec.wins++;
        else if (homeScore < awayScore) homeRec.losses++;
        else homeRec.draws++;
        clubRecords.set(m.homeClubId, homeRec);

        const awayRec = clubRecords.get(m.awayClubId) ?? { wins: 0, losses: 0, draws: 0, pointsFor: 0, pointsAgainst: 0 };
        awayRec.pointsFor += awayScore;
        awayRec.pointsAgainst += homeScore;
        if (awayScore > homeScore) awayRec.wins++;
        else if (awayScore < homeScore) awayRec.losses++;
        else awayRec.draws++;
        clubRecords.set(m.awayClubId, awayRec);
      }

      // Rank all clubs
      const ranked = Array.from(clubRecords.entries())
        .map(([cid, rec]) => {
          const points = rec.wins * 4 + rec.draws * 2;
          const percentage = rec.pointsAgainst > 0 ? (rec.pointsFor / rec.pointsAgainst) * 100 : 100;
          return { clubId: cid, points, percentage, ...rec };
        })
        .sort((a, b) => {
          if (b.points !== a.points) return b.points - a.points;
          return b.percentage - a.percentage;
        });

      const positions = ranked.map((r, idx) => ({
        clubId: r.clubId,
        position: idx + 1,
        record: `${r.wins}-${r.losses}${r.draws > 0 ? `-${r.draws}` : ""}`,
      }));

      result.push({
        roundNumber: round.roundNumber,
        seasonYear: round.seasonYear,
        matchType,
        positions,
      });
    }
  }

  return { clubs, data: result };
}

// Get HFA history for ALL clubs by round (for league-wide graph)
export async function getAllClubsHfaHistory() {
  const results = await prisma.homeGameResult.findMany({
    include: {
      club: { select: { id: true, name: true, abbreviation: true, primaryColor: true, secondaryColor: true } },
      match: { include: { round: { include: { season: true } } } },
    },
    orderBy: [
      { match: { round: { season: { year: "asc" } } } },
      { match: { round: { roundNumber: "asc" } } },
    ],
  });

  if (results.length === 0) return { clubs: [], data: [] };

  // Collect all clubs
  const clubsMap = new Map<string, { id: string; name: string; abbreviation: string; primaryColor: string | null; secondaryColor: string | null }>();
  for (const r of results) {
    if (!clubsMap.has(r.club.id)) clubsMap.set(r.club.id, r.club);
  }
  const clubs = Array.from(clubsMap.values());

  const output: {
    roundNumber: number;
    seasonYear: number;
    matchType: string;
    hfaValues: { clubId: string; hfa: number; gamesPlayed: number }[];
  }[] = [];

  for (const matchType of ["SENIORS", "RESERVES"] as const) {
    const typeResults = results.filter((r) => r.matchType === matchType);
    if (typeResults.length === 0) continue;

    // Group by round
    const roundsSet = new Map<string, { roundNumber: number; seasonYear: number }>();
    for (const r of typeResults) {
      const key = `${r.match.round.season.year}-${r.match.round.roundNumber}`;
      if (!roundsSet.has(key)) {
        roundsSet.set(key, { roundNumber: r.match.round.roundNumber, seasonYear: r.match.round.season.year });
      }
    }
    const rounds = Array.from(roundsSet.values());

    // Track cumulative margins per club
    const clubMargins = new Map<string, number[]>();

    for (const round of rounds) {
      const roundResults = typeResults.filter(
        (r) => r.match.round.roundNumber === round.roundNumber && r.match.round.season.year === round.seasonYear
      );

      for (const r of roundResults) {
        const margins = clubMargins.get(r.clubId) ?? [];
        margins.push(r.margin);
        clubMargins.set(r.clubId, margins);
      }

      // Calculate HFA for each club at this round (negative margins count as half)
      const calcHfaValue = (margin: number) => margin < 0 ? margin / 2 : margin;
      const hfaValues = Array.from(clubMargins.entries()).map(([clubId, margins]) => {
        const last10 = margins.slice(-10);
        const hfa = last10.reduce((s, m) => s + calcHfaValue(m), 0) / last10.length;
        return {
          clubId,
          hfa: Math.round(hfa * 10) / 10,
          gamesPlayed: margins.length,
        };
      });

      output.push({
        roundNumber: round.roundNumber,
        seasonYear: round.seasonYear,
        matchType,
        hfaValues,
      });
    }
  }

  return { clubs, data: output };
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
