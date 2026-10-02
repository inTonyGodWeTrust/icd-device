import { expect, test } from '../fixtures';

test.describe('Telemetry', () => {
  test('every value is inside its ICD range', async ({ device, icd }) => {
    const telemetry = await device.getTelemetry();

    for (const [name, param] of Object.entries(icd.telemetry)) {
      await test.step(name, async () => {
        expect(telemetry[name], `${name} is missing`).toBeDefined();
        if (param.type === 'enum') expect(param.values).toContain(telemetry[name]);
        if (param.min !== undefined) expect(telemetry[name]).toBeGreaterThanOrEqual(param.min);
        if (param.max !== undefined) expect(telemetry[name]).toBeLessThanOrEqual(param.max);
      });
    }
  });

  test('counter increases by 1 per packet', async ({ device }) => {
    const counters = [];
    for (let i = 0; i < 5; i++) counters.push((await device.getTelemetry()).counter);
    expect(counters).toEqual([0, 1, 2, 3, 4]);
  });

  test('counter wraps from 65535 to 0', async ({ device }) => {
    await device.inject({ counter: 65535 });
    expect((await device.getTelemetry()).counter).toEqual(65535);
    expect((await device.getTelemetry()).counter).toEqual(0);
  });

  test.describe('temp_warn threshold from the ICD', () => {
    const cases = [
      { delta: -0.1, warn: false },
      { delta: 0, warn: false },
      { delta: 0.1, warn: true },
    ];

    for (const { delta, warn } of cases) {
      test(`threshold ${delta >= 0 ? '+' : ''}${delta} degC -> temp_warn ${warn}`, async ({ device, icd }) => {
        const temperature = icd.telemetry.temperature.warnAbove! + delta;
        await device.inject({ temperature });

        const telemetry = await device.getTelemetry();

        expect(telemetry.temperature).toEqual(temperature);
        expect(telemetry.temp_warn).toEqual(warn);
      });
    }
  });
});
