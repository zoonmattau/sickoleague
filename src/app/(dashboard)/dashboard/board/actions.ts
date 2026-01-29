"use server";

import prisma from "@/lib/prisma";
import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import {
  generateBoardStatement,
  evaluateCoachRebuttal,
  type BoardContext,
} from "@/lib/ai/anthropic";
import type { GoalType, GoalPriority, BoardType, MeetingType } from "@prisma/client";

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
      club: true,
    },
  });

  return coach?.club ?? null;
}

// Get the current user's coach info
async function getMyCoach() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return null;

  return prisma.coach.findFirst({
    where: {
      OR: [{ discordId: user.id }, { email: user.email ?? "" }],
    },
  });
}

// Get the board for the current user's club
export async function getMyBoard() {
  const club = await getMyClub();
  if (!club) return null;

  const board = await prisma.clubBoard.findUnique({
    where: { clubId: club.id },
    include: {
      goals: {
        include: {
          season: true,
        },
        orderBy: [{ priority: "asc" }, { createdAt: "asc" }],
      },
      meetings: {
        include: {
          season: true,
          round: true,
        },
        orderBy: { createdAt: "desc" },
      },
      club: {
        include: {
          standings: {
            include: { season: true },
            orderBy: { season: { year: "desc" } },
          },
          seasonResults: {
            include: { season: true },
            orderBy: { season: { year: "desc" } },
          },
        },
      },
    },
  });

  // If no board exists, create a default one
  if (!board) {
    const newBoard = await prisma.clubBoard.create({
      data: {
        clubId: club.id,
        boardType: "TRADITIONAL",
        toleranceRating: 50,
      },
      include: {
        goals: {
          include: {
            season: true,
          },
        },
        meetings: {
          include: {
            season: true,
            round: true,
          },
        },
        club: {
          include: {
            standings: {
              include: { season: true },
            },
            seasonResults: {
              include: { season: true },
            },
          },
        },
      },
    });
    return newBoard;
  }

  return board;
}

// Generate season goals using AI (admin/system function)
export async function generateSeasonGoals(clubId: string, seasonId: string) {
  const board = await prisma.clubBoard.findUnique({
    where: { clubId },
    include: {
      club: {
        include: {
          standings: {
            where: { seasonId },
          },
          seasonResults: {
            orderBy: { season: { year: "desc" } },
            take: 3,
          },
        },
      },
    },
  });

  if (!board) return { error: "Board not found" };

  // Determine goals based on board type and history
  const previousPosition = board.club.seasonResults[0]?.finalPosition ?? 5;
  const goals: { goalType: GoalType; priority: GoalPriority; targetValue?: number }[] = [];

  switch (board.boardType) {
    case "AMBITIOUS":
      goals.push(
        { goalType: "WIN_PREMIERSHIP", priority: "PRIMARY" },
        { goalType: "MAKE_FINALS", priority: "SECONDARY" },
        { goalType: "FINISH_TOP_4", priority: "SECONDARY" }
      );
      break;
    case "DEVELOPMENT":
      goals.push(
        { goalType: "IMPROVE_LADDER", priority: "PRIMARY" },
        { goalType: "AVOID_BOTTOM", priority: "SECONDARY" }
      );
      break;
    case "RUTHLESS":
      goals.push(
        { goalType: "MAKE_FINALS", priority: "PRIMARY" },
        { goalType: "FINISH_TOP_4", priority: "PRIMARY" },
        { goalType: "WIN_PERCENTAGE", priority: "SECONDARY", targetValue: 50 }
      );
      break;
    case "SUPPORTIVE":
      goals.push(
        { goalType: "IMPROVE_LADDER", priority: "PRIMARY" },
        { goalType: "STAY_UNDER_CAP", priority: "SECONDARY" }
      );
      break;
    case "TRADITIONAL":
    default:
      // Set goals based on previous performance
      if (previousPosition <= 2) {
        goals.push(
          { goalType: "WIN_PREMIERSHIP", priority: "PRIMARY" },
          { goalType: "MAKE_FINALS", priority: "SECONDARY" }
        );
      } else if (previousPosition <= 4) {
        goals.push(
          { goalType: "MAKE_FINALS", priority: "PRIMARY" },
          { goalType: "FINISH_TOP_4", priority: "ASPIRATIONAL" }
        );
      } else if (previousPosition <= 6) {
        goals.push(
          { goalType: "IMPROVE_LADDER", priority: "PRIMARY" },
          { goalType: "MAKE_FINALS", priority: "ASPIRATIONAL" }
        );
      } else {
        goals.push(
          { goalType: "IMPROVE_LADDER", priority: "PRIMARY" },
          { goalType: "AVOID_BOTTOM", priority: "SECONDARY" }
        );
      }
  }

  // Create goals in database
  for (const goal of goals) {
    await prisma.boardGoal.create({
      data: {
        boardId: board.id,
        seasonId,
        goalType: goal.goalType,
        priority: goal.priority,
        targetValue: goal.targetValue,
      },
    });
  }

  revalidatePath("/dashboard/board");
  return { success: true, goalsCreated: goals.length };
}

