import { defineConfig, devices } from '@playwright/test';
import constants from './pages/constants';

export default defineConfig({
  testDir: './tests',
  outputDir: './output/test-results',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  reporter: [['list'], ['html', { open: 'never', outputFolder: './output/report' }]],
  use: {
    baseURL: constants.BASE_URL,
  },

  webServer: {
    command: 'npx tsx src/server.ts',
    url: `${constants.BASE_URL}${constants.LINKS.HEALTH}`,
    reuseExistingServer: !process.env.CI,
  },

  projects: [
    // If the ICD is inconsistent, device tests are meaningless, so they wait for it
    { name: 'icd', testDir: './tests/icd' },
    { name: 'api', testDir: './tests/api', dependencies: ['icd'] },
    // The device console app is not part of this repo: set UI_URL to run these tests against it
    ...(constants.UI_URL
      ? [{
          name: 'ui',
          testDir: './tests/ui',
          dependencies: ['icd'],
          use: { ...devices['Desktop Chrome'], baseURL: constants.UI_URL },
        }]
      : []),
  ],
});
