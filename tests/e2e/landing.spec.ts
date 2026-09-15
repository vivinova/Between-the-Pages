import { test, expect } from "@playwright/test";

test("home page offers sign up and sign in", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByRole("heading", { name: "Between the Pages" })).toBeVisible();
  await expect(page.getByRole("link", { name: "Start your journal" })).toBeVisible();
  await expect(page.getByRole("link", { name: "Sign in" })).toBeVisible();
});

test("protected routes redirect anonymous visitors to sign in", async ({ page }) => {
  for (const path of ["/today", "/journal", "/journal/new", "/journal/passages"]) {
    await page.goto(path);
    await expect(page).toHaveURL(/\/login/);
  }
});

test("library is browsable without an account", async ({ page }) => {
  await page.goto("/library");
  await expect(page).toHaveURL(/\/library/);
  await expect(page.getByRole("heading", { name: "The Library" })).toBeVisible();
});
