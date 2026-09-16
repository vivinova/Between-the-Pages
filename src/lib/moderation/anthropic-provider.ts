import Anthropic from "@anthropic-ai/sdk";
import { jsonSchemaOutputFormat } from "@anthropic-ai/sdk/helpers/json-schema";
import { env } from "@/lib/env";
import { checkForPossiblePii } from "@/lib/moderation/pii";
import { checkForCrisisLanguage } from "@/lib/moderation/crisis";
import type {
  ModerationCheckResult,
  ModerationContext,
  ModerationProvider,
  ModerationReason,
} from "@/lib/moderation/types";

const MODEL = "claude-opus-5";

// The categories Claude is asked to choose from. Kept separate from
// ModerationReason (a superset) so a schema change here can't silently
// widen what the classifier is allowed to return without a matching
// update to the JSON schema below.
const CLASSIFIER_REASONS = [
  "possible_pii",
  "possible_crisis_language",
  "possible_harassment_language",
  "graphic_or_violent_content",
  "hate_or_discrimination",
  "sexual_content",
  "spam_or_incoherent_content",
] as const satisfies readonly ModerationReason[];

const CLASSIFICATION_JSON_SCHEMA = {
  type: "object",
  properties: {
    risk_level: { type: "string", enum: ["low", "flagged"] },
    reasons: {
      type: "array",
      items: { type: "string", enum: CLASSIFIER_REASONS },
    },
  },
  required: ["risk_level", "reasons"],
  additionalProperties: false,
} as const;

const classificationOutputFormat = jsonSchemaOutputFormat(CLASSIFICATION_JSON_SCHEMA);

const CONTEXT_DESCRIPTION: Record<ModerationContext, string> = {
  confession:
    "an anonymous confession someone is submitting to a public board, to be published under a category (e.g. grief, regret, identity) with no author attached",
  reply:
    "a short anonymous reply someone is leaving on another visitor's published confession",
};

function buildSystemPrompt(context: ModerationContext): string {
  return `You are the content-safety classifier for an anonymous confession board: visitors submit a confession under a category, and it publishes anonymously with no account or login behind it. Other visitors can react to and reply to a published confession, also anonymously.

You are classifying ${CONTEXT_DESCRIPTION[context]}, before it is shown to anyone else.

This board exists specifically so people can admit things they can't say elsewhere — grief, regret, self-harm history, addiction, family conflict, secrets. Describing a difficult experience, including past or present thoughts of self-harm or suicide, is the normal, expected use of this board and must NOT by itself be flagged as "possible_crisis_language" — that reason is for language suggesting the person may be in danger right now and could benefit from a human moderator seeing it before it's shared (e.g. an active plan, a present-tense expression of intent, a goodbye message), not for reflective or past-tense writing about hard experiences.

Classify the text into exactly these categories where they apply:
- possible_pii: a real name, phone number, email, address, employer, school, or other detail specific enough to identify the writer or someone else, beyond what anonymous sharing intends.
- possible_crisis_language: suggests the writer may be at active risk right now, as described above — not general reflection on past difficulty.
- possible_harassment_language: targets, threatens, or demeans a specific identifiable person (not the writer's own past experience of being harassed).
- graphic_or_violent_content: gratuitous graphic violence or gore, distinct from describing having survived something violent.
- hate_or_discrimination: hate speech or discrimination against a protected group.
- sexual_content: explicit sexual content.
- spam_or_incoherent_content: spam, advertising, or text with no coherent reflective content at all.

Assign risk_level "flagged" if any category applies, "low" otherwise. List every category that applies in reasons (empty if none). Err toward "low" for ordinary difficult, personal writing — the cost of over-flagging is real people's honest reflections getting delayed in a review queue.`;
}

let client: Anthropic | undefined;

function getClient(): Anthropic {
  if (!client) {
    client = new Anthropic({ apiKey: env.anthropicApiKey() });
  }
  return client;
}

async function classify(
  text: string,
  context: ModerationContext,
): Promise<{ riskLevel: "low" | "flagged"; reasons: ModerationReason[] } | "refused"> {
  const response = await getClient().messages.parse({
    model: MODEL,
    max_tokens: 1024,
    system: buildSystemPrompt(context),
    messages: [{ role: "user", content: text }],
    output_config: { format: classificationOutputFormat },
  });

  if (response.stop_reason === "refusal") {
    return "refused";
  }

  if (!response.parsed_output) {
    throw new Error("Moderation classifier returned unparseable output.");
  }

  return {
    riskLevel: response.parsed_output.risk_level,
    reasons: response.parsed_output.reasons,
  };
}

/**
 * Real moderation backend: Claude classifies the text against the
 * categories above, combined with the same deterministic PII/crisis-keyword
 * heuristics the mock provider uses as a fast, dependency-free backstop.
 *
 * Fails closed: a classifier refusal or any API/network error routes the
 * content to human review rather than guessing — see submitBook /
 * submitMarginNote, which only auto-publish when requiresHumanReview is
 * false. It never blocks or auto-removes content on its own; the two-step
 * insert-as-pending/admin-promote pattern means the worst this provider can
 * do on failure is leave something in the moderator queue.
 */
class AnthropicModerationProvider implements ModerationProvider {
  readonly name = "anthropic";
  readonly isProductionReady = true;

  async checkContent(
    text: string,
    context: ModerationContext,
  ): Promise<ModerationCheckResult> {
    const reasons = new Set<ModerationReason>();

    if (checkForCrisisLanguage(text)) {
      reasons.add("possible_crisis_language");
    }
    if (checkForPossiblePii(text).hasPossibleMatch) {
      reasons.add("possible_pii");
    }

    try {
      const result = await classify(text, context);
      if (result === "refused") {
        reasons.add("flagged_by_safety_classifier");
      } else {
        result.reasons.forEach((reason) => reasons.add(reason));
      }
    } catch (error) {
      // Deliberately not user content — error detail only, for operators.
      console.error("[moderation] Anthropic classifier call failed:", error);
      reasons.add("moderation_check_failed");
    }

    const flagged = reasons.size > 0;
    return {
      riskLevel: flagged ? "flagged" : "low",
      requiresHumanReview: flagged,
      reasons: [...reasons],
    };
  }
}

export const anthropicModerationProvider = new AnthropicModerationProvider();
