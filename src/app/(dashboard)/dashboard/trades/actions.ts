"use server";

import prisma from "@/lib/prisma";
import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { validateSalaryCap, formatSalaryCapError, updateClubSalaryRecords } from "@/lib/salary-cap";
import { calculateMarketAppeal, calculateAdjustedPrice, formatAppealModifier } from "@/lib/market-appeal";

// Helper to get the current user's club
async function getMyClub() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return null;

  const coach = await prisma.coach.findFirst({
    where: {
      OR: [{ discordId: user.id }, { email: user.email ?? "" }],
    },
    include: {
      club: {
        include: {
          staffContracts: {
            where: { status: "ACTIVE", staffRole: "LIST_MANAGER" },
            include: {
              staff: { include: { aflTeam: true } },
            },
          },
        },
      },
    },
  });

  return coach?.club ?? null;
}

// Helper to get club with city data (for market appeal calculations)
async function getMyClubWithCity() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return null;

  // Use raw query approach to handle optional city relation
  const coach = await prisma.coach.findFirst({
    where: {
      OR: [{ discordId: user.id }, { email: user.email ?? "" }],
    },
    include: {
      club: true,
    },
  });

  if (!coach?.club) return null;

  // Try to fetch city data separately (handles case where city relation doesn't exist yet)
  try {
    const clubWithCity = await prisma.$queryRaw<Array<{
      city_name: string | null;
      city_state: string | null;
      city_market_size: string | null;
    }>>`
      SELECT c.name as city_name, c.state as city_state, c.market_size as city_market_size
      FROM clubs cl
      LEFT JOIN cities c ON cl.city_id = c.id
      WHERE cl.id = ${coach.club.id}
    `;

    if (clubWithCity[0]?.city_name) {
      return {
        ...coach.club,
        city: {
          name: clubWithCity[0].city_name,
          state: clubWithCity[0].city_state!,
          marketSize: clubWithCity[0].city_market_size as "MAJOR" | "LARGE" | "MEDIUM" | "SMALL",
        },
      };
    }
  } catch {
    // City relation doesn't exist yet, return club without city
  }

  return { ...coach.club, city: null };
}

// Get list manager discount percentage for the current club
async function getListManagerDiscount(clubId: string): Promise<number> {
  const listManagerContract = await prisma.staffContract.findFirst({
    where: {
      clubId,
      staffRole: "LIST_MANAGER",
      status: "ACTIVE",
    },
    include: {
      staff: { include: { aflTeam: true } },
    },
  });

  if (!listManagerContract?.staff.aflTeam?.currentLadderPos) return 0;

  const ladderPos = listManagerContract.staff.aflTeam.currentLadderPos;
  // Formula: (19 - ladderPosition) / 3
  return (19 - ladderPos) / 3;
}

export type FreeAgentPlayer = {
  id: string;
  firstName: string;
  lastName: string;
  positions: string[];
  photoUrl: string | null;
  aflTeam: {
    id: string;
    name: string;
    abbreviation: string;
  } | null;
  averagePoints: number | null;
  expectedPrice: number;
  adjustedExpectedPrice: number;
  marketAppeal: number;
  marketAppealDisplay: string;
  activeBids: number;
  topBid: number | null;
  decision: Date | null;
};

export type FreeAgentStaff = {
  id: string;
  name: string;
  role: string;
  league: string;
  aflTeam: {
    id: string;
    name: string;
    abbreviation: string;
    currentLadderPos: number | null;
  } | null;
  currentContract: {
    clubId: string;
    clubName: string;
    endSeason: number;
  } | null;
  isAvailable: boolean;
};

export type MyBid = {
  id: string;
  playerId: string;
  playerName: string;
  playerPosition: string[];
  aflTeam: string | null;
  totalValue: number;
  years: number;
  offerExpires: Date;
  status: string;
  createdAt: Date;
};

/**
 * Get the number of games remaining in the current season
 */
export async function getGamesRemaining(): Promise<number> {
  const season = await prisma.season.findFirst({
    where: { status: "ACTIVE" },
    include: {
      rounds: {
        where: {
          roundType: { not: "BYE" },
        },
      },
    },
  });

  if (!season) return 0;

  // Count rounds that haven't been completed yet
  const completedRounds = await prisma.round.count({
    where: {
      seasonId: season.id,
      roundType: { not: "BYE" },
      matches: {
        every: {
          status: "COMPLETED",
        },
      },
    },
  });

  const totalRounds = season.rounds.length;
  return Math.max(0, totalRounds - completedRounds);
}

