const { PrismaClient } = require('@prisma/client');
const p = new PrismaClient();

function randInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

async function run() {
  // Get completed matches
  const matches = await p.match.findMany({
    where: { status: 'COMPLETED' },
    include: {
      round: true,
      homeClub: {
        include: {
          rosterPlayers: {
            include: { contract: { include: { aflPlayer: true } } }
          }
        }
      },
      awayClub: {
        include: {
          rosterPlayers: {
            include: { contract: { include: { aflPlayer: true } } }
          }
        }
      }
    }
  });

  console.log('Processing', matches.length, 'matches...');

  const allScores = [];

  for (const match of matches) {
    const isSeniors = match.matchType === 'SENIORS';

    const homeRoster = match.homeClub.rosterPlayers.filter(rp =>
      isSeniors ? rp.squad === 'SENIORS' : rp.squad === 'RESERVES'
    );
    const awayRoster = match.awayClub.rosterPlayers.filter(rp =>
      isSeniors ? rp.squad === 'SENIORS' : rp.squad === 'RESERVES'
    );

    for (const rp of [...homeRoster, ...awayRoster]) {
      const score = randInt(40, 150);
      const isCaptain = Math.random() < 0.1;
      const isVc = !isCaptain && Math.random() < 0.1;

      allScores.push({
        matchId: match.id,
        rosterPlayerId: rp.id,
        aflPlayerId: rp.contract.aflPlayer.id,
        aflFantasyScore: score,
        isCaptain,
        isViceCaptain: isVc,
        finalScore: isCaptain ? score * 2 : isVc ? score * 1.5 : score,
        played: true
      });
    }
  }

  console.log('Inserting', allScores.length, 'scores in batch...');

  // Use createMany for batch insert
  const result = await p.matchPlayerScore.createMany({
    data: allScores,
    skipDuplicates: true
  });

  console.log('Created', result.count, 'player scores');
  await p.$disconnect();
}
run();
