import { readFile } from 'node:fs/promises';
import { test } from 'node:test';
import assert from 'node:assert/strict';
import ts from 'typescript';
const source = await readFile(new URL('../src/models/table-order-validation.ts', import.meta.url), 'utf8');
const compiled = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.ES2022 } }).outputText;
const { orderInput, priceOrder, orderVersion } = await import('data:text/javascript;base64,' + Buffer.from(compiled).toString('base64'));
const id = '1234567890abcdef12345678';
const other = 'abcdef1234567890abcdef12';
const draft = { tableName: ' Mesa 4 ', guests: 3, notes: '', lines: [{ productId: id, quantity: 3, notes: ' Sin cebolla ' }] };
const products = [{ _id: id, name: 'Ceviche', price: 12.35, active: true }];
test('uses catalog prices, computes cents, and rejects injected totals and state', () => {
  const input = orderInput({ ...draft, totalCents: 1, status: 'closed', lines: [{ ...draft.lines[0], unitPriceCents: 1, name: 'Manipulado' }] });
  assert.equal(input.tableName, 'Mesa 4');
  assert.equal(input.lines[0].notes, 'Sin cebolla');
  assert.equal(input.status, undefined);
  const priced = priceOrder(input.lines, products);
  assert.equal(priced.totalCents, 3705);
  assert.equal(priced.lines[0].name, 'Ceviche');
});
test('keeps saved prices when the catalog changes or a product becomes unavailable', () => {
  const previous = priceOrder(orderInput(draft).lines, products).lines;
  const lines = orderInput({ ...draft, lines: [{ productId: id, quantity: 4 }] }).lines;
  assert.equal(priceOrder(lines, [], previous).totalCents, 4940);
  assert.equal(priceOrder(lines, [{ ...products[0], price: 99, active: false }], previous).totalCents, 4940);
});
test('rejects newly added missing or inactive products and invalid catalog prices', () => {
  const lines = orderInput(draft).lines;
  for (const catalog of [[], [{ ...products[0], active: false }], [{ ...products[0], price: NaN }], [{ ...products[0], price: -1 }]]) assert.throws(() => priceOrder(lines, catalog));
});
test('validates names, guests, quantities, IDs and limits', () => {
  for (const patch of [{ tableName: ' ' }, { tableName: 'a'.repeat(41) }, { guests: 0 }, { guests: 1.5 }, { guests: '2' }, { guests: 1001 }, { notes: {} }, { lines: null }]) assert.throws(() => orderInput({ ...draft, ...patch }));
  for (const patch of [{ quantity: 0 }, { quantity: 1.5 }, { quantity: '2' }, { quantity: 1001 }, { productId: 'invalid' }, { notes: 'a'.repeat(301) }]) assert.throws(() => orderInput({ ...draft, lines: [{ ...draft.lines[0], ...patch }] }));
  assert.throws(() => orderInput({ ...draft, lines: [draft.lines[0], draft.lines[0]] }));
  assert.throws(() => orderInput({ ...draft, lines: Array(101).fill(draft.lines[0]) }));
});
test('allows opening an empty table and totals several products correctly', () => {
  assert.deepEqual(priceOrder(orderInput({ ...draft, lines: [] }).lines, []), { lines: [], totalCents: 0 });
  const lines = orderInput({ ...draft, lines: [...draft.lines, { productId: other, quantity: 2 }] }).lines;
  assert.equal(priceOrder(lines, [...products, { _id: other, name: 'Agua', price: 1.1 }]).totalCents, 3925);
});
test('requires a revision for updates to prevent overwriting another tablet', () => {
  for (const revision of [undefined, null, '0', -1, 1.5, NaN]) assert.throws(() => orderVersion(revision));
  assert.equal(orderVersion(0), 0);
  assert.equal(orderVersion(3), 3);
});
test('tax snapshots come from the catalog and stay fixed when catalog taxes change',()=>{
 const lines=orderInput(draft).lines;
 const first=priceOrder(lines,[{...products[0],taxRate:10}]);
 assert.equal(first.lines[0].taxRate,10);
 const updated=priceOrder(lines,[{...products[0],taxRate:21}],first.lines);
 assert.equal(updated.lines[0].taxRate,10);
 assert.equal(priceOrder(lines,products).lines[0].taxRate,null);
});
