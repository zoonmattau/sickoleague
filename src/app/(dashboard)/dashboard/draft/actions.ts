"use server";

import prisma from "@/lib/prisma";
import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { isAdmin } from "@/lib/admin";
import type { DraftOrderType, DraftStatus } from "@prisma/client";

// ============================================================================
// HELPERS
// ============================================================================

async function getMyClub() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) return null;

  const coach = await prisma.coach.findFirst({
    where: {
      OR: [{ discordId: user.id }, { email: user.email ?? "" }],
    },
    include: { club: true },
  });

  return coach?.club ?? null;
}

async function getCurrentUser() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  return user;
}

async function requireAdmin() {
  const user = await getCurrentUser();
  if (!user || !isAdmin(user)) {
    throw new Error("Unauthorized: Admin access required");
  }
  return user;
}

// Calculate pick order for a given pick number based on draft order type
function calculatePickClubIndex(
  pickNumber: number,
  numClubs: number,
  orderType: DraftOrderType
): number {
  const round = Math.ceil(pickNumber / numClubs);
  const positionInRound = ((pickNumber - 1) % numClubs);

  if (orderType === "STRAIGHT") {
    return positionInRound;
  }

  // SNAKE order: reverse direction on even rounds
  if (round % 2 === 0) {
    return numClubs - 1 - positionInRound;
  }
  return positionInRound;
}

// ============================================================================
// READ ACTIONS (Any User)
// ============================================================================

export async function getDraftState(seasonId: string) {
  const season = await prisma.season.findUnique({
    where: { id: seasonId },
    include: {
      draftPicks: {
        orderBy: { pickNumber: "asc" },
        include: {
          currentClub: {
            select: {
              id: true,
              name: true,
              abbreviation: true,
              primaryColor: true,
              secondaryColor: true,
            },
          },
          originalClub: {
            select: {
              id: true,
              name: true,
              abbreviation: true,
            },
          },
          playerSelected: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              positions: true,
              avgPoints: true,
              aflTeam: {
                select: { abbreviation: true },
              },
            },
          },
        },
      },
    },
  });

  if (!season) return null;

  // Get all clubs for the draft board columns
  const clubs = await prisma.club.findMany({
    orderBy: { name: "asc" },
    select: {
      id: true,
      name: true,
      abbreviation: true,
      primaryColor: true,
      secondaryColor: true,
    },
  });

  // Build draft order (which club picks at which position)
  const numClubs = clubs.length;
  const draftOrder: string[] = [];

  // We need to determine the initial draft order based on previous season results
  const previousSeason = await prisma.season.findFirst({
    where: { year: season.year - 1 },
    include: {
      seasonResults: {
        where: { competition: "SENIORS" },
        orderBy: { finalPosition: "desc" }, // Worst teams first
        include: { club: true },
      },
    },
  });

  let orderedClubIds: string[];
  if (previousSeason?.seasonResults && previousSeason.seasonResults.length >= numClubs) {
    // Order by reverse finishing position (worst team picks first)
    orderedClubIds = previousSeason.seasonResults.map((r) => r.clubId);
  } else {
    // No previous season - use alphabetical order
    orderedClubIds = clubs.map((c) => c.id);
  }

  // Build draft order for all picks
  const totalPicks = numClubs * 21; // 21 rounds
  for (let i = 1; i <= totalPicks; i++) {
    const clubIndex = calculatePickClubIndex(i, numClubs, season.draftOrderType);
    draftOrder.push(orderedClubIds[clubIndex]);
  }

  // Current pick info
  const currentPick = season.draftPicks.find(
    (p) => p.pickNumber === season.currentPickNumber
  );

  // Queue - next 8 picks
  const queuePicks = season.draftPicks
    .filter((p) => p.pickNumber >= season.currentPickNumber && p.pickNumber < season.currentPickNumber + 8)
    .map((p) => ({
      pickNumber: p.pickNumber,
      clubId: p.currentClubId,
      club: p.currentClub,
      round: p.round,
    }));

  // Time remaining
  let timeRemaining: number | null = null;
  if (season.pickDeadline && season.draftStatus === "IN_PROGRESS") {
    const now = new Date();
    const deadline = new Date(season.pickDeadline);
    timeRemaining = Math.max(0, Math.floor((deadline.getTime() - now.getTime()) / 1000));
  }

  return {
    seasonId: season.id,
    year: season.year,
    draftOrderType: season.draftOrderType,
    draftStatus: season.draftStatus,
    currentPickNumber: season.currentPickNumber,
    pickTimerSeconds: season.pickTimerSeconds,
    pickDeadline: season.pickDeadline,
    timeRemaining,
    picks: season.draftPicks.map((p) => ({
      id: p.id,
      round: p.round,
      pickNumber: p.pickNumber,
      clubId: p.currentClubId,
      club: p.currentClub,
      originalClubId: p.originalClubId,
      originalClub: p.originalClub,
      used: p.used,
      passed: p.passed,
      player: p.playerSelected
        ? {
            id: p.playerSelected.id,
            name: `${p.playerSelected.firstName} ${p.playerSelected.lastName}`,
            positions: p.playerSelected.positions,
            avgPoints: p.playerSelected.avgPoints ? Number(p.playerSelected.avgPoints) : null,
            aflTeam: p.playerSelected.aflTeam?.abbreviation ?? null,
          }
        : null,
    })),
    clubs,
    draftOrder,
    currentPick: currentPick
      ? {
          id: currentPick.id,
          pickNumber: currentPick.pickNumber,
          round: currentPick.round,
          clubId: currentPick.currentClubId,
          club: currentPick.currentClub,
        }
      : null,
    queue: queuePicks,
  };
}

