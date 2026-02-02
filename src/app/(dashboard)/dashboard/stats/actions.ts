"use server";

import prisma from "@/lib/prisma";
import { unstable_cache } from "next/cache";

const getCachedTeamStats = unstable_cache(
  async () => {
    const currentYear = new Date().getFullYear();

    // Get all clubs
    const clubs = await prisma.club.findMany({
      select: {
        id: true,
        name: true,
        abbreviation: true,
        primaryColor: true,
        secondaryColor: true,
      },
      orderBy: { name: "asc" },
    });

    // Get contracts for all clubs
    const contracts = await prisma.contract.findMany({
      where: { status: "ACTIVE" },
      select: {
        id: true,
        clubId: true,
        totalValue: true,
        yearBreakdown: true,
        endSeason: true,
      },
    });

    // Group contracts by club
    const contractsByClub = new Map<string, typeof contracts>();
    for (const contract of contracts) {
      const existing = contractsByClub.get(contract.clubId) ?? [];
      existing.push(contract);
      contractsByClub.set(contract.clubId, existing);
    }

    // Get salary data for all clubs
    const salaryData = await prisma.clubSalary.findMany({
      where: { season: currentYear },
    });
    const salaryByClub = new Map(salaryData.map(s => [s.clubId, s]));

    // Get player scores aggregated by club
    const playerScores = await prisma.matchPlayerScore.groupBy({
      by: ["rosterPlayerId"],
      _avg: { aflFantasyScore: true },
      _count: { aflFantasyScore: true },
      where: {
        played: true,
        aflFantasyScore: { not: null },
      },
    });

    // Get roster player to club mapping
    const rosterPlayers = await prisma.rosterPlayer.findMany({
      where: {
        id: { in: playerScores.map(s => s.rosterPlayerId) },
      },
      select: {
        id: true,
        clubId: true,
      },
    });

    const rosterToClub = new Map(rosterPlayers.map(rp => [rp.id, rp.clubId]));

    // Aggregate scores by club
    const clubScores = new Map<string, { totalAvg: number; playerCount: number; totalGames: number }>();
    for (const score of playerScores) {
      const clubId = rosterToClub.get(score.rosterPlayerId);
      if (!clubId) continue;

      const existing = clubScores.get(clubId) ?? { totalAvg: 0, playerCount: 0, totalGames: 0 };
      existing.totalAvg += score._avg.aflFantasyScore ?? 0;
      existing.playerCount += 1;
      existing.totalGames += score._count.aflFantasyScore;
      clubScores.set(clubId, existing);
    }

    return clubs.map(club => {
      const clubSalary = salaryByClub.get(club.id);
      const clubContracts = contractsByClub.get(club.id) ?? [];
      const scores = clubScores.get(club.id);

      // Calculate current year salary from contract breakdowns
      let currentYearSalary = 0;
      let expiringContracts = 0;

      for (const contract of clubContracts) {
        const breakdown = contract.yearBreakdown as { season: number; value: number }[];
        const thisYearValue = breakdown.find(b => b.season === currentYear)?.value ?? 0;
        currentYearSalary += thisYearValue;

        if (contract.endSeason === currentYear) {
          expiringContracts++;
        }
      }

      return {
        id: club.id,
        clubId: club.id,
        clubName: club.name,
        clubAbbr: club.abbreviation,
        primaryColor: club.primaryColor,
        secondaryColor: club.secondaryColor,
        rosterSize: clubContracts.length,
        totalSalary: clubSalary?.totalSalary ? Number(clubSalary.totalSalary) : currentYearSalary,
        salaryCap: clubSalary?.salaryCap ? Number(clubSalary.salaryCap) : 750,
        capRoom: clubSalary?.capRoom ? Number(clubSalary.capRoom) : (750 - currentYearSalary),
        isOverCap: clubSalary?.isOverCap ?? (currentYearSalary > 750),
        avgPlayerScore: scores ? Math.round((scores.totalAvg / scores.playerCount) * 10) / 10 : null,
        totalGamesPlayed: scores?.totalGames ?? 0,
        expiringContracts,
      };
    });
  },
  ["all-team-stats"],
  { revalidate: 60 }
);

export async function getAllTeamStats() {
  return getCachedTeamStats();
}

