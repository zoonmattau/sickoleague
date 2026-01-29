"use server";

import prisma from "@/lib/prisma";

// Get club's current W/L record from standings
export async function getClubRecord(clubId: string) {
  const currentSeason = await prisma.season.findFirst({
    where: { status: { in: ["ACTIVE", "UPCOMING"] } },
    orderBy: { year: "desc" },
  });

  if (!currentSeason) return null;

  // Get this club's standings
  const standings = await prisma.standing.findMany({
    where: { clubId, seasonId: currentSeason.id },
  });

  // Get all standings to calculate ladder position
  const allStandings = await prisma.standing.findMany({
    where: { seasonId: currentSeason.id },
    orderBy: [
      { points: "desc" },
      { percentage: "desc" },
    ],
  });

  const seniors = standings.find(s => s.competition === "SENIORS");
  const reserves = standings.find(s => s.competition === "RESERVES");

  // Calculate ladder positions
  const seniorsLadder = allStandings.filter(s => s.competition === "SENIORS");
  const reservesLadder = allStandings.filter(s => s.competition === "RESERVES");
  const seniorsPosition = seniors ? seniorsLadder.findIndex(s => s.clubId === clubId) + 1 : 0;
  const reservesPosition = reserves ? reservesLadder.findIndex(s => s.clubId === clubId) + 1 : 0;
  const totalTeams = seniorsLadder.length || 12;

  return {
    seniors: seniors ? {
      wins: seniors.wins,
      losses: seniors.losses,
      draws: seniors.draws,
      played: seniors.played,
      percentage: Number(seniors.percentage),
      pointsFor: Number(seniors.pointsFor),
      pointsAgainst: Number(seniors.pointsAgainst),
      ladderPosition: seniorsPosition,
    } : { wins: 0, losses: 0, draws: 0, played: 0, percentage: 0, pointsFor: 0, pointsAgainst: 0, ladderPosition: 0 },
    reserves: reserves ? {
      wins: reserves.wins,
      losses: reserves.losses,
      draws: reserves.draws,
      played: reserves.played,
      percentage: Number(reserves.percentage),
      pointsFor: Number(reserves.pointsFor),
      pointsAgainst: Number(reserves.pointsAgainst),
      ladderPosition: reservesPosition,
    } : { wins: 0, losses: 0, draws: 0, played: 0, percentage: 0, pointsFor: 0, pointsAgainst: 0, ladderPosition: 0 },
    totalTeams,
  };
}

// Get next upcoming match for a club
export async function getClubUpcomingMatch(clubId: string) {
  const match = await prisma.match.findFirst({
    where: {
      OR: [{ homeClubId: clubId }, { awayClubId: clubId }],
      status: "SCHEDULED",
    },
    include: {
      round: { include: { season: true } },
      homeClub: { select: { id: true, name: true, abbreviation: true, primaryColor: true, secondaryColor: true } },
      awayClub: { select: { id: true, name: true, abbreviation: true, primaryColor: true, secondaryColor: true } },
    },
    orderBy: [
      { round: { roundNumber: "asc" } },
    ],
  });

  if (!match) return null;

  const isHome = match.homeClubId === clubId;
  const opponent = isHome ? match.awayClub : match.homeClub;

  return {
    roundNumber: match.round.roundNumber,
    matchType: match.matchType,
    status: match.status,
    isHome,
    opponent,
  };
}

// Get top performers for a team
export async function getTeamBestPlayers(clubId: string, limit: number = 5) {
  const scores = await prisma.matchPlayerScore.findMany({
    where: {
      rosterPlayer: { clubId },
      played: true,
      aflFantasyScore: { not: null },
    },
    include: {
      rosterPlayer: {
        include: {
          contract: {
            include: {
              aflPlayer: {
                include: { aflTeam: true },
              },
            },
          },
        },
      },
    },
  });

  // Aggregate by contract
  const playerScores = new Map<string, {
    contractId: string;
    playerName: string;
    positions: string[];
    aflTeam: string | null;
    scores: number[];
  }>();

  for (const score of scores) {
    const contractId = score.rosterPlayer.contractId;
    const player = score.rosterPlayer.contract.aflPlayer;

    const existing = playerScores.get(contractId) ?? {
      contractId,
      playerName: `${player.firstName} ${player.lastName}`,
      positions: player.positions,
      aflTeam: player.aflTeam?.abbreviation ?? null,
      scores: [],
    };

    existing.scores.push(score.aflFantasyScore!);
    playerScores.set(contractId, existing);
  }

  // Calculate averages and sort
  const results = Array.from(playerScores.values())
    .map((p) => ({
      ...p,
      avgScore: p.scores.reduce((a, b) => a + b, 0) / p.scores.length,
      gamesPlayed: p.scores.length,
    }))
    .sort((a, b) => b.avgScore - a.avgScore)
    .slice(0, limit);

  return results;
}