/**
 * Get all unsigned players as free agents
 */
export async function getFreeAgentPlayers(): Promise<FreeAgentPlayer[]> {
  // Get the current user's club to calculate market appeal
  const club = await getMyClubWithCity();

  // Get players with no active contract
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
      contractOffers: {
        where: { status: "PENDING" },
        orderBy: { totalValue: "desc" },
      },
    },
    orderBy: [{ lastName: "asc" }, { firstName: "asc" }],
  });

  // Get average scores for each player
  const playerScores = await prisma.matchPlayerScore.groupBy({
    by: ["aflPlayerId"],
    _avg: { aflFantasyScore: true },
    where: {
      aflPlayerId: { in: players.map((p) => p.id) },
      played: true,
    },
  });

  const scoreMap = new Map(
    playerScores.map((s) => [s.aflPlayerId, s._avg.aflFantasyScore])
  );

  return players.map((player) => {
    const avgPoints = scoreMap.get(player.id) ?? null;
    // Expected price based on average points or default
    const expectedPrice = avgPoints ? Math.round(avgPoints * 0.8) : 30;

    // Calculate market appeal for this player based on club's city
    const marketAppeal = club
      ? calculateMarketAppeal(club, player.aflTeam ? { name: player.aflTeam.name } : null)
      : 0;
    const adjustedExpectedPrice = calculateAdjustedPrice(expectedPrice, marketAppeal);

    return {
      id: player.id,
      firstName: player.firstName,
      lastName: player.lastName,
      positions: player.positions,
      photoUrl: player.photoUrl,
      aflTeam: player.aflTeam
        ? {
            id: player.aflTeam.id,
            name: player.aflTeam.name,
            abbreviation: player.aflTeam.abbreviation,
          }
        : null,
      averagePoints: avgPoints,
      expectedPrice,
      adjustedExpectedPrice,
      marketAppeal,
      marketAppealDisplay: formatAppealModifier(marketAppeal),
      activeBids: player.contractOffers.length,
      topBid:
        player.contractOffers.length > 0
          ? Number(player.contractOffers[0].totalValue)
          : null,
      decision:
        player.contractOffers.length > 0
          ? player.contractOffers[0].offerExpires
          : null,
    };
  });
}

/**
 * Get all staff members with their contract status
 */
export async function getFreeAgentStaff(): Promise<FreeAgentStaff[]> {
  const staff = await prisma.staff.findMany({
    include: {
      aflTeam: true,
      staffContracts: {
        where: { status: "ACTIVE" },
        include: {
          club: { select: { id: true, name: true } },
        },
        take: 1,
      },
    },
    orderBy: [{ league: "asc" }, { role: "asc" }, { name: "asc" }],
  });

  return staff.map((s) => ({
    id: s.id,
    name: s.name,
    role: s.role,
    league: s.league,
    aflTeam: s.aflTeam
      ? {
          id: s.aflTeam.id,
          name: s.aflTeam.name,
          abbreviation: s.aflTeam.abbreviation,
          currentLadderPos: s.aflTeam.currentLadderPos,
        }
      : null,
    currentContract: s.staffContracts[0]
      ? {
          clubId: s.staffContracts[0].clubId,
          clubName: s.staffContracts[0].club.name,
          endSeason: s.staffContracts[0].endSeason,
        }
      : null,
    isAvailable: s.isAvailable,
  }));
}

/**
 * Place a bid on a free agent player
 */
