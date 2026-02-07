import Anthropic from "@anthropic-ai/sdk";
import { getNegotiationSystemPrompt, buildNegotiationUserPrompt } from "./prompts/negotiation";
import { getBoardSystemPrompt, buildBoardStatementPrompt, buildBoardVerdictPrompt } from "./prompts/board";
import {
  getNarrativeSystemPrompt,
  buildRoundWrapPrompt,
  buildPowerRankingsPrompt,
  type RoundWrapContext,
  type PowerRankingsContext,
} from "./prompts/narrative";

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

// Types for negotiation context
export interface NegotiationContext {
  // Target info
  targetType: "player" | "staff";
  targetName: string;
  targetPosition?: string; // For players
  targetRole?: string; // For staff
  aflTeam?: string;

  // Personality
  personality: {
    ambition: number;
    loyalty: number;
    riskTolerance: number;
    prideLevel: number;
    negotiationStyle: string;
  };

  // Club info
  clubName: string;
  clubTrophies: number;
  clubLadderPosition?: number;

  // Current offer
  offer: {
    years: number;
    totalValue: number;
    yearBreakdown: { season: number; value: number }[];
  };

  // Previous contract (if any)
  previousContract?: {
    clubName: string;
    salary: number;
    years: number;
  };

  // Conversation history
  messages: { role: "coach" | "player" | "staff"; content: string }[];

  // Current mood (0-100)
  mood: number;

  // Coach's new message
  coachMessage: string;
}

export interface NegotiationResponse {
  message: string;
  emotion: string;
  moodChange: number; // -20 to +20
  decision?: "accept" | "reject" | "counter" | "continue";
  counterOffer?: {
    years: number;
    totalValue: number;
  };
}

// Types for board context
export interface BoardContext {
  boardType: string;
  toleranceRating: number;
  clubName: string;
  coachName: string;

  // Current season performance
  seasonYear: number;
  ladderPosition?: number;
  wins: number;
  losses: number;
  draws: number;
  pointsFor: number;
  pointsAgainst: number;

  // Goals for this season
  goals: {
    goalType: string;
    priority: string;
    targetValue?: number;
    currentValue?: number;
    isAchieved: boolean;
  }[];

  // Historical context
  previousSeasons?: {
    year: number;
    position: number;
    madeFinals: boolean;
    isPremier: boolean;
  }[];

  // Meeting type
  meetingType: string;

  // Previous meetings this season
  previousMeetings?: {
    type: string;
    outcome?: string;
    confidenceLevel?: number;
  }[];
}

export interface BoardStatement {
  statement: string;
  tone: "supportive" | "neutral" | "concerned" | "critical";
  keyPoints: string[];
  suggestedConfidence: number; // 0-100
}

export interface BoardVerdict {
  verdict: string;
  outcome: "CONFIDENCE_HIGH" | "CONFIDENCE_MEDIUM" | "CONFIDENCE_LOW" | "FIRED";
  confidenceLevel: number;
  reasoning: string;
}

// Generate AI response for negotiation
export async function generateNegotiationResponse(
  context: NegotiationContext
): Promise<NegotiationResponse> {
  const systemPrompt = getNegotiationSystemPrompt(context);
  const userPrompt = buildNegotiationUserPrompt(context);

  try {
    const response = await anthropic.messages.create({
      model: "claude-sonnet-4-20250514",
      max_tokens: 1024,
      system: systemPrompt,
      messages: [{ role: "user", content: userPrompt }],
    });

    const content = response.content[0];
    if (content.type !== "text") {
      throw new Error("Unexpected response type");
    }

    // Parse JSON response
    const parsed = JSON.parse(content.text);

    return {
      message: parsed.message,
      emotion: parsed.emotion || "neutral",
      moodChange: Math.max(-20, Math.min(20, parsed.moodChange || 0)),
      decision: parsed.decision,
      counterOffer: parsed.counterOffer,
    };
  } catch (error) {
    console.error("Error generating negotiation response:", error);
    // Fallback response
    return {
      message: "I need some time to think about this. Can we continue this conversation later?",
      emotion: "thoughtful",
      moodChange: 0,
      decision: "continue",
    };
  }
}

