export interface RoundWrapContext {
  roundNumber: number;
  seasonYear: number;
  matches: {
    homeClub: string;
    homeAbbr: string;
    awayClub: string;
    awayAbbr: string;
    homeScore: number;
    awayScore: number;
    homeStaffBonus: number | null;
    awayStaffBonus: number | null;
    matchType: "SENIORS" | "RESERVES";
    isRivalMatch: boolean;
    topScorers: {
      playerName: string;
      club: string;
      score: number;
      isCaptain: boolean;
    }[];
  }[];
  standings: {
    club: string;
    abbr: string;
    wins: number;
    losses: number;
    draws: number;
    percentage: number;
    ladderPosition: number | null;
    competition: "SENIORS" | "RESERVES";
  }[];
  recentTrades: {
    from: string;
    to: string;
    assets: string[];
    completedAt: string;
  }[];
  clubSnippets: {
    name: string;
    abbr: string;
    founded: number | null;
    city: string | null;
  }[];
}

export interface PowerRankingsContext {
  seasonYear: number;
  roundNumber: number;
  standings: {
    club: string;
    abbr: string;
    wins: number;
    losses: number;
    draws: number;
    percentage: number;
    ladderPosition: number | null;
    competition: "SENIORS" | "RESERVES";
  }[];
  recentForm: {
    club: string;
    abbr: string;
    last3: ("W" | "L" | "D")[];
    competition: "SENIORS" | "RESERVES";
  }[];
  recentTrades: {
    from: string;
    to: string;
    assets: string[];
  }[];
}

const NARRATIVE_SYSTEM_PROMPT = `You are a beat reporter for a small regional footy newspaper covering the Sicko League, an AFL fantasy competition.

VOICE RULES:
- Short sentences. No cliches. No exclamation marks.
- State facts, note the odd detail, move on.
- Use club names and abbreviations naturally.
- Reference rivalry history when relevant but don't overdo it.
- Terse, dry, matter-of-fact local footy journalism. Not ESPN hype.
- Never use phrases like "in a thrilling encounter" or "electrifying performance".
- You can be wry, but never sarcastic or mean-spirited.

RESPONSE FORMAT:
You must respond with a valid JSON object:
{
  "headline": "A short, punchy headline for the article",
  "body": "The full article text"
}`;

export function getNarrativeSystemPrompt(): string {
  return NARRATIVE_SYSTEM_PROMPT;
}

