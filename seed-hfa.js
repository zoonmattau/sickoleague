const { PrismaClient } = require('@prisma/client');
const p = new PrismaClient();

async function run() {
  // Get all completed matches
  const matches = await p.match.findMany({
    where: { status: 'COMPLETED' },
    include: {
      round: { include: { season: true } },
    },
    orderBy: [
      { round: { season: { year: 'asc' } } },
      { round: { roundNumber: 'asc' } },
    ],
  });

  console.log('Processing', matches.length, 'matches for HFA...');

  // Track game numbers per club per matchType
  const gameCounters = new Map(); // key: clubId-matchType, value: count

  const hfaRecords = [];

  for (const m of matches) {
    const homeClubId = m.homeClubId;
    const matchType = m.matchType;
    const key = `${homeClubId}-${matchType}`;

    // Increment game number for this club/matchType
    const currentCount = (gameCounters.get(key) ?? 0) + 1;
    gameCounters.set(key, currentCount);

    // Calculate margin (home perspective)
    const homeScore = Number(m.homeScore ?? 0);
    const awayScore = Number(m.awayScore ?? 0);
    const margin = homeScore - awayScore;

    hfaRecords.push({
      clubId: homeClubId,
      matchId: m.id,
      matchType,
      margin,
      gameNumber: currentCount,
    });
  }

  console.log('Inserting', hfaRecords.length, 'HFA records...');

  // Clear existing and insert fresh
  await p.homeGameResult.deleteMany({});

  const result = await p.homeGameResult.createMany({
    data: hfaRecords,
    skipDuplicates: true,
  });

  console.log('Created', result.count, 'HFA records');
  await p.$disconnect();
}

run();
