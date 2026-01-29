"use server";

import prisma from "@/lib/prisma";
import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { generateNegotiationResponse, type NegotiationContext } from "@/lib/ai/anthropic";
import type { NegotiationStyle, MessageRole } from "@prisma/client";

// Helper to get the current user's club
async function getMyClub() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) return null;

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
          seasonResults: {
            where: { isPremier: true },
            include: { season: true },
          },
          standings: {
            orderBy: { season: { year: "desc" } },
            take: 1,
          },
        },
      },
    },
  });

  return coach?.club ?? null;
}

// Get negotiation target details (player or staff)
export async function getNegotiationTarget(targetType: "player" | "staff", targetId: string) {
  if (targetType === "player") {
    const player = await prisma.aflPlayer.findUnique({
      where: { id: targetId },
      include: {
        aflTeam: true,
        personalityProfile: true,
        contracts: {
          where: { status: "ACTIVE" },
          include: {
            club: true,
          },
          take: 1,
        },
      },
    });

    if (!player) return null;

    const currentContract = player.contracts[0];

    return {
      type: "player" as const,
      id: player.id,
      name: `${player.firstName} ${player.lastName}`,
      position: player.positions.join("/"),
      aflTeam: player.aflTeam?.abbreviation ?? null,
      photoUrl: player.photoUrl,
      personality: player.personalityProfile ?? null,
      currentContract: currentContract
        ? {
            clubId: currentContract.clubId,
            clubName: currentContract.club.name,
            salary: Number(currentContract.totalValue) / (currentContract.endSeason - currentContract.startSeason + 1),
            endSeason: currentContract.endSeason,
          }
        : null,
    };
  } else {
    const staff = await prisma.staff.findUnique({
      where: { id: targetId },
      include: {
        aflTeam: true,
        personalityProfile: true,
        staffContracts: {
          where: { status: "ACTIVE" },
          include: {
            club: true,
          },
          take: 1,
        },
      },
    });

    if (!staff) return null;

    const currentContract = staff.staffContracts[0];

    return {
      type: "staff" as const,
      id: staff.id,
      name: staff.name,
      role: staff.role,
      aflTeam: staff.aflTeam?.abbreviation ?? null,
      personality: staff.personalityProfile ?? null,
      currentContract: currentContract
        ? {
            clubId: currentContract.clubId,
            clubName: currentContract.club.name,
            salary: Number(currentContract.totalValue) / (currentContract.endSeason - currentContract.startSeason + 1),
            endSeason: currentContract.endSeason,
          }
        : null,
    };
  }
}

// Start a new negotiation session
export async function startNegotiation(
  targetType: "player" | "staff",
  targetId: string,
  initialOffer: { years: number; yearBreakdown: { season: number; value: number }[] }
) {
  const club = await getMyClub();
  if (!club) return { error: "No club found" };

  // Check for existing active session
  const existingSession = await prisma.negotiationSession.findFirst({
    where: {
      clubId: club.id,
      ...(targetType === "player" ? { aflPlayerId: targetId } : { staffId: targetId }),
      status: "ACTIVE",
    },
  });

  if (existingSession) {
    return { sessionId: existingSession.id };
  }

  // Calculate total value
  const totalValue = initialOffer.yearBreakdown.reduce((sum, y) => sum + y.value, 0);

  // Create new session
  const session = await prisma.negotiationSession.create({
    data: {
      clubId: club.id,
      ...(targetType === "player" ? { aflPlayerId: targetId } : { staffId: targetId }),
      currentOffer: {
        years: initialOffer.years,
        totalValue,
        yearBreakdown: initialOffer.yearBreakdown,
      },
      aiContext: [],
      playerMood: 50,
    },
  });

  revalidatePath("/dashboard/negotiate");
  return { sessionId: session.id };
}

// Get an existing negotiation session
export async function getNegotiationSession(sessionId: string) {
  const club = await getMyClub();
  if (!club) return null;

  const session = await prisma.negotiationSession.findFirst({
    where: {
      id: sessionId,
      clubId: club.id,
    },
    include: {
      messages: {
        orderBy: { createdAt: "asc" },
      },
      aflPlayer: {
        include: {
          aflTeam: true,
          personalityProfile: true,
          contracts: {
            where: { status: "ACTIVE" },
            include: { club: true },
            take: 1,
          },
        },
      },
      staff: {
        include: {
          aflTeam: true,
          personalityProfile: true,
          staffContracts: {
            where: { status: "ACTIVE" },
            include: { club: true },
            take: 1,
          },
        },
      },
      club: {
        include: {
          seasonResults: {
            where: { isPremier: true },
            include: { season: true },
          },
          standings: {
            orderBy: { season: { year: "desc" } },
            take: 1,
          },
        },
      },
    },
  });

  return session;
}

