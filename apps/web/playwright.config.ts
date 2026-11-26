import { defineConfig } from "@playwright/test";

const existingServer = process.env.AUDITOR_WEB_TEST_ORIGIN;

export default defineConfig({
  testDir: "./tests/e2e",
  timeout: 30_000,
  use: {
    baseURL: existingServer ?? "http://127.0.0.1:3100",
    browserName: "chromium",
    channel: process.env.CI ? undefined : "chrome",
    screenshot: "only-on-failure",
    trace: "retain-on-failure",
  },
  webServer: existingServer ? undefined : {
    command: "npm run dev -- --port 3100",
    url: "http://127.0.0.1:3100",
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
    env: { AUDITOR_API_ORIGIN: "http://127.0.0.1:1" },
  },
});
