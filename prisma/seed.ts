import { PrismaClient, Position, PlayerStatus, SeasonStatus, RoundType, RoundStatus, DraftType, MarketSize, VenueClass } from '@prisma/client'
import 'dotenv/config'

const prisma = new PrismaClient()

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

// Sicko League fantasy clubs with seniors and reserves branding
// Fantasy clubs named after their cities (City + Mascot style, like AFL teams)
const fantasyClubs = [
  {
    name: 'Ashford Sickos',
    abbreviation: 'ASH',
    reservesName: 'Millbrook Symptoms',
    reservesAbbreviation: 'MIL',
    primaryColor: '#1a1a2e',
    secondaryColor: '#eaeaea',
    founded: 1864,
    history: `Founded in the bitter winter of 1864, the Ashford Sickos emerged from the slums of the northern industrial district. Factory workers from textile mills, foundries, and slaughterhouses banded together to form a club that would give them something to live for beyond grueling six-day work weeks.

The name "Sickos" was thrust upon them by wealthy southerners who mocked their pale, gaunt appearances—the toll of working in poorly ventilated factories. Rather than shrink from the insult, they embraced it. "We're sick of poverty, sick of being looked down on, and we'll make you sick when we beat you," declared founding captain Thomas Crane.

Their first premiership in 1879 sparked celebrations that shut down the factories for a day. The club's fortunes have waxed and waned with Ashford's economy—the deindustrialization of the 1980s nearly killed them—but the tech boom has brought new wealth. Today's Sickos are a strange hybrid: old-school supporters who remember the hard times alongside tech millionaires in vintage jerseys.

The reserves, the Millbrook Symptoms, train at the quiet village oval 30 minutes from the city—a deliberate contrast where young players develop away from the spotlight.`
  },
  {
    name: 'Ashford Hoggers',
    abbreviation: 'AHG',
    reservesName: 'Coalfield Piglets',
    reservesAbbreviation: 'COA',
    primaryColor: '#ff6b6b',
    secondaryColor: '#ffffff',
    founded: 1873,
    history: `The Ashford Hoggers were established in 1873 by the merchant families of southern Ashford—men who owned the factories where Sickos supporters toiled. The "Hoggers" name came from accusations that the club hogged the best players by outspending everyone else. The accusation was accurate then and remains accurate today.

The north-south rivalry with the Sickos crystallized into one of football's fiercest feuds. It's class warfare disguised as sport: old money versus workers, establishment versus outsiders. The 1891 derby sparked actual riots; the 1903 match ended with a duel between club presidents (both survived, barely).

The Hoggers have always been controversial—accused of buying premierships, poaching youth talent, bending every rule. They've also won more than anyone else. Success breeds resentment, and the Hoggers wear that resentment as a badge of honor.

Their reserves, the Coalfield Piglets, operate from the former mining town where the Hoggers have strategically recruited working-class talent for decades—a pipeline into Sickos territory that keeps the rivalry simmering.`
  },
  {
    name: 'Riverside Maulers',
    abbreviation: 'RIV',
    reservesName: 'Saltwater Bay Crew',
    reservesAbbreviation: 'SAL',
    primaryColor: '#4ecdc4',
    secondaryColor: '#1a1a1a',
    founded: 1861,
    history: `The Riverside Maulers trace their origins to 1861, when a group of dockworkers formed what they called a "football club" but what most observers considered organized violence. Early Maulers matches were brutal affairs—referees feared for their safety, and opposing players often required medical attention.

The club has never apologized for its reputation. The motto "No Mercy" is taken literally. Maulers teams across generations have been hard, ruthless, and uncompromising. Critics call them thugs; supporters call them warriors.

The harbour has always defined them. The original ground was on the docks, players trained by lifting cargo, and immigrant communities from the waterfront shaped a club that prizes toughness above all else. The Maulers remain the only club that still mandates pre-season dock work for all players.

The reserves, Saltwater Bay Crew, train in the Portuguese fishing village where ocean swimming and early mornings on boats build the legendary endurance that Maulers teams are famous for.`
  },
  {
    name: 'Riverside Ruckus',
    abbreviation: 'RRK',
    reservesName: 'Northbridge Tappers',
    reservesAbbreviation: 'NOR',
    primaryColor: '#45b7d1',
    secondaryColor: '#ffffff',
    founded: 1867,
    history: `In 1867, railway workers on the north side of the harbour grew tired of watching dockworkers dominate local football. They formed the Riverside Ruckus—a name that perfectly describes both the noise their supporters make and their chaotic, unpredictable style of play.

Where the Maulers are methodically violent, the Ruckus are joyfully anarchic. Their founding principle was simple: if you can't outmuscle the dockworkers, outwit them. The resulting style—all flair, movement, and improvisation—has made them the league's most entertaining side when things click.

The harbour rivalry has shaped both clubs for over 150 years. Riverside is divided—literally by the water, culturally by allegiance. Families have split, businesses been boycotted, friendships ended forever. The annual derby remains the most anticipated fixture in the competition.

The reserves, Northbridge Tappers, are based in the gritty industrial port where "tough as Northbridge" is the highest compliment. Softness is not tolerated.`
  },
  {
    name: 'Glendale Pressers',
    abbreviation: 'GLE',
    reservesName: 'Sunvale Kickers',
    reservesAbbreviation: 'SUN',
    primaryColor: '#f9ca24',
    secondaryColor: '#1a1a1a',
    founded: 1952,
    history: `The Glendale Pressers were born in 1952, founded by Victorian migrants who brought their football obsession to rugby league territory. For years they were mocked as southern interlopers playing the wrong code.

The "Pressers" name came from their distinctive style—relentless forward pressure enabled by year-round training in Queensland's perfect weather. While southern teams shivered through winter, the Pressers ran and ran.

The transformation from outsiders to establishment took decades. The Glendale Dome, opened in 2003, was the turning point—suddenly they had a venue that made summer football comfortable. Membership exploded. The Pressers became the model for football's northern expansion.

The reserves, Sunvale Kickers, train in the tropical farming district where the humidity is deliberate torture. If you can train in Sunvale's summer, you can play anywhere.`
  },
  {
    name: 'Westbrook Bandits',
    abbreviation: 'WES',
    reservesName: 'Redgum Rangers',
    reservesAbbreviation: 'RED',
    primaryColor: '#6c5ce7',
    secondaryColor: '#ffffff',
    founded: 1919,
    history: `The Westbrook Bandits were founded in 1919 by returned soldiers from the Great War, men who'd been given farming land in the newly opened district. Shell-shocked and restless, they channeled their energy into football.

The "Bandits" name came from their opportunistic playing style—stealing the ball, stealing wins, stealing joy from opponents. For fifty years they were a country league team, playing against other farming communities.

Then Melbourne's suburban sprawl reached Westbrook in the 1970s. Suddenly the country club was in the city. The population exploded, and so did the supporter base. Today's Bandits represent the suburban dream: young families, affordable mortgages, and a team that belongs to everyone priced out of the inner city.

The reserves, Redgum Rangers, train in the timber town where the hilly terrain builds extraordinary running power and the country atmosphere keeps young players grounded.`
  },
  {
    name: 'Kingsley Flops',
    abbreviation: 'KIN',
    reservesName: 'Vinehurst Donuts',
    reservesAbbreviation: 'VIN',
    primaryColor: '#fd79a8',
    secondaryColor: '#1a1a1a',
    founded: 1866,
    history: `German Lutheran settlers established the Kingsley Flops in 1866, bringing their love of football along with their expertise in winemaking. The "Flops" name was originally an insult—critics said their elaborate playing style produced lots of falls and few goals.

The club found the criticism amusing and adopted it. Kingsley has always been the "cultured" club: beautiful oval, sophisticated members, aesthetically pleasing football. They've been accused of caring more about how they play than whether they win—a charge that's not entirely unfair.

But don't mistake refinement for weakness. The Flops have won their share of premierships, and their player development program—which emphasizes skill over strength—is the envy of the league. They take raw talent and turn it into artists.

The reserves, Vinehurst Donuts, train in a postcard-perfect village where the pace of life teaches patience. Young players learn that development takes time.`
  },
  {
    name: 'Beachport Warmers',
    abbreviation: 'BEA',
    reservesName: 'Dunes End Riders',
    reservesAbbreviation: 'DUN',
    primaryColor: '#a29bfe',
    secondaryColor: '#1a1a1a',
    founded: 1928,
    history: `The Beachport Warmers were founded in 1928 by local lifesavers on Western Australia's stunning Indian Ocean coast. The "Warmers" name is ironic—Beachport is famous for its powerful surf and occasional great white shark, and the club's initiation ritual involves a dawn swim regardless of what's been spotted.

The isolated WA beach lifestyle shapes everything about the Warmers. Training ends at the water. Players must be competent surfers. The club's famous calm under pressure comes from athletes who've learned to read the Indian Ocean's massive swells and respect its power.

Critics have always underestimated the Warmers—they look too relaxed, too casual, too interested in the beach to be serious about football. The long flights to away games should tire them out. Instead, those critics are routinely surprised when the Warmers run over them in the final quarter.

The reserves, Dunes End Riders, are based in a hamlet so remote there's literally nothing to do but train and surf. The isolation focuses the mind wonderfully.`
  },
  {
    name: 'Thornton Markers',
    abbreviation: 'THO',
    reservesName: 'Orchard Vale Flyers',
    reservesAbbreviation: 'ORC',
    primaryColor: '#00b894',
    secondaryColor: '#ffffff',
    founded: 1859,
    history: `The Thornton Markers are among the oldest clubs in Australian football, established in 1859 when Tasmania was still a separate colony. The "Markers" name came from their specialty: contested marking in the cold, wet conditions that favor strong overhead players.

For over 160 years, the Markers have represented Tasmanian pride against mainland clubs who look down on the island state. The chip on the shoulder is enormous and completely justified—Tasmania produces extraordinary footballers, and the Markers have been proving it since before most other clubs existed.

Isolation has made Thornton fiercely independent. They can't rely on big sponsorships or massive crowds, so they've built a culture of self-reliance. Players who come through the Markers system know how to handle adversity.

The reserves, Orchard Vale Flyers, train in the apple-farming valley where young players work the harvest in the off-season. It builds strength, humility, and appreciation for honest work.`
  },
  {
    name: 'Ironbark Kings',
    abbreviation: 'IRO',
    reservesName: 'Dusty Creek Princes',
    reservesAbbreviation: 'DUS',
    primaryColor: '#e17055',
    secondaryColor: '#ffffff',
    founded: 1907,
    history: `The Ironbark Kings were founded in 1907 by coal miners in the Hunter Valley who needed entertainment after long shifts underground. The "Kings" name was aspirational—they were anything but royalty, covered in coal dust and playing football on fields surrounded by slag heaps.

For decades, the Kings were overshadowed by the Sydney clubs, seen as country cousins despite the growing wealth beneath their feet. But coal money eventually made Ironbark prosperous, and the Kings have leveraged that into modern facilities.

The mining heritage runs deep—the jersey still features a miner's helmet, and every player visits a working mine to understand where the club's identity comes from. The gritty determination of the coal miners lives on in every contest.

The reserves, Dusty Creek Princes, train in a former mining camp in the hills. The isolation teaches focus and the work ethic of the coalfields.`
  },
  {
    name: 'Hillcrest Fifties',
    abbreviation: 'HIL',
    reservesName: 'Pine Ridge Attackers',
    reservesAbbreviation: 'PIN',
    primaryColor: '#0984e3',
    secondaryColor: '#ffffff',
    founded: 1955,
    history: `The Hillcrest Fifties were founded in 1955 in a small mountain town that never expected to compete at the highest level. The "Fifties" name commemorates both their founding decade and their ground's 550-meter elevation.

The Fifties have always been underdogs. Too small, too remote, too poor—every year, experts predict they'll be overwhelmed by bigger, richer clubs. Every year, they survive and occasionally thrive.

The secret is community. Every child in Hillcrest plays for the Fifties juniors. Every business sponsors the club. Every resident attends games. The intense local support creates an atmosphere that bigger clubs simply cannot match.

The reserves, Pine Ridge Attackers, train at 800 meters elevation in a village accessible only by winding mountain road. The altitude training produces players with legendary endurance.`
  },
  {
    name: 'Ferndale Rebels',
    abbreviation: 'FER',
    reservesName: 'Hayfield Defenders',
    reservesAbbreviation: 'HAY',
    primaryColor: '#636e72',
    secondaryColor: '#dfe6e9',
    founded: 1883,
    history: `The Ferndale Rebels were founded in 1883 after a furious dispute with the regional football association over player eligibility. Rather than accept the ruling, Ferndale declared independence and formed their own club. They've been "rebels" ever since.

With just 95,000 people, Ferndale is the smallest market in the competition. They can't outspend anyone, can't attract star players with big contracts, can't fill a stadium with corporate hospitality. What they can do is develop talent from the farming community around them.

Ferndale players are famously tough, humble, and team-oriented. They're raised on farms where work starts before dawn and nobody complains. They play football the same way: hard work, no excuses, everything for the team.

The reserves, Hayfield Defenders, train at the tiniest venue in professional football—a farming hamlet where the grandstand seats 200 and everyone knows every player by name.`
  },
]