// Create a board meeting
export async function createBoardMeeting(
  meetingType: MeetingType,
  roundId?: string
) {
  const club = await getMyClub();
  if (!club) return { error: "No club found" };

  const board = await prisma.clubBoard.findUnique({
    where: { clubId: club.id },
  });

  if (!board) return { error: "Board not found" };

  // Get current season
  const currentSeason = await prisma.season.findFirst({
    where: { status: "ACTIVE" },
    orderBy: { year: "desc" },
  });

  if (!currentSeason) return { error: "No active season" };

  const meeting = await prisma.boardMeeting.create({
    data: {
      boardId: board.id,
      seasonId: currentSeason.id,
      roundId,
      meetingType,
      status: "PENDING",
    },
  });

  revalidatePath("/dashboard/board");
  return { meetingId: meeting.id };
}

// Get meeting with generated board statement
export async function getMeetingWithStatement(meetingId: string) {
  const club = await getMyClub();
  const coach = await getMyCoach();
  if (!club || !coach) return null;

  const meeting = await prisma.boardMeeting.findFirst({
    where: {
      id: meetingId,
      board: { clubId: club.id },
    },
    include: {
      board: {
        include: {
          goals: {
            where: { seasonId: { not: undefined } },
            include: { season: true },
          },
          meetings: {
            where: {
              id: { not: meetingId },
              status: "COMPLETED",
            },
            orderBy: { createdAt: "desc" },
          },
          club: {
            select: { name: true },
          },
        },
      },
      season: true,
      round: true,
    },
  });

  if (!meeting) return null;

  // Get current standings
  const standings = await prisma.standing.findMany({
    where: {
      clubId: club.id,
      seasonId: meeting.seasonId,
    },
  });

  const seniorsStanding = standings.find((s) => s.competition === "SENIORS");

  // Get previous season results
  const previousResults = await prisma.seasonResult.findMany({
    where: { clubId: club.id },
    include: { season: true },
    orderBy: { season: { year: "desc" } },
    take: 3,
  });

  // If no statement yet, generate one
  if (!meeting.boardStatement) {
    const context: BoardContext = {
      boardType: meeting.board.boardType,
      toleranceRating: meeting.board.toleranceRating,
      clubName: club.name,
      coachName: coach.displayName,
      seasonYear: meeting.season.year,
      ladderPosition: seniorsStanding?.ladderPosition ?? undefined,
      wins: seniorsStanding?.wins ?? 0,
      losses: seniorsStanding?.losses ?? 0,
      draws: seniorsStanding?.draws ?? 0,
      pointsFor: Number(seniorsStanding?.pointsFor ?? 0),
      pointsAgainst: Number(seniorsStanding?.pointsAgainst ?? 0),
      goals: meeting.board.goals
        .filter((g) => g.seasonId === meeting.seasonId)
        .map((g) => ({
          goalType: g.goalType,
          priority: g.priority,
          targetValue: g.targetValue ?? undefined,
          currentValue: g.currentValue ?? undefined,
          isAchieved: g.isAchieved,
        })),
      previousSeasons: previousResults.map((r) => ({
        year: r.season.year,
        position: r.finalPosition,
        madeFinals: r.madeFinals,
        isPremier: r.isPremier,
      })),
      meetingType: meeting.meetingType,
      previousMeetings: meeting.board.meetings.map((m) => ({
        type: m.meetingType,
        outcome: m.outcome ?? undefined,
        confidenceLevel: m.confidenceLevel ?? undefined,
      })),
    };

    const statement = await generateBoardStatement(context);

    // Save the statement
    await prisma.boardMeeting.update({
      where: { id: meetingId },
      data: {
        boardStatement: statement.statement,
        status: "AWAITING_RESPONSE",
        confidenceLevel: statement.suggestedConfidence,
      },
    });

    return {
      ...meeting,
      boardStatement: statement.statement,
      status: "AWAITING_RESPONSE" as const,
      confidenceLevel: statement.suggestedConfidence,
      statementTone: statement.tone,
      keyPoints: statement.keyPoints,
    };
  }

  return meeting;
}

