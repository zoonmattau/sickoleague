/**
 * Generate 2026 Season Fixture
 *
 * 12 teams, 22 rounds of regular season (double round-robin)
 * Each team plays every other team once at home, once away
 *
 * AFL 2026: Opening Round + Rounds 1-24
 * - Opening Round + R1-R21 = Regular Season (22 weeks)
 * - R22-R24 = Finals (3 weeks)
 * - AFL Byes: Rounds 12-16
 *
 * Run with: npx tsx prisma/generate-fixture.ts
 */

import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

// Standard round-robin algorithm using circle method
function generateDoubleRoundRobin(teams: string[]): { home: string; away: string }[][] {
  const n = teams.length;
  if (n % 2 !== 0) {
    throw new Error("Need even number of teams");
  }

  const rounds: { home: string; away: string }[][] = [];

  // Create a working array - fix first team, rotate others
  const fixed = teams[0];
  const rotating = teams.slice(1);

  // First half - 11 rounds
  for (let round = 0; round < n - 1; round++) {
    const matches: { home: string; away: string }[] = [];

    // First team plays against the team at position 0 in rotating array
    // Alternate home/away for the fixed team
    if (round % 2 === 0) {
      matches.push({ home: fixed, away: rotating[0] });
    } else {
      matches.push({ home: rotating[0], away: fixed });
    }

    // Pair remaining teams: 1 with last, 2 with second-to-last, etc.
    for (let i = 1; i < n / 2; i++) {
      const team1 = rotating[i];
      const team2 = rotating[n - 1 - i];

      // Alternate home/away based on position
      if (i % 2 === 0) {
        matches.push({ home: team1, away: team2 });
      } else {
        matches.push({ home: team2, away: team1 });
      }
    }

    rounds.push(matches);

    // Rotate: move last element to position 0
    rotating.unshift(rotating.pop()!);
  }

  // Second half - swap home/away from first half (rounds 12-22)
  for (let i = 0; i < n - 1; i++) {
    const swappedMatches = rounds[i].map(m => ({
      home: m.away,
      away: m.home
    }));
    rounds.push(swappedMatches);
  }

  return rounds;
}