// Fictional Australian-style cities with full histories
const cities: Array<{
  name: string;
  state: string;
  marketSize: MarketSize;
  population: number;
  description: string;
  founded: number;
  history: string;
}> = [
  {
    name: 'Ashford',
    state: 'VIC',
    marketSize: 'MAJOR',
    population: 3200000,
    description: 'Tech boom capital where tradition meets innovation—everyone wants to live here.',
    founded: 1835,
    history: `Ashford was established in 1835 as a wool trading post on the banks of the Ashford River. The discovery of gold in 1851 transformed it into a booming metropolis almost overnight. By the 1880s, Ashford had become the industrial heart of the colony, with massive textile mills, foundries, and railway workshops employing tens of thousands.

The city's working-class roots bred a fierce football culture. Factory workers formed the first clubs in the 1870s, playing on dusty paddocks during lunch breaks. The rivalry between the industrial north (where the Sickos emerged) and the merchant south (home of the Hoggers) dates back over 150 years.

But Ashford's greatest transformation came in the 2010s. The old warehouse districts became startup incubators. International tech giants established headquarters. The population exploded from 2 million to 3.2 million in just fifteen years as young professionals from across the world flooded in, drawn by the booming economy and the famous livability.

Today, Ashford is the tech capital of the southern hemisphere, home to more unicorn startups than anywhere outside Silicon Valley. Craft breweries occupy former factories. Software engineers pack the terraces at Ashford Arena. The old working-class supporters eye the newcomers suspiciously, but there's no denying the energy. Property prices are insane, the traffic is worse, and absolutely everyone wants to be here.

The football clubs have benefited enormously—tech money means massive sponsorships, and the influx of cashed-up fans has sent membership soaring. But there's tension too: long-time supporters resent being priced out of games, and the demographic shift has changed the character of match days. The question for Ashford's clubs is whether they can embrace the boom without losing their soul.`
  },
  {
    name: 'Riverside',
    state: 'NSW',
    marketSize: 'MAJOR',
    population: 2500000,
    description: 'Harbour city with fierce local pride and waterfront stadiums.',
    founded: 1842,
    history: `Riverside began as a convict settlement in 1842, strategically positioned where the Darling River meets the sea. The natural deep-water harbour made it essential for colonial shipping, and the city grew wealthy on wool exports and later coal.

Football arrived with immigrant workers in the 1860s. The dockworkers formed the Maulers in 1878, playing a brutal, physical style that terrified opponents. The Ruckus emerged from the railway workshops in 1882, and the two clubs have been at war ever since.

The harbour divides the city both geographically and tribally. Cross the Riverside Bridge wearing the wrong colours and you'll hear about it. The city's 2.5 million residents maintain a rivalry that has seen everything from street brawls to political scandals. Match day in Riverside is not for the faint-hearted.`
  },
  {
    name: 'Glendale',
    state: 'QLD',
    marketSize: 'LARGE',
    population: 850000,
    description: 'Sunshine state football capital with year-round perfect weather.',
    founded: 1862,
    history: `Glendale was carved from subtropical bushland in 1862 by sugar cane farmers seeking fortune in the rich coastal soils. The town grew steadily, boosted by the arrival of the railway in 1889 and the discovery of bauxite in the nearby ranges.

Football came late to Glendale—the locals preferred cricket and rugby league until the 1950s. But when the Pressers were founded in 1958 by a group of Victorian migrants, they brought southern passion to the sunshine state. The climate allowed year-round training, and Glendale soon became known for producing supremely fit athletes.

The Glendale Dome, opened in 2003, gave the city a world-class venue that hosts not just football but concerts and events that have put Glendale on the national stage.`
  },
  {
    name: 'Westbrook',
    state: 'VIC',
    marketSize: 'LARGE',
    population: 720000,
    description: 'Outer suburbs growth corridor, family-oriented fan base.',
    founded: 1924,
    history: `Westbrook barely existed before the 1920s—just a few dairy farms and a general store at a crossroads. The soldier settlement scheme after World War I brought thousands of returned servicemen to carve farms from the bush, and a town grew to service them.

The Westbrook Football Club was founded in 1926 in a tin shed behind the pub. For decades, it was a country league team, playing against other farming communities. But Melbourne's suburban sprawl reached Westbrook in the 1970s, and suddenly the town became a city.

Today, Westbrook is home to 720,000 people, many of them young families seeking affordable housing. The Bandits have become their team—a club that represents battlers made good, suburban dreams, and the belief that you don't need a fancy postcode to win.`
  },
  {
    name: 'Kingsley',
    state: 'SA',
    marketSize: 'MEDIUM',
    population: 450000,
    description: 'Wine region city with cultured supporters and historic oval.',
    founded: 1839,
    history: `German Lutheran settlers founded Kingsley in 1839, bringing their expertise in viticulture to the perfect soils of the Kingsley Valley. Within decades, Kingsley wines were winning international awards, and the town became synonymous with culture and refinement.

The Kingsley Football Club, founded in 1871, has always been considered the "gentleman's club" of the league. Their oval, set among ancient gum trees with vineyards visible in the distance, is regarded as the most beautiful ground in the competition.

Don't let the sophistication fool you—Kingsley supporters are as passionate as any. They just express it differently, with wine appreciation societies that double as supporter groups and a club song written by a nineteenth-century German composer.`
  },
  {
    name: 'Beachport',
    state: 'WA',
    marketSize: 'MEDIUM',
    population: 380000,
    description: 'Western Australian coastal town where surfing meets football.',
    founded: 1901,
    history: `Beachport was nothing but sand dunes and pearling luggers until the railway connected it to the goldfields in 1901. Prospectors discovered its pristine Indian Ocean beaches offered respite from the red dust, and a holiday town was born.

The isolation of Western Australia shaped Beachport's character—remote, self-reliant, and blessed with some of the best waves on Earth. The Warmers, founded in 1928, are the most laid-back team in the competition. Training sessions end at the beach. Players surf before games. The club mascot is a seagull.

But there's steel beneath the sand. Beachport has produced some of the toughest players in league history—athletes hardened by swimming in shark-infested waters and blessed with the reflexes of surfers reading the Indian Ocean's powerful swells. The isolation means players are used to long travel and self-sufficiency. Underestimate the Warmers at your peril.`
  },
  {
    name: 'Thornton',
    state: 'TAS',
    marketSize: 'SMALL',
    population: 180000,
    description: 'Apple Isle outpost with tight-knit community support.',
    founded: 1828,
    history: `Thornton is one of the oldest European settlements in Australia, established as a military outpost in 1828. The harsh conditions bred hard people, and when the apple orchards were planted in the 1860s, they attracted workers who weren't afraid of difficult labor.

The Thornton Football Club was founded in 1869, making it one of the oldest in the nation. For over 150 years, the Markers have represented Tasmanian pride against mainland clubs who often looked down on the island state.

Isolation has made Thornton fiercely independent. The town of 180,000 punches well above its weight, producing a disproportionate number of elite players. There's something about the cold winters, the mountain training runs, and the chip on the shoulder that creates champions.`
  },
  {
    name: 'Ironbark',
    state: 'NSW',
    marketSize: 'MEDIUM',
    population: 420000,
    description: 'Mining money fuels this Hunter Valley coal town.',
    founded: 1895,
    history: `Ironbark sprang up around coal seams in the Hunter Valley in 1895. The black gold beneath the hills attracted thousands of miners from across the world, and a tough, multicultural community formed around the pit heads.

The Kings were founded in 1907 by mine workers who wanted entertainment after long shifts underground. The "Kings" name was aspirational—they were anything but royalty, covered in coal dust and playing football on fields surrounded by slag heaps.

Coal money eventually made Ironbark prosperous, and the Kings have leveraged that wealth into modern facilities. But the mining heritage runs deep—the jersey still features a miner's helmet, and every player visits a working mine to understand where the club's identity comes from. The gritty determination of the coal miners lives on in every contest.`
  },
  {
    name: 'Hillcrest',
    state: 'NSW',
    marketSize: 'SMALL',
    population: 150000,
    description: 'Mountains gateway town with classic underdog spirit.',
    founded: 1878,
    history: `Hillcrest was founded by timber cutters in 1878, perched in the foothills where the coastal plain meets the Great Dividing Range. The town grew as a supply point for mountain explorers and later as a refuge for city dwellers seeking clean air.

The Fifties—named for the club's founding in 1950 and their home ground's elevation of 550 meters—have always been outsiders. Too small to attract big-name players, too far from the city to generate major sponsorship, they've survived on pure community spirit.

Every Hillcrest child grows up playing for the Fifties juniors. The club is the town's identity, its social center, its reason for existence. On match days, the population effectively doubles as the surrounding mountain communities descend to support their team.`
  },
  {
    name: 'Ferndale',
    state: 'VIC',
    marketSize: 'SMALL',
    population: 95000,
    description: 'Country farming town, grassroots football heartland.',
    founded: 1856,
    history: `Ferndale was established in 1856 when the Robertson family drove their cattle herd into the lush valley and decided to stay. Other farming families followed, and a classic Australian country town took shape around the general store, the pub, and the football oval.

The Rebels were founded in 1889 after a dispute with the regional football association over player eligibility. Rather than back down, Ferndale formed their own club and declared themselves "rebels" against the establishment. The name stuck.

With just 95,000 people, Ferndale is the smallest market in the competition. But the farming community produces remarkably talented athletes—strong from manual labor, humble from rural upbringing, and desperate to prove that country kids can compete with anyone.`
  },
]

