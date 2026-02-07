"use server";

import prisma from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { isAdmin } from "@/lib/admin";
import { generateRoundWrap, generatePowerRankings } from "@/lib/ai/anthropic";
import type { RoundWrapContext, PowerRankingsContext } from "@/lib/ai/prompts/narrative";

export async function getArticles(seasonId: string) {
  const articles = await prisma.leagueArticle.findMany({
    where: { seasonId },
    include: {
      round: {
        select: { roundNumber: true, roundType: true },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  return articles.map((a) => ({
    id: a.id,
    type: a.type,
    headline: a.headline,
    body: a.body,
    roundNumber: a.round?.roundNumber ?? null,
    roundType: a.round?.roundType ?? null,
    createdAt: a.createdAt.toISOString(),
  }));
}

export async function generateRoundNarrative(roundId: string) {
  // Admin check
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user || !isAdmin(user)) {
    return { success: false, error: "Unauthorized" };
  }

  try {
    // Get the round with its season
    const round = await prisma.round.findUnique({
      where: { id: roundId },
      include: {
        season: true,
        matches: {
          where: { status: "COMPLETED" },
          include: {
            homeClub: { include: { city: true } },
            awayClub: { include: { city: true } },
            playerScores: {
              where: { played: true },
              include: {
                aflPlayer: true,
                rosterPlayer: {
                  include: { club: { select: { abbreviation: true } } },
                },
              },
              orderBy: { finalScore: "desc" },
            },
          },
        },
      },
    });

    if (!round) {
      return { success: false, error: "Round not found" };
    }

    // Check if articles already exist for this round
    const existing = await prisma.leagueArticle.findFirst({
      where: { roundId, seasonId: round.seasonId },
    });

    if (existing) {
      return { success: false, error: "Articles already generated for this round" };
    }

    // Build match data for context
    const matchData: RoundWrapContext["matches"] = round.matches.map((m) => {
      // Get top 3 scorers for this match
      const topScorers = m.playerScores
        .filter((ps) => ps.finalScore !== null)
        .sort((a, b) => Number(b.finalScore ?? 0) - Number(a.finalScore ?? 0))
        .slice(0, 3)
        .map((ps) => ({
          playerName: `${ps.aflPlayer.firstName} ${ps.aflPlayer.lastName}`,
          club: ps.rosterPlayer?.club?.abbreviation ?? "",
          score: Number(ps.finalScore ?? 0),
          isCaptain: ps.isCaptain,
        }));

      return {
        homeClub: m.homeClub.name,
        homeAbbr: m.homeClub.abbreviation,
        awayClub: m.awayClub.name,
        awayAbbr: m.awayClub.abbreviation,
        homeScore: Number(m.homeScore ?? 0),
        awayScore: Number(m.awayScore ?? 0),
        homeStaffBonus: m.homeStaffBonus ? Number(m.homeStaffBonus) : null,
        awayStaffBonus: m.awayStaffBonus ? Number(m.awayStaffBonus) : null,
        matchType: m.matchType,
        isRivalMatch: m.isRivalMatch,
        topScorers,
      };
    });

    // Get current standings
    const standings = await prisma.standing.findMany({
      where: { seasonId: round.seasonId },
      include: { club: { select: { name: true, abbreviation: true } } },
      orderBy: [{ competition: "asc" }, { wins: "desc" }, { percentage: "desc" }],
    });

    const standingsData: RoundWrapContext["standings"] = standings.map((s) => ({
      club: s.club.name,
      abbr: s.club.abbreviation,
      wins: s.wins,
      losses: s.losses,
      draws: s.draws,
      percentage: Number(s.percentage),
      ladderPosition: s.ladderPosition,
      competition: s.competition,
    }));

    // Get recent trades (completed since last round)
    const previousRound = await prisma.round.findFirst({
      where: {
        seasonId: round.seasonId,
        roundNumber: round.roundNumber - 1,
      },
    });

    const recentTrades = await prisma.trade.findMany({
      where: {
        status: "COMPLETED",
        completedAt: previousRound
          ? { gte: previousRound.createdAt }
          : undefined,
      },
      include: {
        proposedBy: { select: { name: true, abbreviation: true } },
        proposedTo: { select: { name: true, abbreviation: true } },
        assets: {
          include: {
            contract: { include: { aflPlayer: true } },
            staffContract: { include: { staff: true } },
            draftPick: true,
          },
        },
      },
      take: 10,
    });

    const tradesData: RoundWrapContext["recentTrades"] = recentTrades.map((t) => ({
      from: t.proposedBy.name,
      to: t.proposedTo.name,
      assets: t.assets.map((a) => {
        if (a.contract?.aflPlayer) {
          return `${a.contract.aflPlayer.firstName} ${a.contract.aflPlayer.lastName}`;
        }
        if (a.staffContract?.staff) {
          return `${a.staffContract.staff.name} (staff)`;
        }
        if (a.draftPick) {
          return `Round ${a.draftPick.round} pick`;
        }
        if (a.assetType === "SALARY") {
          return `$${Number(a.salaryAmount ?? 0)} salary`;
        }
        return "unknown asset";
      }),
      completedAt: t.completedAt?.toLocaleDateString() ?? "",
    }));

    // Get club snippets
    const clubs = await prisma.club.findMany({
      select: {
        name: true,
        abbreviation: true,
        founded: true,
        city: { select: { name: true } },
      },
    });

    const clubSnippets: RoundWrapContext["clubSnippets"] = clubs.map((c) => ({
      name: c.name,
      abbr: c.abbreviation,
      founded: c.founded,
      city: c.city?.name ?? null,
    }));

    // Build round wrap context
    const roundWrapContext: RoundWrapContext = {
      roundNumber: round.roundNumber,
      seasonYear: round.season.year,
      matches: matchData,
      standings: standingsData,
      recentTrades: tradesData,
      clubSnippets,
    };

    // Build power rankings context
    // Get last 3 rounds of results per club for form
    const recentRounds = await prisma.round.findMany({
      where: {
        seasonId: round.seasonId,
        roundNumber: { lte: round.roundNumber, gte: Math.max(1, round.roundNumber - 2) },
        status: "COMPLETED",
      },
      include: {
        matches: {
          where: { status: "COMPLETED" },
          select: {
            homeClubId: true,
            awayClubId: true,
            homeScore: true,
            awayScore: true,
            matchType: true,
          },
        },
      },
      orderBy: { roundNumber: "asc" },
    });

    // Build form data per club - map clubId to club name via standings
    const clubIdToName = new Map<string, { name: string; abbr: string }>();
    for (const s of standings) {
      clubIdToName.set(s.clubId, { name: s.club.name, abbr: s.club.abbreviation });
    }

    const formMap = new Map<string, { abbr: string; seniors: ("W" | "L" | "D")[]; reserves: ("W" | "L" | "D")[] }>();
    for (const club of clubs) {
      formMap.set(club.name, { abbr: club.abbreviation, seniors: [], reserves: [] });
    }

    for (const r of recentRounds) {
      for (const m of r.matches) {
        const homeScore = Number(m.homeScore ?? 0);
        const awayScore = Number(m.awayScore ?? 0);

        const getResult = (isHome: boolean): "W" | "L" | "D" => {
          if (homeScore === awayScore) return "D";
          if (isHome) return homeScore > awayScore ? "W" : "L";
          return awayScore > homeScore ? "W" : "L";
        };

        const competition = m.matchType === "SENIORS" ? "seniors" : "reserves";

        const homeInfo = clubIdToName.get(m.homeClubId);
        if (homeInfo) {
          const form = formMap.get(homeInfo.name);
          if (form) form[competition].push(getResult(true));
        }

        const awayInfo = clubIdToName.get(m.awayClubId);
        if (awayInfo) {
          const form = formMap.get(awayInfo.name);
          if (form) form[competition].push(getResult(false));
        }
      }
    }

    const recentForm: PowerRankingsContext["recentForm"] = [];
    for (const [clubName, form] of formMap) {
      if (form.seniors.length > 0) {
        recentForm.push({
          club: clubName,
          abbr: form.abbr,
          last3: form.seniors.slice(-3),
          competition: "SENIORS",
        });
      }
    }

    const powerRankingsContext: PowerRankingsContext = {
      seasonYear: round.season.year,
      roundNumber: round.roundNumber,
      standings: standingsData,
      recentForm,
      recentTrades: tradesData.map((t) => ({
        from: t.from,
        to: t.to,
        assets: t.assets,
      })),
    };

    // Generate both articles in parallel
    const [roundWrapResult, powerRankingsResult] = await Promise.all([
      generateRoundWrap(roundWrapContext),
      generatePowerRankings(powerRankingsContext),
    ]);

    // Save to database
    await prisma.leagueArticle.createMany({
      data: [
        {
          type: "ROUND_WRAP",
          headline: roundWrapResult.headline,
          body: roundWrapResult.body,
          seasonId: round.seasonId,
          roundId: round.id,
        },
        {
          type: "POWER_RANKINGS",
          headline: powerRankingsResult.headline,
          body: powerRankingsResult.body,
          seasonId: round.seasonId,
          roundId: round.id,
        },
      ],
    });

    revalidatePath("/dashboard/news");
    revalidatePath("/admin");

    return { success: true };
  } catch (error) {
    console.error("Failed to generate round narrative:", error);
    return { success: false, error: "Failed to generate round narrative" };
  }
}
