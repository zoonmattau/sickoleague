import { PrismaClient, Position, PlayerStatus, SeasonStatus, RoundType, RoundStatus, DraftType } from '@prisma/client'
import { PrismaPg } from '@prisma/adapter-pg'
import pg from 'pg'
import 'dotenv/config'

const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL })
const adapter = new PrismaPg(pool)
const prisma = new PrismaClient({ adapter })

// All 18 AFL Teams
const aflTeams = [
  { name: 'Adelaide Crows', abbreviation: 'ADE' },
  { name: 'Brisbane Lions', abbreviation: 'BRI' },
  { name: 'Carlton', abbreviation: 'CAR' },
  { name: 'Collingwood', abbreviation: 'COL' },
  { name: 'Essendon', abbreviation: 'ESS' },
  { name: 'Fremantle', abbreviation: 'FRE' },
  { name: 'Geelong Cats', abbreviation: 'GEE' },
  { name: 'Gold Coast Suns', abbreviation: 'GCS' },
  { name: 'GWS Giants', abbreviation: 'GWS' },
  { name: 'Hawthorn', abbreviation: 'HAW' },
  { name: 'Melbourne', abbreviation: 'MEL' },
  { name: 'North Melbourne', abbreviation: 'NM' },
  { name: 'Port Adelaide', abbreviation: 'PA' },
  { name: 'Richmond', abbreviation: 'RIC' },
  { name: 'St Kilda', abbreviation: 'STK' },
  { name: 'Sydney Swans', abbreviation: 'SYD' },
  { name: 'West Coast Eagles', abbreviation: 'WCE' },
  { name: 'Western Bulldogs', abbreviation: 'WB' },
]