// Towns near each city for reserves teams
const towns: Array<{
  name: string;
  state: string;
  nearCityName: string;
  population: number;
  description: string;
  founded: number;
  history: string;
}> = [
  {
    name: 'Millbrook',
    state: 'VIC',
    nearCityName: 'Ashford',
    population: 12000,
    description: 'Quiet farming community in Ashford\'s shadow.',
    founded: 1848,
    history: `Millbrook was established in 1848 around a flour mill on the creek that bears its name. For over a century, it supplied bread to Ashford's growing population while maintaining its village character. When the Sickos needed a home for their reserves in 1952, Millbrook's oval—with its ancient oak trees and white picket fence—was the obvious choice. The town embraced its role, and generations of young players have cut their teeth on Millbrook's bumpy surface before graduating to Ashford Arena.`
  },
  {
    name: 'Coalfield',
    state: 'VIC',
    nearCityName: 'Ashford',
    population: 8500,
    description: 'Former mining village turned commuter suburb.',
    founded: 1862,
    history: `Coalfield's seams of black coal powered Ashford's industrial revolution. The mines closed in 1978, but the tough community spirit remained. The Hoggers established their reserves here in 1965, and Coalfield has produced an extraordinary number of first-team players—perhaps because growing up in a mining town, even a former one, breeds a certain hardness.`
  },
  {
    name: 'Saltwater Bay',
    state: 'NSW',
    nearCityName: 'Riverside',
    population: 15000,
    description: 'Fishing village with strong maritime traditions.',
    founded: 1856,
    history: `Saltwater Bay was established by Portuguese fishermen in 1856. The village clings to a rocky headland, its colorful boats bobbing in the harbor. The Maulers chose Saltwater Bay for their reserves in 1948, attracted by the ocean air and the fishermen's work ethic. Players who train at Saltwater Bay run on the beach at dawn, building the endurance that Maulers teams are famous for.`
  },
  {
    name: 'Northbridge',
    state: 'NSW',
    nearCityName: 'Riverside',
    population: 22000,
    description: 'Industrial port town with gritty character.',
    founded: 1871,
    history: `Northbridge grew around the coal loading facilities north of Riverside's main harbor. It was always the rougher cousin—dockworkers, factory hands, people who worked with their hands. The Ruckus established their reserves here in 1959, and the town's no-nonsense attitude has shaped countless players. "Northbridge tough" is a compliment in football circles.`
  },
  {
    name: 'Sunvale',
    state: 'QLD',
    nearCityName: 'Glendale',
    population: 6000,
    description: 'Tropical fruit farming community.',
    founded: 1891,
    history: `Sunvale's mango and pineapple farms have fed Queensland for over a century. The town bakes under tropical sun, and the Pressers have used this to their advantage since establishing their reserves here in 1972. Summer training in Sunvale is brutal—but players who survive it are ready for anything.`
  },
  {
    name: 'Redgum',
    state: 'VIC',
    nearCityName: 'Westbrook',
    population: 4500,
    description: 'Timber town in the foothills.',
    founded: 1908,
    history: `Redgum was carved from the forest by timber cutters in 1908. The massive redgum trees that gave the town its name are mostly gone, but the sawmill still operates, and the town retains its frontier character. The Bandits established their reserves here in 1978, and the hilly terrain has produced players with extraordinary running power.`
  },
  {
    name: 'Vinehurst',
    state: 'SA',
    nearCityName: 'Kingsley',
    population: 3200,
    description: 'Picturesque village surrounded by vineyards.',
    founded: 1847,
    history: `Vinehurst is postcard-perfect: stone cottages, rolling vineyards, and a church steeple visible for miles. The village has hosted Kingsley's reserves since 1923, and the arrangement suits both parties. Vinehurst gets visitors on match days; the Flops get a training ground where the air smells of fermenting grapes and the pace of life encourages patience—essential for developing young players.`
  },
  {
    name: 'Dunes End',
    state: 'WA',
    nearCityName: 'Beachport',
    population: 2800,
    description: 'Remote Western Australian beach hamlet at the end of the coast road.',
    founded: 1934,
    history: `Dunes End is where the sealed road stops and the Indian Ocean begins. Established as a pearling and fishing camp in 1934, it never grew much—which is exactly how residents like it. The Warmers placed their reserves here in 1968, and the extreme isolation has created something special: a team that genuinely doesn't care about outside expectations, playing football for the pure joy of it while surrounded by some of the best surf breaks in Australia.`
  },
  {
    name: 'Orchard Vale',
    state: 'TAS',
    nearCityName: 'Thornton',
    population: 2100,
    description: 'Apple farming hamlet in a fertile valley.',
    founded: 1872,
    history: `Orchard Vale is exactly what it sounds like: a valley of apple orchards, established in 1872 and largely unchanged since. The Markers have run their reserves from Orchard Vale since 1931, using the off-season to have players work the harvest. There's nothing like picking apples all day to build hand strength and humility.`
  },
  {
    name: 'Dusty Creek',
    state: 'NSW',
    nearCityName: 'Ironbark',
    population: 1800,
    description: 'Former coal mining camp in the Hunter Valley hills.',
    founded: 1923,
    history: `Dusty Creek was supposed to be temporary—a camp for workers at a remote coal seam. But the mine kept producing, and the camp became a town. The Kings established their reserves here in 1978, and the isolation has become a feature. Players sent to Dusty Creek learn to focus on training away from city distractions, developing the mental toughness and work ethic that mining communities demand.`
  },
  {
    name: 'Pine Ridge',
    state: 'NSW',
    nearCityName: 'Hillcrest',
    population: 1500,
    description: 'Mountain village accessible only by winding road.',
    founded: 1912,
    history: `Pine Ridge sits at 800 meters elevation, reached by a road with 47 hairpin bends. The village was established by a commune in 1912 and has attracted alternative lifestylers ever since. The Fifties placed their reserves here in 1975, and the altitude training has produced players with legendary endurance. The thin air is murder, but it works.`
  },
  {
    name: 'Hayfield',
    state: 'VIC',
    nearCityName: 'Ferndale',
    population: 850,
    description: 'Tiny farming hamlet where everyone knows everyone.',
    founded: 1889,
    history: `Hayfield is barely a town—more a collection of farms with a pub in the middle. But the 850 residents are fiercely proud of their football connection. The Rebels have run their reserves from Hayfield since 1956, and the tiny ground has seen future champions take their first steps. In Hayfield, a talented youngster isn't just a football prospect—they're someone's grandson, someone's neighbor, someone the whole town has watched grow up.`
  },
]