// Submit coach rebuttal
export async function submitRebuttal(meetingId: string, rebuttalText: string) {
  const club = await getMyClub();
  const coach = await getMyCoach();
  if (!club || !coach) return { error: "Not authenticated" };

  const meeting = await prisma.boardMeeting.findFirst({
    where: {
      id: meetingId,
      board: { clubId: club.id },
      status: "AWAITING_RESPONSE",
    },
    include: {
      board: {
        include: {
          goals: {
            include: { season: true },
          },
        },
      },
      season: true,
    },
  });

  if (!meeting) return { error: "Meeting not found or not awaiting response" };

  // Get standings
  const standings = await prisma.standing.findFirst({
    where: {
      clubId: club.id,
      seasonId: meeting.seasonId,
      competition: "SENIORS",
    },
  });

  // Save the rebuttal
  await prisma.boardMeeting.update({
    where: { id: meetingId },
    data: { coachRebuttal: rebuttalText },
  });

  revalidatePath("/dashboard/board");
  return { success: true };
}

// Finalize meeting and get verdict
export async function finalizeMeeting(meetingId: string) {
  const club = await getMyClub();
  const coach = await getMyCoach();
  if (!club || !coach) return { error: "Not authenticated" };

  const meeting = await prisma.boardMeeting.findFirst({
    where: {
      id: meetingId,
      board: { clubId: club.id },
      status: "AWAITING_RESPONSE",
    },
    include: {
      board: {
        include: {
          goals: {
            include: { season: true },
          },
        },
      },
      season: true,
    },
  });

  if (!meeting) return { error: "Meeting not found" };
  if (!meeting.coachRebuttal) return { error: "No rebuttal submitted" };

  // Get standings
  const standings = await prisma.standing.findFirst({
    where: {
      clubId: club.id,
      seasonId: meeting.seasonId,
      competition: "SENIORS",
    },
  });

  const context: BoardContext = {
    boardType: meeting.board.boardType,
    toleranceRating: meeting.board.toleranceRating,
    clubName: club.name,
    coachName: coach.displayName,
    seasonYear: meeting.season.year,
    ladderPosition: standings?.ladderPosition ?? undefined,
    wins: standings?.wins ?? 0,
    losses: standings?.losses ?? 0,
    draws: standings?.draws ?? 0,
    pointsFor: Number(standings?.pointsFor ?? 0),
    pointsAgainst: Number(standings?.pointsAgainst ?? 0),
    goals: meeting.board.goals
      .filter((g) => g.seasonId === meeting.seasonId)
      .map((g) => ({
        goalType: g.goalType,
        priority: g.priority,
        targetValue: g.targetValue ?? undefined,
        currentValue: g.currentValue ?? undefined,
        isAchieved: g.isAchieved,
      })),
    meetingType: meeting.meetingType,
  };

  const verdict = await evaluateCoachRebuttal(context, meeting.coachRebuttal);

  // Update meeting with verdict
  await prisma.boardMeeting.update({
    where: { id: meetingId },
    data: {
      finalVerdict: verdict.verdict,
      outcome: verdict.outcome,
      confidenceLevel: verdict.confidenceLevel,
      status: "COMPLETED",
    },
  });

  // If fired, remove coach from club
  if (verdict.outcome === "FIRED") {
    await executeTermination(club.id);
  }

  revalidatePath("/dashboard/board");
  revalidatePath("/dashboard");

  return {
    verdict: verdict.verdict,
    outcome: verdict.outcome,
    confidenceLevel: verdict.confidenceLevel,
    reasoning: verdict.reasoning,
  };
}

