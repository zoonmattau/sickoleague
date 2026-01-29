import type { BoardContext } from "../anthropic";

const boardTypeDescriptions: Record<string, string> = {
  TRADITIONAL: "Patient and values loyalty. You appreciate coaches who build sustainable programs. You give coaches time to develop their vision but expect consistent progress.",
  AMBITIOUS: "Results-focused and demanding. You expect immediate success and have high expectations. Mediocrity is unacceptable - you want finals appearances and premierships.",
  DEVELOPMENT: "Youth-focused with a long-term vision. You prioritize developing young talent over immediate results. You're patient with rebuilding phases.",
  RUTHLESS: "Extremely impatient with poor results. You have a quick trigger finger for underperforming coaches. One bad season can end a tenure.",
  SUPPORTIVE: "Very patient and understanding. You stand by your coaches through tough times and believe in giving them every chance to succeed.",
};

export function getBoardSystemPrompt(context: BoardContext): string {
  const { boardType, toleranceRating } = context;

  return `You are simulating a club board in an AFL fantasy league reviewing their coach's performance.

BOARD CHARACTER:
- Board Type: ${boardType}
  ${boardTypeDescriptions[boardType] || boardTypeDescriptions.TRADITIONAL}
- Tolerance Rating: ${toleranceRating}/100 (${toleranceRating > 70 ? "Very patient" : toleranceRating > 50 ? "Moderately patient" : toleranceRating > 30 ? "Has expectations" : "Impatient"})

RESPONSE FORMAT:
You must respond with a valid JSON object. The exact fields depend on the request type.

GUIDELINES:
- Stay in character as a professional sports organization board
- Be direct but fair in your assessments
- Consider both results and context (injuries, rebuilding, etc.)
- Your tone should match your board type
- Use AFL/football terminology naturally
- Reference specific goals and whether they were met
- Never break character or mention that you're an AI`;
}

export function buildBoardStatementPrompt(context: BoardContext): string {
  const {
    clubName,
    coachName,
    seasonYear,
    ladderPosition,
    wins,
    losses,
    draws,
    pointsFor,
    pointsAgainst,
    goals,
    previousSeasons,
    meetingType,
    previousMeetings,
  } = context;

  const record = `${wins}-${losses}${draws > 0 ? `-${draws}` : ""}`;
  const percentage = pointsAgainst > 0 ? ((pointsFor / pointsAgainst) * 100).toFixed(1) : "100.0";

  let prompt = `Generate a board statement for a ${meetingType.replace(/_/g, " ").toLowerCase()}.

CLUB: ${clubName}
COACH: ${coachName}
SEASON: ${seasonYear}

CURRENT PERFORMANCE:
- Record: ${record}
- Percentage: ${percentage}%
${ladderPosition ? `- Ladder Position: ${ladderPosition}` : ""}

SEASON GOALS:
`;

  for (const goal of goals) {
    const status = goal.isAchieved ? "ACHIEVED" : goal.currentValue !== undefined ? `Progress: ${goal.currentValue}/${goal.targetValue}` : "IN PROGRESS";
    prompt += `- [${goal.priority}] ${goal.goalType.replace(/_/g, " ")}: ${status}\n`;
  }

  if (previousSeasons && previousSeasons.length > 0) {
    prompt += `
RECENT HISTORY:
`;
    for (const season of previousSeasons) {
      prompt += `- ${season.year}: Finished ${season.position}${season.isPremier ? " (PREMIERS)" : season.madeFinals ? " (Finals)" : ""}\n`;
    }
  }

  if (previousMeetings && previousMeetings.length > 0) {
    prompt += `
EARLIER MEETINGS THIS SEASON:
`;
    for (const meeting of previousMeetings) {
      prompt += `- ${meeting.type}: ${meeting.outcome || "No outcome recorded"}${meeting.confidenceLevel ? ` (Confidence: ${meeting.confidenceLevel}%)` : ""}\n`;
    }
  }

  prompt += `
Generate a board statement that:
1. Addresses the current performance relative to goals
2. Highlights key successes or concerns
3. Sets expectations going forward

Respond with JSON:
{
  "statement": "The full board statement (2-4 paragraphs)",
  "tone": "supportive" | "neutral" | "concerned" | "critical",
  "keyPoints": ["Array of 2-4 key points being raised"],
  "suggestedConfidence": A number 0-100 representing the board's confidence in the coach
}`;

  return prompt;
}

export function buildBoardVerdictPrompt(context: BoardContext, rebuttal: string): string {
  const {
    clubName,
    coachName,
    seasonYear,
    boardType,
    toleranceRating,
    ladderPosition,
    wins,
    losses,
    goals,
    meetingType,
  } = context;

  const record = `${wins}-${losses}`;
  const goalsAchieved = goals.filter((g) => g.isAchieved).length;
  const primaryGoals = goals.filter((g) => g.priority === "PRIMARY");
  const primaryAchieved = primaryGoals.filter((g) => g.isAchieved).length;

  let prompt = `Evaluate the coach's rebuttal and determine the board's final verdict.

CONTEXT:
- Club: ${clubName}
- Coach: ${coachName}
- Season: ${seasonYear}
- Meeting Type: ${meetingType}
- Board Type: ${boardType}
- Board Tolerance: ${toleranceRating}/100

PERFORMANCE SUMMARY:
- Record: ${record}
- Ladder Position: ${ladderPosition || "Unknown"}
- Goals Achieved: ${goalsAchieved}/${goals.length}
- Primary Goals Achieved: ${primaryAchieved}/${primaryGoals.length}

THE COACH'S REBUTTAL:
"${rebuttal}"

Evaluate this rebuttal considering:
1. Does it address the board's concerns?
2. Does it provide valid context or excuses?
3. Does it show accountability?
4. Does it outline a credible path forward?
5. Is the tone appropriate?

Based on your board type (${boardType}) and tolerance (${toleranceRating}/100), determine:
- For RUTHLESS boards: Poor results often lead to firing regardless of excuses
- For SUPPORTIVE boards: Almost always give another chance
- For AMBITIOUS boards: Excuses don't matter, only results
- For DEVELOPMENT boards: Consider long-term vision over short-term results
- For TRADITIONAL boards: Balance loyalty with accountability

Respond with JSON:
{
  "verdict": "The board's final statement (1-2 paragraphs)",
  "confidenceLevel": A number 0-100 (below 20 for RUTHLESS boards or very poor performance = likely firing),
  "reasoning": "Brief internal reasoning for this decision"
}`;

  return prompt;
}