// Senior venues (in cities)
const cityVenues: Array<{
  name: string;
  cityName: string;
  capacity: number;
  venueClass: VenueClass;
  atmosphereBonus: number;
  description: string;
  opened: number;
  history: string;
}> = [
  {
    name: 'Ashford Arena',
    cityName: 'Ashford',
    capacity: 92000,
    venueClass: 'ELITE',
    atmosphereBonus: 3.0,
    description: 'Iconic 92,000-seat cathedral of football.',
    opened: 1956,
    history: 'Built for the 1956 Olympics and expanded multiple times since. The roar of 92,000 fans creates an atmosphere that has broken many visiting teams.'
  },
  {
    name: 'Ashford Oval',
    cityName: 'Ashford',
    capacity: 35000,
    venueClass: 'STANDARD',
    atmosphereBonus: 1.0,
    description: 'Historic inner-city ground with character.',
    opened: 1882,
    history: 'The oldest continuously used football ground in the nation. The famous elm trees behind the northern stand have watched over 140 years of football.'
  },
  {
    name: 'Riverside Stadium',
    cityName: 'Riverside',
    capacity: 85000,
    venueClass: 'ELITE',
    atmosphereBonus: 3.0,
    description: 'Harbourside mega-stadium with stunning views.',
    opened: 1999,
    history: 'A controversial build that demolished historic warehouses, but the harbour views at sunset have made it one of the world\'s great sporting venues.'
  },
  {
    name: 'Riverside Park',
    cityName: 'Riverside',
    capacity: 28000,
    venueClass: 'STANDARD',
    atmosphereBonus: 1.0,
    description: 'Intimate suburban ground with loyal supporters.',
    opened: 1924,
    history: 'Built by volunteer labor during the Depression, Riverside Park retains a working-class authenticity that bigger stadiums can\'t match.'
  },
  {
    name: 'Glendale Dome',
    cityName: 'Glendale',
    capacity: 55000,
    venueClass: 'MAJOR',
    atmosphereBonus: 2.0,
    description: 'Climate-controlled dome perfect for Queensland summers.',
    opened: 2003,
    history: 'The first retractable-roof stadium in the southern hemisphere. Critics called it unnecessary; summer football in air conditioning proved them wrong.'
  },
  {
    name: 'Westbrook Park',
    cityName: 'Westbrook',
    capacity: 48000,
    venueClass: 'MAJOR',
    atmosphereBonus: 2.0,
    description: 'Modern family-friendly stadium in the suburbs.',
    opened: 1998,
    history: 'Built on former farmland, Westbrook Park was designed with families in mind. The kids\' zone and affordable prices have created the next generation of fans.'
  },
  {
    name: 'Kingsley Oval',
    cityName: 'Kingsley',
    capacity: 32000,
    venueClass: 'STANDARD',
    atmosphereBonus: 1.0,
    description: 'Picturesque ground surrounded by vineyards.',
    opened: 1875,
    history: 'Possibly the most beautiful football ground in existence. The Members\' Stand, built in 1892, is heritage-listed. Wine is served at halftime.'
  },
  {
    name: 'Beachport Arena',
    cityName: 'Beachport',
    capacity: 28000,
    venueClass: 'STANDARD',
    atmosphereBonus: 1.0,
    description: 'Ocean breeze venue just meters from the beach.',
    opened: 1967,
    history: 'Built on sand dunes stabilized with native grasses. The sea breeze affects play noticeably—smart coaches factor it into their game plans.'
  },
  {
    name: 'Thornton Ground',
    cityName: 'Thornton',
    capacity: 15000,
    venueClass: 'BOUTIQUE',
    atmosphereBonus: 0.0,
    description: 'Charming small-town ground with mountain backdrop.',
    opened: 1871,
    history: 'The third-oldest football ground still in use. Mount Wellington looms behind the southern stand, and snow sometimes dusts the playing surface in winter.'
  },
  {
    name: 'Ironbark Stadium',
    cityName: 'Ironbark',
    capacity: 38000,
    venueClass: 'STANDARD',
    atmosphereBonus: 1.0,
    description: 'Remote but modern facility funded by mining boom.',
    opened: 2008,
    history: 'Mining magnates funded this state-of-the-art facility in the middle of the desert. The red dust still finds its way onto the playing surface.'
  },
  {
    name: 'Hillcrest Oval',
    cityName: 'Hillcrest',
    capacity: 12000,
    venueClass: 'BOUTIQUE',
    atmosphereBonus: 0.0,
    description: 'Cozy hillside venue where fans are close to the action.',
    opened: 1952,
    history: 'Carved into the hillside with spectacular valley views. The steep stands create remarkable acoustics—12,000 people sound like 50,000.'
  },
  {
    name: 'Ferndale Showground',
    cityName: 'Ferndale',
    capacity: 9000,
    venueClass: 'BOUTIQUE',
    atmosphereBonus: 0.0,
    description: 'Country showground turned football fortress.',
    opened: 1891,
    history: 'Still hosts the annual agricultural show in October. The players\' race runs past the sheep judging pavilion. It\'s gloriously authentic.'
  },
]

