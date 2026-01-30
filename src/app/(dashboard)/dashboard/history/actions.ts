"use server";

import prisma from "@/lib/prisma";
import { unstable_cache } from "next/cache";

type Champion = {
  year: number;
  matchType: string;
  club: {
    id: string;
    name: string;
    abbreviation: string;
    primaryColor: string | null;
    secondaryColor: string | null;
  };
  coach: string | null;
  grandFinalScore: string | null;
};

type ScoringRecord = {
  score: number;
  club: string;
  opponent?: string;
  player?: string;
  round: number;
  year: number;
};

type WinRecord = {
  margin: number;
  winner: string;
  loser: string;
  round: number;
  year: number;
};

type ClubStats = {
  id: string;
  name: string;
  abbreviation: string;
  primaryColor: string | null;
  secondaryColor: string | null;
  titles: number;
  wins: number;
  losses: number;
  winRate: number;
};

type NotableEvent = {
  date: string;
  title: string;
  description: string | null;
};

type LeagueHistory = {
  champions: Champion[];
  records: {
    highestScore: ScoringRecord | null;
    highestPlayerScore: ScoringRecord | null;
    biggestWin: WinRecord | null;
  };
  clubStats: ClubStats[];
  events: NotableEvent[];
};

const getCachedHistory = unstable_cache(
  async (): Promise<LeagueHistory> => {
    // Get all completed seasons
    const seasons = await prisma.season.findMany({
      where: { status: "COMPLETED" },
      orderBy: { year: "desc" },
    });

    // Get champions from finals matches (simplified - would need a Champion model ideally)
    const champions: Champion[] = [];

    for (const season of seasons) {
      // Find grand final matches (finals are in rounds 20+)
      const grandFinals = await prisma.match.findMany({
        where: {
          status: "COMPLETED",
          round: {
            seasonId: season.id,
            roundNumber: { gte: 20 },
          },
        },
        include: {
          homeClub: {
            include: { coach: true },
          },
          awayClub: {
            include: { coach: true },
          },
          round: true,
        },
        orderBy: { round: { roundNumber: "desc" } },
        take: 2, // Seniors and reserves grand finals
      });

      for (const gf of grandFinals) {
        const homeScore = Number(gf.homeScore ?? 0);
        const awayScore = Number(gf.awayScore ?? 0);
        const winner = homeScore > awayScore ? gf.homeClub : gf.awayClub;
        const loserScore = homeScore > awayScore ? awayScore : homeScore;
        const winnerScore = homeScore > awayScore ? homeScore : awayScore;

        champions.push({
          year: season.year,
          matchType: gf.matchType,
          club: {
            id: winner.id,
            name: winner.name,
            abbreviation: winner.abbreviation,
            primaryColor: winner.primaryColor,
            secondaryColor: winner.secondaryColor,
          },
          coach: winner.coach?.displayName ?? null,
          grandFinalScore: `${winnerScore.toFixed(0)} - ${loserScore.toFixed(0)}`,
        });
      }
    }

    // Get scoring records
    const highestTeamScore = await prisma.match.findFirst({
      where: { status: "COMPLETED" },
      orderBy: { homeScore: "desc" },
      include: {
        homeClub: true,
        awayClub: true,
        round: { include: { season: true } },
      },
    });

    const highestAwayScore = await prisma.match.findFirst({
      where: { status: "COMPLETED" },
      orderBy: { awayScore: "desc" },
      include: {
        homeClub: true,
        awayClub: true,
        round: { include: { season: true } },
      },
    });

    let highestScore: ScoringRecord | null = null;
    if (highestTeamScore && highestAwayScore) {
      const homeMax = Number(highestTeamScore.homeScore ?? 0);
      const awayMax = Number(highestAwayScore.awayScore ?? 0);

      if (homeMax >= awayMax && highestTeamScore) {
        highestScore = {
          score: homeMax,
          club: highestTeamScore.homeClub.name,
          opponent: highestTeamScore.awayClub.name,
          round: highestTeamScore.round.roundNumber,
          year: highestTeamScore.round.season.year,
        };
      } else if (highestAwayScore) {
        highestScore = {
          score: awayMax,
          club: highestAwayScore.awayClub.name,
          opponent: highestAwayScore.homeClub.name,
          round: highestAwayScore.round.roundNumber,
          year: highestAwayScore.round.season.year,
        };
      }
    }

    // Get highest player score
    const highestPlayerScoreRecord = await prisma.matchPlayerScore.findFirst({
      where: { aflFantasyScore: { not: null } },
      orderBy: { aflFantasyScore: "desc" },
      include: {
        rosterPlayer: {
          include: {
            contract: {
              include: {
                aflPlayer: true,
                club: true,
              },
            },
          },
        },
        match: {
          include: {
            round: { include: { season: true } },
          },
        },
      },
    });

    let highestPlayerScore: ScoringRecord | null = null;
    if (highestPlayerScoreRecord) {
      highestPlayerScore = {
        score: Number(highestPlayerScoreRecord.aflFantasyScore ?? 0),
        club: highestPlayerScoreRecord.rosterPlayer.contract.club.name,
        player: `${highestPlayerScoreRecord.rosterPlayer.contract.aflPlayer.firstName} ${highestPlayerScoreRecord.rosterPlayer.contract.aflPlayer.lastName}`,
        round: highestPlayerScoreRecord.match.round.roundNumber,
        year: highestPlayerScoreRecord.match.round.season.year,
      };
    }

    // Get biggest win margin
    const matches = await prisma.match.findMany({
      where: { status: "COMPLETED" },
      include: {
        homeClub: true,
        awayClub: true,
        round: { include: { season: true } },
      },
    });

    let biggestWin: WinRecord | null = null;
    let maxMargin = 0;
    for (const match of matches) {
      const homeScore = Number(match.homeScore ?? 0);
      const awayScore = Number(match.awayScore ?? 0);
      const margin = Math.abs(homeScore - awayScore);

      if (margin > maxMargin) {
        maxMargin = margin;
        const winner = homeScore > awayScore ? match.homeClub : match.awayClub;
        const loser = homeScore > awayScore ? match.awayClub : match.homeClub;
        biggestWin = {
          margin,
          winner: winner.name,
          loser: loser.name,
          round: match.round.roundNumber,
          year: match.round.season.year,
        };
      }
    }

    // Get club statistics
    const clubs = await prisma.club.findMany({
      include: {
        standings: true,
      },
    });

    const clubStats: ClubStats[] = clubs.map(club => {
      const totalWins = club.standings.reduce((sum, s) => sum + s.wins, 0);
      const totalLosses = club.standings.reduce((sum, s) => sum + s.losses, 0);
      const totalGames = totalWins + totalLosses;
      const titles = champions.filter(c => c.club.id === club.id).length;

      return {
        id: club.id,
        name: club.name,
        abbreviation: club.abbreviation,
        primaryColor: club.primaryColor,
        secondaryColor: club.secondaryColor,
        titles,
        wins: totalWins,
        losses: totalLosses,
        winRate: totalGames > 0 ? Math.round((totalWins / totalGames) * 100) : 0,
      };
    }).sort((a, b) => {
      // Sort by titles first, then by win rate
      if (b.titles !== a.titles) return b.titles - a.titles;
      return b.winRate - a.winRate;
    });

    // Notable events (would need a dedicated table, for now return empty)
    const events: NotableEvent[] = [];

    return {
      champions,
      records: {
        highestScore,
        highestPlayerScore,
        biggestWin,
      },
      clubStats,
      events,
    };
  },
  ["league-history"],
  { revalidate: 300 }
);

