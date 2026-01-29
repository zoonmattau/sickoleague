"use server";

import prisma from "@/lib/prisma";
import { unstable_cache } from "next/cache";

// Get all club tensions for the rivalry matrix
export async function getAllClubTensions() {
  try {
    const currentSeason = await prisma.season.findFirst({
      where: { status: { in: ["ACTIVE", "UPCOMING"] } },
      orderBy: { year: "desc" },
    });

    if (!currentSeason) return [];

    // Check if clubTension table exists (may not be migrated yet)
    // @ts-expect-error - clubTension might not exist in Prisma client yet
    if (!prisma.clubTension) {
      // Generate fake tension data for demo purposes
      return generateFakeTensions();
    }

    // @ts-expect-error - clubTension might not exist in Prisma client yet
    const tensions = await prisma.clubTension.findMany({
      where: { seasonId: currentSeason.id },
      include: {
        clubA: {
          select: {
            id: true,
            name: true,
            abbreviation: true,
            primaryColor: true,
            secondaryColor: true,
          },
        },
        clubB: {
          select: {
            id: true,
            name: true,
            abbreviation: true,
            primaryColor: true,
            secondaryColor: true,
          },
        },
      },
    });

    // If no tensions exist, generate fake ones for demo
    if (tensions.length === 0) {
      return generateFakeTensions();
    }

    return tensions.map((t: {
      id: string;
      clubAId: string;
      clubBId: string;
      score: number;
      closeMatches: number;
      trades: number;
      ladderBattles: number;
      clubA: { id: string; name: string; abbreviation: string; primaryColor: string | null; secondaryColor: string | null };
      clubB: { id: string; name: string; abbreviation: string; primaryColor: string | null; secondaryColor: string | null };
    }) => ({
      id: t.id,
      clubAId: t.clubAId,
      clubBId: t.clubBId,
      score: t.score,
      closeMatches: t.closeMatches,
      trades: t.trades,
      ladderBattles: t.ladderBattles,
      clubA: t.clubA,
      clubB: t.clubB,
    }));
  } catch {
    // Table might not exist yet - generate fake data
    return generateFakeTensions();
  }
}

// Generate fake tension data for demo/testing with realistic values
async function generateFakeTensions() {
  const clubs = await prisma.club.findMany({
    select: {
      id: true,
      name: true,
      abbreviation: true,
      primaryColor: true,
      secondaryColor: true,
    },
  });

  const fakeTensions: {
    id: string;
    clubAId: string;
    clubBId: string;
    score: number;
    closeMatches: number;
    finalsMatches: number;
    trades: number;
    ladderBattles: number;
    playerMovements: number;
    clubA: { id: string; name: string; abbreviation: string; primaryColor: string | null; secondaryColor: string | null };
    clubB: { id: string; name: string; abbreviation: string; primaryColor: string | null; secondaryColor: string | null };
  }[] = [];

  // Seeded random function for consistency
  const seededRandom = (seed: number) => {
    const x = Math.sin(seed) * 10000;
    return x - Math.floor(x);
  };

  // Generate tensions for each unique pair
  for (let i = 0; i < clubs.length; i++) {
    for (let j = i + 1; j < clubs.length; j++) {
      // Use a seeded random based on club ids for consistency
      const seed = (clubs[i].id + clubs[j].id).split('').reduce((a, b) => a + b.charCodeAt(0), 0);
      const r1 = seededRandom(seed);
      const r2 = seededRandom(seed * 2);
      const r3 = seededRandom(seed * 3);
      const r4 = seededRandom(seed * 4);
      const r5 = seededRandom(seed * 5);

      // Simulate realistic tension factors
      const closeMatches = r1 > 0.4 ? Math.floor(r1 * 4) : 0; // 0-3 close matches
      const finalsMatches = r2 > 0.8 ? Math.floor((r2 - 0.8) * 10) : 0; // Rare finals meetings
      const trades = r3 > 0.6 ? Math.floor((r3 - 0.6) * 5) : 0; // 0-2 trades
      const ladderBattles = r4 > 0.5 ? Math.floor((r4 - 0.5) * 4) : 0; // Ladder competition
      const playerMovements = r5 > 0.7 ? Math.floor((r5 - 0.7) * 6) : 0; // Player signings

      // Calculate score using the config weights (simplified)
      // Player movements are quality-dependent: star=6, quality=4, solid=2, fringe=0.5, nobody=0
      const playerMovementValue = playerMovements > 0
        ? (r5 > 0.9 ? 6 : r5 > 0.8 ? 4 : r5 > 0.75 ? 2 : 0.5) // Vary quality
        : 0;

      let score = 0;
      score += closeMatches * 3; // Close matches worth ~3 each (decayed avg)
      score += finalsMatches * 5; // Finals matches worth ~5 each
      score += trades * 2.5; // Trades worth 2-3 each
      score += ladderBattles * 2; // Ladder battles
      score += playerMovements * playerMovementValue; // Quality-based player movements

      if (score > 0) {
        fakeTensions.push({
          id: `fake-${i}-${j}`,
          clubAId: clubs[i].id,
          clubBId: clubs[j].id,
          score: Math.round(score),
          closeMatches,
          finalsMatches,
          trades,
          ladderBattles,
          playerMovements,
          clubA: clubs[i],
          clubB: clubs[j],
        });
      }
    }
  }

  return fakeTensions;
}

