import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  console.log('👔 Seeding coaches and staff only...\n')

  // Get AFL team IDs
  const aflTeams = await prisma.aflTeam.findMany()
  const teamNameToId: Record<string, string> = {}
  aflTeams.forEach(t => { teamNameToId[t.name] = t.id })

  // Clear only staff (not contracts or assignments)
  await prisma.staffContract.deleteMany()
  await prisma.staff.deleteMany()
  console.log('   Cleared existing staff')

  // AFL Head Coaches (2025-26 season)
  const aflHeadCoaches = [
    { name: 'Matthew Nicks', team: 'Adelaide Crows' },
    { name: 'Chris Fagan', team: 'Brisbane Lions' },
    { name: 'Michael Voss', team: 'Carlton' },
    { name: 'Craig McRae', team: 'Collingwood' },
    { name: 'Brad Scott', team: 'Essendon' },
    { name: 'Justin Longmuir', team: 'Fremantle' },
    { name: 'Chris Scott', team: 'Geelong Cats' },
    { name: 'Damien Hardwick', team: 'Gold Coast Suns' },
    { name: 'Adam Kingsley', team: 'GWS Giants' },
    { name: 'Sam Mitchell', team: 'Hawthorn' },
    { name: 'Steven King', team: 'Melbourne' },
    { name: 'Alastair Clarkson', team: 'North Melbourne' },
    { name: 'Josh Carr', team: 'Port Adelaide' },
    { name: 'Adem Yze', team: 'Richmond' },
    { name: 'Ross Lyon', team: 'St Kilda' },
    { name: 'Dean Cox', team: 'Sydney Swans' },
    { name: 'Andrew McQualter', team: 'West Coast Eagles' },
    { name: 'Luke Beveridge', team: 'Western Bulldogs' },
  ]

  // AFL List Managers
  const aflListManagers = [
    { name: 'Justin Reid', team: 'Adelaide Crows' },
    { name: 'Dom Ambrogio', team: 'Brisbane Lions' },
    { name: 'Nick Austin', team: 'Carlton' },
    { name: 'Derek Hine', team: 'Collingwood' },
    { name: 'Adrian Dodoro', team: 'Essendon' },
    { name: 'David Walls', team: 'Fremantle' },
    { name: 'Andrew Mackie', team: 'Geelong Cats' },
    { name: 'Craig Cameron', team: 'Gold Coast Suns' },
    { name: 'Jason McCartney', team: 'GWS Giants' },
    { name: 'Mark McKenzie', team: 'Hawthorn' },
    { name: 'Tim Lamb', team: 'Melbourne' },
    { name: 'Brady Rawlings', team: 'North Melbourne' },
    { name: 'Chris Davies', team: 'Port Adelaide' },
    { name: 'Blair Hartley', team: 'Richmond' },
    { name: 'James Gallagher', team: 'St Kilda' },
    { name: 'Kinnear Beatson', team: 'Sydney Swans' },
    { name: 'Rohan O\'Brien', team: 'West Coast Eagles' },
    { name: 'Sam Power', team: 'Western Bulldogs' },
  ]

  // VFL Coaches (22 clubs)
  const vflCoaches = [
    { name: 'Max Bailey' },           // Box Hill Hawks
    { name: 'Mitch Hahn' },           // Brisbane Lions VFL
    { name: 'David Teague' },         // Carlton VFL
    { name: 'Jade Rawlings' },        // Casey Demons
    { name: 'Stewart Crameri' },      // Coburg Lions
    { name: 'Jared Rivers' },         // Collingwood VFL
    { name: 'Daniel Giansiracusa' },  // Essendon VFL
    { name: 'Ashley Hansen' },        // Footscray Bulldogs
    { name: 'Danny Ryan' },           // Frankston Dolphins
    { name: 'Shane O\'Bree' },        // Geelong Cats VFL
    { name: 'Steven King' },          // Gold Coast Suns VFL
    { name: 'Lenny Hayes' },          // GWS Giants VFL
    { name: 'Gavin Brown' },          // North Melbourne VFL
    { name: 'Gary Ayres' },           // Port Melbourne Borough
    { name: 'Xavier Clarke' },        // Richmond VFL
    { name: 'Ryan O\'Keefe' },        // Sandringham Zebras
    { name: 'Cameron Mooney' },       // Southport Sharks
    { name: 'Stuart Dew' },           // Sydney Swans VFL
    { name: 'Michael Barlow' },       // Werribee Tigers
    { name: 'Andy Collins' },         // Williamstown Seagulls
    { name: 'Josh Drummond' },        // Aspley Hornets
    { name: 'Anthony Rock' },         // Northern Bullants
  ]

  // WAFL Coaches (12 clubs)
  const waflCoaches = [
    { name: 'Ashley Prescott' },      // Claremont Tigers
    { name: 'Steve Hargrave' },       // East Fremantle Sharks
    { name: 'Jeremy Barnard' },       // East Perth Royals
    { name: 'Cam Eardley' },          // Peel Thunder
    { name: 'Garry Moss' },           // Perth Demons
    { name: 'Todd Curley' },          // South Fremantle Bulldogs
    { name: 'Jarrad Schofield' },     // Subiaco Lions
    { name: 'Greg Harding' },         // Swan Districts
    { name: 'Matthew Knights' },      // West Coast Eagles WAFL
    { name: 'Darren Harris' },        // West Perth Falcons
    { name: 'Beau Maister' },         // Fremantle Dockers WAFL
    { name: 'Jamie Nani' },           // Central Midlands (expansion)
  ]

  // SANFL Coaches (10 clubs)
  const sanflCoaches = [
    { name: 'Nathan van Berlo' },     // Adelaide Crows SANFL
    { name: 'Roy Laird' },            // Central District Bulldogs
    { name: 'Matthew Lokan' },        // Glenelg Tigers
    { name: 'Rhyce Shaw' },           // North Adelaide Roosters
    { name: 'Jarrod Cotton' },        // Norwood Redlegs
    { name: 'Warren Tredrea' },       // Port Adelaide Magpies
    { name: 'Matthew Broadbent' },    // South Adelaide Panthers
    { name: 'Marty Mattner' },        // Sturt Double Blues
    { name: 'Jason Horne' },          // West Adelaide Bloods
    { name: 'Jade Sheedy' },          // Woodville-West Torrens Eagles
  ]

  // NTFL Coaches (8 clubs)
  const ntflCoaches = [
    { name: 'Nathan Grima' },              // Darwin Buffaloes
    { name: 'Cameron Stokes' },            // Nightcliff Tigers
    { name: 'Jarrad Oakley-Nicholls' },    // Palmerston Magpies
    { name: 'Shannon Motlop' },            // Southern Districts Crocs
    { name: 'Daniel Stafford' },           // St Mary's Saints
    { name: 'Adam Kerinaiua' },            // Tiwi Bombers
    { name: 'Marcus Bontempelli Sr' },     // Wanderers Eagles
    { name: 'Jared Brennan' },             // Waratah Warriors
  ]

  let count = 0

  // Create AFL Head Coaches
  for (const coach of aflHeadCoaches) {
    await prisma.staff.create({
      data: {
        name: coach.name,
        role: 'ASSISTANT_COACH',
        league: 'AFL',
        aflTeamId: teamNameToId[coach.team],
        isAvailable: true,
      },
    })
    count++
  }
  console.log(`   ✓ ${aflHeadCoaches.length} AFL head coaches`)

  // Create AFL List Managers
  for (const manager of aflListManagers) {
    await prisma.staff.create({
      data: {
        name: manager.name,
        role: 'LIST_MANAGER',
        league: 'AFL',
        aflTeamId: teamNameToId[manager.team],
        isAvailable: true,
      },
    })
    count++
  }
  console.log(`   ✓ ${aflListManagers.length} AFL list managers`)

  // Create VFL Coaches
  for (const coach of vflCoaches) {
    await prisma.staff.create({
      data: {
        name: coach.name,
        role: 'ASSISTANT_COACH',
        league: 'VFL',
        isAvailable: true,
      },
    })
    count++
  }
  console.log(`   ✓ ${vflCoaches.length} VFL coaches`)

  // Create WAFL Coaches
  for (const coach of waflCoaches) {
    await prisma.staff.create({
      data: {
        name: coach.name,
        role: 'ASSISTANT_COACH',
        league: 'WAFL',
        isAvailable: true,
      },
    })
    count++
  }
  console.log(`   ✓ ${waflCoaches.length} WAFL coaches`)

  // Create SANFL Coaches
  for (const coach of sanflCoaches) {
    await prisma.staff.create({
      data: {
        name: coach.name,
        role: 'ASSISTANT_COACH',
        league: 'SANFL',
        isAvailable: true,
      },
    })
    count++
  }
  console.log(`   ✓ ${sanflCoaches.length} SANFL coaches`)

  // Create NTFL Coaches
  for (const coach of ntflCoaches) {
    await prisma.staff.create({
      data: {
        name: coach.name,
        role: 'ASSISTANT_COACH',
        league: 'NTFL',
        isAvailable: true,
      },
    })
    count++
  }
  console.log(`   ✓ ${ntflCoaches.length} NTFL coaches`)

  console.log(`\n✅ Created ${count} staff members total`)
}

main()
  .catch(e => { console.error('Error:', e); process.exit(1) })
  .finally(() => prisma.$disconnect())
