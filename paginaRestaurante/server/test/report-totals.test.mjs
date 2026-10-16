import {readFile} from 'node:fs/promises';
import {test} from 'node:test';
import assert from 'node:assert/strict';
import ts from 'typescript';
const source=await readFile(new URL('../../src/app/admin/report-totals.ts',import.meta.url),'utf8');
const compiled=ts.transpileModule(source,{compilerOptions:{module:ts.ModuleKind.ES2022}}).outputText;
const {reportTotals,csvDocument}=await import('data:text/javascript;base64,'+Buffer.from(compiled).toString('base64'));
test('reports distinguish historical unrecorded payments and exclude change from cash sales',()=>{
 const receipt={totalCents:2760,lines:[{quantity:2,unitPriceCents:380,taxRate:10},{quantity:1,unitPriceCents:2000,taxRate:null}],payment:{cashCents:1000,cardCents:1760,tenderedCents:5000,changeCents:4000}};
 const t=reportTotals([receipt,{totalCents:100,lines:[{quantity:1,unitPriceCents:100,taxRate:0}]}],[{totalCents:1210,taxCents:210},{totalCents:500,taxCents:null}]);
 assert.equal(t.salesCents,2860);assert.equal(t.paidCents,2760);assert.equal(t.cashCents,1000);assert.equal(t.cardCents,1760);assert.equal(t.unrecordedPaymentCents,100);
 assert.equal(t.unknownTaxCents,2000);assert.equal(t.baseCents+t.taxCents+t.unknownTaxCents,2860);assert.equal(t.expenseTaxCents,210);assert.equal(t.unknownExpenseTaxCents,500);
});
test('CSV escapes formulas, quotes and newlines without executing spreadsheet formulas',()=>{
 const csv=csvDocument([['=HYPERLINK("x")','+cmd','@sum','-2',' normal','a\nb']]);
 assert.ok(csv.startsWith('\uFEFF'));assert.match(csv,/"'=HYPERLINK\(""x""\)"/);assert.match(csv,/"'\+cmd"/);assert.match(csv,/"a\nb"/);
});