export async function getLeagueHistory(): Promise<LeagueHistory> {
  return getCachedHistory();
}

// Types for backstories
type CityBackstory = {
  id: string;
  name: string;
  state: string;
  marketSize: string;
  population: number;
  founded: number | null;
  description: string | null;
  history: string | null;
};

type TownBackstory = {
  id: string;
  name: string;
  state: string;
  population: number;
  founded: number | null;
  description: string | null;
  history: string | null;
  nearCityName: string | null;
};

type ClubBackstory = {
  id: string;
  name: string;
  abbreviation: string;
  reservesName: string | null;
  primaryColor: string | null;
  secondaryColor: string | null;
  founded: number | null;
  history: string | null;
  cityName: string | null;
  townName: string | null;
  venueName: string | null;
  reservesVenueName: string | null;
};

export type BackstoryData = {
  cities: CityBackstory[];
  towns: TownBackstory[];
  clubs: ClubBackstory[];
};

const getCachedBackstories = unstable_cache(
  async (): Promise<BackstoryData> => {
    let cities: CityBackstory[] = [];
    let towns: TownBackstory[] = [];
    let clubs: ClubBackstory[] = [];

    try {
      // Fetch cities with backstories
      const cityRows = await prisma.$queryRaw<Array<{
        id: string;
        name: string;
        state: string;
        market_size: string;
        population: number;
        founded: number | null;
        description: string | null;
        history: string | null;
      }>>`
        SELECT id, name, state, market_size, population, founded, description, history
        FROM cities
        ORDER BY population DESC
      `;

      cities = cityRows.map(row => ({
        id: row.id,
        name: row.name,
        state: row.state,
        marketSize: row.market_size,
        population: row.population,
        founded: row.founded,
        description: row.description,
        history: row.history,
      }));

      // Fetch towns with backstories
      const townRows = await prisma.$queryRaw<Array<{
        id: string;
        name: string;
        state: string;
        population: number;
        founded: number | null;
        description: string | null;
        history: string | null;
        near_city_name: string | null;
      }>>`
        SELECT t.id, t.name, t.state, t.population, t.founded, t.description, t.history,
               c.name as near_city_name
        FROM towns t
        LEFT JOIN cities c ON t.near_city_id = c.id
        ORDER BY t.population DESC
      `;

      towns = townRows.map(row => ({
        id: row.id,
        name: row.name,
        state: row.state,
        population: row.population,
        founded: row.founded,
        description: row.description,
        history: row.history,
        nearCityName: row.near_city_name,
      }));

      // Fetch clubs with backstories
      const clubRows = await prisma.$queryRaw<Array<{
        id: string;
        name: string;
        abbreviation: string;
        reserves_name: string | null;
        primary_color: string | null;
        secondary_color: string | null;
        founded: number | null;
        history: string | null;
        city_name: string | null;
        town_name: string | null;
        venue_name: string | null;
        reserves_venue_name: string | null;
      }>>`
        SELECT cl.id, cl.name, cl.abbreviation, cl.reserves_name,
               cl.primary_color, cl.secondary_color, cl.founded, cl.history,
               c.name as city_name, t.name as town_name,
               v.name as venue_name, rv.name as reserves_venue_name
        FROM clubs cl
        LEFT JOIN cities c ON cl.city_id = c.id
        LEFT JOIN towns t ON cl.reserves_town_id = t.id
        LEFT JOIN venues v ON cl.home_venue_id = v.id
        LEFT JOIN venues rv ON cl.reserves_venue_id = rv.id
        ORDER BY cl.name
      `;

      clubs = clubRows.map(row => ({
        id: row.id,
        name: row.name,
        abbreviation: row.abbreviation,
        reservesName: row.reserves_name,
        primaryColor: row.primary_color,
        secondaryColor: row.secondary_color,
        founded: row.founded,
        history: row.history,
        cityName: row.city_name,
        townName: row.town_name,
        venueName: row.venue_name,
        reservesVenueName: row.reserves_venue_name,
      }));
    } catch {
      // Tables don't exist yet - return empty data
    }

    return { cities, towns, clubs };
  },
  ["backstories"],
  { revalidate: 600 }
);

export async function getBackstories(): Promise<BackstoryData> {
  return getCachedBackstories();
}