export async function getDraftEligiblePlayers(seasonId: string) {
  // Get all drafted player IDs for this season
  const draftedPlayerIds = await prisma.draftPick.findMany({
    where: {
      seasonId,
      playerSelectedId: { not: null },
    },
    select: { playerSelectedId: true },
  });

  const draftedIds = draftedPlayerIds
    .map((p) => p.playerSelectedId)
    .filter((id): id is string => id !== null);

  // Get all available players not yet drafted
  const players = await prisma.aflPlayer.findMany({
    where: {
      isAvailable: true,
      status: "ACTIVE",
      id: { notIn: draftedIds },
    },
    include: {
      aflTeam: { select: { abbreviation: true, name: true } },
    },
    orderBy: [
      { avgPoints: "desc" },
      { lastName: "asc" },
    ],
  });

  return players.map((p) => ({
    id: p.id,
    firstName: p.firstName,
    lastName: p.lastName,
    name: `${p.firstName} ${p.lastName}`,
    positions: p.positions,
    avgPoints: p.avgPoints ? Number(p.avgPoints) : null,
    gamesPlayed: p.gamesPlayed,
    aflTeam: p.aflTeam?.abbreviation ?? null,
    aflTeamName: p.aflTeam?.name ?? null,
  }));
}

export async function getMyDraftPicks(seasonId: string) {
  const club = await getMyClub();
  if (!club) return [];

  const picks = await prisma.draftPick.findMany({
    where: {
      seasonId,
      currentClubId: club.id,
    },
    orderBy: { pickNumber: "asc" },
    include: {
      originalClub: { select: { name: true, abbreviation: true } },
      playerSelected: {
        select: {
          firstName: true,
          lastName: true,
          positions: true,
        },
      },
    },
  });

  return picks.map((p) => ({
    id: p.id,
    round: p.round,
    pickNumber: p.pickNumber,
    originalClub: p.originalClub,
    used: p.used,
    passed: p.passed,
    player: p.playerSelected
      ? {
          name: `${p.playerSelected.firstName} ${p.playerSelected.lastName}`,
          positions: p.playerSelected.positions,
        }
      : null,
  }));
}

