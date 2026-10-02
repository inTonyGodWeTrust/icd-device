import { Icd, Param } from './icd';

export type Reason = 'UNKNOWN_COMMAND' | 'MISSING_PARAM' | 'INVALID_VALUE' | 'OUT_OF_RANGE' | 'FORBIDDEN_IN_MODE';

export interface CommandResult {
  ack: boolean;
  reason?: Reason;
}

export interface DeviceState {
  mode: string;
  exposure_ms: number;
  temperature: number;
  counter: number;
}

/** Simulated star tracker. All limits come from the ICD. */
export class Device {
  private state: DeviceState = { mode: 'STANDBY', exposure_ms: 100, temperature: 21.5, counter: 0 };

  constructor(private readonly icd: Icd) {}

  getState(): DeviceState {
    return { ...this.state };
  }

  command(body: Record<string, unknown>): CommandResult {
    const name = String(body.command);
    const spec = this.icd.commands[name];
    if (!spec) return { ack: false, reason: 'UNKNOWN_COMMAND' };

    for (const [paramName, param] of Object.entries(spec.params)) {
      const value = body[paramName];
      if (value === undefined) return { ack: false, reason: 'MISSING_PARAM' };
      const problem = validate(param, value);
      if (problem) return { ack: false, reason: problem };
    }

    if (spec.forbiddenIn?.includes(this.state.mode)) return { ack: false, reason: 'FORBIDDEN_IN_MODE' };

    if (name === 'SET_MODE') this.state.mode = String(body.mode);
    if (name === 'SET_EXPOSURE') this.state.exposure_ms = Number(body.exposure_ms);
    return { ack: true };
  }

  telemetry() {
    const warnAbove = this.icd.telemetry.temperature?.warnAbove ?? Infinity;
    const packet = {
      mode: this.state.mode,
      temperature: this.state.temperature,
      exposure_ms: this.state.exposure_ms,
      counter: this.state.counter,
      temp_warn: this.state.temperature > warnAbove,
    };
    this.state.counter = (this.state.counter + 1) % 65536;
    return packet;
  }

  /** Test hook: put the device into a state that is hard to reach naturally */
  inject(values: Partial<Pick<DeviceState, 'temperature' | 'counter'>>): void {
    Object.assign(this.state, values);
  }
}

function validate(param: Param, value: unknown): Reason | undefined {
  if (param.type === 'enum') return param.values?.includes(String(value)) ? undefined : 'INVALID_VALUE';
  if (typeof value !== 'number' || (param.type === 'integer' && !Number.isInteger(value))) return 'INVALID_VALUE';
  if ((param.min !== undefined && value < param.min) || (param.max !== undefined && value > param.max)) return 'OUT_OF_RANGE';
  return undefined;
}
