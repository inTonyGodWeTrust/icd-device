import { expect, Locator, Page } from '@playwright/test';

/** Device console: telemetry table and command panel */
export class ConsolePage {
  readonly telemetryTable: Locator;
  readonly modeSelect: Locator;
  readonly exposureInput: Locator;
  readonly sendModeButton: Locator;
  readonly sendExposureButton: Locator;
  readonly refreshButton: Locator;
  readonly commandResult: Locator;

  constructor(private readonly page: Page) {
    this.telemetryTable = page.getByTestId('telemetry-table');
    this.modeSelect = page.getByLabel('Mode');
    this.exposureInput = page.getByLabel('Exposure, ms');
    this.sendModeButton = page.getByRole('button', { name: 'Set mode' });
    this.sendExposureButton = page.getByRole('button', { name: 'Set exposure' });
    this.refreshButton = page.getByRole('button', { name: 'Refresh telemetry' });
    this.commandResult = page.getByTestId('command-result');
  }

  async open(session: string) {
    await this.page.goto(`/?session=${session}`);
    await expect(this.telemetryTable).toBeVisible();
  }

  async setMode(mode: string) {
    await this.modeSelect.selectOption(mode);
    await this.sendModeButton.click();
  }

  async setExposure(value: number) {
    await this.exposureInput.fill(String(value));
    await this.sendExposureButton.click();
  }

  async refresh() {
    await this.refreshButton.click();
  }

  telemetryRow(name: string) {
    return this.telemetryTable.getByTestId(`row-${name}`);
  }

  async expectTelemetry(name: string, value: string, status = 'OK') {
    const row = this.telemetryRow(name);
    await expect(row.getByTestId('value')).toHaveText(value);
    await expect(row.getByTestId('status')).toContainText(status);
  }
}