// Get recent match results for a team
export async function getTeamRecentGames(clubId: string, limit: number = 5) {
  const matches = await prisma.match.findMany({
    where: {
      OR: [{ homeClubId: clubId }, { awayClubId: clubId }],
      status: "COMPLETED",
    },
    include: {
      round: { include: { season: true } },
      homeClub: { select: { id: true, name: true, abbreviation: true, primaryColor: true, secondaryColor: true } },
      awayClub: { select: { id: true, name: true, abbreviation: true, primaryColor: true, secondaryColor: true } },
    },
    orderBy: [
      { round: { season: { year: "desc" } } },
      { round: { roundNumber: "desc" } },
    ],
    take: limit * 2, // Get more to account for seniors/reserves
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
      result: myScore > oppScore ? "W" : myScore < oppScore ? "L" : "D",
      opponent: {
        id: opponent.id,
        name: opponent.name,
        abbreviation: opponent.abbreviation,
        primaryColor: opponent.primaryColor,
        secondaryColor: opponent.secondaryColor,
      },
      isHome,
    };
  });
}

// Get form analysis for a team
export async function getTeamFormAnalysis(clubId: string) {
  const matches = await prisma.match.findMany({
    where: {
      OR: [{ homeClubId: clubId }, { awayClubId: clubId }],
      status: "COMPLETED",
    },
    include: {
      round: { include: { season: true } },
    },
    orderBy: [
      { round: { season: { year: "desc" } } },
      { round: { roundNumber: "desc" } },
    ],
    take: 20, // Last 20 matches total (seniors + reserves)
  });

  const analyze = (type: "SENIORS" | "RESERVES") => {
    const typeMatches = matches.filter((m) => m.matchType === type);

    if (typeMatches.length === 0) {
      return {
        streak: 0,
        streakType: null as "W" | "L" | "D" | null,
        last5: [] as ("W" | "L" | "D")[],
        winRate: 0,
        avgMargin: 0,
        trend: "neutral" as "up" | "down" | "neutral",
      };
    }

    const results = typeMatches.map((m) => {
      const isHome = m.homeClubId === clubId;
      const myScore = isHome ? Number(m.homeScore ?? 0) : Number(m.awayScore ?? 0);
      const oppScore = isHome ? Number(m.awayScore ?? 0) : Number(m.homeScore ?? 0);
      return {
        result: myScore > oppScore ? "W" : myScore < oppScore ? "L" : "D",
        margin: myScore - oppScore,
      };
    });

    // Calculate streak
    let streak = 1;
    const streakType = results[0]?.result ?? null;
    for (let i = 1; i < results.length; i++) {
      if (results[i].result === streakType) streak++;
      else break;
    }

    // Last 5 results
    const last5 = results.slice(0, 5).map((r) => r.result as "W" | "L" | "D");

    // Win rate
    const wins = results.filter((r) => r.result === "W").length;
    const winRate = results.length > 0 ? (wins / results.length) * 100 : 0;

    // Average margin
    const avgMargin = results.length > 0
      ? results.reduce((sum, r) => sum + r.margin, 0) / results.length
      : 0;

    // Trend: compare first half vs second half average margin
    const half = Math.floor(results.length / 2);
    const recentHalf = results.slice(0, half);
    const olderHalf = results.slice(half);
    const recentAvg = recentHalf.length > 0
      ? recentHalf.reduce((sum, r) => sum + r.margin, 0) / recentHalf.length
      : 0;
    const olderAvg = olderHalf.length > 0
      ? olderHalf.reduce((sum, r) => sum + r.margin, 0) / olderHalf.length
      : 0;
    const trend: "up" | "down" | "neutral" = recentAvg > olderAvg + 5 ? "up" : recentAvg < olderAvg - 5 ? "down" : "neutral";

    return {
      streak,
      streakType: streakType as "W" | "L" | "D" | null,
      last5,
      winRate: Math.round(winRate),
      avgMargin: Math.round(avgMargin * 10) / 10,
      trend,
    };
  };

  return {
    seniors: analyze("SENIORS"),
    reserves: analyze("RESERVES"),
  };
}