// Get detailed rivalry information between two clubs
export async function getRivalryDetails(clubAId: string, clubBId: string) {
  const [clubA, clubB] = await Promise.all([
    prisma.club.findUnique({
      where: { id: clubAId },
      select: {
        id: true,
        name: true,
        abbreviation: true,
        reservesName: true,
        primaryColor: true,
        secondaryColor: true,
      },
    }),
    prisma.club.findUnique({
      where: { id: clubBId },
      select: {
        id: true,
        name: true,
        abbreviation: true,
        reservesName: true,
        primaryColor: true,
        secondaryColor: true,
      },
    }),
  ]);

  if (!clubA || !clubB) return null;

  // Get all matches between these clubs
  const matches = await prisma.match.findMany({
    where: {
      status: "COMPLETED",
      OR: [
        { homeClubId: clubAId, awayClubId: clubBId },
        { homeClubId: clubBId, awayClubId: clubAId },
      ],
    },
    include: {
      round: { include: { season: true } },
    },
    orderBy: [
      { round: { season: { year: "desc" } } },
      { round: { roundNumber: "desc" } },
    ],
  });

  // Calculate head-to-head record from perspective of clubA
  let winsA = 0, winsB = 0, draws = 0;
  let closeMatchCount = 0;

  const matchHistory = matches.map(m => {
    const clubAIsHome = m.homeClubId === clubAId;
    const clubAScore = clubAIsHome ? Number(m.homeScore ?? 0) : Number(m.awayScore ?? 0);
    const clubBScore = clubAIsHome ? Number(m.awayScore ?? 0) : Number(m.homeScore ?? 0);
    const margin = clubAScore - clubBScore;

    if (clubAScore > clubBScore) winsA++;
    else if (clubBScore > clubAScore) winsB++;
    else draws++;

    if (Math.abs(margin) < 20) closeMatchCount++;

    return {
      roundNumber: m.round.roundNumber,
      seasonYear: m.round.season.year,
      matchType: m.matchType,
      clubAScore,
      clubBScore,
      margin,
      clubAIsHome,
    };
  });

  // Get trades between these clubs
  const trades = await prisma.trade.findMany({
    where: {
      status: "COMPLETED",
      OR: [
        { proposedById: clubAId, proposedToId: clubBId },
        { proposedById: clubBId, proposedToId: clubAId },
      ],
    },
    include: {
      assets: {
        include: {
          contract: {
            include: { aflPlayer: { select: { firstName: true, lastName: true } } },
          },
          draftPick: true,
        },
      },
    },
    orderBy: { completedAt: "desc" },
    take: 10,
  });

  // Check if they're official rivals
  const rivalry = await prisma.rival.findFirst({
    where: {
      OR: [
        { clubAId, clubBId },
        { clubAId: clubBId, clubBId: clubAId },
      ],
    },
    include: { season: true },
  });

  // Get current tension if exists
  const currentSeason = await prisma.season.findFirst({
    where: { status: { in: ["ACTIVE", "UPCOMING"] } },
    orderBy: { year: "desc" },
  });

  let tension = null;
  if (currentSeason) {
    try {
      // @ts-expect-error - clubTension might not exist in Prisma client yet
      if (prisma.clubTension) {
        // @ts-expect-error - clubTension might not exist in Prisma client yet
        tension = await prisma.clubTension.findFirst({
          where: {
            seasonId: currentSeason.id,
            OR: [
              { clubAId, clubBId },
              { clubAId: clubBId, clubBId: clubAId },
            ],
          },
        });
      }
    } catch {
      // Table might not exist
    }
  }

  return {
    clubA,
    clubB,
    headToHead: {
      winsA,
      winsB,
      draws,
      total: matches.length,
    },
    closeMatches: closeMatchCount,
    matchHistory: matchHistory.slice(0, 10),
    trades: trades.map(t => ({
      id: t.id,
      completedAt: t.completedAt?.toISOString() ?? null,
      assets: t.assets.map(a => ({
        type: a.assetType,
        playerName: a.contract ? `${a.contract.aflPlayer.firstName} ${a.contract.aflPlayer.lastName}` : null,
        draftPick: a.draftPick ? `Round ${a.draftPick.round} Pick ${a.draftPick.pickNumber}` : null,
        fromClubId: a.fromClubId,
        toClubId: a.toClubId,
      })),
    })),
    isRivals: !!rivalry,
    rivalReason: rivalry?.reason ?? null,
    rivalSeason: rivalry?.season.year ?? null,
    tension: tension ? {
      score: tension.score,
      closeMatches: tension.closeMatches,
      trades: tension.trades,
      ladderBattles: tension.ladderBattles,
    } : null,
  };
}