export function buildRoundWrapPrompt(context: RoundWrapContext): string {
  const { roundNumber, seasonYear, matches, standings, recentTrades, clubSnippets } = context;

  const seniorsMatches = matches.filter((m) => m.matchType === "SENIORS");
  const reservesMatches = matches.filter((m) => m.matchType === "RESERVES");

  let prompt = `Write a Round ${roundNumber} (${seasonYear} season) wrap article.

SENIORS RESULTS:
`;

  for (const m of seniorsMatches) {
    const margin = Math.abs(m.homeScore - m.awayScore);
    const winner = m.homeScore > m.awayScore ? m.homeClub : m.awayClub;
    const loser = m.homeScore > m.awayScore ? m.awayClub : m.homeClub;
    const isDraw = m.homeScore === m.awayScore;

    prompt += `- ${m.homeClub} (${m.homeAbbr}) ${m.homeScore.toFixed(1)} def ${m.awayClub} (${m.awayAbbr}) ${m.awayScore.toFixed(1)}`;
    if (isDraw) {
      prompt = prompt.replace(/ def /, " drew with ");
    }
    prompt += ` [margin: ${margin.toFixed(1)}]`;
    if (m.isRivalMatch) prompt += " [RIVALRY MATCH]";
    if (m.homeStaffBonus || m.awayStaffBonus) {
      prompt += ` [staff bonuses: ${m.homeAbbr} ${m.homeStaffBonus?.toFixed(1) ?? "0"}, ${m.awayAbbr} ${m.awayStaffBonus?.toFixed(1) ?? "0"}]`;
    }
    prompt += "\n";

    if (m.topScorers.length > 0) {
      prompt += `  Top scorers: ${m.topScorers.map((s) => `${s.playerName} (${s.club}) ${s.score}${s.isCaptain ? " [C]" : ""}`).join(", ")}\n`;
    }
  }

  if (reservesMatches.length > 0) {
    prompt += `\nRESERVES RESULTS:\n`;
    for (const m of reservesMatches) {
      const isDraw = m.homeScore === m.awayScore;
      prompt += `- ${m.homeClub} ${m.homeScore.toFixed(1)} ${isDraw ? "drew with" : "def"} ${m.awayClub} ${m.awayScore.toFixed(1)}`;
      if (m.isRivalMatch) prompt += " [RIVALRY]";
      prompt += "\n";
    }
  }

  const seniorsStandings = standings
    .filter((s) => s.competition === "SENIORS")
    .sort((a, b) => (a.ladderPosition ?? 99) - (b.ladderPosition ?? 99));

  prompt += `\nSENIORS LADDER AFTER ROUND ${roundNumber}:\n`;
  for (const s of seniorsStandings) {
    prompt += `${s.ladderPosition ?? "?"}. ${s.abbr} ${s.wins}-${s.losses}${s.draws > 0 ? `-${s.draws}` : ""} (${s.percentage.toFixed(1)}%)\n`;
  }

  if (recentTrades.length > 0) {
    prompt += `\nRECENT TRANSACTIONS:\n`;
    for (const t of recentTrades) {
      prompt += `- ${t.from} traded ${t.assets.join(", ")} to ${t.to} (${t.completedAt})\n`;
    }
  }

  if (clubSnippets.length > 0) {
    prompt += `\nCLUB REFERENCE:\n`;
    for (const c of clubSnippets) {
      let snippet = `- ${c.name} (${c.abbr})`;
      if (c.founded) snippet += `, est. ${c.founded}`;
      if (c.city) snippet += `, ${c.city}`;
      prompt += snippet + "\n";
    }
  }

  prompt += `
INSTRUCTIONS:
- Write 1 short paragraph per seniors match (2-3 sentences each). Cover the result, mention a standout performer if available, and add context (rivalry, upset, streak) where relevant.
- Briefly mention reserves results in 1-2 sentences total if they happened.
- End with a brief ladder summary paragraph (2-3 sentences about the shape of the competition).
- If there were trades, weave a sentence about them naturally (don't force it).
- Keep the total article concise. No padding.

Respond with JSON: { "headline": "...", "body": "..." }`;

  return prompt;
}

export function buildPowerRankingsPrompt(context: PowerRankingsContext): string {
  const { seasonYear, roundNumber, standings, recentForm, recentTrades } = context;

  const seniorsStandings = standings
    .filter((s) => s.competition === "SENIORS")
    .sort((a, b) => (a.ladderPosition ?? 99) - (b.ladderPosition ?? 99));

  let prompt = `Write power rankings for all ${seniorsStandings.length} Sicko League clubs after Round ${roundNumber} (${seasonYear} season).

CURRENT STANDINGS:
`;

  for (const s of seniorsStandings) {
    const form = recentForm.find((f) => f.abbr === s.abbr && f.competition === "SENIORS");
    const formStr = form ? ` [form: ${form.last3.join("")}]` : "";
    prompt += `${s.ladderPosition ?? "?"}. ${s.club} (${s.abbr}) ${s.wins}-${s.losses}${s.draws > 0 ? `-${s.draws}` : ""} (${s.percentage.toFixed(1)}%)${formStr}\n`;
  }

  if (recentTrades.length > 0) {
    prompt += `\nRECENT TRANSACTIONS:\n`;
    for (const t of recentTrades) {
      prompt += `- ${t.from} sent ${t.assets.join(", ")} to ${t.to}\n`;
    }
  }

  prompt += `
INSTRUCTIONS:
- Rank all clubs 1 to ${seniorsStandings.length}. Your rankings can differ from the ladder if you think form or transactions warrant it.
- Write exactly ONE sentence per club. No more.
- Format each entry as: "1. CLUB NAME (ABBR) - Your one sentence."
- Keep it dry and factual. Note form, upsets, or notable moves.
- The headline should be simple, e.g. "Round ${roundNumber} Power Rankings".

Respond with JSON: { "headline": "...", "body": "..." }`;

  return prompt;
}
