import {test} from 'node:test';
import assert from 'node:assert/strict';
import {expenseAttachment} from '../dist/models/expense-attachment.js';
import {expenseInput} from '../dist/models/finance-validation.js';
test('expense attachments accept bounded PDF documents and reject executable or mislabeled content',()=>{
 const attachment={name:'factura.pdf',mimeType:'application/pdf',data:Buffer.from('%PDF-1.7\nexample').toString('base64')};
 assert.equal(expenseAttachment({attachment}).attachmentName,'factura.pdf');assert.deepEqual(expenseAttachment({}),{});
 for(const patch of [{mimeType:'text/html'},{data:Buffer.from('<script>bad</script>').toString('base64')},{name:''},{data:'a'.repeat(2800001)}])assert.throws(()=>expenseAttachment({attachment:{...attachment,...patch}}));
});
test('expense tax may remain unknown and can never exceed the gross total',()=>{
 const draft={supplier:'Proveedor',description:'Compra',category:'Materia prima',date:'2026-10-16',total:121};
 assert.equal(expenseInput(draft).taxCents,null);assert.equal(expenseInput({...draft,taxAmount:21}).taxCents,2100);assert.throws(()=>expenseInput({...draft,taxAmount:122}));
});