export async function getCurrentSeason() {
  const season = await prisma.season.findFirst({
    where: {
      status: { in: ["UPCOMING", "ACTIVE"] },
    },
    orderBy: { year: "desc" },
  });

  return season;
}

// ============================================================================
// USER ACTIONS
// ============================================================================

export async function makePick(pickId: string, playerId: string) {
  const club = await getMyClub();
  if (!club) return { error: "You are not assigned to a club" };

  // Verify the pick belongs to the user's club and is the current pick
  const pick = await prisma.draftPick.findUnique({
    where: { id: pickId },
    include: {
      season: true,
    },
  });

  if (!pick) return { error: "Pick not found" };
  if (pick.currentClubId !== club.id) return { error: "This pick does not belong to your club" };
  if (pick.used || pick.passed) return { error: "This pick has already been used" };
  if (pick.season.currentPickNumber !== pick.pickNumber) {
    return { error: "It is not your turn to pick" };
  }
  if (pick.season.draftStatus !== "IN_PROGRESS") {
    return { error: "The draft is not currently in progress" };
  }

  // Verify player is available
  const player = await prisma.aflPlayer.findUnique({
    where: { id: playerId },
  });

  if (!player) return { error: "Player not found" };
  if (!player.isAvailable || player.status !== "ACTIVE") {
    return { error: "Player is not available" };
  }

  // Check if player has already been drafted
  const alreadyDrafted = await prisma.draftPick.findFirst({
    where: {
      seasonId: pick.seasonId,
      playerSelectedId: playerId,
    },
  });

  if (alreadyDrafted) return { error: "Player has already been drafted" };

  // Make the pick
  await prisma.$transaction(async (tx) => {
    // Update the pick
    await tx.draftPick.update({
      where: { id: pickId },
      data: {
        playerSelectedId: playerId,
        used: true,
      },
    });

    // Advance to next pick
    const nextPickNumber = pick.pickNumber + 1;
    const totalPicks = await tx.draftPick.count({
      where: { seasonId: pick.seasonId },
    });

    if (nextPickNumber > totalPicks) {
      // Draft complete
      await tx.season.update({
        where: { id: pick.seasonId },
        data: {
          draftStatus: "COMPLETED",
          pickDeadline: null,
        },
      });
    } else {
      // Set new deadline
      const deadline = new Date();
      deadline.setSeconds(deadline.getSeconds() + pick.season.pickTimerSeconds);

      await tx.season.update({
        where: { id: pick.seasonId },
        data: {
          currentPickNumber: nextPickNumber,
          pickDeadline: deadline,
        },
      });
    }
  });

  revalidatePath("/dashboard/draft");
  revalidatePath("/admin/draft");

  return { success: true };
}

export async function passPick(pickId: string) {
  const club = await getMyClub();
  if (!club) return { error: "You are not assigned to a club" };

  const pick = await prisma.draftPick.findUnique({
    where: { id: pickId },
    include: { season: true },
  });

  if (!pick) return { error: "Pick not found" };
  if (pick.currentClubId !== club.id) return { error: "This pick does not belong to your club" };
  if (pick.used || pick.passed) return { error: "This pick has already been used" };
  if (pick.season.currentPickNumber !== pick.pickNumber) {
    return { error: "It is not your turn to pick" };
  }
  if (pick.season.draftStatus !== "IN_PROGRESS") {
    return { error: "The draft is not currently in progress" };
  }

  await prisma.$transaction(async (tx) => {
    // Mark as passed
    await tx.draftPick.update({
      where: { id: pickId },
      data: { passed: true },
    });

    // Advance to next pick
    const nextPickNumber = pick.pickNumber + 1;
    const totalPicks = await tx.draftPick.count({
      where: { seasonId: pick.seasonId },
    });

    if (nextPickNumber > totalPicks) {
      await tx.season.update({
        where: { id: pick.seasonId },
        data: {
          draftStatus: "COMPLETED",
          pickDeadline: null,
        },
      });
    } else {
      const deadline = new Date();
      deadline.setSeconds(deadline.getSeconds() + pick.season.pickTimerSeconds);

      await tx.season.update({
        where: { id: pick.seasonId },
        data: {
          currentPickNumber: nextPickNumber,
          pickDeadline: deadline,
        },
      });
    }
  });

  revalidatePath("/dashboard/draft");
  revalidatePath("/admin/draft");

  return { success: true };
}

