import { readFile } from 'node:fs/promises';
import { test } from 'node:test';
import assert from 'node:assert/strict';
import ts from 'typescript';
const moduleUrl = code => 'data:text/javascript;base64,' + Buffer.from(ts.transpileModule(code, { compilerOptions: { module: ts.ModuleKind.ES2022 } }).outputText).toString('base64');
const finance = moduleUrl(await readFile(new URL('../src/models/finance-validation.ts', import.meta.url), 'utf8'));
const source = (await readFile(new URL('../src/models/receipt-validation.ts', import.meta.url), 'utf8')).replace("'./finance-validation.js'", JSON.stringify(finance));
const { receiptRange, receiptInvoiceInput } = await import(moduleUrl(source));
const body = { clientName: 'Cliente de prueba', clientTaxId: 'TEST', clientAddress: 'Dirección de prueba', date: '2026-10-16', taxRates: [10, 21] };
const receipt = { lines: [{ name: 'Plato', quantity: 3, unitPriceCents: 380 }, { name: 'Bebida', quantity: 1, unitPriceCents: 250 }], totalCents: 1390 };
test('receipt invoices preserve original gross totals across different tax rates', () => {
 const invoice = receiptInvoiceInput(body, receipt);
 assert.equal(invoice.totalCents,1390);
 assert.equal(invoice.subtotalCents + invoice.taxCents,1390);
 assert.equal(invoice.lines[0].grossCents,1140);
 assert.equal(invoice.lines[1].grossCents,250);
 assert.equal(invoice.lines[0].baseCents + invoice.lines[0].taxCents,1140);
});
test('client-supplied prices, quantities and totals cannot change the receipt', () => {
 const result = receiptInvoiceInput({...body,totalCents:1,sourceOrderId:'injected',lines:[{quantity:999,unitPrice:0}]}, receipt);
 assert.equal(result.totalCents,1390); assert.equal(result.lines[0].quantity,3); assert.equal(result.sourceOrderId,undefined);
});
test('tax rates and customer details must be explicitly provided', () => {
 for(const patch of [{taxRates:[null,21]},{taxRates:[10]},{taxRates:[10,101]},{taxRates:['10',21]},{clientName:' '},{clientTaxId:''},{clientAddress:''},{date:'2026-02-30'}]) assert.throws(()=>receiptInvoiceInput({...body,...patch},receipt));
 assert.throws(()=>receiptInvoiceInput({...body,taxRates:[]},{lines:[],totalCents:0}));
 assert.throws(()=>receiptInvoiceInput(body,{...receipt,totalCents:1}));
});
test('inclusive-tax rounding preserves every cent even with large quantities', () => {
 for(const quantity of [1,2,3,7,999])for(const price of [1,5,99,380,1350])for(const rate of [0,4,10,21]){
  const gross=quantity*price;
  const result=receiptInvoiceInput({...body,taxRates:[rate]},{lines:[{name:'Prueba',quantity,unitPriceCents:price}],totalCents:gross});
  assert.equal(result.totalCents,gross);assert.equal(result.subtotalCents+result.taxCents,gross);
 }
});
test('report date ranges accept a full year, leap days and reject reversed or impossible dates', () => {
 assert.deepEqual(receiptRange('2026-01-01','2026-12-31'),{start:'2026-01-01',end:'2026-12-31'});
 assert.equal(receiptRange('2024-02-29','2024-02-29').end,'2024-02-29');
 for(const dates of [['2026-02-30','2026-03-01'],['2026-10-17','2026-10-16'],[undefined,'2026-01-01'],['bad','bad']])assert.throws(()=>receiptRange(...dates));
});
