import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  console.log('🏛️ Seeding club boards and tensions...\n')

  const season = await prisma.season.findFirst({ where: { year: 2026 } })
  if (!season) throw new Error('No 2026 season found')

  const clubs = await prisma.club.findMany({ orderBy: { name: 'asc' } })
  console.log(`   Found ${clubs.length} clubs`)

  // Clear existing boards and tensions
  await prisma.boardGoal.deleteMany()
  await prisma.boardMeeting.deleteMany()
  await prisma.clubBoard.deleteMany()
  await prisma.clubTension.deleteMany()
  console.log('   Cleared existing boards and tensions')

  // Create club boards for each club
  for (const club of clubs) {
    await prisma.clubBoard.create({
      data: {
        clubId: club.id,
        boardType: 'TRADITIONAL',
        toleranceRating: 50,
      },
    })
  }
  console.log(`   ✓ Created ${clubs.length} club boards`)

  // Create initial tensions between all club pairs (starts at 0)
  let tensionCount = 0
  for (let i = 0; i < clubs.length; i++) {
    for (let j = i + 1; j < clubs.length; j++) {
      await prisma.clubTension.create({
        data: {
          clubAId: clubs[i].id,
          clubBId: clubs[j].id,
          seasonId: season.id,
          score: 0,
          closeMatches: 0,
          trades: 0,
          ladderBattles: 0,
        },
      })
      tensionCount++
    }
  }
  console.log(`   ✓ Created ${tensionCount} club tension pairs`)

  console.log('\n✅ Done!')
}

main()
  .catch(e => { console.error('Error:', e); process.exit(1) })
  .finally(() => prisma.$disconnect())
