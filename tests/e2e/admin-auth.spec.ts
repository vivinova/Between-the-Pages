import { test, expect } from "@playwright/test";

const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD;

// loginAdmin (and the overview page) call out to Supabase before doing
// anything else (checkRateLimit, then the overview page's three count
// queries) — against a real project that's fast, but in this sandbox
// NEXT_PUBLIC_SUPABASE_URL is an unreachable placeholder, so every one of
// those calls pays a real DNS-resolution failure (several seconds) before
// falling through to its error-handling path. The generous timeouts below
// are a sandbox accommodation, not a statement about real-world latency.
const NETWORK_TIMEOUT = 20_000;

test("an unauthenticated visitor is redirected away from /admin", async ({ page }) => {
  await page.goto("/admin");
  await expect(page).toHaveURL(/\/admin\/login/);
});

test("signing in with the wrong passphrase fails", async ({ page }) => {
  await page.goto("/admin/login");
  await page.getByLabel("Passphrase").fill("definitely-wrong");
  await page.getByRole("button", { name: "Sign in" }).click();
  await expect(page.getByText("Incorrect password.")).toBeVisible({
    timeout: NETWORK_TIMEOUT,
  });
  await expect(page).toHaveURL(/\/admin\/login/);
});

const testOrSkip = ADMIN_PASSWORD ? test : test.skip;

testOrSkip(
  "signing in with the correct passphrase reaches the dashboard, and signing out re-gates it",
  async ({ page }) => {
    test.setTimeout(60_000);

    await page.goto("/admin/login");
    await page.getByLabel("Passphrase").fill(ADMIN_PASSWORD!);
    await page.getByRole("button", { name: "Sign in" }).click();
    await expect(page).toHaveURL(/\/admin$/, { timeout: NETWORK_TIMEOUT });
    await expect(page.getByRole("heading", { name: "Overview" })).toBeVisible({
      timeout: NETWORK_TIMEOUT,
    });

    await page.getByRole("button", { name: "Sign out" }).click();
    await expect(page).toHaveURL(/\/admin\/login/);
    await page.goto("/admin");
    await expect(page).toHaveURL(/\/admin\/login/);
  },
);
