// Playwright : outil developpeur uniquement.
// Chromium headless, canal Chrome seulement si PLAYWRIGHT_CHANNEL=chrome.
// Serveur local fourni, jamais un autre processus.

import { defineConfig } from "@playwright/test";

const baseURL = "http://127.0.0.1:4173";
const avecCanalChrome = process.env.PLAYWRIGHT_CHANNEL === "chrome";

export default defineConfig({
  testDir: "./browser",
  // Le smoke test vise un déploiement réel : il a sa propre configuration.
  testIgnore: /smoke\.spec\.js$/,
  fullyParallel: false,
  workers: 1,
  retries: 0,
  reporter: "list",
  timeout: 20000,
  use: {
    baseURL,
    viewport: { width: 1280, height: 800 }
  },
  projects: [
    {
      name: "chromium",
      use: {
        browserName: "chromium",
        headless: true,
        ...(avecCanalChrome ? { channel: "chrome" } : {})
      }
    }
  ],
  webServer: {
    command: "node server/start.js",
    url: baseURL,
    reuseExistingServer: false,
    timeout: 20000,
    env: {
      HOST: "127.0.0.1",
      PORT: "4173"
    }
  }
});
