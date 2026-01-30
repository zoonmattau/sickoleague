import prisma from "@/lib/prisma";
import { SALARY_CAP } from "@/types";

interface YearBreakdown {
  season: number;
  value: number;
}

interface SalaryCapResult {
  currentSalary: Record<number, number>; // salary by year
  salaryCap: number;
  projectedSalary: Record<number, number>; // salary + new contract by year
  overCapYears: number[]; // years where projected > cap
  isValid: boolean;
}

/**
 * Get the current salary usage for a club for each year
 */
export async function getClubSalaryByYear(clubId: string): Promise<Record<number, number>> {
  // Get all active player contracts
  const playerContracts = await prisma.contract.findMany({
    where: {
      clubId,
      status: "ACTIVE",
    },
    select: {
      yearBreakdown: true,
    },
  });

  // Get all active staff contracts
  const staffContracts = await prisma.staffContract.findMany({
    where: {
      clubId,
      status: "ACTIVE",
    },
    select: {
      yearBreakdown: true,
    },
  });

  const salaryByYear: Record<number, number> = {};

  // Sum player contracts
  for (const contract of playerContracts) {
    const breakdown = contract.yearBreakdown as unknown as YearBreakdown[];
    for (const year of breakdown) {
      salaryByYear[year.season] = (salaryByYear[year.season] ?? 0) + year.value;
    }
  }

  // Sum staff contracts
  for (const contract of staffContracts) {
    const breakdown = contract.yearBreakdown as unknown as YearBreakdown[];
    for (const year of breakdown) {
      salaryByYear[year.season] = (salaryByYear[year.season] ?? 0) + year.value;
    }
  }

  return salaryByYear;
}

/**
 * Get the salary cap for the current/active season
 */
export async function getSalaryCap(): Promise<number> {
  const season = await prisma.season.findFirst({
    where: {
      OR: [{ status: "ACTIVE" }, { status: "UPCOMING" }],
    },
    orderBy: { year: "asc" },
  });

  return season?.salaryCap ? Number(season.salaryCap) : SALARY_CAP;
}

/**
 * Validate if a new contract would exceed the salary cap for any year
 */
export async function validateSalaryCap(
  clubId: string,
  newContractBreakdown: YearBreakdown[]
): Promise<SalaryCapResult> {
  const currentSalary = await getClubSalaryByYear(clubId);
  const salaryCap = await getSalaryCap();

  // Calculate projected salary with new contract
  const projectedSalary: Record<number, number> = { ...currentSalary };
  for (const year of newContractBreakdown) {
    projectedSalary[year.season] = (projectedSalary[year.season] ?? 0) + year.value;
  }

  // Find years that would be over cap
  const overCapYears: number[] = [];
  for (const year of newContractBreakdown) {
    if (projectedSalary[year.season] > salaryCap) {
      overCapYears.push(year.season);
    }
  }

  return {
    currentSalary,
    salaryCap,
    projectedSalary,
    overCapYears,
    isValid: overCapYears.length === 0,
  };
}

/**
 * Format a salary cap error message
 */
export function formatSalaryCapError(result: SalaryCapResult): string {
  if (result.isValid) return "";

  const yearDetails = result.overCapYears
    .map((year) => {
      const projected = result.projectedSalary[year];
      const over = projected - result.salaryCap;
      return `${year}: $${projected.toFixed(0)}k ($${over.toFixed(0)}k over)`;
    })
    .join(", ");

  return `This contract would exceed the salary cap ($${result.salaryCap}k) in: ${yearDetails}`;
}

/**
 * Get salary cap room for each year
 */
export async function getSalaryCapRoom(clubId: string): Promise<Record<number, number>> {
  const currentSalary = await getClubSalaryByYear(clubId);
  const salaryCap = await getSalaryCap();
  const currentYear = new Date().getFullYear();

  const room: Record<number, number> = {};

  // Calculate for current year + next 4 years
  for (let i = 0; i < 5; i++) {
    const year = currentYear + i;
    const used = currentSalary[year] ?? 0;
    room[year] = salaryCap - used;
  }

  return room;
}

// ============================================================================
// DEDICATED SALARY TRACKING
// ============================================================================

interface ClubSalaryBreakdown {
  playerSalary: number;
  staffSalary: number;
  releasedDebt: number;
}

