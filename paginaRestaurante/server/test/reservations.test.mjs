import test from 'node:test';
import assert from 'node:assert/strict';
import { reservationInput } from '../dist/models/reservation.model.js';
const data = { name: ' Ana ', guests: 4, date: '2026-10-16', time: '20:30' };
test('reservations default to pending and accept all three explicit states', () => {
  assert.equal(reservationInput(data).status, 'pending');
  for (const status of ['pending', 'confirmed', 'cancelled']) {
    assert.deepEqual(reservationInput({ ...data, status, revision: 999, injected: true }), { ...data, name: 'Ana', status });
  }
});
test('reservation edits reject unknown states and impossible dates or times', () => {
  for (const bad of [{ status: 'paid' }, { status: {} }, { date: '2026-02-30' }, { time: '24:00' }, { guests: 0 }, { name: ' ' }]) {
    assert.throws(() => reservationInput({ ...data, ...bad }));
  }
});
