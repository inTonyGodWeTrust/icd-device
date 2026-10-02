import { expect, test } from '../fixtures';

test.describe('ICD consistency', () => {
  test('every numeric value has a unit and a valid range', async ({ icd }) => {
    const numeric = [
      ...Object.entries(icd.telemetry).map(([name, param]) => ({ name: `telemetry.${name}`, param })),
      ...Object.entries(icd.commands).flatMap(([command, spec]) =>
        Object.entries(spec.params).map(([name, param]) => ({ name: `${command}.${name}`, param })),
      ),
    ].filter(({ param }) => param.type === 'integer' || param.type === 'number');

    for (const { name, param } of numeric) {
      await test.step(name, async () => {
        expect(param.min, `${name} has no min`).toBeDefined();
        expect(param.max, `${name} has no max`).toBeDefined();
        expect(param.min!).toBeLessThan(param.max!);
        if (name !== 'telemetry.counter') expect(param.unit, `${name} has no unit`).toBeTruthy();
      });
    }
  });

  test('enum values match the list of device modes', async ({ icd }) => {
    expect(icd.commands.SET_MODE.params.mode.values).toEqual(icd.modes);
    expect(icd.telemetry.mode.values).toEqual(icd.modes);
  });

  test('command limits match telemetry limits', async ({ icd }) => {
    const command = icd.commands.SET_EXPOSURE.params.exposure_ms;
    const telemetry = icd.telemetry.exposure_ms;
    expect([command.min, command.max]).toEqual([telemetry.min, telemetry.max]);
  });

  test('warning threshold is inside the temperature range', async ({ icd }) => {
    const { min, max, warnAbove } = icd.telemetry.temperature;
    expect(warnAbove).toBeGreaterThan(min!);
    expect(warnAbove).toBeLessThan(max!);
  });

  test('forbiddenIn refers only to existing modes', async ({ icd }) => {
    for (const [name, command] of Object.entries(icd.commands)) {
      for (const mode of command.forbiddenIn ?? []) {
        expect(icd.modes, `${name}.forbiddenIn`).toContain(mode);
      }
    }
  });
});
