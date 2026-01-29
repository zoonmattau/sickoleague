const { PrismaClient } = require('@prisma/client');
const p = new PrismaClient();

// Map roster spots to required positions
const spotPositions = {
  DEF1: ['DEF'], DEF2: ['DEF'], DEF3: ['DEF'],
  MID1: ['MID'], MID2: ['MID'], MID3: ['MID'], MID4: ['MID'],
  RUC: ['RUC'],
  FWD1: ['FWD'], FWD2: ['FWD'], FWD3: ['FWD'],
  RDEF1: ['DEF'], RDEF2: ['DEF'],
  RMID1: ['MID'], RMID2: ['MID'], RMID3: ['MID'],
  RRUC: ['RUC'],
  RFWD1: ['FWD'], RFWD2: ['FWD'],
  BENCH1: null, BENCH2: null, // Any position
  IL1: null, IL2: null
};

async function run() {
  // Delete all roster assignments and reassign properly
  await p.rosterPlayer.deleteMany({});
  console.log('Cleared roster assignments');

  const clubs = await p.club.findMany({
    include: {
      contracts: {
        where: { status: 'ACTIVE' },
        include: { aflPlayer: true }
      }
    }
  });

  for (const club of clubs) {
    const contracts = club.contracts;
    const used = new Set();

    // Group players by position
    const byPos = { DEF: [], MID: [], RUC: [], FWD: [] };
    for (const c of contracts) {
      for (const pos of c.aflPlayer.positions) {
        if (byPos[pos]) byPos[pos].push(c);
      }
    }

    const assignments = [];

    // Fill seniors spots
    const seniorsSpots = ['DEF1', 'DEF2', 'DEF3', 'MID1', 'MID2', 'MID3', 'MID4', 'RUC', 'FWD1', 'FWD2', 'FWD3'];
    for (const spot of seniorsSpots) {
      const reqPos = spotPositions[spot][0];
      const available = byPos[reqPos].filter(c => !used.has(c.id));
      if (available.length > 0) {
        const contract = available[0];
        used.add(contract.id);
        assignments.push({ clubId: club.id, contractId: contract.id, squad: 'SENIORS', rosterSpot: spot });
      }
    }

    // Fill reserves spots
    const reservesSpots = ['RDEF1', 'RDEF2', 'RMID1', 'RMID2', 'RMID3', 'RRUC', 'RFWD1', 'RFWD2'];
    for (const spot of reservesSpots) {
      const reqPos = spotPositions[spot][0];
      const available = byPos[reqPos].filter(c => !used.has(c.id));
      if (available.length > 0) {
        const contract = available[0];
        used.add(contract.id);
        assignments.push({ clubId: club.id, contractId: contract.id, squad: 'RESERVES', rosterSpot: spot });
      }
    }

    // Put remaining on bench
    const remaining = contracts.filter(c => !used.has(c.id));
    const benchSpots = ['BENCH1'];
    for (let i = 0; i < Math.min(remaining.length, benchSpots.length); i++) {
      assignments.push({ clubId: club.id, contractId: remaining[i].id, squad: 'SENIORS', rosterSpot: benchSpots[i] });
    }

    // Create all assignments
    for (const a of assignments) {
      await p.rosterPlayer.create({ data: a });
    }

    console.log(club.name + ': assigned', assignments.length, 'players');
  }

  await p.$disconnect();
  console.log('Done!');
}
run();
