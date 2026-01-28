"use server";

import prisma from "@/lib/prisma";
import { createClient } from "@/lib/supabase/server";
import { unstable_cache } from "next/cache";

const getCachedClubs = unstable_cache(
  async () => {
    return prisma.club.findMany({
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
