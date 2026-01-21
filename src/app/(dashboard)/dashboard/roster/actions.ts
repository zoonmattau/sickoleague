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
  return { success: true };
}

// Remove a player from roster
export async function removePlayerFromRoster(rosterPlayerId: string) {
  await prisma.rosterPlayer.delete({
    where: { id: rosterPlayerId },
  });

  revalidatePath("/dashboard/roster");
  return { success: true };
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
