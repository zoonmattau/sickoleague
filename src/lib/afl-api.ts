// Squiggle API Client for AFL data
// https://api.squiggle.com.au/

const SQUIGGLE_BASE_URL = "https://api.squiggle.com.au/";
const USER_AGENT = "SickoLeague/1.0";

export interface AflGameResult {
  homeTeam: string;
  awayTeam: string;
  homeScore: number;
  awayScore: number;
  margin: number; // positive = home win
  winner: string;
  complete: boolean;
}

export interface AflStanding {
  name: string;
  rank: number;
  wins: number;
  losses: number;
  draws: number;
  percentage: number;
}

interface SquiggleGame {
  hteam: string;
  ateam: string;
  hscore: number;
  ascore: number;
  winner: string;
  complete: number;
}

interface SquiggleStanding {
  name: string;
  rank: number;
  wins: number;
  losses: number;
  draws: number;
  percentage: number;
}

/**
 * Fetch AFL match results for a specific round and year
 */
export async function fetchAflRoundResults(
  round: number,
  year: number
): Promise<AflGameResult[]> {
  const url = `${SQUIGGLE_BASE_URL}?q=games&round=${round}&year=${year}`;

  const response = await fetch(url, {
    headers: { "User-Agent": USER_AGENT },
    next: { revalidate: 300 }, // Cache for 5 minutes
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch AFL results: ${response.statusText}`);
  }

  const data = await response.json();

  return (data.games || []).map((game: SquiggleGame) => ({
    homeTeam: game.hteam,
    awayTeam: game.ateam,
    homeScore: game.hscore,
    awayScore: game.ascore,
    margin: game.hscore - game.ascore,
    winner: game.winner,
    complete: game.complete === 100,
  }));
}

/**
 * Fetch current AFL ladder standings
 */
export async function fetchAflLadder(year: number): Promise<AflStanding[]> {
  const url = `${SQUIGGLE_BASE_URL}?q=standings&year=${year}`;

  const response = await fetch(url, {
    headers: { "User-Agent": USER_AGENT },
    next: { revalidate: 300 }, // Cache for 5 minutes
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch AFL ladder: ${response.statusText}`);
  }

  const data = await response.json();

  return (data.standings || []).map((standing: SquiggleStanding) => ({
    name: standing.name,
    rank: standing.rank,
    wins: standing.wins,
    losses: standing.losses,
    draws: standing.draws,
    percentage: standing.percentage,
  }));
}

/**
 * Map Squiggle team name to our database team name
 * Squiggle uses slightly different naming conventions
 */
export function mapSquiggleTeamName(squiggleName: string): string {
  const mapping: Record<string, string> = {
    Adelaide: "Adelaide Crows",
    Brisbane: "Brisbane Lions",
    Carlton: "Carlton",
    Collingwood: "Collingwood",
    Essendon: "Essendon",
    Fremantle: "Fremantle",
    Geelong: "Geelong Cats",
    "Gold Coast": "Gold Coast Suns",
    "Greater Western Sydney": "GWS Giants",
    GWS: "GWS Giants",
    Hawthorn: "Hawthorn",
    Melbourne: "Melbourne",
    "North Melbourne": "North Melbourne",
    "Port Adelaide": "Port Adelaide",
    Richmond: "Richmond",
    "St Kilda": "St Kilda",
    Sydney: "Sydney Swans",
    "West Coast": "West Coast Eagles",
    "Western Bulldogs": "Western Bulldogs",
  };

  return mapping[squiggleName] || squiggleName;
}