export async function placeBid(
  playerId: string,
  years: number,
  yearBreakdown: { season: number; value: number }[]
) {
  const club = await getMyClub();
  if (!club) return { error: "No club found" };

  const totalValue = yearBreakdown.reduce((sum, y) => sum + y.value, 0);

  // Apply list manager discount
  const discount = await getListManagerDiscount(club.id);
  const discountMultiplier = 1 - discount / 100;
  const discountedBreakdown = yearBreakdown.map((y) => ({
    season: y.season,
    value: y.value * discountMultiplier,
  }));
  const discountedTotal = totalValue * discountMultiplier;

  // Validate salary cap before placing bid
  const salaryCapResult = await validateSalaryCap(club.id, discountedBreakdown);
  if (!salaryCapResult.isValid) {
    return { error: formatSalaryCapError(salaryCapResult) };
  }

  // Check if player exists and is available
  const player = await prisma.aflPlayer.findUnique({
    where: { id: playerId },
    include: {
      contracts: { where: { status: "ACTIVE" } },
    },
  });

  if (!player) return { error: "Player not found" };
  if (!player.isAvailable) return { error: "Player is not available" };
  if (player.contracts.length > 0)
    return { error: "Player already has an active contract" };

  // Set offer expiration (48 hours from now)
  const offerExpires = new Date();
  offerExpires.setHours(offerExpires.getHours() + 48);

  // Create the contract offer
  const offer = await prisma.contractOffer.create({
    data: {
      aflPlayerId: playerId,
      offeringClubId: club.id,
      offerType: "FREE_AGENT",
      totalValue: discountedTotal,
      years,
      yearBreakdown: discountedBreakdown,
      offerExpires,
      status: "PENDING",
    },
  });

  revalidatePath("/dashboard/trades");
  return {
    success: true,
    offerId: offer.id,
    discount: discount > 0 ? discount.toFixed(1) : null,
  };
}

/**
 * Get all active bids for the current club
 */
