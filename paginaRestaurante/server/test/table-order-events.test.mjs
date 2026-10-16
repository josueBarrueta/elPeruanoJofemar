import test from 'node:test';
import assert from 'node:assert/strict';
import { EventEmitter } from 'node:events';
import { createLiveEvents, tableOrderEvents, notifyTableOrdersChanged } from '../dist/routes/table-order-events.js';

function client() {
  const response = new EventEmitter();
  response.messages = [];
  response.set = headers => { response.headers = headers; };
  response.flushHeaders = () => {};
  response.write = message => { response.messages.push(message); return !response.slow; };
  response.end = () => { response.ended = true; response.emit('close'); };
  tableOrderEvents({}, response);
  return response;
}
test('live changes reach five waiters; disconnected clients are removed and reconnects resync', () => {
  const clients = Array.from({ length: 5 }, client);
  try {
    for (const c of clients) assert.match(c.messages[0], /connected/);
    notifyTableOrdersChanged();
    for (const c of clients) assert.match(c.messages[1], /changed/);
    clients[0].end();
    notifyTableOrdersChanged();
    assert.equal(clients[0].messages.length, 2);
    for (const c of clients.slice(1)) assert.equal(c.messages.length, 3);
    const reconnected = client();
    clients.push(reconnected);
    assert.match(reconnected.messages[0], /connected/);
  } finally { for (const c of clients) c.end(); }
});
test('a slow device is disconnected without preventing delivery to other waiters', () => {
  const slow = client(); const fast = client(); slow.slow = true;
  try {
    notifyTableOrdersChanged();
    assert.equal(slow.ended, true);
    assert.match(fast.messages[1], /changed/);
    notifyTableOrdersChanged();
    assert.equal(slow.messages.length, 2);
    assert.equal(fast.messages.length, 3);
  } finally { slow.end(); fast.end(); }
});

test('periodic resync recovers a lost notification without any new write', async () => {
  const hub = createLiveEvents(10);
  const response = new EventEmitter();
  const messages = [];
  response.set = () => {};
  response.flushHeaders = () => {};
  response.write = message => { messages.push(message); return true; };
  response.end = () => response.emit('close');
  hub.events({}, response);
  try {
    await new Promise(resolve => setTimeout(resolve, 35));
    assert.ok(messages.some(message => message.includes('data: resync')));
  } finally { response.end(); }
  const count = messages.length;
  await new Promise(resolve => setTimeout(resolve, 25));
  assert.equal(messages.length, count);
});
