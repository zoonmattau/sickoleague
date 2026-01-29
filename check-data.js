const { PrismaClient } = require('@prisma/client');
const p = new PrismaClient();

async function run() {
  const matches = await p.match.count();
  const rounds = await p.round.findMany({ where: { status: 'COMPLETED' }, select: { roundNumber: true } });
  const club = await p.club.findFirst({
    where: { coach: { email: 'matthew.parker@live.com.au' } },
    include: { contracts: { where: { status: 'ACTIVE' } } }
  });

  let total = 0;
  for (const c of club?.contracts || []) {
    total += Number(c.totalValue);
  }

  console.log('Matches:', matches);
  console.log('Completed rounds:', rounds.map(r => r.roundNumber).join(', ') || 'none');
  console.log('Your club:', club?.name);
  console.log('Your club contracts:', club?.contracts?.length);
  console.log('Total salary (should be < 750):', total);
  await p.$disconnect();
}
run();