// ============================================================================
// ADMIN ACTIONS (Commissioner Only)
// ============================================================================

export async function setDraftOrderType(seasonId: string, orderType: DraftOrderType) {
  await requireAdmin();

  const season = await prisma.season.findUnique({
    where: { id: seasonId },
  });

  if (!season) return { error: "Season not found" };
  if (season.draftStatus !== "NOT_STARTED") {
    return { error: "Cannot change draft order after draft has started" };
  }

  await prisma.season.update({
    where: { id: seasonId },
    data: { draftOrderType: orderType },
  });

  revalidatePath("/dashboard/draft");
  revalidatePath("/admin/draft");

  return { success: true };
}

export async function setPickTimer(seasonId: string, seconds: number) {
  await requireAdmin();

  if (seconds < 30 || seconds > 600) {
    return { error: "Timer must be between 30 and 600 seconds" };
  }

  await prisma.season.update({
    where: { id: seasonId },
    data: { pickTimerSeconds: seconds },
  });

  revalidatePath("/admin/draft");

  return { success: true };
}

export async function generateDraftPicks(seasonId: string) {
  await requireAdmin();

  const season = await prisma.season.findUnique({
    where: { id: seasonId },
  });

  if (!season) return { error: "Season not found" };

  // Check if picks already exist
  const existingPicks = await prisma.draftPick.count({
    where: { seasonId, draftType: "ANNUAL" },
  });

  if (existingPicks > 0) {
    return { error: "Draft picks already exist for this season" };
  }

  // Get all clubs
  const clubs = await prisma.club.findMany({
    orderBy: { name: "asc" },
  });

  const numClubs = clubs.length;
  if (numClubs === 0) return { error: "No clubs found" };

  // Get draft order from previous season results
  const previousSeason = await prisma.season.findFirst({
    where: { year: season.year - 1 },
    include: {
      seasonResults: {
        where: { competition: "SENIORS" },
        orderBy: { finalPosition: "desc" }, // Worst first
        include: { club: true },
      },
    },
  });

  let orderedClubIds: string[];
  if (previousSeason?.seasonResults && previousSeason.seasonResults.length >= numClubs) {
    orderedClubIds = previousSeason.seasonResults.map((r) => r.clubId);
  } else {
    orderedClubIds = clubs.map((c) => c.id);
  }

  // Generate 21 rounds of picks
  const picks: {
    seasonId: string;
    draftType: "ANNUAL";
    round: number;
    pickNumber: number;
    originalClubId: string;
    currentClubId: string;
  }[] = [];

  for (let round = 1; round <= 21; round++) {
    for (let position = 0; position < numClubs; position++) {
      const pickNumber = (round - 1) * numClubs + position + 1;
      const clubIndex = calculatePickClubIndex(pickNumber, numClubs, season.draftOrderType);
      const clubId = orderedClubIds[clubIndex];

      picks.push({
        seasonId,
        draftType: "ANNUAL",
        round,
        pickNumber,
        originalClubId: clubId,
        currentClubId: clubId,
      });
    }
  }

  await prisma.draftPick.createMany({ data: picks });

  revalidatePath("/dashboard/draft");
  revalidatePath("/admin/draft");

  return { success: true, picksGenerated: picks.length };
}

