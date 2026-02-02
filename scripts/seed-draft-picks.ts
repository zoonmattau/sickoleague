import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  console.log('🎯 Seeding draft picks...\n')

  // Get or create season
  let season = await prisma.season.findFirst({
    where: { year: 2026 },
  })
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
  }

  // Get all clubs
  const clubs = await prisma.club.findMany({
    orderBy: { name: 'asc' },
  })
  console.log(`   Found ${clubs.length} clubs`)

  if (clubs.length !== 12) {
    console.log('   ⚠️  Expected 12 clubs, found', clubs.length)
  }

  // Clear existing draft picks for this season
  const deleted = await prisma.draftPick.deleteMany({
    where: { seasonId: season.id },
  })
  console.log(`   Cleared ${deleted.count} existing draft picks`)

  // Create ANNUAL draft picks: 21 rounds × 12 clubs = 252 picks
  let pickNumber = 1
  for (let round = 1; round <= 21; round++) {
    for (let i = 0; i < clubs.length; i++) {
      await prisma.draftPick.create({
        data: {
          seasonId: season.id,
          draftType: 'ANNUAL',
          round,
          pickNumber,
          originalClubId: clubs[i].id,
          currentClubId: clubs[i].id,
          used: false,
          passed: false,
        },
      })
      pickNumber++
    }
  }
  console.log(`   ✓ Created ${pickNumber - 1} ANNUAL draft picks (21 rounds × ${clubs.length} clubs)`)

  // Create RULE9 draft picks: 1 per club
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

  console.log(`\n✅ Total: ${pickNumber - 1 + clubs.length} draft picks created`)
}

main()
  .catch(e => { console.error('Error:', e); process.exit(1) })
  .finally(() => prisma.$disconnect())
