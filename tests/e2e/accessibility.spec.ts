import { test, expect } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";

// Scans the pages reachable without a Supabase session in this sandbox.
// Authenticated pages (Today, Journal, Library book reader, Settings, the
// moderator dashboard, ...) need a real Supabase project to sign in and
// should be scanned the same way once one is available — see the README's
// manual verification checklist.
const PAGES_TO_SCAN = ["/", "/login", "/signup", "/reset-password", "/library", "/library/find", "/support"];

for (const path of PAGES_TO_SCAN) {
  test(`${path} has no automatically detectable accessibility violations`, async ({ page }) => {
    await page.goto(path);
    const results = await new AxeBuilder({ page })
      .withTags(["wcag2a", "wcag2aa", "wcag22aa"])
      .analyze();
    expect(results.violations, JSON.stringify(results.violations, null, 2)).toEqual([]);
  });
}
