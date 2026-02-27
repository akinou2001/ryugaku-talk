import { defineConfig, devices } from '@playwright/test'
import { TIMEOUTS, DEV_URLS } from './src/config/constants'

/**
 * Playwrightの設定ファイル
 * E2Eテストの実行環境を設定します
 */
export default defineConfig({
  testDir: './e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: 'html',
  use: {
    baseURL: process.env.PLAYWRIGHT_TEST_BASE_URL || DEV_URLS.LOCALHOST,
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
  },

  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
    {
      name: 'firefox',
      use: { ...devices['Desktop Firefox'] },
    },
    {
      name: 'webkit',
      use: { ...devices['Desktop Safari'] },
    },
  ],

  webServer: {
    command: 'npm run dev:local',
    url: DEV_URLS.LOCALHOST,
    reuseExistingServer: !process.env.CI,
    timeout: TIMEOUTS.PLAYWRIGHT_TEST,
  },
})