/**
 * Get detailed salary breakdown for a club for each year
 */
async function getClubSalaryBreakdown(clubId: string): Promise<Record<number, ClubSalaryBreakdown>> {
  // Get all active player contracts
  const playerContracts = await prisma.contract.findMany({
    where: {
      clubId,
      status: "ACTIVE",
    },
    select: {
      yearBreakdown: true,
      releasedDebt: true,
      releasedDebtYears: true,
      endSeason: true,
    },
  });

  // Get all active staff contracts
  const staffContracts = await prisma.staffContract.findMany({
    where: {
      clubId,
      status: "ACTIVE",
    },
    select: {
      yearBreakdown: true,
    },
  });

  // Get released contracts with remaining debt
  const releasedContracts = await prisma.contract.findMany({
    where: {
      clubId,
      status: "RELEASED",
      releasedDebt: { gt: 0 },
    },
    select: {
      releasedDebt: true,
      releasedDebtYears: true,
      endSeason: true,
    },
  });

  const breakdown: Record<number, ClubSalaryBreakdown> = {};
  const currentYear = new Date().getFullYear();

  // Initialize years
  for (let i = 0; i < 5; i++) {
    const year = currentYear + i;
    breakdown[year] = { playerSalary: 0, staffSalary: 0, releasedDebt: 0 };
  }

  // Sum player contracts
  for (const contract of playerContracts) {
    const yearBreakdown = contract.yearBreakdown as unknown as YearBreakdown[];
    for (const year of yearBreakdown) {
      if (breakdown[year.season]) {
        breakdown[year.season].playerSalary += year.value;
      }
    }
  }

  // Sum staff contracts
  for (const contract of staffContracts) {
    const yearBreakdown = contract.yearBreakdown as unknown as YearBreakdown[];
    for (const year of yearBreakdown) {
      if (breakdown[year.season]) {
        breakdown[year.season].staffSalary += year.value;
      }
    }
  }

  // Add released debt (spread over remaining years)
  for (const contract of releasedContracts) {
    if (contract.releasedDebt && contract.releasedDebtYears) {
      const debtPerYear = Number(contract.releasedDebt) / contract.releasedDebtYears;
      for (let i = 0; i < contract.releasedDebtYears; i++) {
        const year = currentYear + i;
        if (breakdown[year]) {
          breakdown[year].releasedDebt += debtPerYear;
        }
      }
    }
  }

  return breakdown;
}

/**
 * Update or create salary records for a club for all relevant years
 */
export async function updateClubSalaryRecords(clubId: string): Promise<void> {
  const breakdown = await getClubSalaryBreakdown(clubId);
  const salaryCap = await getSalaryCap();

  for (const [yearStr, data] of Object.entries(breakdown)) {
    const season = parseInt(yearStr);
    const totalSalary = data.playerSalary + data.staffSalary + data.releasedDebt;
    const capRoom = salaryCap - totalSalary;
    const isOverCap = totalSalary > salaryCap;

    await prisma.clubSalary.upsert({
      where: {
        clubId_season: {
          clubId,
          season,
        },
      },
      update: {
        playerSalary: data.playerSalary,
        staffSalary: data.staffSalary,
        releasedDebt: data.releasedDebt,
        totalSalary,
        salaryCap,
        capRoom,
        isOverCap,
      },
      create: {
        clubId,
        season,
        playerSalary: data.playerSalary,
        staffSalary: data.staffSalary,
        releasedDebt: data.releasedDebt,
        totalSalary,
        salaryCap,
        capRoom,
        isOverCap,
      },
    });
  }
}

/**
 * Get the stored salary records for a club
 */
export async function getClubSalaryRecords(clubId: string) {
  const currentYear = new Date().getFullYear();

  return prisma.clubSalary.findMany({
    where: {
      clubId,
      season: {
        gte: currentYear,
        lte: currentYear + 4,
      },
    },
    orderBy: { season: "asc" },
  });
}

/**
 * Sync salary records for all clubs (admin function)
 */
export async function syncAllClubSalaries(): Promise<{ updated: number }> {
  const clubs = await prisma.club.findMany({
    select: { id: true },
  });

  for (const club of clubs) {
    await updateClubSalaryRecords(club.id);
  }

  return { updated: clubs.length };
}