export async function startDraft(seasonId: string) {
  await requireAdmin();

  const season = await prisma.season.findUnique({
    where: { id: seasonId },
  });

  if (!season) return { error: "Season not found" };
  if (season.draftStatus === "IN_PROGRESS") {
    return { error: "Draft is already in progress" };
  }
  if (season.draftStatus === "COMPLETED") {
    return { error: "Draft has already been completed" };
  }

  // Check if picks exist
  const pickCount = await prisma.draftPick.count({
    where: { seasonId },
  });

  if (pickCount === 0) {
    return { error: "No draft picks have been generated. Generate picks first." };
  }

  const deadline = new Date();
  deadline.setSeconds(deadline.getSeconds() + season.pickTimerSeconds);

  await prisma.season.update({
    where: { id: seasonId },
    data: {
      draftStatus: "IN_PROGRESS",
      currentPickNumber: 1,
      pickDeadline: deadline,
    },
  });

  revalidatePath("/dashboard/draft");
  revalidatePath("/admin/draft");

  return { success: true };
}

export async function pauseDraft(seasonId: string) {
  await requireAdmin();

  const season = await prisma.season.findUnique({
    where: { id: seasonId },
  });

  if (!season) return { error: "Season not found" };
  if (season.draftStatus !== "IN_PROGRESS") {
    return { error: "Draft is not in progress" };
  }

  await prisma.season.update({
    where: { id: seasonId },
    data: {
      draftStatus: "PAUSED",
      pickDeadline: null,
    },
  });

  revalidatePath("/dashboard/draft");
  revalidatePath("/admin/draft");

  return { success: true };
}

export async function resumeDraft(seasonId: string) {
  await requireAdmin();

  const season = await prisma.season.findUnique({
    where: { id: seasonId },
  });

  if (!season) return { error: "Season not found" };
  if (season.draftStatus !== "PAUSED") {
    return { error: "Draft is not paused" };
  }

  const deadline = new Date();
  deadline.setSeconds(deadline.getSeconds() + season.pickTimerSeconds);

  await prisma.season.update({
    where: { id: seasonId },
    data: {
      draftStatus: "IN_PROGRESS",
      pickDeadline: deadline,
    },
  });

  revalidatePath("/dashboard/draft");
  revalidatePath("/admin/draft");

  return { success: true };
}

export async function adminMakePick(pickId: string, playerId: string) {
  await requireAdmin();

  const pick = await prisma.draftPick.findUnique({
    where: { id: pickId },
    include: { season: true },
  });

  if (!pick) return { error: "Pick not found" };
  if (pick.used || pick.passed) return { error: "This pick has already been used" };

  // Verify player is available
  const player = await prisma.aflPlayer.findUnique({
    where: { id: playerId },
  });

  if (!player) return { error: "Player not found" };

  // Check if player has already been drafted
  const alreadyDrafted = await prisma.draftPick.findFirst({
    where: {
      seasonId: pick.seasonId,
      playerSelectedId: playerId,
    },
  });

  if (alreadyDrafted) return { error: "Player has already been drafted" };

  await prisma.$transaction(async (tx) => {
    await tx.draftPick.update({
      where: { id: pickId },
      data: {
        playerSelectedId: playerId,
        used: true,
      },
    });

    // If this was the current pick, advance
    if (pick.season.currentPickNumber === pick.pickNumber) {
      const nextPickNumber = pick.pickNumber + 1;
      const totalPicks = await tx.draftPick.count({
        where: { seasonId: pick.seasonId },
      });

      if (nextPickNumber > totalPicks) {
        await tx.season.update({
          where: { id: pick.seasonId },
          data: {
            draftStatus: "COMPLETED",
            pickDeadline: null,
          },
        });
      } else {
        const deadline = new Date();
        deadline.setSeconds(deadline.getSeconds() + pick.season.pickTimerSeconds);

        await tx.season.update({
          where: { id: pick.seasonId },
          data: {
            currentPickNumber: nextPickNumber,
            pickDeadline: deadline,
          },
        });
      }
    }
  });

  revalidatePath("/dashboard/draft");
  revalidatePath("/admin/draft");

  return { success: true };
}

