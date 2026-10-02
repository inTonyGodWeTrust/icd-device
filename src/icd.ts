import * as fs from 'fs';
import { parse } from 'yaml';

export interface Param {
  type: 'enum' | 'integer' | 'number' | 'boolean';
  values?: string[];
  min?: number;
  max?: number;
  unit?: string;
  warnAbove?: number;
}

export interface Command {
  forbiddenIn?: string[];
  params: Record<string, Param>;
}

export interface Icd {
  device: string;
  revision: string;
  modes: string[];
  commands: Record<string, Command>;
  telemetry: Record<string, Param>;
}

export function loadIcd(path: string): Icd {
  return parse(fs.readFileSync(path, 'utf8')) as Icd;
}