// Generate board statement for a meeting
export async function generateBoardStatement(
  context: BoardContext
): Promise<BoardStatement> {
  const systemPrompt = getBoardSystemPrompt(context);
  const userPrompt = buildBoardStatementPrompt(context);

  try {
    const response = await anthropic.messages.create({
      model: "claude-sonnet-4-20250514",
      max_tokens: 1024,
      system: systemPrompt,
      messages: [{ role: "user", content: userPrompt }],
    });

    const content = response.content[0];
    if (content.type !== "text") {
      throw new Error("Unexpected response type");
    }

    const parsed = JSON.parse(content.text);

    return {
      statement: parsed.statement,
      tone: parsed.tone || "neutral",
      keyPoints: parsed.keyPoints || [],
      suggestedConfidence: Math.max(0, Math.min(100, parsed.suggestedConfidence || 50)),
    };
  } catch (error) {
    console.error("Error generating board statement:", error);
    return {
      statement: "The board has reviewed your performance this season and would like to discuss the results.",
      tone: "neutral",
      keyPoints: ["Season performance under review"],
      suggestedConfidence: 50,
    };
  }
}

// Generate round wrap article
export async function generateRoundWrap(
  context: RoundWrapContext
): Promise<{ headline: string; body: string }> {
  const systemPrompt = getNarrativeSystemPrompt();
  const userPrompt = buildRoundWrapPrompt(context);

  try {
    const response = await anthropic.messages.create({
      model: "claude-sonnet-4-20250514",
      max_tokens: 1500,
      system: systemPrompt,
      messages: [{ role: "user", content: userPrompt }],
    });

    const content = response.content[0];
    if (content.type !== "text") {
      throw new Error("Unexpected response type");
    }

    const parsed = JSON.parse(content.text);
    return {
      headline: parsed.headline,
      body: parsed.body,
    };
  } catch (error) {
    console.error("Error generating round wrap:", error);
    return {
      headline: `Round ${context.roundNumber} Wrap`,
      body: "Round wrap unavailable.",
    };
  }
}

// Generate power rankings article
export async function generatePowerRankings(
  context: PowerRankingsContext
): Promise<{ headline: string; body: string }> {
  const systemPrompt = getNarrativeSystemPrompt();
  const userPrompt = buildPowerRankingsPrompt(context);

  try {
    const response = await anthropic.messages.create({
      model: "claude-sonnet-4-20250514",
      max_tokens: 1500,
      system: systemPrompt,
      messages: [{ role: "user", content: userPrompt }],
    });

    const content = response.content[0];
    if (content.type !== "text") {
      throw new Error("Unexpected response type");
    }

    const parsed = JSON.parse(content.text);
    return {
      headline: parsed.headline,
      body: parsed.body,
    };
  } catch (error) {
    console.error("Error generating power rankings:", error);
    return {
      headline: `Round ${context.roundNumber} Power Rankings`,
      body: "Power rankings unavailable.",
    };
  }
}

// Evaluate coach rebuttal and determine verdict
export async function evaluateCoachRebuttal(
  context: BoardContext,
  rebuttal: string
): Promise<BoardVerdict> {
  const systemPrompt = getBoardSystemPrompt(context);
  const userPrompt = buildBoardVerdictPrompt(context, rebuttal);

  try {
    const response = await anthropic.messages.create({
      model: "claude-sonnet-4-20250514",
      max_tokens: 1024,
      system: systemPrompt,
      messages: [{ role: "user", content: userPrompt }],
    });

    const content = response.content[0];
    if (content.type !== "text") {
      throw new Error("Unexpected response type");
    }

    const parsed = JSON.parse(content.text);

    // Determine outcome based on confidence level and board tolerance
    let outcome: BoardVerdict["outcome"];
    const confidence = Math.max(0, Math.min(100, parsed.confidenceLevel || 50));

    if (confidence >= 70) {
      outcome = "CONFIDENCE_HIGH";
    } else if (confidence >= 40) {
      outcome = "CONFIDENCE_MEDIUM";
    } else if (confidence >= 20 || context.toleranceRating > 70) {
      outcome = "CONFIDENCE_LOW";
    } else {
      // Ruthless boards or very low confidence = fired
      outcome = context.boardType === "RUTHLESS" || confidence < 15 ? "FIRED" : "CONFIDENCE_LOW";
    }

    return {
      verdict: parsed.verdict,
      outcome,
      confidenceLevel: confidence,
      reasoning: parsed.reasoning || "",
    };
  } catch (error) {
    console.error("Error evaluating coach rebuttal:", error);
    return {
      verdict: "The board has decided to continue with the current direction.",
      outcome: "CONFIDENCE_MEDIUM",
      confidenceLevel: 50,
      reasoning: "Standard review process completed.",
    };
  }
}
