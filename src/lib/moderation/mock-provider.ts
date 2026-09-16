import { checkForPossiblePii } from "@/lib/moderation/pii";
import { checkForCrisisLanguage } from "@/lib/moderation/crisis";
import type {
  ModerationCheckResult,
  ModerationContext,
  ModerationProvider,
  ModerationReason,
} from "@/lib/moderation/types";

/**
 * Development-only stand-in for a real moderation service.
 *
 * THIS IS NOT PRODUCTION-READY SAFETY MODERATION. It is a keyword/regex
 * heuristic that exists so the submission pipeline (auto-approve vs. queue
 * for human review) has something to call locally. It cannot reliably
 * detect harassment, graphic content, dangerous instructions, or genuine
 * crisis risk — see the PRD's moderation-workflow requirements for what a
 * real provider needs to cover. Do not deploy this to production and do
 * not represent its output as a safety judgment in any UI copy.
 */
class MockModerationProvider implements ModerationProvider {
  readonly name = "mock";
  readonly isProductionReady = false;

  async checkContent(
    text: string,
    _context: ModerationContext,
  ): Promise<ModerationCheckResult> {
    const reasons: ModerationReason[] = [];

    if (checkForCrisisLanguage(text)) {
      reasons.push("possible_crisis_language");
    }

    if (checkForPossiblePii(text).hasPossibleMatch) {
      reasons.push("possible_pii");
    }

    const flagged = reasons.length > 0;
    return {
      riskLevel: flagged ? "flagged" : "low",
      requiresHumanReview: flagged,
      reasons,
    };
  }
}

export const mockModerationProvider = new MockModerationProvider();
