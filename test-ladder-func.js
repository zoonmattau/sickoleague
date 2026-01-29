const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function getClubLadderPositionHistory(clubId) {
  const matches = await prisma.match.findMany({
    where: { status: "COMPLETED" },
    include: {
      round: { include: { season: true } },
    },
    orderBy: [
      { round: { season: { year: "asc" } } },
      { round: { roundNumber: "asc" } },
    ],
  });

  if (matches.length === 0) return [];

  const result = [];

  for (const matchType of ["SENIORS", "RESERVES"]) {
    const typeMatches = matches.filter((m) => m.matchType === matchType);
    if (typeMatches.length === 0) continue;

    const roundsSet = new Map();
    for (const m of typeMatches) {
      const key = `${m.round.season.year}-${m.round.roundNumber}`;
      if (!roundsSet.has(key)) {
        roundsSet.set(key, { roundNumber: m.round.roundNumber, seasonYear: m.round.season.year });
      }
    }
    const rounds = Array.from(roundsSet.values());

    const clubRecords = new Map();

    for (const round of rounds) {
      const roundMatches = typeMatches.filter(
        (m) => m.round.roundNumber === round.roundNumber && m.round.season.year === round.seasonYear
      );

      for (const m of roundMatches) {
        const homeScore = Number(m.homeScore ?? 0);
        const awayScore = Number(m.awayScore ?? 0);

        const homeRec = clubRecords.get(m.homeClubId) ?? { wins: 0, losses: 0, draws: 0, pointsFor: 0, pointsAgainst: 0 };
        homeRec.pointsFor += homeScore;
        homeRec.pointsAgainst += awayScore;
        if (homeScore > awayScore) homeRec.wins++;
        else if (homeScore < awayScore) homeRec.losses++;
        else homeRec.draws++;
        clubRecords.set(m.homeClubId, homeRec);

        const awayRec = clubRecords.get(m.awayClubId) ?? { wins: 0, losses: 0, draws: 0, pointsFor: 0, pointsAgainst: 0 };
        awayRec.pointsFor += awayScore;
        awayRec.pointsAgainst += homeScore;
        if (awayScore > homeScore) awayRec.wins++;
        else if (awayScore < homeScore) awayRec.losses++;
        else awayRec.draws++;
        clubRecords.set(m.awayClubId, awayRec);
      }

      if (!clubRecords.has(clubId)) continue;

      const ranked = Array.from(clubRecords.entries())
        .map(([cid, rec]) => {
          const points = rec.wins * 4 + rec.draws * 2;
          const percentage = rec.pointsAgainst > 0 ? (rec.pointsFor / rec.pointsAgainst) * 100 : 100;
          return { clubId: cid, points, percentage, ...rec };
        })
        .sort((a, b) => {
          if (b.points !== a.points) return b.points - a.points;
          return b.percentage - a.percentage;
        });

      const position = ranked.findIndex((r) => r.clubId === clubId) + 1;
      const ourRecord = clubRecords.get(clubId);

      result.push({
        roundNumber: round.roundNumber,
        seasonYear: round.seasonYear,
        matchType,
        position,
        wins: ourRecord.wins,
        losses: ourRecord.losses,
        draws: ourRecord.draws,
        record: `${ourRecord.wins}-${ourRecord.losses}${ourRecord.draws > 0 ? `-${ourRecord.draws}` : ""}`,
      });
    }
  }

  return result;
}

async function main() {
  const coach = await prisma.coach.findFirst({
    where: { email: 'matthew.parker@live.com.au' },
    include: { club: true }
  });

  const clubId = coach.club.id;
  console.log('Club:', coach.club.name);

  const data = await getClubLadderPositionHistory(clubId);
  console.log('Total entries:', data.length);
  console.log('Seniors:', data.filter(d => d.matchType === 'SENIORS').length);
  console.log('Reserves:', data.filter(d => d.matchType === 'RESERVES').length);

  console.log('\nSeniors data:');
  data.filter(d => d.matchType === 'SENIORS').forEach(d => {
    console.log(`  R${d.roundNumber}: Position ${d.position}, Record ${d.record}`);
  });

  await prisma.$disconnect();
}

main();
