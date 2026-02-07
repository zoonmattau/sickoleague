"use server";

import prisma from "@/lib/prisma";

// Get the upcoming match for a club
export async function getUpcomingMatch(clubId: string) {
  // Find the current or next round
  const round = await prisma.round.findFirst({
    where: {
      status: { in: ["UPCOMING", "LOCKED", "IN_PROGRESS"] },
    },
    include: {
      season: true,
    },
    orderBy: [
      { season: { year: "asc" } },
      { roundNumber: "asc" },
    ],
  });

  if (!round) return null;

  // Find matches for this club in this round
  const matches = await prisma.match.findMany({
    where: {
      roundId: round.id,
      OR: [{ homeClubId: clubId }, { awayClubId: clubId }],
    },
    include: {
      homeClub: {
        select: {
          id: true,
          name: true,
          abbreviation: true,
          reservesName: true,
          primaryColor: true,
          secondaryColor: true,
          homeVenue: { select: { name: true, capacity: true, venueClass: true, atmosphereBonus: true } },
          reservesVenue: { select: { name: true, capacity: true, venueClass: true, atmosphereBonus: true } },
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
  });

  if (matches.length === 0) return null;

  // Get standings for ladder positions
  const standings = await prisma.standing.findMany({
    where: {
      seasonId: round.seasonId,
    },
    orderBy: [
      { competition: "asc" },
      { wins: "desc" },
      { percentage: "desc" },
    ],
  });

  const getLadderPosition = (cId: string, competition: string) => {
    const competitionStandings = standings.filter(s => s.competition === competition);
    const sorted = [...competitionStandings].sort((a, b) => {
      const aPoints = a.wins * 4 + a.draws * 2;
      const bPoints = b.wins * 4 + b.draws * 2;
      if (bPoints !== aPoints) return bPoints - aPoints;
      return Number(b.percentage) - Number(a.percentage);
    });
    return sorted.findIndex(s => s.clubId === cId) + 1;
  };

  return {
    round: {
      id: round.id,
      roundNumber: round.roundNumber,
      status: round.status,
      lockoutTime: round.lockoutTime?.toISOString() ?? null,
      seasonYear: round.season.year,
    },
    matches: matches.map(m => {
      const isHome = m.homeClubId === clubId;
      const opponent = isHome ? m.awayClub : m.homeClub;
      const myClub = isHome ? m.homeClub : m.awayClub;

      const venue = m.matchType === "SENIORS"
        ? m.homeClub.homeVenue
        : m.homeClub.reservesVenue;

      return {
        id: m.id,
        matchType: m.matchType,
        isHome,
        hfa: m.homeHfa ? Number(m.homeHfa) : null,
        homeStaffBonus: m.homeStaffBonus ? Number(m.homeStaffBonus) : null,
        awayStaffBonus: m.awayStaffBonus ? Number(m.awayStaffBonus) : null,
        isRivalMatch: m.isRivalMatch,
        homeScore: m.homeScore ? Number(m.homeScore) : null,
        awayScore: m.awayScore ? Number(m.awayScore) : null,
        status: m.status,
        venue: venue ? {
          name: venue.name,
          capacity: venue.capacity,
          venueClass: venue.venueClass,
          atmosphereBonus: Number(venue.atmosphereBonus),
        } : null,
        myClub: {
          id: myClub.id,
          name: myClub.name,
          abbreviation: myClub.abbreviation,
          reservesName: myClub.reservesName,
          primaryColor: myClub.primaryColor,
          secondaryColor: myClub.secondaryColor,
          ladderPosition: getLadderPosition(myClub.id, m.matchType),
        },
        opponent: {
          id: opponent.id,
          name: opponent.name,
          abbreviation: opponent.abbreviation,
          reservesName: opponent.reservesName,
          primaryColor: opponent.primaryColor,
          secondaryColor: opponent.secondaryColor,
          ladderPosition: getLadderPosition(opponent.id, m.matchType),
        },
      };
    }),
  };
}

// Get opponent's lineup (projected from last round or locked)
export async function getOpponentLineup(opponentId: string, roundId: string) {
  const round = await prisma.round.findUnique({
    where: { id: roundId },
    include: { season: true },
  });

  if (!round) return null;

  // Try to get lineup locked for this round
  let rosterPlayers = await prisma.rosterPlayer.findMany({
    where: {
      clubId: opponentId,
      roundId: round.id,
    },
    include: {
      contract: {
        include: {
          aflPlayer: {
            include: { aflTeam: true },
          },
        },
      },
    },
  });

  // If no locked lineup, get the current (non-round-specific) lineup
  if (rosterPlayers.length === 0) {
    rosterPlayers = await prisma.rosterPlayer.findMany({
      where: {
        clubId: opponentId,
        roundId: null,
      },
      include: {
        contract: {
          include: {
            aflPlayer: {
              include: { aflTeam: true },
            },
          },
        },
      },
    });
  }

  // Get player stats
  const contractIds = rosterPlayers.map(rp => rp.contractId);
  const scores = await prisma.matchPlayerScore.findMany({
    where: {
      rosterPlayer: { contractId: { in: contractIds } },
      played: true,
      aflFantasyScore: { not: null },
    },
  });

  const statsMap = new Map<string, { total: number; count: number }>();
  for (const score of scores) {
    const cid = score.rosterPlayerId; // This isn't right, need to map back
    // Actually need to group by contract id
  }

  // Recompute stats by contract
  const scoresByContract = new Map<string, number[]>();
  for (const rp of rosterPlayers) {
    const rpScores = await prisma.matchPlayerScore.findMany({
      where: {
        rosterPlayer: { contractId: rp.contractId },
        played: true,
        aflFantasyScore: { not: null },
      },
      orderBy: { createdAt: "asc" },
    });
    scoresByContract.set(rp.contractId, rpScores.map(s => s.aflFantasyScore!));
  }

  return {
    isLocked: round.status !== "UPCOMING",
    isProjected: round.status === "UPCOMING",
    players: rosterPlayers.map(rp => {
      const allScores = scoresByContract.get(rp.contractId) ?? [];
      const last5 = allScores.slice(-5);

      return {
        id: rp.id,
        rosterSpot: rp.rosterSpot,
        squad: rp.squad,
        contract: {
          id: rp.contract.id,
          aflPlayer: {
            id: rp.contract.aflPlayer.id,
            firstName: rp.contract.aflPlayer.firstName,
            lastName: rp.contract.aflPlayer.lastName,
            positions: rp.contract.aflPlayer.positions,
            aflTeam: rp.contract.aflPlayer.aflTeam?.abbreviation ?? null,
          },
        },
        avgScore: allScores.length > 0
          ? Math.round((allScores.reduce((a, b) => a + b, 0) / allScores.length) * 10) / 10
          : null,
        last5Avg: last5.length > 0
          ? Math.round((last5.reduce((a, b) => a + b, 0) / last5.length) * 10) / 10
          : null,
      };
    }),
  };
}

// Get coaching staff for both clubs in a matchup
export async function getMatchStaffComparison(myClubId: string, opponentId: string) {
  const [myStaff, opponentStaff] = await Promise.all([
    prisma.staffContract.findMany({
      where: { clubId: myClubId, status: "ACTIVE" },
      include: {
        staff: {
          include: { aflTeam: { select: { name: true, abbreviation: true } } },
        },
      },
    }),
    prisma.staffContract.findMany({
      where: { clubId: opponentId, status: "ACTIVE" },
      include: {
        staff: {
          include: { aflTeam: { select: { name: true, abbreviation: true } } },
        },
      },
    }),
  ]);

  const serialize = (contracts: typeof myStaff) =>
    contracts.map(sc => ({
      staffRole: sc.staffRole,
      name: sc.staff.name,
      role: sc.staff.role,
      league: sc.staff.league,
      aflTeam: sc.staff.aflTeam?.abbreviation ?? null,
    }));

  return {
    myStaff: serialize(myStaff),
    opponentStaff: serialize(opponentStaff),
  };
}

// Get live scores for a match in progress
export async function getMatchLiveScores(matchId: string) {
  const match = await prisma.match.findUnique({
    where: { id: matchId },
    include: {
      homeClub: { select: { id: true, name: true, abbreviation: true } },
      awayClub: { select: { id: true, name: true, abbreviation: true } },
      playerScores: {
        include: {
          rosterPlayer: {
            include: {
              contract: {
                include: {
                  aflPlayer: {
                    select: {
                      id: true,
                      firstName: true,
                      lastName: true,
                      positions: true,
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

  if (!match) return null;

  const homeScores = match.playerScores
    .filter(ps => ps.rosterPlayer.clubId === match.homeClubId)
    .map(ps => ({
      playerId: ps.aflPlayerId,
      playerName: `${ps.rosterPlayer.contract.aflPlayer.firstName} ${ps.rosterPlayer.contract.aflPlayer.lastName}`,
      positions: ps.rosterPlayer.contract.aflPlayer.positions,
      rosterSpot: ps.rosterPlayer.rosterSpot,
      score: ps.aflFantasyScore,
      isCaptain: ps.isCaptain,
      isViceCaptain: ps.isViceCaptain,
      played: ps.played,
    }));

  const awayScores = match.playerScores
    .filter(ps => ps.rosterPlayer.clubId === match.awayClubId)
    .map(ps => ({
      playerId: ps.aflPlayerId,
      playerName: `${ps.rosterPlayer.contract.aflPlayer.firstName} ${ps.rosterPlayer.contract.aflPlayer.lastName}`,
      positions: ps.rosterPlayer.contract.aflPlayer.positions,
      rosterSpot: ps.rosterPlayer.rosterSpot,
      score: ps.aflFantasyScore,
      isCaptain: ps.isCaptain,
      isViceCaptain: ps.isViceCaptain,
      played: ps.played,
    }));

  return {
    homeClub: match.homeClub,
    awayClub: match.awayClub,
    homeTotal: match.homeScore ? Number(match.homeScore) : homeScores.reduce((sum, s) => sum + (s.score ?? 0), 0),
    awayTotal: match.awayScore ? Number(match.awayScore) : awayScores.reduce((sum, s) => sum + (s.score ?? 0), 0),
    homeScores,
    awayScores,
    status: match.status,
  };
}