// Send a message in a negotiation
export async function sendMessage(sessionId: string, message: string) {
  const club = await getMyClub();
  if (!club) return { error: "No club found" };

  const session = await prisma.negotiationSession.findFirst({
    where: {
      id: sessionId,
      clubId: club.id,
      status: "ACTIVE",
    },
    include: {
      messages: {
        orderBy: { createdAt: "asc" },
      },
      aflPlayer: {
        include: {
          aflTeam: true,
          personalityProfile: true,
          contracts: {
            where: { status: "ACTIVE" },
            include: { club: true },
            take: 1,
          },
        },
      },
      staff: {
        include: {
          aflTeam: true,
          personalityProfile: true,
          staffContracts: {
            where: { status: "ACTIVE" },
            include: { club: true },
            take: 1,
          },
        },
      },
      club: {
        include: {
          seasonResults: {
            where: { isPremier: true },
            include: { season: true },
          },
          standings: {
            orderBy: { season: { year: "desc" } },
            take: 1,
          },
        },
      },
    },
  });

  if (!session) return { error: "Session not found" };

  const isPlayer = !!session.aflPlayer;
  const target = isPlayer ? session.aflPlayer! : session.staff!;
  const personality = isPlayer
    ? session.aflPlayer!.personalityProfile
    : session.staff!.personalityProfile;

  // Default personality if none exists
  const defaultPersonality = {
    ambition: 5,
    loyalty: 5,
    riskTolerance: 5,
    prideLevel: 5,
    negotiationStyle: "BALANCED" as NegotiationStyle,
  };

  const currentOffer = session.currentOffer as {
    years: number;
    totalValue: number;
    yearBreakdown: { season: number; value: number }[];
  };

  // Build context for AI
  const context: NegotiationContext = {
    targetType: isPlayer ? "player" : "staff",
    targetName: isPlayer
      ? `${session.aflPlayer!.firstName} ${session.aflPlayer!.lastName}`
      : session.staff!.name,
    targetPosition: isPlayer ? session.aflPlayer!.positions.join("/") : undefined,
    targetRole: !isPlayer ? session.staff!.role : undefined,
    aflTeam: isPlayer
      ? session.aflPlayer!.aflTeam?.abbreviation
      : session.staff!.aflTeam?.abbreviation,
    personality: personality ?? defaultPersonality,
    clubName: session.club.name,
    clubTrophies: session.club.seasonResults.length,
    clubLadderPosition: session.club.standings[0]?.ladderPosition ?? undefined,
    offer: currentOffer,
    previousContract: isPlayer && session.aflPlayer!.contracts[0]
      ? {
          clubName: session.aflPlayer!.contracts[0].club.name,
          salary:
            Number(session.aflPlayer!.contracts[0].totalValue) /
            (session.aflPlayer!.contracts[0].endSeason -
              session.aflPlayer!.contracts[0].startSeason +
              1),
          years:
            session.aflPlayer!.contracts[0].endSeason -
            session.aflPlayer!.contracts[0].startSeason +
            1,
        }
      : undefined,
    messages: session.messages.map((m) => ({
      role: m.role === "COACH" ? "coach" : isPlayer ? "player" : "staff",
      content: m.content,
    })),
    mood: session.playerMood,
    coachMessage: message,
  };

  // Generate AI response
  const aiResponse = await generateNegotiationResponse(context);

  // Save coach message
  await prisma.negotiationMessage.create({
    data: {
      sessionId,
      role: "COACH",
      content: message,
    },
  });

  // Save AI response
  const responseRole: MessageRole = isPlayer ? "PLAYER" : "STAFF";
  await prisma.negotiationMessage.create({
    data: {
      sessionId,
      role: responseRole,
      content: aiResponse.message,
      emotion: aiResponse.emotion,
    },
  });

  // Update session mood
  const newMood = Math.max(0, Math.min(100, session.playerMood + aiResponse.moodChange));
  await prisma.negotiationSession.update({
    where: { id: sessionId },
    data: {
      playerMood: newMood,
      // Update offer if counter was made
      ...(aiResponse.counterOffer && {
        currentOffer: {
          years: aiResponse.counterOffer.years,
          totalValue: aiResponse.counterOffer.totalValue,
          yearBreakdown: currentOffer.yearBreakdown, // Keep existing breakdown structure
        },
      }),
    },
  });

  // Handle decisions
  if (aiResponse.decision === "accept") {
    await prisma.negotiationSession.update({
      where: { id: sessionId },
      data: { status: "ACCEPTED" },
    });
  } else if (aiResponse.decision === "reject") {
    await prisma.negotiationSession.update({
      where: { id: sessionId },
      data: { status: "REJECTED" },
    });
  }

  revalidatePath(`/dashboard/negotiate`);

  return {
    response: aiResponse,
    newMood,
    status: aiResponse.decision === "accept"
      ? "ACCEPTED"
      : aiResponse.decision === "reject"
      ? "REJECTED"
      : "ACTIVE",
  };
}

