"use server";

import prisma from "@/lib/prisma";
import { unstable_cache } from "next/cache";

const getCachedTeamStats = unstable_cache(
  async () => {
    const standings = await prisma.standing.findMany({
      include: {
        club: {
          select: {
            id: true,
            name: true,
            abbreviation: true,
            reservesName: true,
            primaryColor: true,
            secondaryColor: true,
          },
        },
        season: {
          select: { year: true },
        },
      },
      orderBy: [
        { season: { year: "desc" } },
        { competition: "asc" },
        { wins: "desc" },
      ],
    });

    // Get HFA for each club
    const hfaResults = await prisma.homeGameResult.findMany({
      select: {
        clubId: true,
        matchType: true,
        margin: true,
      },
    });

    // Calculate HFA per club per match type
    const hfaMap = new Map<string, number>();
    const calcHfaValue = (margin: number) => margin < 0 ? margin / 2 : margin;

    for (const club of standings.map(s => s.clubId)) {
      for (const matchType of ["SENIORS", "RESERVES"]) {
        const results = hfaResults.filter(r => r.clubId === club && r.matchType === matchType);
        if (results.length > 0) {
          const last10 = results.slice(-10);
          const hfa = last10.reduce((sum, r) => sum + calcHfaValue(r.margin), 0) / last10.length;
          hfaMap.set(`${club}-${matchType}`, Math.round(hfa * 10) / 10);
        }
      }
    }

    return standings.map(s => ({
      id: s.id,
      clubId: s.club.id,
      clubName: s.club.name,
      clubAbbr: s.club.abbreviation,
      reservesName: s.club.reservesName,
      primaryColor: s.club.primaryColor,
      secondaryColor: s.club.secondaryColor,
      competition: s.competition,
      seasonYear: s.season.year,
      played: s.played,
      wins: s.wins,
      losses: s.losses,
      draws: s.draws,
      points: s.wins * 4 + s.draws * 2,
      pointsFor: Number(s.pointsFor),
      pointsAgainst: Number(s.pointsAgainst),
      percentage: Number(s.percentage),
      hfa: hfaMap.get(`${s.club.id}-${s.competition}`) ?? null,
    }));
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