// AFL Players by team (sample rosters with real player names)
const aflPlayersByTeam: Record<string, Array<{ firstName: string; lastName: string; positions: Position[] }>> = {
  'Adelaide Crows': [
    { firstName: 'Jordan', lastName: 'Dawson', positions: ['DEF', 'MID'] },
    { firstName: 'Rory', lastName: 'Laird', positions: ['MID'] },
    { firstName: 'Ben', lastName: 'Keays', positions: ['MID'] },
    { firstName: 'Izak', lastName: 'Rankine', positions: ['FWD'] },
    { firstName: 'Taylor', lastName: 'Walker', positions: ['FWD'] },
    { firstName: 'Darcy', lastName: 'Fogarty', positions: ['FWD'] },
    { firstName: 'Riley', lastName: 'Thilthorpe', positions: ['FWD', 'RUC'] },
    { firstName: 'Sam', lastName: 'Berry', positions: ['MID'] },
    { firstName: 'Jake', lastName: 'Soligo', positions: ['MID'] },
    { firstName: 'Brodie', lastName: 'Smith', positions: ['DEF'] },
    { firstName: 'Nick', lastName: 'Murray', positions: ['DEF'] },
    { firstName: 'Mark', lastName: 'Keane', positions: ['DEF'] },
    { firstName: 'Reilly', lastName: 'OBrien', positions: ['RUC'] },
  ],
  'Brisbane Lions': [
    { firstName: 'Lachie', lastName: 'Neale', positions: ['MID'] },
    { firstName: 'Hugh', lastName: 'McCluggage', positions: ['MID'] },
    { firstName: 'Josh', lastName: 'Dunkley', positions: ['MID'] },
    { firstName: 'Dayne', lastName: 'Zorko', positions: ['MID', 'FWD'] },
    { firstName: 'Harris', lastName: 'Andrews', positions: ['DEF'] },
    { firstName: 'Joe', lastName: 'Daniher', positions: ['FWD'] },
    { firstName: 'Eric', lastName: 'Hipwood', positions: ['FWD'] },
    { firstName: 'Charlie', lastName: 'Cameron', positions: ['FWD'] },
    { firstName: 'Cam', lastName: 'Rayner', positions: ['FWD', 'MID'] },
    { firstName: 'Oscar', lastName: 'McInerney', positions: ['RUC'] },
    { firstName: 'Brandon', lastName: 'Starcevich', positions: ['DEF'] },
    { firstName: 'Keidean', lastName: 'Coleman', positions: ['DEF'] },
    { firstName: 'Jarrod', lastName: 'Berry', positions: ['MID'] },
  ],
  'Carlton': [
    { firstName: 'Patrick', lastName: 'Cripps', positions: ['MID'] },
    { firstName: 'Sam', lastName: 'Walsh', positions: ['MID'] },
    { firstName: 'Charlie', lastName: 'Curnow', positions: ['FWD'] },
    { firstName: 'Harry', lastName: 'McKay', positions: ['FWD'] },
    { firstName: 'George', lastName: 'Hewett', positions: ['MID'] },
    { firstName: 'Adam', lastName: 'Cerra', positions: ['MID'] },
    { firstName: 'Jacob', lastName: 'Weitering', positions: ['DEF'] },
    { firstName: 'Nic', lastName: 'Newman', positions: ['DEF'] },
    { firstName: 'Blake', lastName: 'Acres', positions: ['MID', 'DEF'] },
    { firstName: 'Marc', lastName: 'Pittonet', positions: ['RUC'] },
    { firstName: 'Tom', lastName: 'De Koning', positions: ['RUC', 'FWD'] },
    { firstName: 'Matt', lastName: 'Kennedy', positions: ['MID'] },
    { firstName: 'Zac', lastName: 'Williams', positions: ['DEF'] },
  ],
  'Collingwood': [
    { firstName: 'Nick', lastName: 'Daicos', positions: ['MID'] },
    { firstName: 'Scott', lastName: 'Pendlebury', positions: ['MID'] },
    { firstName: 'Jordan', lastName: 'De Goey', positions: ['MID', 'FWD'] },
    { firstName: 'Darcy', lastName: 'Moore', positions: ['DEF'] },
    { firstName: 'Brayden', lastName: 'Maynard', positions: ['DEF'] },
    { firstName: 'Jamie', lastName: 'Elliott', positions: ['FWD'] },
    { firstName: 'Brody', lastName: 'Mihocek', positions: ['FWD'] },
    { firstName: 'Dan', lastName: 'McStay', positions: ['FWD'] },
    { firstName: 'Josh', lastName: 'Daicos', positions: ['MID', 'DEF'] },
    { firstName: 'Steele', lastName: 'Sidebottom', positions: ['MID'] },
    { firstName: 'Darcy', lastName: 'Cameron', positions: ['RUC', 'FWD'] },
    { firstName: 'Mason', lastName: 'Cox', positions: ['RUC', 'FWD'] },
    { firstName: 'Jack', lastName: 'Crisp', positions: ['MID', 'DEF'] },
  ],
  'Essendon': [
    { firstName: 'Zach', lastName: 'Merrett', positions: ['MID'] },
    { firstName: 'Darcy', lastName: 'Parish', positions: ['MID'] },
    { firstName: 'Jordan', lastName: 'Ridley', positions: ['DEF'] },
    { firstName: 'Andrew', lastName: 'McGrath', positions: ['MID', 'DEF'] },
    { firstName: 'Jye', lastName: 'Caldwell', positions: ['MID'] },
    { firstName: 'Peter', lastName: 'Wright', positions: ['FWD'] },
    { firstName: 'Kyle', lastName: 'Langford', positions: ['FWD', 'MID'] },
    { firstName: 'Jake', lastName: 'Stringer', positions: ['FWD'] },
    { firstName: 'Sam', lastName: 'Draper', positions: ['RUC'] },
    { firstName: 'Matt', lastName: 'Guelfi', positions: ['MID'] },
    { firstName: 'Dyson', lastName: 'Heppell', positions: ['MID'] },
    { firstName: 'Todd', lastName: 'Goldstein', positions: ['RUC'] },
    { firstName: 'Harrison', lastName: 'Jones', positions: ['FWD'] },
  ],
  'Fremantle': [
    { firstName: 'Andrew', lastName: 'Brayshaw', positions: ['MID'] },
    { firstName: 'Caleb', lastName: 'Serong', positions: ['MID'] },
    { firstName: 'Hayden', lastName: 'Young', positions: ['DEF'] },
    { firstName: 'Jordan', lastName: 'Clark', positions: ['DEF'] },
    { firstName: 'Luke', lastName: 'Ryan', positions: ['DEF'] },
    { firstName: 'Sean', lastName: 'Darcy', positions: ['RUC'] },
    { firstName: 'Luke', lastName: 'Jackson', positions: ['RUC', 'FWD'] },
    { firstName: 'Jye', lastName: 'Amiss', positions: ['FWD'] },
    { firstName: 'Michael', lastName: 'Walters', positions: ['FWD', 'MID'] },
    { firstName: 'Alex', lastName: 'Pearce', positions: ['DEF'] },
    { firstName: 'Nat', lastName: 'Fyfe', positions: ['MID', 'FWD'] },
    { firstName: 'Will', lastName: 'Brodie', positions: ['MID'] },
    { firstName: 'Josh', lastName: 'Treacy', positions: ['FWD'] },
  ],
  'Geelong Cats': [
    { firstName: 'Patrick', lastName: 'Dangerfield', positions: ['MID', 'FWD'] },
    { firstName: 'Jeremy', lastName: 'Cameron', positions: ['FWD'] },
    { firstName: 'Tom', lastName: 'Hawkins', positions: ['FWD'] },
    { firstName: 'Tom', lastName: 'Stewart', positions: ['DEF'] },
    { firstName: 'Cam', lastName: 'Guthrie', positions: ['MID'] },
    { firstName: 'Mitch', lastName: 'Duncan', positions: ['MID'] },
    { firstName: 'Tyson', lastName: 'Stengle', positions: ['FWD'] },
    { firstName: 'Gryan', lastName: 'Miers', positions: ['FWD'] },
    { firstName: 'Rhys', lastName: 'Stanley', positions: ['RUC'] },
    { firstName: 'Mark', lastName: 'Blicavs', positions: ['RUC', 'DEF'] },
    { firstName: 'Sam', lastName: 'De Koning', positions: ['DEF'] },
    { firstName: 'Jake', lastName: 'Kolodjashnij', positions: ['DEF'] },
    { firstName: 'Max', lastName: 'Holmes', positions: ['MID'] },
  ],
  'Gold Coast Suns': [
    { firstName: 'Touk', lastName: 'Miller', positions: ['MID'] },
    { firstName: 'Noah', lastName: 'Anderson', positions: ['MID'] },
    { firstName: 'Matt', lastName: 'Rowell', positions: ['MID'] },
    { firstName: 'Ben', lastName: 'King', positions: ['FWD'] },
    { firstName: 'Sam', lastName: 'Collins', positions: ['DEF'] },
    { firstName: 'Charlie', lastName: 'Ballard', positions: ['DEF'] },
    { firstName: 'Jarrod', lastName: 'Witts', positions: ['RUC'] },
    { firstName: 'David', lastName: 'Swallow', positions: ['MID'] },
    { firstName: 'Jack', lastName: 'Lukosius', positions: ['FWD', 'DEF'] },
    { firstName: 'Wil', lastName: 'Powell', positions: ['DEF'] },
    { firstName: 'Mabior', lastName: 'Chol', positions: ['FWD'] },
    { firstName: 'Brandon', lastName: 'Ellis', positions: ['MID', 'DEF'] },
    { firstName: 'Lachie', lastName: 'Weller', positions: ['MID'] },
  ],
  'GWS Giants': [
    { firstName: 'Josh', lastName: 'Kelly', positions: ['MID'] },
    { firstName: 'Toby', lastName: 'Greene', positions: ['FWD'] },
    { firstName: 'Tim', lastName: 'Taranto', positions: ['MID'] },
    { firstName: 'Lachie', lastName: 'Whitfield', positions: ['MID', 'DEF'] },
    { firstName: 'Stephen', lastName: 'Coniglio', positions: ['MID'] },
    { firstName: 'Jesse', lastName: 'Hogan', positions: ['FWD'] },
    { firstName: 'Harry', lastName: 'Himmelberg', positions: ['FWD', 'DEF'] },
    { firstName: 'Sam', lastName: 'Taylor', positions: ['DEF'] },
    { firstName: 'Nick', lastName: 'Haynes', positions: ['DEF'] },
    { firstName: 'Brent', lastName: 'Daniels', positions: ['FWD'] },
    { firstName: 'Kieren', lastName: 'Briggs', positions: ['RUC'] },
    { firstName: 'Isaac', lastName: 'Cumming', positions: ['DEF'] },
    { firstName: 'Callum', lastName: 'Brown', positions: ['FWD'] },
  ],
  'Hawthorn': [
    { firstName: 'James', lastName: 'Sicily', positions: ['DEF'] },
    { firstName: 'Jai', lastName: 'Newcombe', positions: ['MID'] },
    { firstName: 'Dylan', lastName: 'Moore', positions: ['FWD', 'MID'] },
    { firstName: 'Will', lastName: 'Day', positions: ['MID', 'DEF'] },
    { firstName: 'Changkuoth', lastName: 'Jiath', positions: ['DEF'] },
    { firstName: 'Jack', lastName: 'Gunston', positions: ['FWD'] },
    { firstName: 'Luke', lastName: 'Breust', positions: ['FWD'] },
    { firstName: 'Conor', lastName: 'Nash', positions: ['MID'] },
    { firstName: 'Jack', lastName: 'Scrimshaw', positions: ['DEF'] },
    { firstName: 'Lloyd', lastName: 'Meek', positions: ['RUC'] },
    { firstName: 'Mitch', lastName: 'Lewis', positions: ['FWD'] },
    { firstName: 'Jarman', lastName: 'Impey', positions: ['DEF'] },
    { firstName: 'Karl', lastName: 'Amon', positions: ['MID'] },
  ],
  'Melbourne': [
    { firstName: 'Clayton', lastName: 'Oliver', positions: ['MID'] },
    { firstName: 'Christian', lastName: 'Petracca', positions: ['MID'] },
    { firstName: 'Max', lastName: 'Gawn', positions: ['RUC'] },
    { firstName: 'Steven', lastName: 'May', positions: ['DEF'] },
    { firstName: 'Jake', lastName: 'Lever', positions: ['DEF'] },
    { firstName: 'Angus', lastName: 'Brayshaw', positions: ['MID', 'DEF'] },
    { firstName: 'Ed', lastName: 'Langdon', positions: ['MID'] },
    { firstName: 'Jack', lastName: 'Viney', positions: ['MID'] },
    { firstName: 'Ben', lastName: 'Brown', positions: ['FWD'] },
    { firstName: 'Bayley', lastName: 'Fritsch', positions: ['FWD'] },
    { firstName: 'Kysaiah', lastName: 'Pickett', positions: ['FWD'] },
    { firstName: 'Tom', lastName: 'McDonald', positions: ['FWD', 'DEF'] },
    { firstName: 'Christian', lastName: 'Salem', positions: ['DEF'] },
  ],
  'North Melbourne': [
    { firstName: 'Luke', lastName: 'Davies-Uniacke', positions: ['MID'] },
    { firstName: 'Jy', lastName: 'Simpkin', positions: ['MID'] },
    { firstName: 'Harry', lastName: 'Sheezel', positions: ['DEF', 'MID'] },
    { firstName: 'Jason', lastName: 'Horne-Francis', positions: ['MID'] },
    { firstName: 'Tristan', lastName: 'Xerri', positions: ['RUC'] },
    { firstName: 'Nick', lastName: 'Larkey', positions: ['FWD'] },
    { firstName: 'Cameron', lastName: 'Zurhaar', positions: ['FWD'] },
    { firstName: 'Aidan', lastName: 'Corr', positions: ['DEF'] },
    { firstName: 'Ben', lastName: 'McKay', positions: ['DEF'] },
    { firstName: 'Bailey', lastName: 'Scott', positions: ['MID', 'DEF'] },
    { firstName: 'Jaidyn', lastName: 'Stephenson', positions: ['FWD'] },
    { firstName: 'George', lastName: 'Wardlaw', positions: ['MID'] },
    { firstName: 'Colby', lastName: 'McKercher', positions: ['MID'] },
  ],
  'Port Adelaide': [
    { firstName: 'Connor', lastName: 'Rozee', positions: ['MID', 'FWD'] },
    { firstName: 'Zak', lastName: 'Butters', positions: ['MID'] },
    { firstName: 'Travis', lastName: 'Boak', positions: ['MID'] },
    { firstName: 'Ollie', lastName: 'Wines', positions: ['MID'] },
    { firstName: 'Dan', lastName: 'Houston', positions: ['DEF', 'MID'] },
    { firstName: 'Aliir', lastName: 'Aliir', positions: ['DEF'] },
    { firstName: 'Charlie', lastName: 'Dixon', positions: ['FWD'] },
    { firstName: 'Todd', lastName: 'Marshall', positions: ['FWD'] },
    { firstName: 'Jeremy', lastName: 'Finlayson', positions: ['FWD'] },
    { firstName: 'Darcy', lastName: 'Byrne-Jones', positions: ['DEF'] },
    { firstName: 'Scott', lastName: 'Lycett', positions: ['RUC'] },
    { firstName: 'Ryan', lastName: 'Burton', positions: ['DEF'] },
    { firstName: 'Willem', lastName: 'Drew', positions: ['MID'] },
  ],
  'Richmond': [
    { firstName: 'Dustin', lastName: 'Martin', positions: ['MID', 'FWD'] },
    { firstName: 'Shai', lastName: 'Bolton', positions: ['MID', 'FWD'] },
    { firstName: 'Tim', lastName: 'Taranto', positions: ['MID'] },
    { firstName: 'Dion', lastName: 'Prestia', positions: ['MID'] },
    { firstName: 'Dylan', lastName: 'Grimes', positions: ['DEF'] },
    { firstName: 'Nick', lastName: 'Vlastuin', positions: ['DEF'] },
    { firstName: 'Daniel', lastName: 'Rioli', positions: ['DEF', 'FWD'] },
    { firstName: 'Tom', lastName: 'Lynch', positions: ['FWD'] },
    { firstName: 'Toby', lastName: 'Nankervis', positions: ['RUC'] },
    { firstName: 'Noah', lastName: 'Balta', positions: ['DEF', 'FWD'] },
    { firstName: 'Liam', lastName: 'Baker', positions: ['DEF', 'MID'] },
    { firstName: 'Jack', lastName: 'Graham', positions: ['MID'] },
    { firstName: 'Jack', lastName: 'Riewoldt', positions: ['FWD'] },
  ],
  'St Kilda': [
    { firstName: 'Jack', lastName: 'Steele', positions: ['MID'] },
    { firstName: 'Brad', lastName: 'Crouch', positions: ['MID'] },
    { firstName: 'Jade', lastName: 'Gresham', positions: ['MID', 'FWD'] },
    { firstName: 'Jack', lastName: 'Sinclair', positions: ['MID', 'DEF'] },
    { firstName: 'Nasiah', lastName: 'Wanganeen-Milera', positions: ['DEF', 'MID'] },
    { firstName: 'Max', lastName: 'King', positions: ['FWD'] },
    { firstName: 'Tim', lastName: 'Membrey', positions: ['FWD'] },
    { firstName: 'Rowan', lastName: 'Marshall', positions: ['RUC'] },
    { firstName: 'Callum', lastName: 'Wilkie', positions: ['DEF'] },
    { firstName: 'Dougal', lastName: 'Howard', positions: ['DEF'] },
    { firstName: 'Zak', lastName: 'Jones', positions: ['MID'] },
    { firstName: 'Marcus', lastName: 'Windhager', positions: ['MID'] },
    { firstName: 'Josh', lastName: 'Battle', positions: ['DEF', 'FWD'] },
  ],
  'Sydney Swans': [
    { firstName: 'Isaac', lastName: 'Heeney', positions: ['MID', 'FWD'] },
    { firstName: 'Chad', lastName: 'Warner', positions: ['MID'] },
    { firstName: 'Errol', lastName: 'Gulden', positions: ['MID'] },
    { firstName: 'Callum', lastName: 'Mills', positions: ['MID', 'DEF'] },
    { firstName: 'Jake', lastName: 'Lloyd', positions: ['DEF'] },
    { firstName: 'Dane', lastName: 'Rampe', positions: ['DEF'] },
    { firstName: 'Lance', lastName: 'Franklin', positions: ['FWD'] },
    { firstName: 'Logan', lastName: 'McDonald', positions: ['FWD'] },
    { firstName: 'Tom', lastName: 'Papley', positions: ['FWD'] },
    { firstName: 'Will', lastName: 'Hayward', positions: ['FWD'] },
    { firstName: 'Brodie', lastName: 'Grundy', positions: ['RUC'] },
    { firstName: 'Tom', lastName: 'McCartin', positions: ['DEF'] },
    { firstName: 'Nick', lastName: 'Blakey', positions: ['FWD', 'DEF'] },
  ],
  'West Coast Eagles': [
    { firstName: 'Tim', lastName: 'Kelly', positions: ['MID'] },
    { firstName: 'Elliot', lastName: 'Yeo', positions: ['MID'] },
    { firstName: 'Andrew', lastName: 'Gaff', positions: ['MID'] },
    { firstName: 'Dom', lastName: 'Sheed', positions: ['MID'] },
    { firstName: 'Liam', lastName: 'Duggan', positions: ['MID', 'DEF'] },
    { firstName: 'Oscar', lastName: 'Allen', positions: ['FWD'] },
    { firstName: 'Jake', lastName: 'Waterman', positions: ['FWD'] },
    { firstName: 'Josh', lastName: 'Kennedy', positions: ['FWD'] },
    { firstName: 'Nic', lastName: 'Naitanui', positions: ['RUC'] },
    { firstName: 'Jeremy', lastName: 'McGovern', positions: ['DEF'] },
    { firstName: 'Tom', lastName: 'Barrass', positions: ['DEF'] },
    { firstName: 'Shannon', lastName: 'Hurn', positions: ['DEF'] },
    { firstName: 'Jack', lastName: 'Darling', positions: ['FWD'] },
  ],
  'Western Bulldogs': [
    { firstName: 'Marcus', lastName: 'Bontempelli', positions: ['MID'] },
    { firstName: 'Adam', lastName: 'Treloar', positions: ['MID'] },
    { firstName: 'Tom', lastName: 'Liberatore', positions: ['MID'] },
    { firstName: 'Bailey', lastName: 'Smith', positions: ['MID'] },
    { firstName: 'Jack', lastName: 'Macrae', positions: ['MID'] },
    { firstName: 'Aaron', lastName: 'Naughton', positions: ['FWD'] },
    { firstName: 'Jamarra', lastName: 'Ugle-Hagan', positions: ['FWD'] },
    { firstName: 'Tim', lastName: 'English', positions: ['RUC'] },
    { firstName: 'Caleb', lastName: 'Daniel', positions: ['DEF', 'MID'] },
    { firstName: 'Bailey', lastName: 'Dale', positions: ['DEF'] },
    { firstName: 'Alex', lastName: 'Keath', positions: ['DEF'] },
    { firstName: 'Lachie', lastName: 'Hunter', positions: ['MID'] },
    { firstName: 'Cody', lastName: 'Weightman', positions: ['FWD'] },
  ],
}