// Execute coach termination
export async function executeTermination(clubId: string) {
  await prisma.club.update({
    where: { id: clubId },
    data: { coachId: null },
  });

  revalidatePath("/dashboard");
  return { success: true };
}

// Update board settings (admin only)
export async function updateBoardSettings(
  boardId: string,
  settings: { boardType?: BoardType; toleranceRating?: number }
) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return { error: "Not authenticated" };

  const coach = await prisma.coach.findFirst({
    where: {
      OR: [{ discordId: user.id }, { email: user.email ?? "" }],
    },
  });

  if (!coach?.isCommissioner) return { error: "Only commissioners can update board settings" };

  await prisma.clubBoard.update({
    where: { id: boardId },
    data: {
      ...(settings.boardType && { boardType: settings.boardType }),
      ...(settings.toleranceRating !== undefined && {
        toleranceRating: settings.toleranceRating,
      }),
    },
  });

  revalidatePath("/dashboard/board");
  return { success: true };
}

// Update goal progress
export async function updateGoalProgress(
  goalId: string,
  progress: { currentValue?: number; isAchieved?: boolean }
) {
  const club = await getMyClub();
  if (!club) return { error: "No club found" };

  // Verify the goal belongs to this club's board
  const goal = await prisma.boardGoal.findFirst({
    where: {
      id: goalId,
      board: { clubId: club.id },
    },
  });

  if (!goal) return { error: "Goal not found" };

  await prisma.boardGoal.update({
    where: { id: goalId },
    data: {
      ...(progress.currentValue !== undefined && { currentValue: progress.currentValue }),
      ...(progress.isAchieved !== undefined && { isAchieved: progress.isAchieved }),
    },
  });

  revalidatePath("/dashboard/board");
  return { success: true };
}

// Get all board meetings for current club
export async function getMyBoardMeetings() {
  const club = await getMyClub();
  if (!club) return [];

  const meetings = await prisma.boardMeeting.findMany({
    where: {
      board: { clubId: club.id },
    },
    include: {
      season: true,
      round: true,
    },
    orderBy: { createdAt: "desc" },
  });

  return meetings;
}

// Cancel a pending board meeting
export async function cancelBoardMeeting(meetingId: string) {
  const club = await getMyClub();
  if (!club) return { error: "No club found" };

  // Only allow canceling PENDING or AWAITING_RESPONSE meetings
  const meeting = await prisma.boardMeeting.findFirst({
    where: {
      id: meetingId,
      board: { clubId: club.id },
      status: { in: ["PENDING", "AWAITING_RESPONSE"] },
    },
  });

  if (!meeting) return { error: "Meeting not found or cannot be canceled" };

  // Delete the meeting
  await prisma.boardMeeting.delete({
    where: { id: meetingId },
  });

  revalidatePath("/dashboard/board");
  return { success: true };
}