export async function getMyBids(): Promise<MyBid[]> {
  const club = await getMyClub();
  if (!club) return [];

  const offers = await prisma.contractOffer.findMany({
    where: {
      offeringClubId: club.id,
      status: { in: ["PENDING", "ACCEPTED", "OUTBID"] },
    },
    include: {
      aflPlayer: {
        include: { aflTeam: true },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  return offers.map((o) => ({
    id: o.id,
    playerId: o.aflPlayerId,
    playerName: `${o.aflPlayer.firstName} ${o.aflPlayer.lastName}`,
    playerPosition: o.aflPlayer.positions,
    aflTeam: o.aflPlayer.aflTeam?.abbreviation ?? null,
    totalValue: Number(o.totalValue),
    years: o.years,
    offerExpires: o.offerExpires,
    status: o.status,
    createdAt: o.createdAt,
  }));
}

/**
 * Cancel a pending bid
 */
export async function cancelBid(offerId: string) {
  const club = await getMyClub();
  if (!club) return { error: "No club found" };

  const offer = await prisma.contractOffer.findFirst({
    where: {
      id: offerId,
      offeringClubId: club.id,
      status: "PENDING",
    },
  });

  if (!offer) return { error: "Offer not found or already processed" };

  await prisma.contractOffer.update({
    where: { id: offerId },
    data: { status: "EXPIRED" },
  });

  revalidatePath("/dashboard/trades");
  return { success: true };
}

/**
 * Get pending trades for the club
 */
export async function getPendingTrades() {
  const club = await getMyClub();
  if (!club) return [];

  const trades = await prisma.trade.findMany({
    where: {
      OR: [{ proposedById: club.id }, { proposedToId: club.id }],
      status: { in: ["PROPOSED", "ACCEPTED"] },
    },
    include: {
      proposedBy: { select: { id: true, name: true, abbreviation: true } },
      proposedTo: { select: { id: true, name: true, abbreviation: true } },
      assets: {
        include: {
          contract: {
            include: {
              aflPlayer: { select: { firstName: true, lastName: true } },
            },
          },
          staffContract: {
            include: { staff: { select: { name: true } } },
          },
          draftPick: true,
        },
      },
    },
    orderBy: { proposedAt: "desc" },
  });

  return trades.map((t) => ({
    id: t.id,
    status: t.status,
    isIncoming: t.proposedToId === club.id,
    proposedBy: t.proposedBy,
    proposedTo: t.proposedTo,
    assets: t.assets.map((a) => ({
      type: a.assetType,
      direction: a.fromClubId === club.id ? "outgoing" : "incoming",
      playerName: a.contract?.aflPlayer
        ? `${a.contract.aflPlayer.firstName} ${a.contract.aflPlayer.lastName}`
        : null,
      staffName: a.staffContract?.staff?.name ?? null,
      draftPick: a.draftPick
        ? `R${a.draftPick.round} P${a.draftPick.pickNumber}`
        : null,
      salary: a.salaryAmount ? Number(a.salaryAmount) : null,
    })),
    proposedAt: t.proposedAt,
  }));
}

/**
 * Get trade history for the club
 */
export async function getTradeHistory() {
  const club = await getMyClub();
  if (!club) return [];

  const trades = await prisma.trade.findMany({
    where: {
      OR: [{ proposedById: club.id }, { proposedToId: club.id }],
      status: { in: ["COMPLETED", "REJECTED", "CANCELLED"] },
    },
    include: {
      proposedBy: { select: { id: true, name: true, abbreviation: true } },
      proposedTo: { select: { id: true, name: true, abbreviation: true } },
      assets: {
        include: {
          contract: {
            include: {
              aflPlayer: { select: { firstName: true, lastName: true } },
            },
          },
          staffContract: {
            include: { staff: { select: { name: true } } },
          },
          draftPick: true,
        },
      },
    },
    orderBy: { completedAt: "desc" },
    take: 20,
  });

  return trades.map((t) => ({
    id: t.id,
    status: t.status,
    proposedBy: t.proposedBy,
    proposedTo: t.proposedTo,
    assets: t.assets.map((a) => ({
      type: a.assetType,
      direction: a.fromClubId === club.id ? "outgoing" : "incoming",
      playerName: a.contract?.aflPlayer
        ? `${a.contract.aflPlayer.firstName} ${a.contract.aflPlayer.lastName}`
        : null,
      staffName: a.staffContract?.staff?.name ?? null,
      draftPick: a.draftPick
        ? `R${a.draftPick.round} P${a.draftPick.pickNumber}`
        : null,
      salary: a.salaryAmount ? Number(a.salaryAmount) : null,
    })),
    completedAt: t.completedAt,
  }));
}

/**
 * Get detailed player info including contract history
 */
export type PlayerDetail = {
  id: string;
  firstName: string;
  lastName: string;
  positions: string[];
  photoUrl: string | null;
  aflTeam: {
    name: string;
    abbreviation: string;
  } | null;
  gamesPlayed: number;
  averagePoints: number | null;
  highScore: number | null;
  lowScore: number | null;
  last5Avg: number | null;
  currentContract: {
    clubName: string;
    clubAbbreviation: string;
    salary: number;
    endSeason: number;
    startSeason: number;
  } | null;
  contractHistory: {
    clubName: string;
    clubAbbreviation: string;
    startSeason: number;
    endSeason: number;
    totalValue: number;
    gamesPlayed: number;
  }[];
  seasonStats: {
    season: number;
    gamesPlayed: number;
    averagePoints: number;
    totalPoints: number;
  }[];
};

export async function getPlayerDetail(playerId: string): Promise<PlayerDetail | null> {
  const player = await prisma.aflPlayer.findUnique({
    where: { id: playerId },
    include: {
      aflTeam: true,
      contracts: {
        include: {
          club: { select: { name: true, abbreviation: true } },
          rosterPlayers: {
            where: { roundId: { not: null } },
          },
        },
        orderBy: { startSeason: "desc" },
      },
    },
  });

  if (!player) return null;

  // Get scoring stats
  const scores = await prisma.matchPlayerScore.findMany({
    where: { aflPlayerId: playerId, played: true },
    include: {
      match: {
        include: {
          round: {
            select: { roundNumber: true, season: { select: { year: true } } },
          },
        },
      },
    },
    orderBy: { match: { round: { season: { year: "desc" } } } },
  });

  const allScoreValues = scores.map((s) => s.aflFantasyScore ?? 0);
  const averagePoints =
    allScoreValues.length > 0
      ? allScoreValues.reduce((a, b) => a + b, 0) / allScoreValues.length
      : null;
  const highScore = allScoreValues.length > 0 ? Math.max(...allScoreValues) : null;
  const lowScore = allScoreValues.length > 0 ? Math.min(...allScoreValues) : null;
  const last5Avg =
    allScoreValues.length >= 5
      ? allScoreValues.slice(0, 5).reduce((a, b) => a + b, 0) / 5
      : null;

  // Group by season for season stats
  const seasonGroups = scores.reduce(
    (acc, s) => {
      const season = s.match.round.season.year;
      if (!acc[season]) acc[season] = [];
      acc[season].push(s.aflFantasyScore ?? 0);
      return acc;
    },
    {} as Record<number, number[]>
  );

  const seasonStats = Object.entries(seasonGroups).map(([season, seasonScores]) => ({
    season: Number(season),
    gamesPlayed: seasonScores.length,
    averagePoints: seasonScores.reduce((a, b) => a + b, 0) / seasonScores.length,
    totalPoints: seasonScores.reduce((a, b) => a + b, 0),
  }));

  // Current active contract
  const activeContract = player.contracts.find((c) => c.status === "ACTIVE");

  // Contract history
  const contractHistory = player.contracts
    .filter((c) => c.status !== "ACTIVE")
    .map((c) => ({
      clubName: c.club.name,
      clubAbbreviation: c.club.abbreviation,
      startSeason: c.startSeason,
      endSeason: c.endSeason,
      totalValue: Number(c.totalValue),
      gamesPlayed: c.rosterPlayers.length,
    }));

  return {
    id: player.id,
    firstName: player.firstName,
    lastName: player.lastName,
    positions: player.positions,
    photoUrl: player.photoUrl,
    aflTeam: player.aflTeam
      ? { name: player.aflTeam.name, abbreviation: player.aflTeam.abbreviation }
      : null,
    gamesPlayed: scores.length,
    averagePoints,
    highScore,
    lowScore,
    last5Avg,
    currentContract: activeContract
      ? {
          clubName: activeContract.club.name,
          clubAbbreviation: activeContract.club.abbreviation,
          salary: Number(activeContract.totalValue),
          endSeason: activeContract.endSeason,
          startSeason: activeContract.startSeason,
        }
      : null,
    contractHistory,
    seasonStats: seasonStats.sort((a, b) => b.season - a.season),
  };
}

/**
 * Get detailed staff info including contract history
 */
export type StaffDetail = {
  id: string;
  name: string;
  role: string;
  league: string;
  aflTeam: {
    name: string;
    abbreviation: string;
    currentLadderPos: number | null;
  } | null;
  currentContract: {
    clubName: string;
    clubAbbreviation: string;
    salary: number;
    startSeason: number;
    endSeason: number;
  } | null;
  contractHistory: {
    clubName: string;
    clubAbbreviation: string;
    startSeason: number;
    endSeason: number;
    totalValue: number;
    role: string;
  }[];
  aflTeamResults: {
    season: number;
    wins: number;
    losses: number;
    draws: number;
    ladderPosition: number | null;
  }[];
  listManagerDiscount: number | null;
};

export async function getStaffDetail(staffId: string): Promise<StaffDetail | null> {
  const staff = await prisma.staff.findUnique({
    where: { id: staffId },
    include: {
      aflTeam: true,
      staffContracts: {
        include: {
          club: { select: { name: true, abbreviation: true } },
        },
        orderBy: { startSeason: "desc" },
      },
    },
  });

  if (!staff) return null;

  // Get AFL team results if available
  let aflTeamResults: StaffDetail["aflTeamResults"] = [];
  if (staff.aflTeamId) {
    const results = await prisma.aflMatchResult.findMany({
      where: { aflTeamId: staff.aflTeamId },
      orderBy: { season: "desc" },
    });

    // Group by season
    const seasonGroups = results.reduce(
      (acc, r) => {
        if (!acc[r.season]) acc[r.season] = [];
        acc[r.season].push(r.margin);
        return acc;
      },
      {} as Record<number, number[]>
    );

    aflTeamResults = Object.entries(seasonGroups).map(([season, margins]) => ({
      season: Number(season),
      wins: margins.filter((m) => m > 0).length,
      losses: margins.filter((m) => m < 0).length,
      draws: margins.filter((m) => m === 0).length,
      ladderPosition: null, // Would need to fetch from standings
    }));
  }

  // Current active contract
  const activeContract = staff.staffContracts.find((c) => c.status === "ACTIVE");

  // Contract history
  const contractHistory = staff.staffContracts
    .filter((c) => c.status !== "ACTIVE")
    .map((c) => ({
      clubName: c.club.name,
      clubAbbreviation: c.club.abbreviation,
      startSeason: c.startSeason,
      endSeason: c.endSeason,
      totalValue: Number(c.totalValue),
      role: c.staffRole,
    }));

  // Calculate list manager discount if applicable
  let listManagerDiscount: number | null = null;
  if (staff.role === "LIST_MANAGER" && staff.aflTeam?.currentLadderPos) {
    listManagerDiscount = Math.round((19 - staff.aflTeam.currentLadderPos) / 3);
  }

  return {
    id: staff.id,
    name: staff.name,
    role: staff.role,
    league: staff.league,
    aflTeam: staff.aflTeam
      ? {
          name: staff.aflTeam.name,
          abbreviation: staff.aflTeam.abbreviation,
          currentLadderPos: staff.aflTeam.currentLadderPos,
        }
      : null,
    currentContract: activeContract
      ? {
          clubName: activeContract.club.name,
          clubAbbreviation: activeContract.club.abbreviation,
          salary: Number(activeContract.totalValue),
          startSeason: activeContract.startSeason,
          endSeason: activeContract.endSeason,
        }
      : null,
    contractHistory,
    aflTeamResults: aflTeamResults.sort((a, b) => b.season - a.season),
    listManagerDiscount,
  };
}

/**
 * Get all clubs for trade proposal selection
 */
export async function getClubsForTrade() {
  const myClub = await getMyClub();
  if (!myClub) return { myClub: null, clubs: [] };

  const clubs = await prisma.club.findMany({
    where: { id: { not: myClub.id } },
    select: {
      id: true,
      name: true,
      abbreviation: true,
      primaryColor: true,
      secondaryColor: true,
    },
    orderBy: { name: "asc" },
  });

  return { myClub: { id: myClub.id, name: myClub.name }, clubs };
}

/**
 * Get tradeable players for a club
 */
export async function getTradeablePlayers(clubId: string) {
  const contracts = await prisma.contract.findMany({
    where: {
      clubId,
      status: "ACTIVE",
    },
    include: {
      aflPlayer: {
        select: {
          id: true,
          firstName: true,
          lastName: true,
          positions: true,
          photoUrl: true,
          aflTeam: { select: { abbreviation: true } },
        },
      },
    },
    orderBy: { aflPlayer: { lastName: "asc" } },
  });

  return contracts.map((c) => ({
    contractId: c.id,
    playerId: c.aflPlayer.id,
    firstName: c.aflPlayer.firstName,
    lastName: c.aflPlayer.lastName,
    positions: c.aflPlayer.positions,
    photoUrl: c.aflPlayer.photoUrl,
    aflTeam: c.aflPlayer.aflTeam?.abbreviation ?? null,
    salary: Number(c.totalValue),
    endSeason: c.endSeason,
  }));
}

/**
 * Propose a trade to another club
 */
export async function proposeTrade(
  targetClubId: string,
  myPlayersToSend: string[], // contract IDs
  theirPlayersToReceive: string[] // contract IDs
) {
  const myClub = await getMyClub();
  if (!myClub) return { error: "No club found" };

  if (myPlayersToSend.length === 0 && theirPlayersToReceive.length === 0) {
    return { error: "Must include at least one player in the trade" };
  }

  // Validate my players belong to me
  const myContracts = await prisma.contract.findMany({
    where: {
      id: { in: myPlayersToSend },
      clubId: myClub.id,
      status: "ACTIVE",
    },
  });

  if (myContracts.length !== myPlayersToSend.length) {
    return { error: "Invalid players selected from your roster" };
  }

  // Validate their players belong to them
  const theirContracts = await prisma.contract.findMany({
    where: {
      id: { in: theirPlayersToReceive },
      clubId: targetClubId,
      status: "ACTIVE",
    },
  });

  if (theirContracts.length !== theirPlayersToReceive.length) {
    return { error: "Invalid players selected from their roster" };
  }

  // Create the trade
  const trade = await prisma.trade.create({
    data: {
      proposedById: myClub.id,
      proposedToId: targetClubId,
      status: "PROPOSED",
      assets: {
        create: [
          // Players I'm sending
          ...myPlayersToSend.map((contractId) => ({
            assetType: "PLAYER" as const,
            fromClubId: myClub.id,
            toClubId: targetClubId,
            contractId,
          })),
          // Players I'm receiving
          ...theirPlayersToReceive.map((contractId) => ({
            assetType: "PLAYER" as const,
            fromClubId: targetClubId,
            toClubId: myClub.id,
            contractId,
          })),
        ],
      },
    },
  });

  revalidatePath("/dashboard/trades");
  return { success: true, tradeId: trade.id };
}
