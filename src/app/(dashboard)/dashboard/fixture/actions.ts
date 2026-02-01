"use server";

import prisma from "@/lib/prisma";

export type FixtureMatch = {
  id: string;
  matchType: "SENIORS" | "RESERVES";
  status: string;
  homeScore: number | null;
  awayScore: number | null;
  homeClub: {
    id: string;
    name: string;
    abbreviation: string;
    reservesName: string | null;
    primaryColor: string | null;
    secondaryColor: string | null;
  };
  awayClub: {
    id: string;
    name: string;
    abbreviation: string;
    reservesName: string | null;
    primaryColor: string | null;
    secondaryColor: string | null;
  };
};

export type FixtureRound = {
  id: string;
  roundNumber: number;
  roundType: string;
  status: string;
  lockoutTime: string | null;
  matches: FixtureMatch[];
};

export async function getFullFixture(seasonYear?: number) {
  const year = seasonYear ?? new Date().getFullYear();

  const season = await prisma.season.findUnique({
    where: { year },
  });

  if (!season) return { rounds: [], clubs: [] };

  const rounds = await prisma.round.findMany({
    where: { seasonId: season.id },
    include: {
      matches: {
        include: {
          homeClub: {
            select: {
              id: true,
              name: true,
              abbreviation: true,
              reservesName: true,
              primaryColor: true,
              secondaryColor: true,
            },
          },
          awayClub: {
            select: {
              id: true,
              name: true,
              abbreviation: true,
              reservesName: true,
              primaryColor: true,
              secondaryColor: true,
            },
          },
        },
        orderBy: { matchType: "asc" },
      },
    },
    orderBy: { roundNumber: "asc" },
  });

  const clubs = await prisma.club.findMany({
    select: {
      id: true,
      name: true,
      abbreviation: true,
    },
    orderBy: { name: "asc" },
  });

  return {
    rounds: rounds.map((r) => ({
      id: r.id,
      roundNumber: r.roundNumber,
      roundType: r.roundType,
      status: r.status,
      lockoutTime: r.lockoutTime?.toISOString() ?? null,
      matches: r.matches.map((m) => ({
        id: m.id,
        matchType: m.matchType as "SENIORS" | "RESERVES",
        status: m.status,
        homeScore: m.homeScore ? Number(m.homeScore) : null,
        awayScore: m.awayScore ? Number(m.awayScore) : null,
        homeClub: m.homeClub,
        awayClub: m.awayClub,
      })),
    })),
    clubs,
  };
}

export async function getCurrentRoundMatches() {
  // Find current or upcoming round
  const round = await prisma.round.findFirst({
    where: {
      status: { in: ["UPCOMING", "LOCKED", "IN_PROGRESS"] },
    },
    include: {
      season: true,
      matches: {
        include: {
          homeClub: {
            select: {
              id: true,
              name: true,
              abbreviation: true,
              reservesName: true,
              primaryColor: true,
              secondaryColor: true,
            },
          },
          awayClub: {
            select: {
              id: true,
              name: true,
              abbreviation: true,
              reservesName: true,
              primaryColor: true,
              secondaryColor: true,
            },
          },
        },
        orderBy: { matchType: "asc" },
      },
    },
    orderBy: [{ season: { year: "asc" } }, { roundNumber: "asc" }],
  });

  if (!round) return null;

  // Get standings for ladder positions
  const standings = await prisma.standing.findMany({
    where: { seasonId: round.seasonId },
  });

  const getLadderPos = (clubId: string, competition: string) => {
    const compStandings = standings
      .filter((s) => s.competition === competition)
      .sort((a, b) => {
        const aPoints = a.wins * 4 + a.draws * 2;
        const bPoints = b.wins * 4 + b.draws * 2;
        if (bPoints !== aPoints) return bPoints - aPoints;
        return Number(b.percentage) - Number(a.percentage);
      });
    return compStandings.findIndex((s) => s.clubId === clubId) + 1;
  };

  return {
    round: {
      id: round.id,
      roundNumber: round.roundNumber,
      roundType: round.roundType,
      status: round.status,
      lockoutTime: round.lockoutTime?.toISOString() ?? null,
      seasonYear: round.season.year,
    },
    matches: round.matches.map((m) => ({
      id: m.id,
      matchType: m.matchType as "SENIORS" | "RESERVES",
      status: m.status,
      homeScore: m.homeScore ? Number(m.homeScore) : null,
      awayScore: m.awayScore ? Number(m.awayScore) : null,
      homeClub: {
        ...m.homeClub,
        ladderPosition: getLadderPos(m.homeClubId, m.matchType),
      },
      awayClub: {
        ...m.awayClub,
        ladderPosition: getLadderPos(m.awayClubId, m.matchType),
      },
    })),
  };
}

