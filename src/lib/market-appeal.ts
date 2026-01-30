// MarketSize enum values (matches Prisma schema)
export type MarketSize = "MAJOR" | "LARGE" | "MEDIUM" | "SMALL";

/**
 * Market size modifiers for free agent appeal.
 * Higher appeal = players more likely to accept offers (effective expected price is lower).
 */
export const MARKET_SIZE_MODIFIERS: Record<MarketSize, number> = {
  MAJOR: 0.15,  // +15% appeal (dual-team big cities)
  LARGE: 0.10,  // +10% appeal
  MEDIUM: 0.05, // +5% appeal
  SMALL: 0.00,  // baseline (0%)
};

/**
 * State codes for AFL teams mapped to their states.
 * Used for same-state bonus calculation.
 */
const AFL_TEAM_STATES: Record<string, string> = {
  // VIC teams
  "Carlton": "VIC",
  "Collingwood": "VIC",
  "Essendon": "VIC",
  "Geelong Cats": "VIC",
  "Hawthorn": "VIC",
  "Melbourne": "VIC",
  "North Melbourne": "VIC",
  "Richmond": "VIC",
  "St Kilda": "VIC",
  "Western Bulldogs": "VIC",
  // NSW teams
  "Sydney Swans": "NSW",
  "GWS Giants": "NSW",
  // QLD teams
  "Brisbane Lions": "QLD",
  "Gold Coast Suns": "QLD",
  // SA teams
  "Adelaide Crows": "SA",
  "Port Adelaide": "SA",
  // WA teams
  "Fremantle": "WA",
  "West Coast Eagles": "WA",
};

/**
 * Get the state for an AFL team name.
 */
export function getAflTeamState(teamName: string | undefined | null): string | null {
  if (!teamName) return null;
  return AFL_TEAM_STATES[teamName] ?? null;
}

type ClubWithCity = {
  city?: {
    state: string;
    marketSize: MarketSize;
  } | null;
};

type AflTeamInfo = {
  name?: string;
} | null;

/**
 * Calculate the market appeal modifier for a club when signing a player.
 *
 * @param club - The club making the offer (must include city relation)
 * @param playerAflTeam - Optional: the player's AFL team (for same-state bonus)
 * @returns Appeal modifier between 0 and 0.20 (0% to 20%)
 *
 * @example
 * // MAJOR market club signing player from same state
 * const appeal = calculateMarketAppeal(club, player.aflTeam);
 * // appeal = 0.20 (15% market + 5% same state)
 *
 * const adjustedExpectedPrice = basePrice * (1 - appeal);
 * // If base is $80k, adjusted = $64k (easier to sign)
 */
export function calculateMarketAppeal(
  club: ClubWithCity,
  playerAflTeam?: AflTeamInfo
): number {
  if (!club.city) return 0;

  let modifier = MARKET_SIZE_MODIFIERS[club.city.marketSize] ?? 0;

  // Same state bonus: +5% if player's AFL team is in the same state as the club's city
  if (playerAflTeam?.name) {
    const playerState = getAflTeamState(playerAflTeam.name);
    if (playerState && playerState === club.city.state) {
      modifier += 0.05;
    }
  }

  // Cap at 20% maximum appeal
  return Math.min(modifier, 0.20);
}

/**
 * Format the appeal modifier as a percentage string for display.
 */
export function formatAppealModifier(modifier: number): string {
  if (modifier <= 0) return "0%";
  return `+${Math.round(modifier * 100)}%`;
}

/**
 * Calculate adjusted expected price after applying market appeal.
 * Lower expected price = easier to sign the player.
 *
 * @param basePrice - The base expected price for the player
 * @param appealModifier - The market appeal modifier (0 to 0.20)
 * @returns Adjusted expected price (lower for higher appeal)
 */
export function calculateAdjustedPrice(basePrice: number, appealModifier: number): number {
  return Math.round(basePrice * (1 - appealModifier));
}