// Tension calculation weights and decay factors
const TENSION_CONFIG = {
  // Close match (margin < 20 points)
  closeMatch: {
    currentSeason: 4,
    lastSeason: 2,
    older: 1,
  },
  // Finals match between clubs
  finalsMatch: {
    currentSeason: 6,
    lastSeason: 4,
    older: 2,
  },
  // Any regular season match
  regularMatch: {
    currentSeason: 1,
    lastSeason: 0.5,
    older: 0,
  },
  // Trades between clubs
  trade: {
    base: 2,
    lopsided: 3, // Extra points if trade was one-sided
  },
  // Ladder position battles
  ladderBattle: {
    samePosition: 2,
    finalsContention: 4, // Both fighting for spots 4-5
    withinTwo: 1,
  },
  // Player movement - based on player quality
  playerSigning: {
    star: 6,       // Elite player (avg 95+)
    quality: 4,    // Good player (avg 85-94)
    solid: 2,      // Decent player (avg 75-84)
    fringe: 0.5,   // Depth player (avg 65-74)
    nobody: 0,     // Scrub (avg <65) - who cares
  },
  // Decay multipliers by season age
  decay: {
    current: 1.0,
    lastSeason: 0.6,
    twoSeasonsAgo: 0.3,
    older: 0.1,
  },
};

// Get decay multiplier based on season difference
function getDecayMultiplier(currentYear: number, eventYear: number): number {
  const diff = currentYear - eventYear;
  if (diff === 0) return TENSION_CONFIG.decay.current;
  if (diff === 1) return TENSION_CONFIG.decay.lastSeason;
  if (diff === 2) return TENSION_CONFIG.decay.twoSeasonsAgo;
  return TENSION_CONFIG.decay.older;
}

