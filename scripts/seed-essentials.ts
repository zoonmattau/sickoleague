import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

// Fantasy clubs
const fantasyClubs = [
  { name: 'Ashford Sickos', abbreviation: 'ASH', reservesName: 'Millbrook Symptoms', reservesAbbreviation: 'MIL', primaryColor: '#1a1a2e', secondaryColor: '#eaeaea' },
  { name: 'Ashford Hoggers', abbreviation: 'AHG', reservesName: 'Coalfield Piglets', reservesAbbreviation: 'COA', primaryColor: '#ff6b6b', secondaryColor: '#ffffff' },
  { name: 'Riverside Maulers', abbreviation: 'RIV', reservesName: 'Saltwater Bay Crew', reservesAbbreviation: 'SAL', primaryColor: '#4ecdc4', secondaryColor: '#1a1a1a' },
  { name: 'Riverside Ruckus', abbreviation: 'RRK', reservesName: 'Northbridge Tappers', reservesAbbreviation: 'NOR', primaryColor: '#45b7d1', secondaryColor: '#ffffff' },
  { name: 'Glendale Pressers', abbreviation: 'GLE', reservesName: 'Sunvale Kickers', reservesAbbreviation: 'SUN', primaryColor: '#f9ca24', secondaryColor: '#1a1a1a' },
  { name: 'Westbrook Bandits', abbreviation: 'WES', reservesName: 'Redgum Rangers', reservesAbbreviation: 'RED', primaryColor: '#6c5ce7', secondaryColor: '#ffffff' },
  { name: 'Kingsley Flops', abbreviation: 'KIN', reservesName: 'Vinehurst Donuts', reservesAbbreviation: 'VIN', primaryColor: '#fd79a8', secondaryColor: '#1a1a1a' },
  { name: 'Beachport Warmers', abbreviation: 'BEA', reservesName: 'Dunes End Riders', reservesAbbreviation: 'DUN', primaryColor: '#a29bfe', secondaryColor: '#1a1a1a' },
  { name: 'Thornton Markers', abbreviation: 'THO', reservesName: 'Orchard Vale Flyers', reservesAbbreviation: 'ORC', primaryColor: '#00b894', secondaryColor: '#ffffff' },
  { name: 'Ironbark Kings', abbreviation: 'IRO', reservesName: 'Dusty Creek Princes', reservesAbbreviation: 'DUS', primaryColor: '#e17055', secondaryColor: '#ffffff' },
  { name: 'Hillcrest Fifties', abbreviation: 'HIL', reservesName: 'Pine Ridge Attackers', reservesAbbreviation: 'PIN', primaryColor: '#0984e3', secondaryColor: '#ffffff' },
  { name: 'Ferndale Rebels', abbreviation: 'FER', reservesName: 'Hayfield Defenders', reservesAbbreviation: 'HAY', primaryColor: '#636e72', secondaryColor: '#dfe6e9' },
]

async function main() {
  console.log('🏈 Seeding essentials (clubs, season, draft picks)...\n')

  // Create clubs if they don't exist
  const existingClubs = await prisma.club.findMany()
  let clubs = existingClubs

  if (existingClubs.length === 0) {
    console.log('   Creating 12 fantasy clubs...')
    for (const club of fantasyClubs) {
      await prisma.club.create({ data: club })
    }
    clubs = await prisma.club.findMany({ orderBy: { name: 'asc' } })
    console.log(`   ✓ Created ${clubs.length} clubs`)
  } else {
    console.log(`   Found ${existingClubs.length} existing clubs`)
  }

  // Create season if it doesn't exist
  let season = await prisma.season.findFirst({ where: { year: 2026 } })
  if (!season) {
    console.log('   Creating 2026 season...')
    season = await prisma.season.create({
      data: {
        year: 2026,
        salaryCap: 750,
        status: 'UPCOMING',
        byeRounds: [12, 13, 14],
        finalsStartRound: 24,
        reservesBonusPool: { '1': 75, '2': 50, '3': 30, '4': 20, '5': 10 },
      },
    })
    console.log('   ✓ Created 2026 season')
  } else {
    console.log('   Found existing 2026 season')
  }

  // Create rounds if they don't exist
  const existingRounds = await prisma.round.findMany({ where: { seasonId: season.id } })
  if (existingRounds.length === 0) {
    console.log('   Creating 27 rounds...')
    for (let i = 1; i <= 27; i++) {
      let roundType: 'REGULAR' | 'BYE' | 'FINALS_WK1' | 'FINALS_WK2' | 'FINALS_WK3' = 'REGULAR'
      if ([12, 13, 14].includes(i)) roundType = 'BYE'
      else if (i === 24) roundType = 'FINALS_WK1'
      else if (i === 25) roundType = 'FINALS_WK2'
      else if (i === 26 || i === 27) roundType = 'FINALS_WK3'

      await prisma.round.create({
        data: {
          seasonId: season.id,
          roundNumber: i,
          roundType,
          status: 'UPCOMING',
          isRule9Draft: i === 10,
        },
      })
    }
    console.log('   ✓ Created 27 rounds')
  } else {
    console.log(`   Found ${existingRounds.length} existing rounds`)
  }

  // Create standings if they don't exist
  const existingStandings = await prisma.standing.findMany({ where: { seasonId: season.id } })
  if (existingStandings.length === 0) {
    console.log('   Creating standings...')
    for (const club of clubs) {
      await prisma.standing.create({
        data: { seasonId: season.id, clubId: club.id, competition: 'SENIORS', played: 0, wins: 0, losses: 0, draws: 0, pointsFor: 0, pointsAgainst: 0, percentage: 100 },
      })
      await prisma.standing.create({
        data: { seasonId: season.id, clubId: club.id, competition: 'RESERVES', played: 0, wins: 0, losses: 0, draws: 0, pointsFor: 0, pointsAgainst: 0, percentage: 100 },
      })
    }
    console.log(`   ✓ Created standings for ${clubs.length} clubs`)
  } else {
    console.log(`   Found ${existingStandings.length} existing standings`)
  }

  // Clear and recreate draft picks
  const deleted = await prisma.draftPick.deleteMany({ where: { seasonId: season.id } })
  console.log(`   Cleared ${deleted.count} existing draft picks`)

  // Create ANNUAL draft picks: 21 rounds × 12 clubs = 252 picks
  let pickNumber = 1
  for (let round = 1; round <= 21; round++) {
    for (const club of clubs) {
      await prisma.draftPick.create({
        data: {
          seasonId: season.id,
          draftType: 'ANNUAL',
          round,
          pickNumber,
          originalClubId: club.id,
          currentClubId: club.id,
          used: false,
          passed: false,
        },
      })
      pickNumber++
    }
  }
  console.log(`   ✓ Created ${pickNumber - 1} ANNUAL draft picks`)

  // Create RULE9 draft picks
  for (let i = 0; i < clubs.length; i++) {
    await prisma.draftPick.create({
      data: {
        seasonId: season.id,
        draftType: 'RULE9',
        round: 1,
        pickNumber: i + 1,
        originalClubId: clubs[i].id,
        currentClubId: clubs[i].id,
        used: false,
        passed: false,
      },
    })
  }
  console.log(`   ✓ Created ${clubs.length} RULE9 draft picks`)

  console.log(`\n✅ Done! ${pickNumber - 1 + clubs.length} total draft picks`)
}

main()
  .catch(e => { console.error('Error:', e); process.exit(1) })
  .finally(() => prisma.$disconnect())
