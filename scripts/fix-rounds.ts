import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  console.log('📆 Fixing rounds...\n')

  const season = await prisma.season.findFirst({ where: { year: 2026 } })
  if (!season) throw new Error('No 2026 season found')

  // Delete existing rounds
  await prisma.round.deleteMany({ where: { seasonId: season.id } })
  console.log('   Cleared existing rounds')

  // Update season settings
  await prisma.season.update({
    where: { id: season.id },
    data: {
      byeRounds: [12, 13, 14],
      finalsStartRound: 22,
    },
  })

  // Create 24 rounds
  for (let i = 1; i <= 24; i++) {
    let roundType: 'REGULAR' | 'BYE' | 'FINALS_WK1' | 'FINALS_WK2' | 'FINALS_WK3' = 'REGULAR'

    if ([12, 13, 14].includes(i)) roundType = 'BYE'
    else if (i === 22) roundType = 'FINALS_WK1'
    else if (i === 23) roundType = 'FINALS_WK2'
    else if (i === 24) roundType = 'FINALS_WK3'

    await prisma.round.create({
      data: {
        seasonId: season.id,
        roundNumber: i,
        roundType,
        status: 'UPCOMING',
        isRule9Draft: i === 17,
      },
    })
  }

  console.log('   ✓ Created 24 rounds:')
  console.log('     - Round 1: Opening Round')
  console.log('     - Rounds 2-11, 15-21: Regular')
  console.log('     - Rounds 12-14: Bye')
  console.log('     - Round 17: Rule 9 Draft')
  console.log('     - Rounds 22-24: Finals Wk 1-3')
  console.log('\n✅ Done!')
}

main()
  .catch(e => { console.error('Error:', e); process.exit(1) })
  .finally(() => prisma.$disconnect())
