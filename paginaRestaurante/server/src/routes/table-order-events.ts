import type { Request, Response } from 'express';

export function createLiveEvents(heartbeatMs = 15000) {
const clients = new Set<Response>();
function notify() {
  for (const client of clients) {
    // Disconnect slow clients rather than accumulating data in memory.
    if (!client.write('event: tables\ndata: changed\n\n')) client.end();
  }
}
function events(_req: Request, res: Response) {
  res.set({ 'Content-Type': 'text/event-stream', 'Cache-Control': 'no-cache, no-transform', 'X-Accel-Buffering': 'no' });
  res.flushHeaders();
  res.socket?.setNoDelay(true);
  clients.add(res);
  res.write('event: tables\ndata: connected\n\n');
  const heartbeat = setInterval(() => {
    // A periodic resync also recovers events missed during reconnects or deployments.
    if (!res.write('event: tables\ndata: resync\n\n')) res.end();
  }, heartbeatMs);
  // Renew periodically through authentication; reconnect also reloads missed changes.
  const renew = setTimeout(() => res.end(), 240000);
  res.on('close', () => { clients.delete(res); clearInterval(heartbeat); clearTimeout(renew); });
}

return { notify, events };
}
const tables = createLiveEvents();
export const notifyTableOrdersChanged = tables.notify;
export const tableOrderEvents = tables.events;