async function main() {
  console.log("Generating 2026 Season Fixture...\n");

  // Get all clubs
  const clubs = await prisma.club.findMany({
    orderBy: { name: "asc" },
  });

  if (clubs.length !== 12) {
    console.error(`Expected 12 clubs, found ${clubs.length}`);
    console.log("Clubs:", clubs.map(c => c.name).join(", "));
    if (clubs.length < 12) {
      console.error("Please seed clubs first");
      process.exit(1);
    }
  }

  console.log("Clubs:");
  clubs.forEach((c, i) => console.log(`  ${i + 1}. ${c.name} (${c.abbreviation})`));
  console.log();

  // Get or create 2026 season
  let season = await prisma.season.findUnique({
    where: { year: 2026 },
  });

  if (!season) {
    season = await prisma.season.create({
      data: {
        year: 2026,
        status: "UPCOMING",
        salaryCap: 750,
        byeRounds: [12, 13, 14, 15, 16], // AFL bye rounds
        finalsStartRound: 22,
      },
    });
    console.log("Created 2026 season");
  } else {
    // Update bye rounds and finals info
    season = await prisma.season.update({
      where: { id: season.id },
      data: {
        byeRounds: [12, 13, 14, 15, 16],
        finalsStartRound: 22,
      },
    });
    console.log("Updated 2026 season");
  }

  // Delete existing rounds and matches for this season
  const existingRounds = await prisma.round.findMany({
    where: { seasonId: season.id },
    include: { matches: true },
  });

  if (existingRounds.length > 0) {
    console.log(`Deleting ${existingRounds.length} existing rounds...`);

    // Delete related records first (order matters due to FK constraints)
    await prisma.rosterHistory.deleteMany({
      where: { round: { seasonId: season.id } },
    });

    await prisma.draftEligibility.deleteMany({
      where: { round: { seasonId: season.id } },
    });

    await prisma.boardMeeting.deleteMany({
      where: { round: { seasonId: season.id } },
    });

    await prisma.rosterPlayer.deleteMany({
      where: { round: { seasonId: season.id } },
    });

    // Delete match-related records
    await prisma.matchPlayerScore.deleteMany({
      where: { match: { round: { seasonId: season.id } } },
    });

    await prisma.homeGameResult.deleteMany({
      where: { match: { round: { seasonId: season.id } } },
    });

    await prisma.match.deleteMany({
      where: { round: { seasonId: season.id } },
    });

    // Delete rounds
    await prisma.round.deleteMany({
      where: { seasonId: season.id },
    });
  }

  // Create rounds
  // Round 0 = Opening Round, Rounds 1-21 = Regular Season, Rounds 22-24 = Finals
  const roundsToCreate = [];

  // Opening Round (round number 0)
  roundsToCreate.push({
    seasonId: season.id,
    roundNumber: 0,
    roundType: "REGULAR" as const,
    status: "UPCOMING" as const,
  });

  // Regular season rounds 1-21
  for (let i = 1; i <= 21; i++) {
    roundsToCreate.push({
      seasonId: season.id,
      roundNumber: i,
      roundType: "REGULAR" as const,
      status: "UPCOMING" as const,
    });
  }

  // Finals rounds 22-24
  roundsToCreate.push({
    seasonId: season.id,
    roundNumber: 22,
    roundType: "FINALS_WK1" as const,
    status: "UPCOMING" as const,
  });
  roundsToCreate.push({
    seasonId: season.id,
    roundNumber: 23,
    roundType: "FINALS_WK2" as const,
    status: "UPCOMING" as const,
  });
  roundsToCreate.push({
    seasonId: season.id,
    roundNumber: 24,
    roundType: "FINALS_WK3" as const,
    status: "UPCOMING" as const,
  });

  await prisma.round.createMany({
    data: roundsToCreate,
  });
  console.log(`Created ${roundsToCreate.length} rounds (Opening + R1-R21 regular, R22-R24 finals)`);

  // Get created rounds
  const rounds = await prisma.round.findMany({
    where: { seasonId: season.id },
    orderBy: { roundNumber: "asc" },
  });

  // Generate fixture
  const clubIds = clubs.map(c => c.id);
  const fixture = generateDoubleRoundRobin(clubIds);

  console.log(`\nGenerated ${fixture.length} rounds of fixtures`);

  // Create matches for regular season (rounds 0-21 = 22 rounds)
  const regularRounds = rounds.filter(r => r.roundType === "REGULAR");

  let totalMatches = 0;
  for (let i = 0; i < regularRounds.length; i++) {
    const round = regularRounds[i];
    const roundFixture = fixture[i];

    const matchesToCreate = [];

    for (const match of roundFixture) {
      // Create both SENIORS and RESERVES matches
      matchesToCreate.push({
        roundId: round.id,
        homeClubId: match.home,
        awayClubId: match.away,
        matchType: "SENIORS" as const,
        status: "SCHEDULED" as const,
      });
      matchesToCreate.push({
        roundId: round.id,
        homeClubId: match.home,
        awayClubId: match.away,
        matchType: "RESERVES" as const,
        status: "SCHEDULED" as const,
      });
    }

    await prisma.match.createMany({
      data: matchesToCreate,
    });

    totalMatches += matchesToCreate.length;
  }

  console.log(`Created ${totalMatches} matches (${totalMatches / 2} Seniors + ${totalMatches / 2} Reserves)`);

  // Print fixture summary
  console.log("\n=== FIXTURE SUMMARY ===\n");

  const clubMap = new Map(clubs.map(c => [c.id, c.abbreviation]));

  for (let i = 0; i < regularRounds.length; i++) {
    const round = regularRounds[i];
    const roundFixture = fixture[i];

    const roundName = round.roundNumber === 0 ? "Opening Round" : `Round ${round.roundNumber}`;
    console.log(`${roundName}:`);

    for (const match of roundFixture) {
      const homeAbbr = clubMap.get(match.home);
      const awayAbbr = clubMap.get(match.away);
      console.log(`  ${homeAbbr} vs ${awayAbbr}`);
    }
    console.log();
  }

  // Verify each team plays exactly 22 games (11 home, 11 away)
  console.log("=== VERIFICATION ===\n");

  for (const club of clubs) {
    let homeGames = 0;
    let awayGames = 0;
    const opponents = new Set<string>();
    const homeOpponents = new Set<string>();
    const awayOpponents = new Set<string>();

    for (const roundFixture of fixture) {
      for (const match of roundFixture) {
        if (match.home === club.id) {
          homeGames++;
          opponents.add(match.away);
          homeOpponents.add(match.away);
        }
        if (match.away === club.id) {
          awayGames++;
          opponents.add(match.home);
          awayOpponents.add(match.home);
        }
      }
    }

    const status = homeGames === 11 && awayGames === 11 && opponents.size === 11
      ? "✓"
      : "✗";

    console.log(`${status} ${club.abbreviation}: ${homeGames} home, ${awayGames} away, ${opponents.size} unique opponents`);

    if (homeOpponents.size !== 11 || awayOpponents.size !== 11) {
      console.log(`  WARNING: ${homeOpponents.size} home opponents, ${awayOpponents.size} away opponents`);
    }
  }

  console.log("\nDone!");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