// Sicko League fantasy clubs
const fantasyClubs = [
  { name: 'The Sickos', abbreviation: 'SCK' },
  { name: 'Ball Hoggers', abbreviation: 'BHG' },
  { name: 'Midfield Maulers', abbreviation: 'MFM' },
  { name: 'Ruckus Makers', abbreviation: 'RKM' },
  { name: 'Forward Press', abbreviation: 'FWP' },
  { name: 'Back Line Bandits', abbreviation: 'BLB' },
  { name: 'Fantasy Flops', abbreviation: 'FLO' },
  { name: 'Bench Warmers', abbreviation: 'BWM' },
]

async function main() {
  console.log('🏈 Starting Sicko League database seed...\n')

  // Clear existing data (in reverse order of dependencies)
  console.log('🧹 Clearing existing data...')
  await prisma.matchPlayerScore.deleteMany()
  await prisma.homeGameResult.deleteMany()
  await prisma.rosterHistory.deleteMany()
  await prisma.rosterPlayer.deleteMany()
  await prisma.tradeAsset.deleteMany()
  await prisma.trade.deleteMany()
  await prisma.contractOffer.deleteMany()
  await prisma.rfaPlayer.deleteMany()
  await prisma.staffContract.deleteMany()
  await prisma.contract.deleteMany()
  await prisma.draftPick.deleteMany()
  await prisma.draftEligibility.deleteMany()
  await prisma.match.deleteMany()
  await prisma.rival.deleteMany()
  await prisma.standing.deleteMany()
  await prisma.seasonResult.deleteMany()
  await prisma.round.deleteMany()
  await prisma.season.deleteMany()
  await prisma.staff.deleteMany()
  await prisma.aflPlayer.deleteMany()
  await prisma.aflTeam.deleteMany()
  await prisma.club.deleteMany()
  await prisma.coach.deleteMany()

  // Seed AFL Teams
  console.log('🏟️  Creating AFL teams...')
  const createdTeams: Record<string, string> = {}
  for (const team of aflTeams) {
    const created = await prisma.aflTeam.create({
      data: {
        name: team.name,
        abbreviation: team.abbreviation,
        currentLadderPos: aflTeams.indexOf(team) + 1, // Temporary ladder position
      },
    })
    createdTeams[team.name] = created.id
  }
  console.log(`   ✓ Created ${aflTeams.length} AFL teams`)

  // Seed AFL Players
  console.log('👤 Creating AFL players...')
  let playerCount = 0
  const allPlayers: Array<{ id: string; firstName: string; lastName: string; positions: Position[] }> = []

  for (const [teamName, players] of Object.entries(aflPlayersByTeam)) {
    const teamId = createdTeams[teamName]
    for (const player of players) {
      const created = await prisma.aflPlayer.create({
        data: {
          firstName: player.firstName,
          lastName: player.lastName,
          positions: player.positions,
          aflTeamId: teamId,
          status: PlayerStatus.ACTIVE,
          isAvailable: true,
        },
      })
      allPlayers.push({ ...player, id: created.id })
      playerCount++
    }
  }
  console.log(`   ✓ Created ${playerCount} AFL players`)

  // Seed Staff
  console.log('👔 Creating coaching staff...')
  let staffCount = 0
  for (const [teamName, teamId] of Object.entries(createdTeams)) {
    await prisma.staff.create({
      data: {
        name: `${teamName.split(' ')[0]} Assistant`,
        role: 'ASSISTANT_COACH',
        aflTeamId: teamId,
        isAvailable: true,
      },
    })
    await prisma.staff.create({
      data: {
        name: `${teamName.split(' ')[0]} List Mgr`,
        role: 'LIST_MANAGER',
        aflTeamId: teamId,
        isAvailable: true,
      },
    })
    staffCount += 2
  }
  console.log(`   ✓ Created ${staffCount} staff members`)

  // Seed Fantasy Clubs
  console.log('🏆 Creating fantasy clubs...')
  const createdClubs: string[] = []
  for (const club of fantasyClubs) {
    const created = await prisma.club.create({
      data: {
        name: club.name,
        abbreviation: club.abbreviation,
      },
    })
    createdClubs.push(created.id)
  }
  console.log(`   ✓ Created ${fantasyClubs.length} fantasy clubs`)

  // Seed 2025 Season
  console.log('📅 Creating 2025 season...')
  const season = await prisma.season.create({
    data: {
      year: 2025,
      salaryCap: 750,
      status: SeasonStatus.UPCOMING,
      byeRounds: [12, 13, 14],
      finalsStartRound: 24,
      reservesBonusPool: { '1': 75, '2': 50, '3': 30, '4': 20, '5': 10 },
    },
  })
  console.log(`   ✓ Created 2025 season`)

  // Seed Rounds
  console.log('📆 Creating rounds...')
  const rounds: string[] = []
  for (let i = 1; i <= 27; i++) {
    let roundType: RoundType = RoundType.REGULAR
    if ([12, 13, 14].includes(i)) roundType = RoundType.BYE
    else if (i === 24) roundType = RoundType.FINALS_WK1
    else if (i === 25) roundType = RoundType.FINALS_WK2
    else if (i === 26 || i === 27) roundType = RoundType.FINALS_WK3

    const round = await prisma.round.create({
      data: {
        seasonId: season.id,
        roundNumber: i,
        roundType,
        status: RoundStatus.UPCOMING,
        isRule9Draft: i === 10, // Rule 9 draft at round 10
      },
    })
    rounds.push(round.id)
  }
  console.log(`   ✓ Created 27 rounds (incl. 3 bye rounds + finals)`)

  // Seed Draft Picks (3 rounds of picks for each club)
  console.log('🎯 Creating draft picks...')
  let pickNumber = 1
  for (let round = 1; round <= 3; round++) {
    for (let i = 0; i < createdClubs.length; i++) {
      await prisma.draftPick.create({
        data: {
          seasonId: season.id,
          draftType: DraftType.ANNUAL,
          round,
          pickNumber: pickNumber,
          originalClubId: createdClubs[i],
          currentClubId: createdClubs[i],
          used: false,
          passed: false,
        },
      })
      pickNumber++
    }
  }
  console.log(`   ✓ Created ${pickNumber - 1} draft picks`)

  // Seed Rule 9 Picks (1 per club)
  console.log('📋 Creating Rule 9 draft picks...')
  for (let i = 0; i < createdClubs.length; i++) {
    await prisma.draftPick.create({
      data: {
        seasonId: season.id,
        draftType: DraftType.RULE9,
        round: 1,
        pickNumber: i + 1,
        originalClubId: createdClubs[i],
        currentClubId: createdClubs[i],
        used: false,
        passed: false,
      },
    })
  }
  console.log(`   ✓ Created ${createdClubs.length} Rule 9 draft picks`)

  // Seed Standings (initialize at 0)
  console.log('📊 Creating standings...')
  for (const clubId of createdClubs) {
    await prisma.standing.create({
      data: {
        seasonId: season.id,
        clubId,
        competition: 'SENIORS',
        played: 0,
        wins: 0,
        losses: 0,
        draws: 0,
        pointsFor: 0,
        pointsAgainst: 0,
        percentage: 100,
      },
    })
    await prisma.standing.create({
      data: {
        seasonId: season.id,
        clubId,
        competition: 'RESERVES',
        played: 0,
        wins: 0,
        losses: 0,
        draws: 0,
        pointsFor: 0,
        pointsAgainst: 0,
        percentage: 100,
      },
    })
  }
  console.log(`   ✓ Created standings for ${createdClubs.length} clubs (Seniors + Reserves)`)

  console.log('\n✅ Database seed completed successfully!')
  console.log('\n📈 Summary:')
  console.log(`   • ${aflTeams.length} AFL teams`)
  console.log(`   • ${playerCount} AFL players`)
  console.log(`   • ${staffCount} staff members`)
  console.log(`   • ${fantasyClubs.length} fantasy clubs`)
  console.log(`   • 1 season (2025)`)
  console.log(`   • 27 rounds`)
  console.log(`   • ${pickNumber - 1 + createdClubs.length} draft picks`)
}

main()
  .catch((e) => {
    console.error('❌ Seed failed:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
