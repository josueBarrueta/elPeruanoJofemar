import { readFile } from 'node:fs/promises';
import { test } from 'node:test';
import assert from 'node:assert/strict';
import ts from 'typescript';
const source=await readFile(new URL('../../src/app/admin/document-preview.service.ts',import.meta.url),'utf8');
let compiled=ts.transpileModule(source,{compilerOptions:{module:ts.ModuleKind.ES2022,target:ts.ScriptTarget.ES2022,experimentalDecorators:true}}).outputText;
compiled=compiled.replace(/import\s*\{[^}]*\}\s*from ['"]@angular\/core['"];?/,`const Injectable=()=>value=>value;const signal=initial=>{let value=initial;const read=()=>value;read.set=next=>value=next;return read;};`);
const {DocumentPreviewService}=await import('data:text/javascript;base64,'+Buffer.from(compiled).toString('base64'));
globalThis.document={baseURI:'https://example.test/restaurant/'};
const api=new DocumentPreviewService();
const order={_id:'0123456789abcdef01234567',tableName:'Entrada',guests:2,status:'closed',closedAt:'2026-10-16T12:45:00Z',totalCents:760,lines:[{name:'Cuzqueña',quantity:2,unitPriceCents:380}]};
test('receipt uses 80 mm print layout, a fixed source reference and original amounts',()=>{
 api.receipt(order,{});const doc=api.preview();assert.equal(doc.ticket,true);assert.match(doc.html,/@page\{size:80mm 250mm/);assert.match(doc.html,/R-0123456789ABCDEF01234567/);assert.match(doc.html,/7,60/);assert.match(doc.html,/no acredita el pago/);
});
test('all user supplied content is escaped in printable documents',()=>{
 api.receipt({...order,tableName:'<script>alert(1)</script>',lines:[{...order.lines[0],name:'<img src=x onerror=alert(1)>'}]},{legalName:'<svg onload=alert(1)>'});
 const html=api.preview().html;assert.ok(!html.includes('<script>'));assert.ok(!html.includes('<img src=x'));assert.match(html,/&lt;script&gt;/);assert.match(html,/&lt;svg/);
});
test('invoice uses approved black-letter logo, A4 and exact stored tax totals',()=>{
 api.invoice({_id:'123',sourceOrderId:order._id,clientName:'Cliente',clientTaxId:'TEST',clientAddress:'Dirección',date:'2026-10-16',totalCents:760,lines:[{description:'Cuzqueña',quantity:2,unitPrice:3.455,taxRate:10,baseCents:691,taxCents:69,grossCents:760}]},{});
 const doc=api.preview();assert.equal(doc.ticket,false);assert.match(doc.html,/@page\{size:A4/);assert.match(doc.html,/logo-jofemar-facturas.png/);assert.match(doc.html,/FACTURA · BORRADOR/);assert.match(doc.html,/6,91/);assert.match(doc.html,/0,69/);assert.match(doc.html,/7,60/);
});
test('period reports use receipts as the single revenue source and include expenses',()=>{
 api.report('2026-10-01','2026-10-31',[order],[{supplier:'Proveedor',description:'Compra',date:'2026-10-16',totalCents:200,paid:false}],{});
 const html=api.preview().html;assert.match(html,/7,60/);assert.match(html,/2,00/);assert.match(html,/5,60/);assert.match(html,/Pendiente/);assert.match(html,/No es una factura/);
});
