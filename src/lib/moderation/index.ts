import { env } from "@/lib/env";
import { mockModerationProvider } from "@/lib/moderation/mock-provider";
import { anthropicModerationProvider } from "@/lib/moderation/anthropic-provider";
import type { ModerationProvider } from "@/lib/moderation/types";

export type {
  ModerationCheckResult,
  ModerationContext,
  ModerationProvider,
  ModerationReason,
} from "@/lib/moderation/types";

let warned = false;

/**
 * The active moderation backend, chosen by the MODERATION_PROVIDER env var
 * ("mock", the default, or "anthropic"). Every server action that moderates
 * content should go through this function rather than importing a concrete
 * implementation directly.
 */
export function getModerationProvider(): ModerationProvider {
  const provider =
    env.moderationProvider() === "anthropic" ? anthropicModerationProvider : mockModerationProvider;

  if (!provider.isProductionReady && !warned) {
    warned = true;
    // Deliberately not user content — provider name only.
    console.warn(
      `[moderation] Using "${provider.name}" moderation provider, which is NOT production-ready.`,
    );
  }

  return provider;
}