// Calculate and update tension between all clubs
export async function calculateTensionFromMatches() {
  const currentSeason = await prisma.season.findFirst({
    where: { status: { in: ["ACTIVE", "UPCOMING"] } },
    orderBy: { year: "desc" },
  });

  if (!currentSeason) return { error: "No active season" };
  const currentYear = currentSeason.year;

  const clubs = await prisma.club.findMany({ select: { id: true } });
  const clubIds = clubs.map(c => c.id);

  // Get all completed matches (last 4 seasons)
  const matches = await prisma.match.findMany({
    where: {
      status: "COMPLETED",
      round: {
        season: {
          year: { gte: currentYear - 3 },
        },
      },
    },
    include: {
      round: {
        include: { season: true },
      },
    },
  });

  // Get all completed trades (last 4 seasons)
  const trades = await prisma.trade.findMany({
    where: {
      status: "COMPLETED",
      completedAt: { gte: new Date(currentYear - 3, 0, 1) },
    },
    include: {
      assets: {
        include: {
          contract: true,
        },
      },
    },
  });

  // Get current standings for ladder battle calculation
  const standings = await prisma.standing.findMany({
    where: { seasonId: currentSeason.id },
  });
  const standingsMap = new Map(standings.map(s => [s.clubId, s]));

  // Get player scoring history for quality assessment
  const playerScores = await prisma.playerScore.groupBy({
    by: ["contractId"],
    _avg: { score: true },
    _count: { score: true },
    where: {
      match: {
        round: {
          season: { year: { gte: currentYear - 2 } },
        },
      },
    },
  });

  // Build a map of contractId -> average score (only if they've played enough games)
  const playerAvgScores = new Map<string, number>();
  for (const p of playerScores) {
    if ((p._count.score ?? 0) >= 3) { // Need at least 3 games
      playerAvgScores.set(p.contractId, p._avg.score ?? 0);
    }
  }

  // Keep star set for backwards compatibility
  const starContractIds = new Set(
    playerScores
      .filter(p => (p._avg.score ?? 0) >= 85 && (p._count.score ?? 0) >= 5)
      .map(p => p.contractId)
  );

  // Get contract history for player movement tracking
  const contractHistory = await prisma.contract.findMany({
    where: {
      startSeason: { gte: currentYear - 2 },
    },
    select: {
      id: true,
      clubId: true,
      aflPlayerId: true,
      startSeason: true,
    },
  });

  // Build a map of player -> previous clubs
  const playerPreviousClubs = new Map<string, Set<string>>();
  for (const contract of contractHistory) {
    if (!playerPreviousClubs.has(contract.aflPlayerId)) {
      playerPreviousClubs.set(contract.aflPlayerId, new Set());
    }
    playerPreviousClubs.get(contract.aflPlayerId)!.add(contract.clubId);
  }

  // Calculate tension for each pair
  const tensionResults: { clubAId: string; clubBId: string; details: TensionDetails }[] = [];

  for (let i = 0; i < clubIds.length; i++) {
    for (let j = i + 1; j < clubIds.length; j++) {
      const clubAId = clubIds[i];
      const clubBId = clubIds[j];

      const details = calculatePairTension(
        clubAId,
        clubBId,
        currentYear,
        matches,
        trades,
        standingsMap,
        playerAvgScores,
        playerPreviousClubs
      );

      if (details.totalScore > 0) {
        tensionResults.push({ clubAId, clubBId, details });
      }
    }
  }

  // Save to database
  for (const { clubAId, clubBId, details } of tensionResults) {
    try {
      // @ts-expect-error - clubTension might not exist in Prisma client yet
      if (prisma.clubTension) {
        // @ts-expect-error - clubTension might not exist in Prisma client yet
        await prisma.clubTension.upsert({
          where: {
            clubAId_clubBId_seasonId: {
              clubAId,
              clubBId,
              seasonId: currentSeason.id,
            },
          },
          create: {
            clubAId,
            clubBId,
            seasonId: currentSeason.id,
            score: Math.round(details.totalScore),
            closeMatches: details.closeMatches,
            trades: details.tradeCount,
            ladderBattles: details.ladderBattles,
          },
          update: {
            score: Math.round(details.totalScore),
            closeMatches: details.closeMatches,
            trades: details.tradeCount,
            ladderBattles: details.ladderBattles,
          },
        });
      }
    } catch {
      // Table might not exist
    }
  }

  return { success: true, calculated: tensionResults.length };
}

type TensionDetails = {
  totalScore: number;
  closeMatches: number;
  finalsMatches: number;
  regularMatches: number;
  tradeCount: number;
  lopsidedTrades: number;
  ladderBattles: number;
  playerMovements: number;
};

type MatchWithRound = {
  id: string;
  homeClubId: string;
  awayClubId: string;
  homeScore: unknown;
  awayScore: unknown;
  matchType: string;
  round: {
    roundNumber: number;
    season: { year: number };
  };
};

type TradeWithAssets = {
  id: string;
  proposedById: string;
  proposedToId: string;
  completedAt: Date | null;
  assets: {
    assetType: string;
    fromClubId: string;
    toClubId: string;
    contract: { id: string } | null;
  }[];
};