// Modify the current offer
export async function modifyOffer(
  sessionId: string,
  newOffer: { years: number; yearBreakdown: { season: number; value: number }[] }
) {
  const club = await getMyClub();
  if (!club) return { error: "No club found" };

  const session = await prisma.negotiationSession.findFirst({
    where: {
      id: sessionId,
      clubId: club.id,
      status: "ACTIVE",
    },
  });

  if (!session) return { error: "Session not found" };

  const totalValue = newOffer.yearBreakdown.reduce((sum, y) => sum + y.value, 0);

  await prisma.negotiationSession.update({
    where: { id: sessionId },
    data: {
      currentOffer: {
        years: newOffer.years,
        totalValue,
        yearBreakdown: newOffer.yearBreakdown,
      },
    },
  });

  // Add system message about offer change
  await prisma.negotiationMessage.create({
    data: {
      sessionId,
      role: "SYSTEM",
      content: `Offer updated: ${newOffer.years} year(s), $${totalValue} total`,
    },
  });

  revalidatePath(`/dashboard/negotiate`);
  return { success: true };
}

// Accept negotiation and create contract
export async function acceptNegotiation(sessionId: string) {
  const club = await getMyClub();
  if (!club) return { error: "No club found" };

  const session = await prisma.negotiationSession.findFirst({
    where: {
      id: sessionId,
      clubId: club.id,
      status: "ACCEPTED",
    },
  });

  if (!session) return { error: "Session not found or not accepted" };

  const currentOffer = session.currentOffer as {
    years: number;
    totalValue: number;
    yearBreakdown: { season: number; value: number }[];
  };

  const startSeason = currentOffer.yearBreakdown[0]?.season ?? new Date().getFullYear();
  const endSeason = currentOffer.yearBreakdown[currentOffer.yearBreakdown.length - 1]?.season ?? startSeason;

  if (session.aflPlayerId) {
    // Create player contract
    await prisma.contract.create({
      data: {
        clubId: club.id,
        aflPlayerId: session.aflPlayerId,
        startSeason,
        endSeason,
        totalValue: currentOffer.totalValue,
        yearBreakdown: currentOffer.yearBreakdown,
        contractType: "FREE_AGENT",
        status: "ACTIVE",
      },
    });
  } else if (session.staffId) {
    // Determine staff role based on existing staff or default
    const staff = await prisma.staff.findUnique({ where: { id: session.staffId } });
    const staffRole = staff?.role === "LIST_MANAGER" ? "LIST_MANAGER" : "SENIOR_ASSISTANT";

    await prisma.staffContract.create({
      data: {
        clubId: club.id,
        staffId: session.staffId,
        staffRole,
        startSeason,
        endSeason,
        totalValue: currentOffer.totalValue,
        yearBreakdown: currentOffer.yearBreakdown,
        status: "ACTIVE",
      },
    });
  }

  revalidatePath("/dashboard/roster");
  revalidatePath("/dashboard");
  return { success: true };
}

// Walk away from negotiation
export async function walkAway(sessionId: string) {
  const club = await getMyClub();
  if (!club) return { error: "No club found" };

  const session = await prisma.negotiationSession.findFirst({
    where: {
      id: sessionId,
      clubId: club.id,
      status: "ACTIVE",
    },
  });

  if (!session) return { error: "Session not found" };

  await prisma.negotiationSession.update({
    where: { id: sessionId },
    data: { status: "EXPIRED" },
  });

  revalidatePath("/dashboard/negotiate");
  return { success: true };
}

// Get all active negotiations for the club
export async function getMyNegotiations() {
  const club = await getMyClub();
  if (!club) return [];

  const sessions = await prisma.negotiationSession.findMany({
    where: {
      clubId: club.id,
    },
    include: {
      aflPlayer: {
        include: { aflTeam: true },
      },
      staff: {
        include: { aflTeam: true },
      },
      messages: {
        orderBy: { createdAt: "desc" },
        take: 1,
      },
    },
    orderBy: { updatedAt: "desc" },
  });

  return sessions.map((s) => ({
    id: s.id,
    status: s.status,
    targetType: s.aflPlayerId ? "player" : "staff",
    targetName: s.aflPlayer
      ? `${s.aflPlayer.firstName} ${s.aflPlayer.lastName}`
      : s.staff?.name ?? "Unknown",
    targetTeam: s.aflPlayer?.aflTeam?.abbreviation ?? s.staff?.aflTeam?.abbreviation ?? null,
    mood: s.playerMood,
    lastMessage: s.messages[0]?.content ?? null,
    updatedAt: s.updatedAt.toISOString(),
  }));
}
