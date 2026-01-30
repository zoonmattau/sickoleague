"use server";

import prisma from "@/lib/prisma";
import { createClient } from "@/lib/supabase/server";
import { unstable_cache } from "next/cache";

// Type definitions for city and venue data
type CityData = {
  id: string;
  name: string;
  state: string;
  marketSize: "MAJOR" | "LARGE" | "MEDIUM" | "SMALL";
  population: number;
  description: string | null;
};

type VenueData = {
  id: string;
  name: string;
  capacity: number;
  venueClass: "ELITE" | "MAJOR" | "STANDARD" | "BOUTIQUE";
  atmosphereBonus: number;
  description: string | null;
};

const getCachedClubs = unstable_cache(
  async () => {
    const clubs = await prisma.club.findMany({
      include: {
        coach: {
          select: {
            id: true,
            displayName: true,
            discordId: true,
          },
        },
        contracts: {
          where: { status: "ACTIVE" },
          include: {
            aflPlayer: {
              include: {
                aflTeam: true,
              },
            },
          },
        },
        rivalsA: {
          include: {
            clubB: {
              select: {
                id: true,
                name: true,
                abbreviation: true,
                primaryColor: true,
                secondaryColor: true,
              },
            },
            season: {
              select: {
                year: true,
              },
            },
          },
        },
        rivalsB: {
          include: {
            clubA: {
              select: {
                id: true,
                name: true,
                abbreviation: true,
                primaryColor: true,
                secondaryColor: true,
              },
            },
            season: {
              select: {
                year: true,
              },
            },
          },
        },
      },
      orderBy: { name: "asc" },
    });

    // Try to fetch city and venue data separately (handles migration not yet run)
    let cityVenueMap: Map<string, { city: CityData | null; venue: VenueData | null }> = new Map();
    try {
      const cityVenueData = await prisma.$queryRaw<Array<{
        club_id: string;
        city_id: string | null;
        city_name: string | null;
        city_state: string | null;
        city_market_size: string | null;
        city_population: number | null;
        city_description: string | null;
        venue_id: string | null;
        venue_name: string | null;
        venue_capacity: number | null;
        venue_class: string | null;
        venue_atmosphere_bonus: number | null;
        venue_description: string | null;
      }>>`
        SELECT
          cl.id as club_id,
          c.id as city_id, c.name as city_name, c.state as city_state,
          c.market_size as city_market_size, c.population as city_population, c.description as city_description,
          v.id as venue_id, v.name as venue_name, v.capacity as venue_capacity,
          v.venue_class as venue_class, v.atmosphere_bonus as venue_atmosphere_bonus, v.description as venue_description
        FROM clubs cl
        LEFT JOIN cities c ON cl.city_id = c.id
        LEFT JOIN venues v ON cl.home_venue_id = v.id
      `;

      for (const row of cityVenueData) {
        cityVenueMap.set(row.club_id, {
          city: row.city_id ? {
            id: row.city_id,
            name: row.city_name!,
            state: row.city_state!,
            marketSize: row.city_market_size as CityData["marketSize"],
            population: row.city_population!,
            description: row.city_description,
          } : null,
          venue: row.venue_id ? {
            id: row.venue_id,
            name: row.venue_name!,
            capacity: row.venue_capacity!,
            venueClass: row.venue_class as VenueData["venueClass"],
            atmosphereBonus: Number(row.venue_atmosphere_bonus ?? 0),
            description: row.venue_description,
          } : null,
        });
      }
    } catch {
      // City/Venue tables don't exist yet - that's ok
    }

    return clubs.map(club => ({
      ...club,
      city: cityVenueMap.get(club.id)?.city ?? null,
      homeVenue: cityVenueMap.get(club.id)?.venue ?? null,
    }));
  },
  ["all-clubs-with-contracts"],
  { revalidate: 60 }
);

export async function getAllClubsWithContracts() {
  const currentYear = new Date().getFullYear();
  const clubs = await getCachedClubs();

  return clubs.map((club) => {
    const salaryByYear: Record<number, number> = {};

    for (const contract of club.contracts) {
      const breakdown = contract.yearBreakdown as { season: number; value: number }[];
      for (const yr of breakdown) {
        if (yr.season >= currentYear) {
          salaryByYear[yr.season] = (salaryByYear[yr.season] || 0) + yr.value;
        }
      }
    }

    const rivals = [
      ...club.rivalsA.map((r) => ({
        club: r.clubB,
        reason: r.reason,
        seasonYear: r.season.year,
      })),
      ...club.rivalsB.map((r) => ({
        club: r.clubA,
        reason: r.reason,
        seasonYear: r.season.year,
      })),
    ];

    return {
      id: club.id,
      name: club.name,
      abbreviation: club.abbreviation,
      reservesName: club.reservesName,
      primaryColor: club.primaryColor,
      secondaryColor: club.secondaryColor,
      coach: club.coach,
      city: club.city ? {
        id: club.city.id,
        name: club.city.name,
        state: club.city.state,
        marketSize: club.city.marketSize,
        population: club.city.population,
        description: club.city.description,
      } : null,
      homeVenue: club.homeVenue ? {
        id: club.homeVenue.id,
        name: club.homeVenue.name,
        capacity: club.homeVenue.capacity,
        venueClass: club.homeVenue.venueClass,
        atmosphereBonus: Number(club.homeVenue.atmosphereBonus),
        description: club.homeVenue.description,
      } : null,
      contracts: club.contracts.map((c) => ({
        id: c.id,
        startSeason: c.startSeason,
        endSeason: c.endSeason,
        totalValue: Number(c.totalValue),
        yearBreakdown: c.yearBreakdown as { season: number; value: number }[],
        contractType: c.contractType,
        tradeBlock: c.tradeBlock,
        aflPlayer: {
          id: c.aflPlayer.id,
          firstName: c.aflPlayer.firstName,
          lastName: c.aflPlayer.lastName,
          positions: c.aflPlayer.positions,
          photoUrl: c.aflPlayer.photoUrl,
          aflTeam: c.aflPlayer.aflTeam ? {
            name: c.aflPlayer.aflTeam.name,
            abbreviation: c.aflPlayer.aflTeam.abbreviation,
          } : null,
        },
      })),
      salaryByYear,
      rivals,
    };
  });
}

const getCachedSeason = unstable_cache(
  async () => {
    return prisma.season.findFirst({
      where: { status: { in: ["ACTIVE", "UPCOMING"] } },
      orderBy: { year: "desc" },
    });
  },
  ["current-season"],
  { revalidate: 300 }
);

export async function getCurrentSeason() {
  const season = await getCachedSeason();
  return season ? {
    year: season.year,
    salaryCap: Number(season.salaryCap),
  } : { year: new Date().getFullYear(), salaryCap: 750 };
}

export async function getMyClubId() {
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
    include: { club: true },
  });

  return coach?.club?.id ?? null;
}
