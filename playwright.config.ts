import { readFileSync, existsSync } from "node:fs";
import path from "node:path";
import { defineConfig, devices } from "@playwright/test";

// Next.js loads .env.local itself for the webServer process below, but the
// Playwright test runner is a separate Node process that doesn't — tests
// that need an env value (e.g. ADMIN_PASSWORD, to drive the admin login
// flow) read process.env directly, so parse the same file here too. No new
// dependency: this only needs to handle simple KEY=VALUE lines, which is
// all .env.local ever contains. (Playwright loads this config as CommonJS,
// so __dirname is used rather than import.meta.)
const envLocalPath = path.join(__dirname, ".env.local");
if (existsSync(envLocalPath)) {
  for (const line of readFileSync(envLocalPath, "utf-8").split("\n")) {
    const match = /^([A-Z0-9_]+)=(.*)$/.exec(line.trim());
    const key = match?.[1];
    const value = match?.[2];
    if (key !== undefined && value !== undefined && !(key in process.env)) {
      process.env[key] = value;
    }
  }
}

export default defineConfig({
  testDir: "./tests/e2e",
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  reporter: "list",
  use: {
    baseURL: process.env.PLAYWRIGHT_BASE_URL ?? "http://localhost:3000",
    trace: "on-first-retry",
  },
  projects: [
    {
      name: "chromium",
      use: {
        ...devices["Desktop Chrome"],
        // This environment pre-installs Chromium at a fixed path rather
        // than the version Playwright would otherwise auto-download.
        launchOptions: process.env.PLAYWRIGHT_CHROMIUM_PATH
          ? { executablePath: process.env.PLAYWRIGHT_CHROMIUM_PATH }
          : undefined,
      },
    },
  ],
  webServer: process.env.PLAYWRIGHT_BASE_URL
    ? undefined
    : {
        command: "npm run build && npm run start",
        url: "http://localhost:3000",
        reuseExistingServer: !process.env.CI,
        timeout: 120_000,
      },
});
