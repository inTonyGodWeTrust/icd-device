import { APIRequestContext, expect } from '@playwright/test';
import constants from './constants';

export class DeviceApi {
  constructor(private readonly request: APIRequestContext) {}

  async sendCommand(command: string, params: Record<string, unknown> = {}) {
    const response = await this.request.post(constants.LINKS.COMMAND, { data: { command, ...params } });
    expect(response.status()).toEqual(200);
    return response.json();
  }

  async getTelemetry() {
    const response = await this.request.get(constants.LINKS.TELEMETRY);
    expect(response.status()).toEqual(200);
    return response.json();
  }

  async getState() {
    const response = await this.request.get(constants.LINKS.STATE);
    expect(response.status()).toEqual(200);
    return response.json();
  }

  async inject(values: { temperature?: number; counter?: number }) {
    const response = await this.request.post(constants.LINKS.INJECT, { data: values });
    expect(response.status()).toEqual(204);
  }
}
