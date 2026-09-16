export type ModerationContext = "confession" | "reply";

export type ModerationReason =
  | "possible_pii"
  | "possible_crisis_language"
  | "possible_harassment_language"
  | "graphic_or_violent_content"
  | "hate_or_discrimination"
  | "sexual_content"
  | "spam_or_incoherent_content"
  // The provider's own safety classifier declined to process the content —
  // a strong signal on its own, distinct from an infrastructure failure.
  | "flagged_by_safety_classifier"
  // The provider call itself failed (network, auth, rate limit, ...). Fail
  // closed: route to human review rather than guess at a risk level.
  | "moderation_check_failed";

export interface ModerationCheckResult {
  riskLevel: "low" | "flagged";
  requiresHumanReview: boolean;
  reasons: ModerationReason[];
}

/**
 * Swappable moderation backend. src/lib/moderation/index.ts is the only
 * place that decides which implementation is active — server actions call
 * `getModerationProvider()`, never a concrete implementation directly.
 */
export interface ModerationProvider {
  readonly name: string;
  readonly isProductionReady: boolean;
  checkContent(text: string, context: ModerationContext): Promise<ModerationCheckResult>;
}
