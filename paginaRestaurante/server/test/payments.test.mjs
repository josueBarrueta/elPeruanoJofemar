import { readFile } from 'node:fs/promises';
import { test } from 'node:test';
import assert from 'node:assert/strict';
import ts from 'typescript';
const url=source=>'data:text/javascript;base64,'+Buffer.from(ts.transpileModule(source,{compilerOptions:{module:ts.ModuleKind.ES2022}}).outputText).toString('base64');
const orders=url(await readFile(new URL('../src/models/table-order-validation.ts',import.meta.url),'utf8'));
const source=(await readFile(new URL('../src/models/payment-validation.ts',import.meta.url),'utf8')).replace("'./table-order-validation.js'",JSON.stringify(orders));
const {paymentInput}=await import(url(source));
test('cash change is calculated from the server total and cash sales exclude change',()=>{
 assert.deepEqual(paymentInput({method:'cash',tendered:50,cashCents:1,changeCents:99999},4350),{method:'cash',cashCents:4350,cardCents:0,tenderedCents:5000,changeCents:650});
});
test('card payment always equals the server total',()=>{
 assert.deepEqual(paymentInput({method:'card',cardCents:1},2760),{method:'card',cashCents:0,cardCents:2760,tenderedCents:0,changeCents:0});
});
test('mixed payment computes the remaining card amount exactly',()=>{
 const paid=paymentInput({method:'mixed',cash:10,card:1},2760);assert.equal(paid.cashCents,1000);assert.equal(paid.cardCents,1760);assert.equal(paid.cashCents+paid.cardCents,2760);assert.equal(paid.changeCents,0);
});
test('rejects underpayments, fractional cents, unknown methods and invalid splits',()=>{
 for(const data of [{method:'cash',tendered:27.59},{method:'cash',tendered:27.601},{method:'cash',tendered:'30'},{method:'cash',tendered:NaN},{method:'mixed',cash:0},{method:'mixed',cash:27.60},{method:'mixed',cash:-1},{method:'mixed',cash:5.001},{method:'bank'},null])assert.throws(()=>paymentInput(data,2760));
 for(const total of [0,-1,NaN,27.5])assert.throws(()=>paymentInput({method:'card'},total));
});
