export default {
  BASE_URL: `http://localhost:${process.env.SIM_PORT ?? 4310}`,
  // Device console web app (not part of this repo). UI tests run only when UI_URL is set.
  UI_URL: process.env.UI_URL,
  SESSION_HEADER: 'x-sim-session',
  ICD_PATH: 'icd/star-tracker.yaml',

  LINKS: {
    HEALTH: '/api/health',
    COMMAND: '/api/command',
    TELEMETRY: '/api/telemetry',
    STATE: '/api/state',
    INJECT: '/api/inject',
    SESSION: '/api/session',
  },

  DEFAULT_STATE: {
    mode: 'STANDBY',
    exposure_ms: 100,
  },
} as const;
