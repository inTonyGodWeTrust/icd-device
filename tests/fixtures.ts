import { test as base } from '@playwright/test';
import constants from '../pages/constants';
import { ConsolePage } from '../pages/consolePage';
import { DeviceApi } from '../pages/deviceApi';
import { Icd, loadIcd } from '../src/icd';

type Fixtures = {
  icd: Icd;
  session: string;
  device: DeviceApi;
  consolePage: ConsolePage;
};

export const test = base.extend<Fixtures>({
  icd: async ({}, use) => {
    await use(loadIcd(constants.ICD_PATH));
  },

  // Each test gets its own device on the simulator: tests run in parallel and do not depend on each other
  session: async ({}, use, testInfo) => {
    await use(`${testInfo.testId}-${testInfo.retry}`);
  },

  device: async ({ playwright, session }, use) => {
    const request = await playwright.request.newContext({
      baseURL: constants.BASE_URL,
      extraHTTPHeaders: { [constants.SESSION_HEADER]: session },
    });
    await use(new DeviceApi(request));
    await request.delete(constants.LINKS.SESSION);
    await request.dispose();
  },

  // The console opens the same simulator session, so state set through the API is visible in the UI
  consolePage: async ({ page, session }, use) => {
    const consolePage = new ConsolePage(page);
    await consolePage.open(session);
    await use(consolePage);
  },
});

export { expect } from '@playwright/test';
