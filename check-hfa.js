const { PrismaClient } = require('@prisma/client');
const p = new PrismaClient();

async function run() {
  const coach = await p.coach.findFirst({
    where: { email: 'matthew.parker@live.com.au' },
    include: { club: true }
  });

  const clubId = coach.club.id;
  console.log('Club:', coach.club.name);

  // Check home games from matches
  const homeMatches = await p.match.findMany({
    where: {
      homeClubId: clubId,
      matchType: 'SENIORS',
      status: 'COMPLETED'
    },
    include: { round: true },
    orderBy: { round: { roundNumber: 'asc' } }
  });

  console.log('\nSeniors home matches from Match table:');
  homeMatches.forEach(m => {
    console.log(`  R${m.round.roundNumber}: ${m.homeScore} - ${m.awayScore}`);
  });

  // Check HomeGameResult records
  const hfaResults = await p.homeGameResult.findMany({
    where: {
      clubId,
      matchType: 'SENIORS'
    },
    include: { match: { include: { round: true } } },
    orderBy: { gameNumber: 'asc' }
  });

  console.log('\nSeniors HFA records from HomeGameResult table:');
  hfaResults.forEach(r => {
    console.log(`  G${r.gameNumber} (R${r.match.round.roundNumber}): margin ${r.margin}`);
  });

  await p.$disconnect();
}

run();
