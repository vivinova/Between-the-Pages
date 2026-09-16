import { test, expect } from "@playwright/test";

test("home page offers confessing and browsing", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByRole("heading", { name: "Between the Pages" })).toBeVisible();
  await expect(page.getByRole("link", { name: "Leave a confession" })).toBeVisible();
  await expect(page.getByRole("link", { name: "Browse confessions" })).toBeVisible();
});

test("confess page renders the submission form", async ({ page }) => {
  await page.goto("/confess");
  await expect(page.getByRole("heading", { name: "Leave a confession" })).toBeVisible();
  await expect(page.getByLabel("Category")).toBeVisible();
  await expect(page.getByLabel("Your confession")).toBeVisible();
  await expect(page.getByRole("button", { name: "Leave this confession" })).toBeVisible();
});

test("an unknown confession id 404s", async ({ page }) => {
  await page.goto("/confessions/00000000-0000-0000-0000-000000000000");
  await expect(page.getByText("This page isn't here.")).toBeVisible();
});

test("an unknown category slug 404s", async ({ page }) => {
  await page.goto("/categories/not-a-real-category");
  await expect(page.getByText("This page isn't here.")).toBeVisible();
});
