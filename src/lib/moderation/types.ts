export type ModerationContext = "book_excerpt" | "margin_note";

export type ModerationReason =
  | "possible_pii"
  | "possible_crisis_language"
  | "possible_harassment_language";

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
