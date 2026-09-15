import { mockModerationProvider } from "@/lib/moderation/mock-provider";
import type { ModerationProvider } from "@/lib/moderation/types";

export type {
  ModerationCheckResult,
  ModerationContext,
  ModerationProvider,
  ModerationReason,
} from "@/lib/moderation/types";

let warned = false;

/**
 * The active moderation backend. Currently always the mock provider — there
 * is no real provider wired up yet. When one exists, branch on an env var
 * here (e.g. MODERATION_PROVIDER) rather than changing call sites; every
 * server action that moderates content should go through this function.
 */
export function getModerationProvider(): ModerationProvider {
  const provider = mockModerationProvider;

  if (!provider.isProductionReady && !warned) {
    warned = true;
    // Deliberately not user content — provider name only.
    console.warn(
      `[moderation] Using "${provider.name}" moderation provider, which is NOT production-ready.`,
    );
  }

  return provider;
}
