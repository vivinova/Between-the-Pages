import { test, expect } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";

// Every page in this app is reachable without an account — there are no
// accounts. /admin/login is public (it's the gate itself); pages behind it
// need a real Supabase project to have anything to moderate, so they
// aren't scanned here — see the README's manual verification checklist.
const PAGES_TO_SCAN = ["/", "/categories", "/confess", "/support", "/saved", "/admin/login"];

for (const path of PAGES_TO_SCAN) {
  test(`${path} has no automatically detectable accessibility violations`, async ({ page }) => {
    await page.goto(path);
    const results = await new AxeBuilder({ page })
      .withTags(["wcag2a", "wcag2aa", "wcag22aa"])
      .analyze();
    expect(results.violations, JSON.stringify(results.violations, null, 2)).toEqual([]);
  });
}
