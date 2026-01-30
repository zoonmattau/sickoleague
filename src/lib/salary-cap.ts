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
