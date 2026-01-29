const { PrismaClient } = require('@prisma/client');
const p = new PrismaClient();

async function run() {
  // Get all standings
  const standings = await p.standing.findMany({
    include: { season: true },
  });

  console.log('Processing', standings.length, 'standings...');

  // Group by season + competition
  const groups = new Map();
  for (const s of standings) {
    const key = `${s.seasonId}-${s.competition}`;
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key).push(s);
  }

  // For each group, rank by points (4*wins + 2*draws), then percentage
  for (const [key, list] of groups.entries()) {
    // Sort by points desc, then percentage desc
    list.sort((a, b) => {
      const pointsA = a.wins * 4 + a.draws * 2;
      const pointsB = b.wins * 4 + b.draws * 2;
      if (pointsB !== pointsA) return pointsB - pointsA;
      return Number(b.percentage) - Number(a.percentage);
    });

    // Assign positions
    for (let i = 0; i < list.length; i++) {
      const s = list[i];
      await p.standing.update({
        where: { id: s.id },
        data: { ladderPosition: i + 1 },
      });
    }
    console.log(`Updated ${list.length} standings for ${key}`);
  }

  console.log('Done!');
  await p.$disconnect();
}

run();
