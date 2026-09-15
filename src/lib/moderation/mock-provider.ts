import { checkForPossiblePii } from "@/lib/moderation/pii";
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

  // Deliberately short and unambiguous — this is a routing heuristic (send
  // to human review), not a clinical risk assessment. It is not exhaustive
  // and misses non-English text, misspellings, and indirect phrasing by
  // design; false negatives here are expected to be caught by the human
  // review queue for anything that reads as high-risk on manual read.
  private readonly crisisPhrases = [
    "kill myself",
    "end my life",
    "want to die",
    "suicidal",
    "suicide",
    "hurt myself",
    "self harm",
    "self-harm",
  ];

  async checkContent(
    text: string,
    _context: ModerationContext,
  ): Promise<ModerationCheckResult> {
    const reasons: ModerationReason[] = [];
    const lower = text.toLowerCase();

    if (this.crisisPhrases.some((phrase) => lower.includes(phrase))) {
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