export async function getRecentResults(limit = 3) {
  const rounds = await prisma.round.findMany({
    where: {
      status: "COMPLETED",
    },
    include: {
      season: true,
      matches: {
        include: {
          homeClub: {
            select: {
              id: true,
              name: true,
              abbreviation: true,
              reservesName: true,
              primaryColor: true,
              secondaryColor: true,
            },
          },
          awayClub: {
            select: {
              id: true,
              name: true,
              abbreviation: true,
              reservesName: true,
              primaryColor: true,
              secondaryColor: true,
            },
          },
        },
        orderBy: { matchType: "asc" },
      },
    },
    orderBy: [{ season: { year: "desc" } }, { roundNumber: "desc" }],
    take: limit,
  });

  return rounds.map((r) => ({
    id: r.id,
    roundNumber: r.roundNumber,
    roundType: r.roundType,
    seasonYear: r.season.year,
    matches: r.matches.map((m) => ({
      id: m.id,
      matchType: m.matchType as "SENIORS" | "RESERVES",
      status: m.status,
      homeScore: m.homeScore ? Number(m.homeScore) : null,
      awayScore: m.awayScore ? Number(m.awayScore) : null,
      homeClub: m.homeClub,
      awayClub: m.awayClub,
    })),
  }));
}

export async function getLiveMatchScores(matchId: string) {
  const match = await prisma.match.findUnique({
    where: { id: matchId },
    include: {
      homeClub: { select: { id: true, name: true, abbreviation: true } },
      awayClub: { select: { id: true, name: true, abbreviation: true } },
      playerScores: {
        where: { played: true },
        include: {
          rosterPlayer: {
            include: {
              contract: {
                include: {
                  aflPlayer: {
                    select: { firstName: true, lastName: true, positions: true },
                  },
                },
              },
            },
          },
        },
        orderBy: { aflFantasyScore: "desc" },
      },
    },
  });

  if (!match) return null;

  const homeScorers = match.playerScores
    .filter((ps) => ps.rosterPlayer.clubId === match.homeClubId)
    .map((ps) => ({
      name: `${ps.rosterPlayer.contract.aflPlayer.firstName} ${ps.rosterPlayer.contract.aflPlayer.lastName}`,
      score: ps.aflFantasyScore ?? 0,
      isCaptain: ps.isCaptain,
      isViceCaptain: ps.isViceCaptain,
    }));

  const awayScorers = match.playerScores
    .filter((ps) => ps.rosterPlayer.clubId === match.awayClubId)
    .map((ps) => ({
      name: `${ps.rosterPlayer.contract.aflPlayer.firstName} ${ps.rosterPlayer.contract.aflPlayer.lastName}`,
      score: ps.aflFantasyScore ?? 0,
      isCaptain: ps.isCaptain,
      isViceCaptain: ps.isViceCaptain,
    }));

  return {
    homeClub: match.homeClub,
    awayClub: match.awayClub,
    homeTotal: match.homeScore
      ? Number(match.homeScore)
      : homeScorers.reduce((sum, s) => sum + s.score, 0),
    awayTotal: match.awayScore
      ? Number(match.awayScore)
      : awayScorers.reduce((sum, s) => sum + s.score, 0),
    homeScorers: homeScorers.slice(0, 5),
    awayScorers: awayScorers.slice(0, 5),
    status: match.status,
  };
}