// Reserve venues (in towns)
const townVenues: Array<{
  name: string;
  townName: string;
  capacity: number;
  venueClass: VenueClass;
  atmosphereBonus: number;
  description: string;
  opened: number;
  history: string;
}> = [
  { name: 'Millbrook Recreation Reserve', townName: 'Millbrook', capacity: 3500, venueClass: 'BOUTIQUE', atmosphereBonus: 0.0, description: 'Village oval with ancient oak trees.', opened: 1895, history: 'The white picket fence has been repainted every year since 1895 by the same family. The oaks were planted to commemorate Federation.' },
  { name: 'Coalfield Memorial Ground', townName: 'Coalfield', capacity: 4000, venueClass: 'BOUTIQUE', atmosphereBonus: 0.0, description: 'Former mining town oval with historic grandstand.', opened: 1912, history: 'Named for the 23 miners killed in the 1911 disaster. Their names are on the honor board in the grandstand, and matches begin with a moment of silence.' },
  { name: 'Saltwater Bay Oval', townName: 'Saltwater Bay', capacity: 4500, venueClass: 'BOUTIQUE', atmosphereBonus: 0.0, description: 'Seaside ground where seagulls outnumber fans.', opened: 1934, history: 'Built on reclaimed marshland with the help of Portuguese fishermen. The sea mist rolls in during winter games, creating an ethereal atmosphere.' },
  { name: 'Northbridge Workers Ground', townName: 'Northbridge', capacity: 5000, venueClass: 'BOUTIQUE', atmosphereBonus: 0.0, description: 'Industrial suburb venue with passionate locals.', opened: 1948, history: 'Funded by union contributions and built by volunteer labor. The working-class heritage is proudly displayed in murals on the grandstand walls.' },
  { name: 'Sunvale Sports Complex', townName: 'Sunvale', capacity: 3000, venueClass: 'BOUTIQUE', atmosphereBonus: 0.0, description: 'Tropical ground where mangoes fall from boundary trees.', opened: 1975, history: 'The mango trees that line the boundary were planted by the original Polynesian farming families. Fruit occasionally interrupts play.' },
  { name: 'Redgum Timber Workers Oval', townName: 'Redgum', capacity: 2500, venueClass: 'BOUTIQUE', atmosphereBonus: 0.0, description: 'Forest clearing venue surrounded by towering trees.', opened: 1934, history: 'Literally carved from the forest. The remaining redgums behind the goals are estimated to be 400 years old and are protected.' },
  { name: 'Vinehurst Village Green', townName: 'Vinehurst', capacity: 2000, venueClass: 'BOUTIQUE', atmosphereBonus: 0.0, description: 'Charming village ground with stone pavilion.', opened: 1889, history: 'The stone pavilion was built by German stonemasons and features the club\'s crest carved above the entrance. Wine tastings after matches are traditional.' },
  { name: 'Dunes End Recreation Ground', townName: 'Dunes End', capacity: 1800, venueClass: 'BOUTIQUE', atmosphereBonus: 0.0, description: 'Remote beach oval at the end of the road.', opened: 1956, history: 'Sand blows onto the playing surface in strong winds. Players have been known to stop mid-game to watch whales migrating past.' },
  { name: 'Orchard Vale Community Oval', townName: 'Orchard Vale', capacity: 1500, venueClass: 'BOUTIQUE', atmosphereBonus: 0.0, description: 'Apple country ground surrounded by orchards.', opened: 1909, history: 'The clubrooms were originally an apple packing shed. Players still get a bag of apples after each game—it\'s in the by-laws.' },
  { name: 'Dusty Creek Mining Camp Ground', townName: 'Dusty Creek', capacity: 2200, venueClass: 'BOUTIQUE', atmosphereBonus: 0.0, description: 'Outback oval where the red dust never settles.', opened: 1965, history: 'The most remote venue in professional football. Players and officials fly in by charter plane. The isolation is the point.' },
  { name: 'Pine Ridge Alpine Oval', townName: 'Pine Ridge', capacity: 1200, venueClass: 'BOUTIQUE', atmosphereBonus: 0.0, description: 'High-altitude ground with thin air and thick atmosphere.', opened: 1958, history: 'At 800m elevation, the thin air exhausts visiting teams. Locals say the mountains give them strength. The views are undeniably spectacular.' },
  { name: 'Hayfield Community Ground', townName: 'Hayfield', capacity: 800, venueClass: 'BOUTIQUE', atmosphereBonus: 0.0, description: 'Tiny farming ground where crowds know every player by name.', opened: 1923, history: 'The smallest venue in professional football. The grandstand seats 200; everyone else stands. The atmosphere is impossibly intimate.' },
]

