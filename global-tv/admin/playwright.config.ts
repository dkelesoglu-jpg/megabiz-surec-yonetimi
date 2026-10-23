import { defineConfig, devices } from '@playwright/test';

// Yerelde önceden kurulu Chromium kullanılabilir: PW_CHROMIUM_PATH=/opt/pw-browsers/chromium
const executablePath = process.env.PW_CHROMIUM_PATH || undefined;

export default defineConfig({
  testDir: './e2e',
  fullyParallel: true,
  retries: 0,
  reporter: [['list']],
  use: { baseURL: 'http://localhost:4173', trace: 'retain-on-failure' },
  webServer: {
    command: 'npm run build && npm run preview',
    url: 'http://localhost:4173',
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
  },
  projects: [
    { name: 'masaustu', use: { ...devices['Desktop Chrome'], launchOptions: { executablePath } } },
    { name: 'mobil', use: { ...devices['Pixel 7'], launchOptions: { executablePath } } },
  ],
});
