import constants from '../../pages/constants';
import { expect, test } from '../fixtures';

test.describe('Commands', () => {
  test('SET_MODE accepts every mode from the ICD', async ({ device, icd }) => {
    for (const mode of icd.modes) {
      await test.step(`Switch to ${mode}`, async () => {
        expect(await device.sendCommand('SET_MODE', { mode })).toEqual({ ack: true });
        expect((await device.getTelemetry()).mode).toEqual(mode);
      });
    }
  });

  test.describe('SET_EXPOSURE boundaries from the ICD', () => {
    test('values on and around the limits', async ({ device, icd }) => {
      const { min, max } = icd.commands.SET_EXPOSURE.params.exposure_ms;
      const cases = [
        { value: min! - 1, ack: false },
        { value: min!, ack: true },
        { value: max!, ack: true },
        { value: max! + 1, ack: false },
      ];

      for (const { value, ack } of cases) {
        await test.step(`${value} ms -> ${ack ? 'accepted' : 'rejected'}`, async () => {
          const result = await device.sendCommand('SET_EXPOSURE', { exposure_ms: value });
          expect(result.ack).toEqual(ack);
          if (!ack) expect(result.reason).toEqual('OUT_OF_RANGE');
        });
      }
    });
  });

  test('SET_EXPOSURE is forbidden in CALIBRATION', async ({ device }) => {
    await test.step('Enter CALIBRATION', async () => {
      expect(await device.sendCommand('SET_MODE', { mode: 'CALIBRATION' })).toEqual({ ack: true });
    });

    await test.step('Command is rejected', async () => {
      expect(await device.sendCommand('SET_EXPOSURE', { exposure_ms: 250 })).toEqual({ ack: false, reason: 'FORBIDDEN_IN_MODE' });
    });

    await test.step('Works again after leaving CALIBRATION', async () => {
      await device.sendCommand('SET_MODE', { mode: 'TRACKING' });
      expect(await device.sendCommand('SET_EXPOSURE', { exposure_ms: 250 })).toEqual({ ack: true });
      expect((await device.getTelemetry()).exposure_ms).toEqual(250);
    });
  });

  test.describe('Invalid commands are rejected and change nothing', () => {
    const cases = [
      { title: 'unknown command', command: 'SELF_DESTRUCT', params: {}, reason: 'UNKNOWN_COMMAND' },
      { title: 'missing parameter', command: 'SET_MODE', params: {}, reason: 'MISSING_PARAM' },
      { title: 'unknown mode', command: 'SET_MODE', params: { mode: 'TURBO' }, reason: 'INVALID_VALUE' },
      { title: 'exposure as text', command: 'SET_EXPOSURE', params: { exposure_ms: '100' }, reason: 'INVALID_VALUE' },
      { title: 'fractional exposure', command: 'SET_EXPOSURE', params: { exposure_ms: 10.5 }, reason: 'INVALID_VALUE' },
      { title: 'negative exposure', command: 'SET_EXPOSURE', params: { exposure_ms: -1 }, reason: 'OUT_OF_RANGE' },
    ];

    for (const { title, command, params, reason } of cases) {
      test(title, async ({ device }) => {
        expect(await device.sendCommand(command, params)).toEqual({ ack: false, reason });
        expect(await device.getState()).toMatchObject(constants.DEFAULT_STATE);
      });
    }
  });
});
