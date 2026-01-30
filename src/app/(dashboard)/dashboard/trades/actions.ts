"use server";

import prisma from "@/lib/prisma";
import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

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
 * Get all unsigned players as free agents
 */
export async function getFreeAgentPlayers(): Promise<FreeAgentPlayer[]> {
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
  const discountedTotal = totalValue * (1 - discount / 100);

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
      yearBreakdown: yearBreakdown.map((y) => ({
        season: y.season,
        value: y.value * (1 - discount / 100),
      })),
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