// Club to city/venue assignments with reserves towns
const clubAssignments = [
  { clubIndex: 0, cityName: 'Ashford', venueName: 'Ashford Arena', reservesTownName: 'Millbrook', reservesVenueName: 'Millbrook Recreation Reserve' },
  { clubIndex: 1, cityName: 'Ashford', venueName: 'Ashford Oval', reservesTownName: 'Coalfield', reservesVenueName: 'Coalfield Memorial Ground' },
  { clubIndex: 2, cityName: 'Riverside', venueName: 'Riverside Stadium', reservesTownName: 'Saltwater Bay', reservesVenueName: 'Saltwater Bay Oval' },
  { clubIndex: 3, cityName: 'Riverside', venueName: 'Riverside Park', reservesTownName: 'Northbridge', reservesVenueName: 'Northbridge Workers Ground' },
  { clubIndex: 4, cityName: 'Glendale', venueName: 'Glendale Dome', reservesTownName: 'Sunvale', reservesVenueName: 'Sunvale Sports Complex' },
  { clubIndex: 5, cityName: 'Westbrook', venueName: 'Westbrook Park', reservesTownName: 'Redgum', reservesVenueName: 'Redgum Timber Workers Oval' },
  { clubIndex: 6, cityName: 'Kingsley', venueName: 'Kingsley Oval', reservesTownName: 'Vinehurst', reservesVenueName: 'Vinehurst Village Green' },
  { clubIndex: 7, cityName: 'Beachport', venueName: 'Beachport Arena', reservesTownName: 'Dunes End', reservesVenueName: 'Dunes End Recreation Ground' },
  { clubIndex: 8, cityName: 'Thornton', venueName: 'Thornton Ground', reservesTownName: 'Orchard Vale', reservesVenueName: 'Orchard Vale Community Oval' },
  { clubIndex: 9, cityName: 'Ironbark', venueName: 'Ironbark Stadium', reservesTownName: 'Dusty Creek', reservesVenueName: 'Dusty Creek Mining Camp Ground' },
  { clubIndex: 10, cityName: 'Hillcrest', venueName: 'Hillcrest Oval', reservesTownName: 'Pine Ridge', reservesVenueName: 'Pine Ridge Alpine Oval' },
  { clubIndex: 11, cityName: 'Ferndale', venueName: 'Ferndale Showground', reservesTownName: 'Hayfield', reservesVenueName: 'Hayfield Community Ground' },
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
  await prisma.negotiationMessage.deleteMany()
  await prisma.negotiationSession.deleteMany()
  await prisma.personalityProfile.deleteMany()
  await prisma.contractOffer.deleteMany()
  await prisma.rfaPlayer.deleteMany()
  await prisma.staffContract.deleteMany()
  await prisma.contract.deleteMany()
  await prisma.draftPick.deleteMany()
  await prisma.draftEligibility.deleteMany()
  await prisma.match.deleteMany()
  await prisma.rival.deleteMany()
  await prisma.clubTension.deleteMany()
  await prisma.clubSalary.deleteMany()
  await prisma.standing.deleteMany()
  await prisma.seasonResult.deleteMany()
  await prisma.boardGoal.deleteMany()
  await prisma.boardMeeting.deleteMany()
  await prisma.clubBoard.deleteMany()
  await prisma.round.deleteMany()
  await prisma.season.deleteMany()
  await prisma.staff.deleteMany()
  await prisma.aflPlayer.deleteMany()
  await prisma.aflTeam.deleteMany()
  await prisma.club.deleteMany()
  await prisma.coach.deleteMany()
  await prisma.venue.deleteMany()
  await prisma.town.deleteMany()
  await prisma.city.deleteMany()

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

  // Seed Cities
  console.log('🏙️  Creating cities...')
  const createdCities: Record<string, string> = {}
  for (const city of cities) {
    const created = await prisma.city.create({
      data: {
        name: city.name,
        state: city.state,
        marketSize: city.marketSize,
        population: city.population,
        description: city.description,
        founded: city.founded,
        history: city.history,
      },
    })
    createdCities[city.name] = created.id
  }
  console.log(`   ✓ Created ${cities.length} cities`)

  // Seed Towns
  console.log('🏘️  Creating towns...')
  const createdTowns: Record<string, string> = {}
  for (const town of towns) {
    const created = await prisma.town.create({
      data: {
        name: town.name,
        state: town.state,
        population: town.population,
        description: town.description,
        founded: town.founded,
        history: town.history,
        nearCityId: createdCities[town.nearCityName],
      },
    })
    createdTowns[town.name] = created.id
  }
  console.log(`   ✓ Created ${towns.length} towns`)

  // Seed City Venues (for seniors)
  console.log('🏟️  Creating city venues...')
  const createdVenues: Record<string, string> = {}
  for (const venue of cityVenues) {
    const created = await prisma.venue.create({
      data: {
        name: venue.name,
        capacity: venue.capacity,
        venueClass: venue.venueClass,
        atmosphereBonus: venue.atmosphereBonus,
        description: venue.description,
        opened: venue.opened,
        history: venue.history,
        cityId: createdCities[venue.cityName],
      },
    })
    createdVenues[venue.name] = created.id
  }
  console.log(`   ✓ Created ${cityVenues.length} city venues`)

  // Seed Town Venues (for reserves)
  console.log('🏟️  Creating town venues...')
  for (const venue of townVenues) {
    const created = await prisma.venue.create({
      data: {
        name: venue.name,
        capacity: venue.capacity,
        venueClass: venue.venueClass,
        atmosphereBonus: venue.atmosphereBonus,
        description: venue.description,
        opened: venue.opened,
        history: venue.history,
        townId: createdTowns[venue.townName],
      },
    })
    createdVenues[venue.name] = created.id
  }
  console.log(`   ✓ Created ${townVenues.length} town venues`)

  // Seed Fantasy Clubs with city/venue and reserves town/venue assignments
  console.log('🏆 Creating fantasy clubs...')
  const createdClubs: string[] = []
  for (let i = 0; i < fantasyClubs.length; i++) {
    const club = fantasyClubs[i]
    const assignment = clubAssignments.find(a => a.clubIndex === i)
    const created = await prisma.club.create({
      data: {
        name: club.name,
        abbreviation: club.abbreviation,
        reservesName: club.reservesName,
        reservesAbbreviation: club.reservesAbbreviation,
        primaryColor: club.primaryColor,
        secondaryColor: club.secondaryColor,
        founded: club.founded,
        history: club.history,
        cityId: assignment ? createdCities[assignment.cityName] : null,
        homeVenueId: assignment ? createdVenues[assignment.venueName] : null,
        reservesTownId: assignment ? createdTowns[assignment.reservesTownName] : null,
        reservesVenueId: assignment ? createdVenues[assignment.reservesVenueName] : null,
      },
    })
    createdClubs.push(created.id)
  }
  console.log(`   ✓ Created ${fantasyClubs.length} fantasy clubs with city/town/venue assignments`)

  // Seed 2026 Season
  console.log('📅 Creating 2026 season...')
  const season = await prisma.season.create({
    data: {
      year: 2026,
      salaryCap: 750,
      status: SeasonStatus.UPCOMING,
      byeRounds: [12, 13, 14],
      finalsStartRound: 24,
      reservesBonusPool: { '1': 75, '2': 50, '3': 30, '4': 20, '5': 10 },
    },
  })
  console.log(`   ✓ Created 2026 season`)

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

  // Create coaches and assign to clubs
  console.log('👨‍💼 Creating coaches and assigning to clubs...')
  const coachNames = [
    { name: 'Matt Wilson', email: 'matt@sickoleague.com' },
    { name: 'Jake Thompson', email: 'jake@sickoleague.com' },
    { name: 'Chris Anderson', email: 'chris@sickoleague.com' },
    { name: 'Daniel Murphy', email: 'daniel@sickoleague.com' },
    { name: 'Michael Roberts', email: 'michael@sickoleague.com' },
    { name: 'Ryan Mitchell', email: 'ryan@sickoleague.com' },
    { name: 'Tom Harris', email: 'tom@sickoleague.com' },
    { name: 'Ben Taylor', email: 'ben@sickoleague.com' },
    { name: 'Luke Martin', email: 'luke@sickoleague.com' },
    { name: 'James Brown', email: 'james@sickoleague.com' },
    { name: 'Alex Davis', email: 'alex@sickoleague.com' },
    { name: 'Sam Williams', email: 'sam@sickoleague.com' },
  ]

  for (let i = 0; i < createdClubs.length; i++) {
    const coachData = coachNames[i]
    const coach = await prisma.coach.create({
      data: {
        displayName: coachData.name,
        email: coachData.email,
        isCommissioner: i === 0, // First coach is commissioner
      },
    })
    // Link coach to club
    await prisma.club.update({
      where: { id: createdClubs[i] },
      data: { coachId: coach.id },
    })
  }
  console.log(`   ✓ Created ${createdClubs.length} coaches and assigned to clubs`)

  // Distribute players to clubs via contracts
  console.log('📝 Creating player contracts...')
  const playersPerClub = Math.floor(allPlayers.length / createdClubs.length)
  let contractCount = 0

  // Shuffle players for random distribution
  const shuffledPlayers = [...allPlayers].sort(() => Math.random() - 0.5)

  for (let clubIndex = 0; clubIndex < createdClubs.length; clubIndex++) {
    const clubId = createdClubs[clubIndex]
    const startIndex = clubIndex * playersPerClub
    const endIndex = clubIndex === createdClubs.length - 1
      ? shuffledPlayers.length  // Last club gets remaining players
      : startIndex + playersPerClub

    const clubPlayers = shuffledPlayers.slice(startIndex, endIndex)

    for (const player of clubPlayers) {
      // Random contract length 1-4 years
      const contractLength = Math.floor(Math.random() * 4) + 1
      const startSeason = 2026
      const endSeason = startSeason + contractLength - 1

      // Base salary on randomness (30-100k per year)
      const yearlyValue = Math.floor(Math.random() * 70) + 30
      const yearBreakdown = []
      for (let year = startSeason; year <= endSeason; year++) {
        yearBreakdown.push({ season: year, value: yearlyValue })
      }

      await prisma.contract.create({
        data: {
          clubId,
          aflPlayerId: player.id,
          startSeason,
          endSeason,
          totalValue: yearlyValue * contractLength,
          yearBreakdown,
          contractType: 'DRAFT',
          status: 'ACTIVE',
        },
      })
      contractCount++
    }
  }
  console.log(`   ✓ Created ${contractCount} player contracts`)

  // Create same-city rivalries
  console.log('⚔️  Creating same-city rivalries...')
  // Find clubs in the same city and create SAME_CITY rivalries
  const clubsWithCities = await prisma.club.findMany({
    where: { cityId: { not: null } },
    select: { id: true, name: true, cityId: true },
  })

  // Group clubs by city
  const clubsByCity: Record<string, { id: string; name: string }[]> = {}
  for (const club of clubsWithCities) {
    if (club.cityId) {
      if (!clubsByCity[club.cityId]) clubsByCity[club.cityId] = []
      clubsByCity[club.cityId].push({ id: club.id, name: club.name })
    }
  }

  // Create rivalries for cities with 2+ clubs
  let rivalryCount = 0
  for (const [cityId, cityClubs] of Object.entries(clubsByCity)) {
    if (cityClubs.length >= 2) {
      // Create rivalry between first two clubs in city
      await prisma.rival.create({
        data: {
          clubAId: cityClubs[0].id,
          clubBId: cityClubs[1].id,
          seasonId: season.id,
          reason: 'SAME_CITY',
        },
      })
      console.log(`   ✓ Created rivalry: ${cityClubs[0].name} vs ${cityClubs[1].name}`)
      rivalryCount++
    }
  }
  console.log(`   ✓ Created ${rivalryCount} same-city rivalries`)

  console.log('\n✅ Database seed completed successfully!')
  console.log('\n📈 Summary:')
  console.log(`   • ${aflTeams.length} AFL teams`)
  console.log(`   • ${playerCount} AFL players`)
  console.log(`   • ${staffCount} staff members`)
  console.log(`   • ${cities.length} cities`)
  console.log(`   • ${towns.length} towns`)
  console.log(`   • ${cityVenues.length + townVenues.length} venues (${cityVenues.length} city, ${townVenues.length} town)`)
  console.log(`   • ${fantasyClubs.length} fantasy clubs`)
  console.log(`   • ${rivalryCount} same-city rivalries`)
  console.log(`   • 1 season (2026)`)
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
