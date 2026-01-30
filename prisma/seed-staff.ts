import { PrismaClient, StaffRole, StaffLeague } from "@prisma/client";
import "dotenv/config";

const prisma = new PrismaClient();

// AFL Senior Coaches (2025 season)
const aflCoaches: Array<{ team: string; name: string }> = [
  { team: "Adelaide Crows", name: "Matthew Nicks" },
  { team: "Brisbane Lions", name: "Chris Fagan" },
  { team: "Carlton", name: "Michael Voss" },
  { team: "Collingwood", name: "Craig McRae" },
  { team: "Essendon", name: "Brad Scott" },
  { team: "Fremantle", name: "Justin Longmuir" },
  { team: "Geelong Cats", name: "Chris Scott" },
  { team: "Gold Coast Suns", name: "Damien Hardwick" },
  { team: "GWS Giants", name: "Adam Kingsley" },
  { team: "Hawthorn", name: "Sam Mitchell" },
  { team: "Melbourne", name: "Simon Goodwin" },
  { team: "North Melbourne", name: "Alastair Clarkson" },
  { team: "Port Adelaide", name: "Ken Hinkley" },
  { team: "Richmond", name: "Adem Yze" },
  { team: "St Kilda", name: "Ross Lyon" },
  { team: "Sydney Swans", name: "John Longmire" },
  { team: "West Coast Eagles", name: "Andrew McQualter" },
  { team: "Western Bulldogs", name: "Luke Beveridge" },
];

// AFL List Managers (2025 season)
const aflListManagers: Array<{ team: string; name: string }> = [
  { team: "Adelaide Crows", name: "Justin Reid" },
  { team: "Brisbane Lions", name: "Danny Daly" },
  { team: "Carlton", name: "Nick Austin" },
  { team: "Collingwood", name: "Derek Hine" },
  { team: "Essendon", name: "Adrian Dodoro" },
  { team: "Fremantle", name: "David Walls" },
  { team: "Geelong Cats", name: "Andrew Mackie" },
  { team: "Gold Coast Suns", name: "Craig Cameron" },
  { team: "GWS Giants", name: "Jason McCartney" },
  { team: "Hawthorn", name: "Mark McKenzie" },
  { team: "Melbourne", name: "Tim Lamb" },
  { team: "North Melbourne", name: "Brady Rawlings" },
  { team: "Port Adelaide", name: "Chris Davies" },
  { team: "Richmond", name: "Blair Hartley" },
  { team: "St Kilda", name: "James Gallagher" },
  { team: "Sydney Swans", name: "Kinnear Beatson" },
  { team: "West Coast Eagles", name: "Rohan O'Brien" },
  { team: "Western Bulldogs", name: "Sam Power" },
];

// VFL Coaches (Victoria Football League) - All 2026 clubs
const vflCoaches: Array<{ name: string }> = [
  { name: "Leigh Adams" }, // Box Hill Hawks
  { name: "David Teague" }, // Carlton VFL
  { name: "Ryan Ferguson" }, // Casey Demons
  { name: "Steven King" }, // Coburg
  { name: "Jared Rivers" }, // Collingwood VFL
  { name: "Daniel Giansiracusa" }, // Essendon VFL
  { name: "Ashley Hansen" }, // Footscray
  { name: "Dale Tapping" }, // Frankston
  { name: "Shane O'Bree" }, // Geelong VFL
  { name: "Josh Fraser" }, // Northern Knights
  { name: "Gary Ayres" }, // Port Melbourne
  { name: "Andrew Collins" }, // Richmond VFL
  { name: "Adam Schneider" }, // Sandringham
  { name: "Cameron Mooney" }, // Southport
  { name: "Michael Barlow" }, // Werribee
  { name: "Andy Collins" }, // Williamstown
];

// SANFL Coaches (South Australian National Football League) - All 2026 clubs
const sanflCoaches: Array<{ name: string }> = [
  { name: "Jarrad Wright" }, // Adelaide FC
  { name: "Mark Mickan" }, // Central District
  { name: "Chad Cornes" }, // Glenelg
  { name: "Damian Squire" }, // Norwood
  { name: "Josh Carr" }, // North Adelaide
  { name: "Matthew Lokan" }, // Port Adelaide Magpies
  { name: "Ryan O'Keefe" }, // South Adelaide
  { name: "Jamie Gallagher" }, // Sturt
  { name: "Nathan Bassett" }, // West Adelaide
  { name: "Nathan Grima" }, // Woodville-West Torrens
];

// WAFL Coaches (Western Australian Football League) - All 2026 clubs
const waflCoaches: Array<{ name: string }> = [
  { name: "Jarrad Schofield" }, // Claremont
  { name: "Beau Wilkes" }, // East Fremantle
  { name: "Chris Waterman" }, // East Perth
  { name: "Adam Pickering" }, // Peel Thunder
  { name: "Trevor Williams" }, // Perth
  { name: "Bill Monaghan" }, // South Fremantle
  { name: "Marc Webb" }, // Subiaco
  { name: "Adam Selwood" }, // Swan Districts
  { name: "Darren Harris" }, // West Perth
];

