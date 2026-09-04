import { defineConfig } from "@playwright/test";
import { existsSync } from "node:fs";

const defaultChromePath =
  process.platform === "win32"
    ? "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe"
    : "";
const requestedChromePath =
  process.env.PLAYWRIGHT_CHROME_PATH ?? defaultChromePath;
const executablePath =
  requestedChromePath && existsSync(requestedChromePath)
    ? requestedChromePath
    : undefined;

export default defineConfig({
  testDir: "./tests/e2e",
  fullyParallel: false,
  workers: 1,
  retries: 0,
  reporter: [["list"]],
  use: {
    baseURL: process.env.PLAYWRIGHT_BASE_URL ?? "http://127.0.0.1:43173",
    browserName: "chromium",
    headless: true,
    launchOptions: executablePath ? { executablePath } : undefined,
    trace: "retain-on-failure",
    screenshot: "only-on-failure",
  },
  webServer: process.env.PLAYWRIGHT_BASE_URL
    ? undefined
    : {
        command: "npm run dev -- --hostname 127.0.0.1 --port 43173",
        url: "http://127.0.0.1:43173/en",
        reuseExistingServer: true,
        timeout: 120_000,
      },
});
