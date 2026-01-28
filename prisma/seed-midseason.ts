import { PrismaClient, Position, SeasonStatus, RoundStatus, MatchStatus, Squad, RosterSpot, ContractType } from '@prisma/client'
import 'dotenv/config'

const prisma = new PrismaClient()

// Helper to get random int
function randInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min
}

// Helper to shuffle array
function shuffle<T>(arr: T[]): T[] {
  const a = [...arr]
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[a[i], a[j]] = [a[j], a[i]]
  }
  return a
}

async function main() {
  console.log('🏈 Seeding mid-season data...\n')

  // Get existing data
  const clubs = await prisma.club.findMany({ orderBy: { name: 'asc' } })
  const players = await prisma.aflPlayer.findMany({ include: { aflTeam: true } })
  const season = await prisma.season.findFirst({ where: { year: 2026 } })
  const rounds = await prisma.round.findMany({ where: { seasonId: season?.id }, orderBy: { roundNumber: 'asc' } })

  if (!season || clubs.length === 0 || players.length === 0) {
    console.log('❌ Run the base seed first: npx prisma db seed')
    return
  }

  console.log(`Found ${clubs.length} clubs, ${players.length} players`)

  // Update season to ACTIVE
  await prisma.season.update({
    where: { id: season.id },
    data: { status: SeasonStatus.ACTIVE }
  })

  // Create coaches for each club
  console.log('👨‍💼 Creating coaches...')
  const coachNames = [
    'Matt Smith', 'Josh Wilson', 'Ben Taylor', 'Sam Brown',
    'Tom Davis', 'Jake Miller', 'Chris Anderson', 'Dan Thomas',
    'Mike Jackson', 'Ryan White', 'Luke Harris', 'James Martin'
  ]

  for (let i = 0; i < clubs.length; i++) {
    const coach = await prisma.coach.create({
      data: {
        email: `coach${i + 1}@sickoleague.com`,
        displayName: coachNames[i] || `Coach ${i + 1}`,
        discordId: `discord_${i + 1}`,
        isCommissioner: i === 0,
      }
    })
    await prisma.club.update({
      where: { id: clubs[i].id },
      data: { coachId: coach.id }
    })
  }
  console.log(`   ✓ Created ${clubs.length} coaches`)

  // Distribute players to clubs with contracts
  console.log('📝 Creating contracts...')
  const shuffledPlayers = shuffle(players)
  const playersPerClub = 20
  let contractCount = 0

  for (let i = 0; i < clubs.length; i++) {
    const clubPlayers = shuffledPlayers.slice(i * playersPerClub, (i + 1) * playersPerClub)

    for (let j = 0; j < clubPlayers.length; j++) {
      const player = clubPlayers[j]
      const years = randInt(1, 4)
      const baseValue = randInt(20, 80)
      const yearBreakdown: { season: number; value: number }[] = []

      let total = 0
      for (let y = 0; y < years; y++) {
        const value = Math.round(baseValue * (1 + y * 0.1)) // 10% yearly increase
        yearBreakdown.push({ season: 2026 + y, value })
        total += value
      }

      await prisma.contract.create({
        data: {
          clubId: clubs[i].id,
          aflPlayerId: player.id,
          startSeason: 2026,
          endSeason: 2025 + years,
          totalValue: total,
          yearBreakdown,
          isMinimum: baseValue < 25,
          contractType: ContractType.DRAFT,
          status: 'ACTIVE',
          tradeBlock: Math.random() < 0.1, // 10% on trade block
        }
      })
      contractCount++
    }
  }
  console.log(`   ✓ Created ${contractCount} contracts`)

  // Create roster assignments
  console.log('📋 Creating roster assignments...')
  const seniorSpots: RosterSpot[] = ['DEF1', 'DEF2', 'DEF3', 'MID1', 'MID2', 'MID3', 'MID4', 'RUC', 'FWD1', 'FWD2', 'FWD3']
  const reserveSpots: RosterSpot[] = ['RDEF1', 'RDEF2', 'RMID1', 'RMID2', 'RMID3', 'RRUC', 'RFWD1', 'RFWD2']
  const benchSpots: RosterSpot[] = ['BENCH1']

  for (const club of clubs) {
    const contracts = await prisma.contract.findMany({
      where: { clubId: club.id, status: 'ACTIVE' },
      include: { aflPlayer: true }
    })

    let seniorIdx = 0
    let reserveIdx = 0
    let benchIdx = 0

    for (const contract of contracts) {
      let squad: Squad
      let spot: RosterSpot

      if (seniorIdx < seniorSpots.length) {
        squad = 'SENIORS'
        spot = seniorSpots[seniorIdx++]
      } else if (reserveIdx < reserveSpots.length) {
        squad = 'RESERVES'
        spot = reserveSpots[reserveIdx++]
      } else if (benchIdx < benchSpots.length) {
        squad = 'SENIORS'
        spot = benchSpots[benchIdx++]
      } else {
        continue
      }

      await prisma.rosterPlayer.create({
        data: {
          clubId: club.id,
          contractId: contract.id,
          squad,
          rosterSpot: spot,
        }
      })
    }
  }
  console.log(`   ✓ Created roster assignments`)

  // Create matches and scores for rounds 1-12
  console.log('🏟️  Creating match results (rounds 1-12)...')
  const completedRounds = rounds.slice(0, 12)

  for (const round of completedRounds) {
    // Update round status
    await prisma.round.update({
      where: { id: round.id },
      data: { status: RoundStatus.COMPLETED }
    })

    // Create matchups (simple round-robin style)
    const shuffledClubs = shuffle([...clubs])
    for (let i = 0; i < shuffledClubs.length; i += 2) {
      if (i + 1 >= shuffledClubs.length) break

      const homeClub = shuffledClubs[i]
      const awayClub = shuffledClubs[i + 1]

      // Generate scores (AFL Fantasy team scores typically 1500-2200)
      const homeScore = randInt(1500, 2200)
      const awayScore = randInt(1500, 2200)
      const homeReservesScore = randInt(800, 1400)
      const awayReservesScore = randInt(800, 1400)

      // Seniors match
      await prisma.match.create({
        data: {
          roundId: round.id,
          homeClubId: homeClub.id,
          awayClubId: awayClub.id,
          matchType: 'SENIORS',
          homeScore,
          awayScore,
          status: MatchStatus.COMPLETED,
          isRivalMatch: false,
        }
      })

      // Reserves match
      await prisma.match.create({
        data: {
          roundId: round.id,
          homeClubId: homeClub.id,
          awayClubId: awayClub.id,
          matchType: 'RESERVES',
          homeScore: homeReservesScore,
          awayScore: awayReservesScore,
          status: MatchStatus.COMPLETED,
          isRivalMatch: false,
        }
      })
    }
  }
  console.log(`   ✓ Created matches for 12 rounds`)

  // Calculate and update standings
  console.log('📊 Calculating standings...')
  for (const club of clubs) {
    for (const comp of ['SENIORS', 'RESERVES'] as const) {
      const homeMatches = await prisma.match.findMany({
        where: { homeClubId: club.id, matchType: comp, status: 'COMPLETED' }
      })
      const awayMatches = await prisma.match.findMany({
        where: { awayClubId: club.id, matchType: comp, status: 'COMPLETED' }
      })

      let wins = 0, losses = 0, draws = 0, pointsFor = 0, pointsAgainst = 0

      for (const m of homeMatches) {
        const hScore = Number(m.homeScore || 0)
        const aScore = Number(m.awayScore || 0)
        pointsFor += hScore
        pointsAgainst += aScore
        if (hScore > aScore) wins++
        else if (hScore < aScore) losses++
        else draws++
      }

      for (const m of awayMatches) {
        const hScore = Number(m.homeScore || 0)
        const aScore = Number(m.awayScore || 0)
        pointsFor += aScore
        pointsAgainst += hScore
        if (aScore > hScore) wins++
        else if (aScore < hScore) losses++
        else draws++
      }

      const played = wins + losses + draws
      const percentage = pointsAgainst > 0 ? (pointsFor / pointsAgainst) * 100 : 100

      await prisma.standing.updateMany({
        where: { clubId: club.id, seasonId: season.id, competition: comp },
        data: { wins, losses, draws, played, pointsFor, pointsAgainst, percentage }
      })
    }
  }

  // Update ladder positions
  for (const comp of ['SENIORS', 'RESERVES'] as const) {
    const standings = await prisma.standing.findMany({
      where: { seasonId: season.id, competition: comp },
      orderBy: [{ wins: 'desc' }, { percentage: 'desc' }]
    })
    for (let i = 0; i < standings.length; i++) {
      await prisma.standing.update({
        where: { id: standings[i].id },
        data: { ladderPosition: i + 1 }
      })
    }
  }
  console.log(`   ✓ Updated standings`)

  // Create some rivalries
  console.log('⚔️  Creating rivalries...')
  const rivalPairs = [
    [0, 1], [2, 3], [4, 5], [0, 3], [1, 4]
  ]
  for (const [a, b] of rivalPairs) {
    if (clubs[a] && clubs[b]) {
      await prisma.rival.create({
        data: {
          clubAId: clubs[a].id,
          clubBId: clubs[b].id,
          seasonId: season.id,
          reason: Math.random() < 0.5 ? 'FINALS_OPPONENT' : 'NOMINATED'
        }
      })
    }
  }
  console.log(`   ✓ Created ${rivalPairs.length} rivalries`)

  console.log('\n✅ Mid-season seed completed!')
}

main()
  .catch((e) => {
    console.error('❌ Seed failed:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
