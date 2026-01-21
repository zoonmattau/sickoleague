"use server";

import prisma from "@/lib/prisma";
import { revalidatePath } from "next/cache";

export async function updateMatchResult(
  matchId: string,
  homeScore: number,
  awayScore: number
) {
  try {
    await prisma.match.update({
      where: { id: matchId },
      data: {
        homeScore: homeScore,
        awayScore: awayScore,
        status: "COMPLETED"
      }
    });

    revalidatePath("/admin");
    revalidatePath("/");

    return { success: true };
  } catch (error) {
    console.error("Failed to update match:", error);
    return { success: false, error: "Failed to update match result" };
  }
}

export async function recalculateStandings() {
  try {
    // Get all completed matches
    const matches = await prisma.match.findMany({
      where: { status: "COMPLETED" },
      include: {
        homeClub: true,
        awayClub: true
      }
    });

    // Get all clubs
    const clubs = await prisma.club.findMany();

    // Initialize standings data
    const standingsData: Record<string, {
      clubId: string;
      competition: "SENIORS" | "RESERVES";
      played: number;
      wins: number;
      losses: number;
      draws: number;
      pointsFor: number;
      pointsAgainst: number;
    }> = {};

    // Initialize all clubs with zero stats
    for (const club of clubs) {
      standingsData[`${club.id}-SENIORS`] = {
        clubId: club.id,
        competition: "SENIORS",
        played: 0,
        wins: 0,
        losses: 0,
        draws: 0,
        pointsFor: 0,
        pointsAgainst: 0
      };
      standingsData[`${club.id}-RESERVES`] = {
        clubId: club.id,
        competition: "RESERVES",
        played: 0,
        wins: 0,
        losses: 0,
        draws: 0,
        pointsFor: 0,
        pointsAgainst: 0
      };
    }

    // Calculate standings from matches
    for (const match of matches) {
      if (match.homeScore === null || match.awayScore === null) continue;

      const homeKey = `${match.homeClubId}-${match.matchType}`;
      const awayKey = `${match.awayClubId}-${match.matchType}`;

      // Update games played
      standingsData[homeKey].played++;
      standingsData[awayKey].played++;

      // Update points for/against
      standingsData[homeKey].pointsFor += match.homeScore;
      standingsData[homeKey].pointsAgainst += match.awayScore;
      standingsData[awayKey].pointsFor += match.awayScore;
      standingsData[awayKey].pointsAgainst += match.homeScore;

      // Update wins/losses/draws
      if (match.homeScore > match.awayScore) {
        standingsData[homeKey].wins++;
        standingsData[awayKey].losses++;
      } else if (match.awayScore > match.homeScore) {
        standingsData[awayKey].wins++;
        standingsData[homeKey].losses++;
      } else {
        standingsData[homeKey].draws++;
        standingsData[awayKey].draws++;
      }
    }

    // Update all standings in database
    for (const key of Object.keys(standingsData)) {
      const data = standingsData[key];
      const percentage = data.pointsAgainst === 0
        ? (data.pointsFor > 0 ? 999.9 : 100.0)
        : (data.pointsFor / data.pointsAgainst) * 100;

      await prisma.standing.updateMany({
        where: {
          clubId: data.clubId,
          competition: data.competition
        },
        data: {
          played: data.played,
          wins: data.wins,
          losses: data.losses,
          draws: data.draws,
          pointsFor: data.pointsFor,
          pointsAgainst: data.pointsAgainst,
          percentage: percentage
        }
      });
    }

    revalidatePath("/admin");
    revalidatePath("/");

    return { success: true };
  } catch (error) {
    console.error("Failed to recalculate standings:", error);
    return { success: false, error: "Failed to recalculate standings" };
  }
}