// NTFL Coaches (Northern Territory Football League) - All 2026 clubs
const ntflCoaches: Array<{ name: string }> = [
  { name: "Mitchell Thomas" }, // Darwin Buffaloes
  { name: "Steven Reilly" }, // Nightcliff Tigers
  { name: "Cameron Stokes" }, // Palmerston Magpies
  { name: "Michael Bowden" }, // Southern Districts
  { name: "Steven Armstrong" }, // St Marys
  { name: "Gavin Chin" }, // Waratah
  { name: "Mick McGuane" }, // Tiwi Bombers
  { name: "Shannon Motlop" }, // Wanderers
];

async function main() {
  console.log("🏈 Starting staff seed...\n");

  // Clear existing staff
  console.log("🧹 Clearing existing staff...");
  await prisma.staffContract.deleteMany();
  await prisma.negotiationSession.deleteMany({
    where: { staffId: { not: undefined } },
  });
  await prisma.personalityProfile.deleteMany({
    where: { staffId: { not: undefined } },
  });
  await prisma.staff.deleteMany();

  // Get AFL teams for linking
  const aflTeams = await prisma.aflTeam.findMany();
  const teamIdMap = new Map(aflTeams.map((t) => [t.name, t.id]));

  let createdCount = 0;

  // Create AFL Senior Coaches
  console.log("👔 Creating AFL Senior Coaches...");
  for (const coach of aflCoaches) {
    const teamId = teamIdMap.get(coach.team);
    await prisma.staff.create({
      data: {
        name: coach.name,
        role: StaffRole.ASSISTANT_COACH,
        league: StaffLeague.AFL,
        aflTeamId: teamId,
        isAvailable: true,
      },
    });
    createdCount++;
  }
  console.log(`   ✓ Created ${aflCoaches.length} AFL coaches`);

  // Create AFL List Managers
  console.log("📋 Creating AFL List Managers...");
  for (const lm of aflListManagers) {
    const teamId = teamIdMap.get(lm.team);
    await prisma.staff.create({
      data: {
        name: lm.name,
        role: StaffRole.LIST_MANAGER,
        league: StaffLeague.AFL,
        aflTeamId: teamId,
        isAvailable: true,
      },
    });
    createdCount++;
  }
  console.log(`   ✓ Created ${aflListManagers.length} AFL list managers`);

  // Create VFL Coaches
  console.log("🏟️  Creating VFL Coaches...");
  for (const coach of vflCoaches) {
    await prisma.staff.create({
      data: {
        name: coach.name,
        role: StaffRole.ASSISTANT_COACH,
        league: StaffLeague.VFL,
        isAvailable: true,
      },
    });
    createdCount++;
  }
  console.log(`   ✓ Created ${vflCoaches.length} VFL coaches`);

  // Create SANFL Coaches
  console.log("🏟️  Creating SANFL Coaches...");
  for (const coach of sanflCoaches) {
    await prisma.staff.create({
      data: {
        name: coach.name,
        role: StaffRole.ASSISTANT_COACH,
        league: StaffLeague.SANFL,
        isAvailable: true,
      },
    });
    createdCount++;
  }
  console.log(`   ✓ Created ${sanflCoaches.length} SANFL coaches`);

  // Create WAFL Coaches
  console.log("🏟️  Creating WAFL Coaches...");
  for (const coach of waflCoaches) {
    await prisma.staff.create({
      data: {
        name: coach.name,
        role: StaffRole.ASSISTANT_COACH,
        league: StaffLeague.WAFL,
        isAvailable: true,
      },
    });
    createdCount++;
  }
  console.log(`   ✓ Created ${waflCoaches.length} WAFL coaches`);

  // Create NTFL Coaches
  console.log("🏟️  Creating NTFL Coaches...");
  for (const coach of ntflCoaches) {
    await prisma.staff.create({
      data: {
        name: coach.name,
        role: StaffRole.ASSISTANT_COACH,
        league: StaffLeague.NTFL,
        isAvailable: true,
      },
    });
    createdCount++;
  }
  console.log(`   ✓ Created ${ntflCoaches.length} NTFL coaches`);

  console.log("\n✅ Staff seed completed!");
  console.log(`\n📈 Summary: Created ${createdCount} staff members`);
  console.log(`   • ${aflCoaches.length} AFL coaches`);
  console.log(`   • ${aflListManagers.length} AFL list managers`);
  console.log(`   • ${vflCoaches.length} VFL coaches`);
  console.log(`   • ${sanflCoaches.length} SANFL coaches`);
  console.log(`   • ${waflCoaches.length} WAFL coaches`);
  console.log(`   • ${ntflCoaches.length} NTFL coaches`);
}

main()
  .catch((e) => {
    console.error("❌ Seed failed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
