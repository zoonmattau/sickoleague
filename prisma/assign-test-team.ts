import { PrismaClient, RosterSpot, Squad } from '@prisma/client'
import { PrismaPg } from '@prisma/adapter-pg'
import pg from 'pg'
import 'dotenv/config'

const EMAIL = process.argv[2] || 'matthew.parker@live.com.au'

const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL })
const adapter = new PrismaPg(pool)
const prisma = new PrismaClient({ adapter })

// Roster structure: need players by position
const SENIORS: { spot: RosterSpot; position: string }[] = [
  { spot: 'DEF1', position: 'DEF' },
  { spot: 'DEF2', position: 'DEF' },
  { spot: 'DEF3', position: 'DEF' },
  { spot: 'MID1', position: 'MID' },
  { spot: 'MID2', position: 'MID' },
  { spot: 'MID3', position: 'MID' },
  { spot: 'MID4', position: 'MID' },
  { spot: 'RUC', position: 'RUC' },
  { spot: 'FWD1', position: 'FWD' },
  { spot: 'FWD2', position: 'FWD' },
  { spot: 'FWD3', position: 'FWD' },
]

const RESERVES: { spot: RosterSpot; position: string }[] = [
  { spot: 'RDEF1', position: 'DEF' },
  { spot: 'RDEF2', position: 'DEF' },
  { spot: 'RMID1', position: 'MID' },
  { spot: 'RMID2', position: 'MID' },
  { spot: 'RMID3', position: 'MID' },
  { spot: 'RRUC', position: 'RUC' },
  { spot: 'RFWD1', position: 'FWD' },
  { spot: 'RFWD2', position: 'FWD' },
]

async function main() {
  console.log(`Assigning test team to: ${EMAIL}\n`)

  // 1. Find or create the coach
  let coach = await prisma.coach.findFirst({ where: { email: EMAIL } })
  if (!coach) {
    coach = await prisma.coach.create({
      data: {
        email: EMAIL,
        displayName: EMAIL.split('@')[0],
      },
    })
    console.log(`Created coach: ${coach.displayName} (${coach.id})`)
  } else {
    console.log(`Found existing coach: ${coach.displayName} (${coach.id})`)
  }

  // 2. Find the first unassigned club, or use one already assigned to this coach
  let club = await prisma.club.findFirst({ where: { coachId: coach.id } })
  if (!club) {
    club = await prisma.club.findFirst({ where: { coachId: null } })
    if (!club) {
      console.error('No available clubs! Run the seed first: npm run db:seed')
      process.exit(1)
    }
    await prisma.club.update({
      where: { id: club.id },
      data: { coachId: coach.id },
    })
    console.log(`Assigned club: ${club.name} (${club.abbreviation})`)
  } else {
    console.log(`Coach already has club: ${club.name}`)
  }

  // 3. Clean up existing contracts and roster for this club (so re-runs are safe)
  await prisma.rosterPlayer.deleteMany({ where: { clubId: club.id } })
  await prisma.contract.deleteMany({ where: { clubId: club.id } })
  console.log('Cleared existing contracts & roster for this club')

  // 4. Find available players by position
  const allSpots = [...SENIORS, ...RESERVES]
  const needed: Record<string, number> = {}
  for (const s of allSpots) {
    needed[s.position] = (needed[s.position] || 0) + 1
  }
  // DEF: 5, MID: 7, RUC: 2, FWD: 5 = 19 total

  const pickedPlayerIds = new Set<string>()
  const playersByPosition: Record<string, string[]> = { DEF: [], MID: [], RUC: [], FWD: [] }

  for (const [pos, count] of Object.entries(needed)) {
    const players = await prisma.aflPlayer.findMany({
      where: {
        positions: { has: pos as any },
        status: 'ACTIVE',
        contracts: { none: { status: 'ACTIVE' } },
      },
      take: count + 5, // grab extras in case of overlap
    })

    let picked = 0
    for (const p of players) {
      if (picked >= count) break
      if (pickedPlayerIds.has(p.id)) continue
      pickedPlayerIds.add(p.id)
      playersByPosition[pos].push(p.id)
      picked++
    }

    if (picked < count) {
      console.warn(`Only found ${picked}/${count} players for ${pos}`)
    }
  }

  console.log(`Selected players - DEF: ${playersByPosition.DEF.length}, MID: ${playersByPosition.MID.length}, RUC: ${playersByPosition.RUC.length}, FWD: ${playersByPosition.FWD.length}`)

  // 5. Create contracts and roster assignments
  const contractValues = [48, 45, 42, 40, 38, 36, 35, 34, 33, 32, 30, 28, 26, 25, 24, 22, 20, 18, 15]
  let contractIndex = 0

  for (const { spot, position } of allSpots) {
    const squad: Squad = SENIORS.some(s => s.spot === spot) ? 'SENIORS' : 'RESERVES'
    const playerId = playersByPosition[position].shift()
    if (!playerId) {
      console.warn(`No player available for ${spot}, skipping`)
      continue
    }

    const value = contractValues[contractIndex] ?? 15
    contractIndex++

    const contract = await prisma.contract.create({
      data: {
        clubId: club.id,
        aflPlayerId: playerId,
        startSeason: 2026,
        endSeason: 2028,
        totalValue: value,
        yearBreakdown: [
          { season: 2026, value },
          { season: 2027, value },
          { season: 2028, value },
        ],
        contractType: 'DRAFT',
        status: 'ACTIVE',
      },
    })

    await prisma.rosterPlayer.create({
      data: {
        clubId: club.id,
        contractId: contract.id,
        squad,
        rosterSpot: spot,
      },
    })
  }

  const totalSalary = contractValues.slice(0, contractIndex).reduce((a, b) => a + b, 0)
  console.log(`\nCreated ${contractIndex} contracts (total salary: ${totalSalary}/750)`)
  console.log('Assigned all players to roster spots')

  // Summary
  const finalClub = await prisma.club.findUnique({
    where: { id: club.id },
    include: {
      contracts: {
        where: { status: 'ACTIVE' },
        include: { aflPlayer: { include: { aflTeam: true } } },
      },
      rosterPlayers: {
        where: { roundId: null },
        include: { contract: { include: { aflPlayer: true } } },
      },
    },
  })

  console.log(`\n--- ${finalClub!.name} Roster ---`)
  for (const rp of finalClub!.rosterPlayers.sort((a, b) => a.rosterSpot.localeCompare(b.rosterSpot))) {
    const p = rp.contract.aflPlayer
    console.log(`  ${rp.rosterSpot.padEnd(6)} ${rp.squad.padEnd(8)} ${p.firstName} ${p.lastName}`)
  }

  console.log('\nDone! Visit /dashboard to see your team.')
}

main()
  .catch((e) => {
    console.error('Failed:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
