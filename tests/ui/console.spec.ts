import constants from '../../pages/constants';
import { expect, test } from '../fixtures';

// Hybrid tests: state is prepared and verified through the API, actions and display are checked in the UI
test.describe('Device console', () => {
  test('telemetry table shows every ICD value with its unit', async ({ consolePage, icd }) => {
    for (const [name, param] of Object.entries(icd.telemetry)) {
      await test.step(name, async () => {
        const row = consolePage.telemetryRow(name);
        await expect(row).toBeVisible();
        if (param.unit) await expect(row.getByTestId('unit')).toHaveText(param.unit);
      });
    }
  });

  test('mode changed in the UI reaches the device', async ({ consolePage, device }) => {
    await test.step('Set TRACKING in the UI', async () => {
      await consolePage.setMode('TRACKING');
      await expect(consolePage.commandResult).toHaveText('Command accepted');
    });

    await test.step('Device state is updated', async () => {
      expect((await device.getState()).mode).toEqual('TRACKING');
    });

    await test.step('Telemetry table shows the new mode', async () => {
      await consolePage.refresh();
      await consolePage.expectTelemetry('mode', 'TRACKING');
    });
  });

  test('exposure above the ICD limit is rejected with a clear message', async ({ consolePage, device, icd }) => {
    const { max } = icd.commands.SET_EXPOSURE.params.exposure_ms;

    await consolePage.setExposure(max! + 1);

    await expect(consolePage.commandResult).toContainText('OUT_OF_RANGE');
    expect((await device.getState()).exposure_ms).toEqual(constants.DEFAULT_STATE.exposure_ms);
  });

  test('exposure change is rejected in CALIBRATION', async ({ consolePage, device }) => {
    await device.sendCommand('SET_MODE', { mode: 'CALIBRATION' });

    await consolePage.setExposure(250);

    await expect(consolePage.commandResult).toContainText('FORBIDDEN_IN_MODE');
  });

  test('high temperature is shown as a warning', async ({ consolePage, device, icd }) => {
    const temperature = icd.telemetry.temperature.warnAbove! + 5;
    await device.inject({ temperature });

    await consolePage.refresh();

    await consolePage.expectTelemetry('temperature', String(temperature), 'WARNING');
    await consolePage.expectTelemetry('temp_warn', 'true', 'WARNING');
  });
});
