import { test, expect } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";

// Every page in this app is reachable without an account — there are no
// accounts. /admin needs a real Supabase project and the admin passphrase
// to reach past its login gate, so it isn't scanned here — see the
// README's manual verification checklist.
const PAGES_TO_SCAN = ["/", "/categories", "/confess", "/support", "/saved"];

for (const path of PAGES_TO_SCAN) {
  test(`${path} has no automatically detectable accessibility violations`, async ({ page }) => {
    await page.goto(path);
    const results = await new AxeBuilder({ page })
      .withTags(["wcag2a", "wcag2aa", "wcag22aa"])
      .analyze();
    expect(results.violations, JSON.stringify(results.violations, null, 2)).toEqual([]);
  });
}
