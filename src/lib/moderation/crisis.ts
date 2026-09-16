/**
 * A short, deliberately unambiguous keyword list — a routing/UI-prompt
 * heuristic, not a clinical risk assessment. It is not exhaustive and
 * misses indirect phrasing, misspellings, and non-English text by design.
 * Shared between the client (an immediate, gentle prompt while composing)
 * and MockModerationProvider (routing to human review), so both sides stay
 * in sync — never duplicate this list.
 */
export const CRISIS_PHRASES = [
  "kill myself",
  "end my life",
  "want to die",
  "suicidal",
  "suicide",
  "hurt myself",
  "self harm",
  "self-harm",
];

export function checkForCrisisLanguage(text: string): boolean {
  const lower = text.toLowerCase();
  return CRISIS_PHRASES.some((phrase) => lower.includes(phrase));
}
