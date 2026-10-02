import * as http from 'http';
import * as path from 'path';
import { Device } from './device';
import { loadIcd } from './icd';

const PORT = Number(process.env.SIM_PORT ?? 4310);
const icd = loadIcd(path.resolve(__dirname, '../icd/star-tracker.yaml'));

// One device per x-sim-session header, so parallel tests never share state
const sessions = new Map<string, Device>();

function deviceFor(req: http.IncomingMessage): Device {
  const id = String(req.headers['x-sim-session'] ?? 'default');
  if (!sessions.has(id)) sessions.set(id, new Device(icd));
  return sessions.get(id)!;
}

async function readBody(req: http.IncomingMessage): Promise<Record<string, unknown>> {
  let text = '';
  for await (const chunk of req) text += chunk;
  return text ? JSON.parse(text) : {};
}

function send(res: http.ServerResponse, status: number, body?: unknown) {
  res.writeHead(status, { 'content-type': 'application/json' });
  res.end(body === undefined ? undefined : JSON.stringify(body));
}

const server = http.createServer(async (req, res) => {
  try {
    const route = `${req.method} ${req.url}`;
    if (route === 'GET /api/health') return send(res, 200, { status: 'ok' });
    if (route === 'POST /api/command') return send(res, 200, deviceFor(req).command(await readBody(req)));
    if (route === 'GET /api/telemetry') return send(res, 200, deviceFor(req).telemetry());
    if (route === 'GET /api/state') return send(res, 200, deviceFor(req).getState());
    if (route === 'POST /api/inject') {
      deviceFor(req).inject(await readBody(req));
      return send(res, 204);
    }
    if (route === 'DELETE /api/session') {
      sessions.delete(String(req.headers['x-sim-session']));
      return send(res, 204);
    }
    send(res, 404, { error: `${route} not found` });
  } catch (error) {
    send(res, 400, { error: (error as Error).message });
  }
});

server.listen(PORT, () => console.log(`Simulator for ${icd.device} on http://localhost:${PORT}`));