const getCachedPlayerStats = unstable_cache(
  async () => {
    const scores = await prisma.matchPlayerScore.findMany({
      where: {
        played: true,
        aflFantasyScore: { not: null },
      },
      include: {
        rosterPlayer: {
          include: {
            club: {
              select: {
                id: true,
                name: true,
                abbreviation: true,
                primaryColor: true,
                secondaryColor: true,
              },
            },
            contract: {
              select: {
                id: true,
                totalValue: true,
                tradeBlock: true,
                yearBreakdown: true,
                endSeason: true,
                aflPlayer: {
                  select: {
                    id: true,
                    firstName: true,
                    lastName: true,
                    positions: true,
                    photoUrl: true,
                    aflTeam: {
                      select: {
                        name: true,
                        abbreviation: true,
                      },
                    },
                  },
                },
              },
            },
          },
        },
        match: {
          select: {
            matchType: true,
            round: {
              select: {
                roundNumber: true,
                season: { select: { year: true } },
              },
            },
          },
        },
      },
    });

    // Aggregate by contract
    const playerMap = new Map<string, {
      contractId: string;
      aflPlayerId: string;
      firstName: string;
      lastName: string;
      positions: string[];
      photoUrl: string | null;
      aflTeam: string | null;
      clubId: string;
      clubName: string;
      clubAbbr: string;
      primaryColor: string | null;
      secondaryColor: string | null;
      salary: number;
      tradeBlock: boolean;
      endSeason: number;
      scores: number[];
      seniorsGames: number;
      reservesGames: number;
    }>();

    const currentYear = new Date().getFullYear();

    for (const score of scores) {
      const contract = score.rosterPlayer.contract;
      const player = contract.aflPlayer;
      const club = score.rosterPlayer.club;
      const key = contract.id;

      const breakdown = contract.yearBreakdown as { season: number; value: number }[];
      const currentYearSalary = breakdown.find(y => y.season === currentYear)?.value ?? 0;

      const existing = playerMap.get(key) ?? {
        contractId: contract.id,
        aflPlayerId: player.id,
        firstName: player.firstName,
        lastName: player.lastName,
        positions: player.positions,
        photoUrl: player.photoUrl,
        aflTeam: player.aflTeam?.abbreviation ?? null,
        clubId: club.id,
        clubName: club.name,
        clubAbbr: club.abbreviation,
        primaryColor: club.primaryColor,
        secondaryColor: club.secondaryColor,
        salary: currentYearSalary,
        tradeBlock: contract.tradeBlock,
        endSeason: contract.endSeason,
        scores: [],
        seniorsGames: 0,
        reservesGames: 0,
      };

      existing.scores.push(score.aflFantasyScore!);
      if (score.match.matchType === "SENIORS") {
        existing.seniorsGames++;
      } else {
        existing.reservesGames++;
      }

      playerMap.set(key, existing);
    }

    return Array.from(playerMap.values()).map(p => {
      const total = p.scores.reduce((a, b) => a + b, 0);
      const last5 = p.scores.slice(-5);
      const last5Total = last5.reduce((a, b) => a + b, 0);

      return {
        contractId: p.contractId,
        aflPlayerId: p.aflPlayerId,
        firstName: p.firstName,
        lastName: p.lastName,
        positions: p.positions,
        photoUrl: p.photoUrl,
        aflTeam: p.aflTeam,
        clubId: p.clubId,
        clubName: p.clubName,
        clubAbbr: p.clubAbbr,
        primaryColor: p.primaryColor,
        secondaryColor: p.secondaryColor,
        salary: p.salary,
        tradeBlock: p.tradeBlock,
        endSeason: p.endSeason,
        avgScore: p.scores.length > 0 ? Math.round((total / p.scores.length) * 10) / 10 : null,
        last5Avg: last5.length > 0 ? Math.round((last5Total / last5.length) * 10) / 10 : null,
        gamesPlayed: p.scores.length,
        seniorsGames: p.seniorsGames,
        reservesGames: p.reservesGames,
      };
    });
  },
  ["all-player-stats"],
  { revalidate: 60 }
);

export async function getAllPlayerStats() {
  return getCachedPlayerStats();
}