export async function reassignPick(pickId: string, newClubId: string) {
  await requireAdmin();

  const pick = await prisma.draftPick.findUnique({
    where: { id: pickId },
    include: { season: true },
  });

  if (!pick) return { error: "Pick not found" };
  if (pick.used) return { error: "Cannot reassign a used pick" };

  // Verify new club exists
  const newClub = await prisma.club.findUnique({
    where: { id: newClubId },
  });

  if (!newClub) return { error: "Club not found" };

  await prisma.draftPick.update({
    where: { id: pickId },
    data: { currentClubId: newClubId },
  });

  revalidatePath("/dashboard/draft");
  revalidatePath("/admin/draft");

  return { success: true };
}

export async function undoLastPick(seasonId: string) {
  await requireAdmin();

  const season = await prisma.season.findUnique({
    where: { id: seasonId },
  });

  if (!season) return { error: "Season not found" };

  // Find the last used or passed pick
  const lastPick = await prisma.draftPick.findFirst({
    where: {
      seasonId,
      OR: [{ used: true }, { passed: true }],
    },
    orderBy: { pickNumber: "desc" },
  });

  if (!lastPick) return { error: "No picks to undo" };

  await prisma.$transaction(async (tx) => {
    // Reset the pick
    await tx.draftPick.update({
      where: { id: lastPick.id },
      data: {
        playerSelectedId: null,
        used: false,
        passed: false,
      },
    });

    // Set current pick back to this one
    const deadline = new Date();
    deadline.setSeconds(deadline.getSeconds() + season.pickTimerSeconds);

    await tx.season.update({
      where: { id: seasonId },
      data: {
        currentPickNumber: lastPick.pickNumber,
        draftStatus: "IN_PROGRESS",
        pickDeadline: deadline,
      },
    });
  });

  revalidatePath("/dashboard/draft");
  revalidatePath("/admin/draft");

  return { success: true };
}

export async function resetDraft(seasonId: string) {
  await requireAdmin();

  await prisma.$transaction(async (tx) => {
    // Reset all picks
    await tx.draftPick.updateMany({
      where: { seasonId },
      data: {
        playerSelectedId: null,
        used: false,
        passed: false,
      },
    });

    // Reset season draft state
    await tx.season.update({
      where: { id: seasonId },
      data: {
        draftStatus: "NOT_STARTED",
        currentPickNumber: 1,
        pickDeadline: null,
      },
    });
  });

  revalidatePath("/dashboard/draft");
  revalidatePath("/admin/draft");

  return { success: true };
}

export async function deleteDraftPicks(seasonId: string) {
  await requireAdmin();

  const season = await prisma.season.findUnique({
    where: { id: seasonId },
  });

  if (!season) return { error: "Season not found" };
  if (season.draftStatus === "IN_PROGRESS") {
    return { error: "Cannot delete picks while draft is in progress" };
  }

  await prisma.$transaction(async (tx) => {
    await tx.draftPick.deleteMany({
      where: { seasonId, draftType: "ANNUAL" },
    });

    await tx.season.update({
      where: { id: seasonId },
      data: {
        draftStatus: "NOT_STARTED",
        currentPickNumber: 1,
        pickDeadline: null,
      },
    });
  });

  revalidatePath("/dashboard/draft");
  revalidatePath("/admin/draft");

  return { success: true };
}

// Skip to a specific pick number (admin only)
export async function skipToPick(seasonId: string, pickNumber: number) {
  await requireAdmin();

  const season = await prisma.season.findUnique({
    where: { id: seasonId },
  });

  if (!season) return { error: "Season not found" };

  const totalPicks = await prisma.draftPick.count({
    where: { seasonId },
  });

  if (pickNumber < 1 || pickNumber > totalPicks) {
    return { error: `Pick number must be between 1 and ${totalPicks}` };
  }

  const deadline = new Date();
  deadline.setSeconds(deadline.getSeconds() + season.pickTimerSeconds);

  await prisma.season.update({
    where: { id: seasonId },
    data: {
      currentPickNumber: pickNumber,
      pickDeadline: deadline,
      draftStatus: "IN_PROGRESS",
    },
  });

  revalidatePath("/dashboard/draft");
  revalidatePath("/admin/draft");

  return { success: true };
}
