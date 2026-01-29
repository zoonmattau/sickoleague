const { PrismaClient } = require('@prisma/client');
const p = new PrismaClient();

async function run() {
  const clubs = await p.club.findMany({
    include: { contracts: { where: { status: 'ACTIVE' } } }
  });

  for (const club of clubs) {
    const contracts = club.contracts;
    const numContracts = contracts.length;

    // Target ~700 total (under 750 cap) spread across contracts
    // Higher value players get more, lower get less
    const targetTotal = 680 + Math.floor(Math.random() * 40); // 680-720
    const avgPerPlayer = targetTotal / numContracts;

    let assigned = 0;
    for (let i = 0; i < contracts.length; i++) {
      const contract = contracts[i];

      // Vary from 15 to 60 per year, with some stars
      let yearlyValue;
      if (i < 3) {
        yearlyValue = 50 + Math.floor(Math.random() * 15); // Stars: 50-65
      } else if (i < 8) {
        yearlyValue = 35 + Math.floor(Math.random() * 15); // Good: 35-50
      } else {
        yearlyValue = 15 + Math.floor(Math.random() * 20); // Role/min: 15-35
      }

      const years = contract.endSeason - contract.startSeason + 1;
      const yearBreakdown = [];
      let total = 0;

      for (let y = 0; y < years; y++) {
        const value = Math.round(yearlyValue * (1 + y * 0.05)); // 5% yearly increase
        yearBreakdown.push({ season: 2026 + y, value });
        total += value;
      }

      await p.contract.update({
        where: { id: contract.id },
        data: {
          totalValue: total,
          yearBreakdown,
          isMinimum: yearlyValue < 20
        }
      });
      assigned++;
    }

    // Recalculate club's 2026 salary
    const updated = await p.contract.findMany({
      where: { clubId: club.id, status: 'ACTIVE' }
    });
    let salary2026 = 0;
    for (const c of updated) {
      const breakdown = c.yearBreakdown;
      const yr = breakdown.find(y => y.season === 2026);
      if (yr) salary2026 += yr.value;
    }
    console.log(club.name + ':', salary2026);
  }

  await p.$disconnect();
  console.log('Done!');
}
run();