function calculatePairTension(
  clubAId: string,
  clubBId: string,
  currentYear: number,
  matches: MatchWithRound[],
  trades: TradeWithAssets[],
  standingsMap: Map<string, { played: number; wins: number; losses: number }>,
  playerAvgScores: Map<string, number>,
  playerPreviousClubs: Map<string, Set<string>>
): TensionDetails {
  let totalScore = 0;
  let closeMatches = 0;
  let finalsMatches = 0;
  let regularMatches = 0;
  let tradeCount = 0;
  let lopsidedTrades = 0;
  let ladderBattles = 0;
  let playerMovements = 0;

  // 1. Analyze matches between these clubs
  const pairMatches = matches.filter(
    m =>
      (m.homeClubId === clubAId && m.awayClubId === clubBId) ||
      (m.homeClubId === clubBId && m.awayClubId === clubAId)
  );

  for (const match of pairMatches) {
    const year = match.round.season.year;
    const decay = getDecayMultiplier(currentYear, year);
    const margin = Math.abs(Number(match.homeScore ?? 0) - Number(match.awayScore ?? 0));
    const isFinals = match.matchType === "FINALS" || match.round.roundNumber > 18;
    const isClose = margin < 20;

    if (isFinals) {
      finalsMatches++;
      const points = year === currentYear
        ? TENSION_CONFIG.finalsMatch.currentSeason
        : year === currentYear - 1
        ? TENSION_CONFIG.finalsMatch.lastSeason
        : TENSION_CONFIG.finalsMatch.older;
      totalScore += points * decay;
    } else {
      regularMatches++;
      const points = year === currentYear
        ? TENSION_CONFIG.regularMatch.currentSeason
        : year === currentYear - 1
        ? TENSION_CONFIG.regularMatch.lastSeason
        : TENSION_CONFIG.regularMatch.older;
      totalScore += points * decay;
    }

    if (isClose) {
      closeMatches++;
      const points = year === currentYear
        ? TENSION_CONFIG.closeMatch.currentSeason
        : year === currentYear - 1
        ? TENSION_CONFIG.closeMatch.lastSeason
        : TENSION_CONFIG.closeMatch.older;
      totalScore += points * decay;
    }
  }

  // 2. Analyze trades between these clubs
  const pairTrades = trades.filter(
    t =>
      (t.proposedById === clubAId && t.proposedToId === clubBId) ||
      (t.proposedById === clubBId && t.proposedToId === clubAId)
  );

  for (const trade of pairTrades) {
    tradeCount++;
    totalScore += TENSION_CONFIG.trade.base;

    // Check if trade was lopsided (one side got more assets)
    const assetsToA = trade.assets.filter(a => a.toClubId === clubAId).length;
    const assetsToB = trade.assets.filter(a => a.toClubId === clubBId).length;
    if (Math.abs(assetsToA - assetsToB) >= 2) {
      lopsidedTrades++;
      totalScore += TENSION_CONFIG.trade.lopsided;
    }
  }

  // 3. Check ladder battles (current season only)
  const standingA = standingsMap.get(clubAId);
  const standingB = standingsMap.get(clubBId);
  if (standingA && standingB) {
    // Calculate ladder positions based on wins
    const allStandings = Array.from(standingsMap.entries())
      .map(([id, s]) => ({ id, points: s.wins * 4 }))
      .sort((a, b) => b.points - a.points);

    const posA = allStandings.findIndex(s => s.id === clubAId) + 1;
    const posB = allStandings.findIndex(s => s.id === clubBId) + 1;
    const posDiff = Math.abs(posA - posB);

    if (posDiff === 0) {
      ladderBattles++;
      totalScore += TENSION_CONFIG.ladderBattle.samePosition;
    } else if (posDiff <= 2) {
      // Check if both fighting for finals (positions 3-6)
      if ((posA >= 3 && posA <= 6) && (posB >= 3 && posB <= 6)) {
        ladderBattles++;
        totalScore += TENSION_CONFIG.ladderBattle.finalsContention;
      } else {
        ladderBattles++;
        totalScore += TENSION_CONFIG.ladderBattle.withinTwo;
      }
    }
  }

  // 4. Check player movements (signing former players)
  // Only adds tension based on player quality - nobodies don't matter
  for (const [, clubsForPlayer] of playerPreviousClubs) {
    if (clubsForPlayer.has(clubAId) && clubsForPlayer.has(clubBId) && clubsForPlayer.size >= 2) {
      // Find the contract for this player to check their quality
      // We need to look up their avg score from trades or other sources
      // For now, check if any trade assets between these clubs involved this player
      const relevantTrades = trades.filter(t =>
        ((t.proposedById === clubAId && t.proposedToId === clubBId) ||
         (t.proposedById === clubBId && t.proposedToId === clubAId)) &&
        t.assets.some(a => a.contract !== null)
      );

      for (const trade of relevantTrades) {
        for (const asset of trade.assets) {
          if (asset.contract) {
            const avgScore = playerAvgScores.get(asset.contract.id) ?? 0;

            // Determine tension based on player quality
            let tensionValue = 0;
            if (avgScore >= 95) {
              tensionValue = TENSION_CONFIG.playerSigning.star;
            } else if (avgScore >= 85) {
              tensionValue = TENSION_CONFIG.playerSigning.quality;
            } else if (avgScore >= 75) {
              tensionValue = TENSION_CONFIG.playerSigning.solid;
            } else if (avgScore >= 65) {
              tensionValue = TENSION_CONFIG.playerSigning.fringe;
            } else {
              tensionValue = TENSION_CONFIG.playerSigning.nobody; // Who cares
            }

            if (tensionValue > 0) {
              playerMovements++;
              totalScore += tensionValue;
            }
          }
        }
      }
    }
  }

  return {
    totalScore,
    closeMatches,
    finalsMatches,
    regularMatches,
    tradeCount,
    lopsidedTrades,
    ladderBattles,
    playerMovements,
  };
}
