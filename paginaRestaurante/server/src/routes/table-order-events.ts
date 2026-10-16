import type { Request, Response } from 'express';

const clients = new Set<Response>();
export function notifyTableOrdersChanged() {
  for (const client of clients) {
    // Disconnect slow clients rather than accumulating data in memory.
    if (!client.write('event: tables\ndata: changed\n\n')) client.end();
  }
}
export function tableOrderEvents(req: Request, res: Response) {
  res.set({ 'Content-Type': 'text/event-stream', 'Cache-Control': 'no-cache, no-transform', 'X-Accel-Buffering': 'no' });
  res.flushHeaders();
  clients.add(res);
  res.write('event: tables\ndata: connected\n\n');
  const heartbeat = setInterval(() => res.write(': heartbeat\n\n'), 15000);
  // Renew periodically through authentication; reconnect also reloads missed changes.
  const renew = setTimeout(() => res.end(), 240000);
  res.on('close', () => { clients.delete(res); clearInterval(heartbeat); clearTimeout(renew); });
}
