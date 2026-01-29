const { PrismaClient } = require('@prisma/client');
const p = new PrismaClient();

async function test() {
  // Get the user's club (Back Line Bandits)
  const coach = await p.coach.findFirst({
    where: { email: 'matthew.parker@live.com.au' },
    include: { club: true }
  });

  if (!coach || !coach.club) {
    console.log('No club found');
    await p.$disconnect();
    return;
  }

  const clubId = coach.club.id;
  console.log('Club:', coach.club.name, clubId);

  // Test the matches query - same as in the action
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

  console.log('Total completed matches:', matches.length);

  // Check if our club is in any matches
  const clubMatches = matches.filter(m =>
    m.homeClubId === clubId || m.awayClubId === clubId
  );
  console.log('Club matches:', clubMatches.length);

  // Simulate the function logic for SENIORS
  const seniorsMatches = matches.filter(m => m.matchType === 'SENIORS');
  console.log('Seniors matches:', seniorsMatches.length);

  // Get unique rounds
  const roundsSet = new Map();
  for (const m of seniorsMatches) {
    const key = `${m.round.season.year}-${m.round.roundNumber}`;
    if (!roundsSet.has(key)) {
      roundsSet.set(key, { roundNumber: m.round.roundNumber, seasonYear: m.round.season.year });
    }
  }
  console.log('Unique rounds:', roundsSet.size);

  // Track cumulative records
  const clubRecords = new Map();
  let dataPoints = 0;

  for (const [key, round] of roundsSet.entries()) {
    const roundMatches = seniorsMatches.filter(
      m => m.round.roundNumber === round.roundNumber && m.round.season.year === round.seasonYear
    );

    for (const m of roundMatches) {
      const homeScore = Number(m.homeScore || 0);
      const awayScore = Number(m.awayScore || 0);

      // Update home club
      const homeRec = clubRecords.get(m.homeClubId) || { wins: 0, losses: 0, draws: 0, pointsFor: 0, pointsAgainst: 0 };
      homeRec.pointsFor += homeScore;
      homeRec.pointsAgainst += awayScore;
      if (homeScore > awayScore) homeRec.wins++;
      else if (homeScore < awayScore) homeRec.losses++;
      else homeRec.draws++;
      clubRecords.set(m.homeClubId, homeRec);

      // Update away club
      const awayRec = clubRecords.get(m.awayClubId) || { wins: 0, losses: 0, draws: 0, pointsFor: 0, pointsAgainst: 0 };
      awayRec.pointsFor += awayScore;
      awayRec.pointsAgainst += homeScore;
      if (awayScore > homeScore) awayRec.wins++;
      else if (awayScore < homeScore) awayRec.losses++;
      else awayRec.draws++;
      clubRecords.set(m.awayClubId, awayRec);
    }

    if (clubRecords.has(clubId)) {
      dataPoints++;
    }
  }

  console.log('Data points for our club:', dataPoints);
  console.log('Club record:', clubRecords.get(clubId));

  await p.$disconnect();
}
test();
