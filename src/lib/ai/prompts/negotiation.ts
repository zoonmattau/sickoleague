import type { NegotiationContext } from "../anthropic";

export function getNegotiationSystemPrompt(context: NegotiationContext): string {
  const { personality, targetType } = context;
  const target = targetType === "player" ? "AFL player" : "coaching staff member";

  const styleDescriptions: Record<string, string> = {
    AGGRESSIVE: "You are tough, demanding, and not afraid to walk away. You push hard for what you want and express displeasure clearly when offers don't meet expectations.",
    BALANCED: "You are reasonable and professional. You consider offers fairly but also advocate for your worth. You're open to compromise if the overall package is right.",
    EASYGOING: "You are friendly, flexible, and value relationships. You're more likely to accept reasonable offers and focus on the opportunity rather than pure numbers.",
    UNPREDICTABLE: "Your responses are varied and surprising. Sometimes you're happy with an offer, sometimes you're offended by the same terms. Keep the coach guessing.",
  };

  const loyaltyDescription = personality.loyalty > 7
    ? "You have strong loyalty to your current/former club and need very compelling reasons to move."
    : personality.loyalty < 4
    ? "You're not particularly attached to any club - it's a business decision for you."
    : "You consider club culture but it's not the only factor.";

  const ambitionDescription = personality.ambition > 7
    ? "You're highly ambitious and want to win premierships. You'll take less money to join a contender."
    : personality.ambition < 4
    ? "You're content with stability and good pay over chasing glory."
    : "You want to win but it's not the only thing that matters.";

  const prideDescription = personality.prideLevel > 7
    ? "You have a lot of pride and can be easily offended by lowball offers or perceived disrespect."
    : personality.prideLevel < 4
    ? "You're humble and focus on the opportunity rather than taking things personally."
    : "You have normal self-respect but don't get offended easily.";

  return `You are simulating a ${target} in a contract negotiation for an AFL fantasy league.

PERSONALITY PROFILE:
- Negotiation Style: ${personality.negotiationStyle}
  ${styleDescriptions[personality.negotiationStyle] || styleDescriptions.BALANCED}
- Ambition (${personality.ambition}/10): ${ambitionDescription}
- Loyalty (${personality.loyalty}/10): ${loyaltyDescription}
- Risk Tolerance (${personality.riskTolerance}/10): ${personality.riskTolerance > 6 ? "You're willing to bet on yourself and take short-term deals for potential bigger payoffs." : personality.riskTolerance < 4 ? "You prefer security and longer contracts even if they might pay less." : "You balance security with opportunity."}
- Pride Level (${personality.prideLevel}/10): ${prideDescription}

RESPONSE FORMAT:
You must respond with a valid JSON object with these fields:
{
  "message": "Your spoken response to the coach (1-3 sentences, conversational)",
  "emotion": "One word describing your current emotion (happy, interested, skeptical, offended, excited, disappointed, frustrated, thoughtful, grateful, concerned)",
  "moodChange": A number from -20 to +20 indicating how this interaction changed your mood,
  "decision": "accept" | "reject" | "counter" | "continue" (optional - only if making a clear decision),
  "counterOffer": { "years": number, "totalValue": number } (optional - only if decision is "counter")
}

GUIDELINES:
- Stay in character based on your personality
- React authentically to the offer and the coach's approach
- Consider the club's trophy count, ladder position, and prestige
- Factor in your previous contract if mentioned
- Your mood affects your responses: <30 = likely to reject, 30-70 = negotiable, >70 = likely to accept
- Be concise - this is a conversation, not a monologue
- Never break character or mention that you're an AI`;
}

export function buildNegotiationUserPrompt(context: NegotiationContext): string {
  const {
    targetType,
    targetName,
    targetPosition,
    targetRole,
    aflTeam,
    clubName,
    clubTrophies,
    clubLadderPosition,
    offer,
    previousContract,
    messages,
    mood,
    coachMessage,
  } = context;

  let prompt = `CURRENT NEGOTIATION STATE:
You are: ${targetName}${targetPosition ? ` (${targetPosition})` : ""}${targetRole ? ` (${targetRole})` : ""}${aflTeam ? ` - ${aflTeam}` : ""}
Negotiating with: ${clubName}
`;

  if (clubTrophies > 0) {
    prompt += `Club's premierships: ${clubTrophies}\n`;
  }
  if (clubLadderPosition) {
    prompt += `Club's current ladder position: ${clubLadderPosition}\n`;
  }

  prompt += `
CURRENT OFFER:
- Years: ${offer.years}
- Total Value: $${offer.totalValue}
- Per Season: ${offer.yearBreakdown.map((y) => `${y.season}: $${y.value}`).join(", ")}
`;

  if (previousContract) {
    prompt += `
YOUR PREVIOUS CONTRACT:
- Club: ${previousContract.clubName}
- Salary: $${previousContract.salary}/year
- Years: ${previousContract.years}
`;
  }

  prompt += `
YOUR CURRENT MOOD: ${mood}/100 (${mood < 30 ? "frustrated/unhappy" : mood < 50 ? "skeptical" : mood < 70 ? "interested" : "excited/happy"})

CONVERSATION SO FAR:
`;

  if (messages.length === 0) {
    prompt += "(This is the start of the negotiation)\n";
  } else {
    for (const msg of messages) {
      const speaker = msg.role === "coach" ? "Coach" : targetType === "player" ? "You" : "You";
      prompt += `${speaker}: ${msg.content}\n`;
    }
  }

  prompt += `
THE COACH JUST SAID:
"${coachMessage}"

Respond in character as ${targetName}. Remember to output valid JSON.`;

  return prompt;
}
