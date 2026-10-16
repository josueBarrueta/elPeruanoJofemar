import {test} from 'node:test';
import assert from 'node:assert/strict';
import mongoose from 'mongoose';
import {issuanceSnapshot,emissionRecord} from '../dist/models/invoice-issuance.js';
import {invoiceIssuance} from '../dist/routes/invoice-issuance.js';
import {InvoiceDraft,FinanceSettings} from '../dist/models/finance.model.js';
import {InvoiceCounter,InvoiceIssueEvent} from '../dist/models/invoice-counter.model.js';
const today=new Intl.DateTimeFormat('sv-SE',{timeZone:'Europe/Madrid'}).format(new Date());
const settings={legalName:'Restaurante de prueba',taxId:'TEST123',address:'Dirección de prueba',invoiceSeries:'TEST',invoiceStartingNumber:41};
const draft={_id:'1234567890abcdef12345678',clientName:'Cliente',clientTaxId:'CLIENTE123',clientAddress:'Dirección cliente',date:today,updatedAt:new Date('2026-01-01T12:00:00Z'),lines:[{description:'Plato',quantity:2,unitPrice:10,taxRate:10}],subtotalCents:2000,taxCents:200,totalCents:2200};
test('emission requires issuer, customer, series, valid dates and matching totals',()=>{
 for(const field of ['legalName','taxId','address','invoiceSeries'])assert.throws(()=>issuanceSnapshot(draft,{...settings,[field]:''},today));
 for(const field of ['clientName','clientTaxId','clientAddress'])assert.throws(()=>issuanceSnapshot({...draft,[field]:''},settings,today));
 for(const patch of [{totalCents:1},{subtotalCents:1},{lines:[]},{date:'2999-01-01'}])assert.throws(()=>issuanceSnapshot({...draft,...patch},settings,today));
 assert.throws(()=>issuanceSnapshot(draft,{...settings,invoiceStartingNumber:1.5},today));
});
test('issued snapshot preserves gross receipt cents and the original operation date',()=>{
 const input=issuanceSnapshot({...draft,date:'2026-01-01',lines:[{description:'Bebida',quantity:2,unitPrice:3.455,taxRate:10,baseCents:691,taxCents:69,grossCents:760}],subtotalCents:691,taxCents:69,totalCents:760},settings,today);
 assert.equal(input.date,today);assert.equal(input.operationDate,'2026-01-01');assert.equal(input.totalCents,760);
 const record=emissionRecord(input,41,new Date('2026-01-01T12:00:00Z'),'previous');assert.equal(record.invoiceNumber,'TEST/000041');assert.equal(record.status,'issued');assert.equal(record.previousHash,'previous');assert.match(record.recordHash,/^[a-f0-9]{64}$/);
 settings.legalName='Otra razón social';assert.equal(record.issuerSnapshot.legalName,'Restaurante de prueba');settings.legalName='Restaurante de prueba';
});
const handler=invoiceIssuance.stack[0].route.stack[0].handle;
async function fixture(run, options={}){
 const restore=[];
 const stub=(obj,key,value)=>{const original=obj[key];restore.push(()=>obj[key]=original);obj[key]=value;};
 const state={docs:new Map([[draft._id,structuredClone(draft)],['abcdef1234567890abcdef12',{...structuredClone(draft),_id:'abcdef1234567890abcdef12'}]]),counter:null,events:[]};
 const query=value=>({session(){return this;},lean:async()=>structuredClone(typeof value==='function'?value():value)});
 let tail=Promise.resolve();
 stub(mongoose,'startSession',async()=>({endSession:async()=>{},withTransaction:async work=>{const wait=tail;let release;tail=new Promise(resolve=>release=resolve);await wait;const before=structuredClone(state);try{await work();}catch(error){state.docs=before.docs;state.counter=before.counter;state.events=before.events;throw error;}finally{release();}}}));
 stub(InvoiceDraft,'findById',id=>query(()=>state.docs.get(id)));
 stub(FinanceSettings,'findById',()=>query(options.noSettings?{}:settings));
 stub(InvoiceCounter,'findById',()=>query(()=>state.counter));
 stub(InvoiceCounter,'create',async rows=>{state.counter=rows[0];return rows.map(row=>({...row,toObject:()=>row}));});
 stub(InvoiceDraft,'findOneAndUpdate',(q,u,opts)=>query(()=>{assert.ok(opts.session);const doc=state.docs.get(q._id);if(!doc||doc.status==='issued')return null;const updated={...doc,...structuredClone(u.$set)};state.docs.set(q._id,updated);return updated;}));
 stub(InvoiceCounter,'updateOne',async(_q,u,opts)=>{assert.ok(opts.session);Object.assign(state.counter,u.$set);});
 stub(InvoiceIssueEvent,'create',async(rows,opts)=>{assert.ok(opts.session);if(options.failEvent)throw Error('Simulated audit write failure');state.events.push(...rows);return rows;});
 const emit=async(id=draft._id,version=draft.updatedAt.toISOString())=>{let error;const res={body:null,json(value){this.body=value;}};await handler({params:{id},body:{expectedUpdatedAt:version}},res,e=>error=e);return {doc:res.body,error};};
 try{await run({state,emit});}finally{restore.reverse().forEach(fn=>fn());}
}
test('repeated emission returns the same invoice number without another audit record',()=>fixture(async({state,emit})=>{
 const first=await emit();assert.equal(first.error,undefined);assert.equal(first.doc.invoiceNumber,'TEST/000041');
 const second=await emit();assert.equal(second.doc.invoiceNumber,first.doc.invoiceNumber);assert.equal(state.events.length,1);assert.equal(state.counter.lastNumber,41);
}));
test('simultaneous emissions get consecutive distinct numbers and a linked audit chain',()=>fixture(async({state,emit})=>{
 const [a,b]=await Promise.all([emit(),emit('abcdef1234567890abcdef12')]);assert.equal(a.error,undefined);assert.equal(b.error,undefined);assert.deepEqual([a.doc.issueSequence,b.doc.issueSequence],[41,42]);assert.equal(b.doc.previousHash,a.doc.recordHash);assert.equal(state.events.length,2);
}));
test('missing fiscal settings and stale draft versions consume no numbers',()=>fixture(async({state,emit})=>{
 const stale=await emit(draft._id,'2000-01-01T00:00:00Z');assert.ok(stale.error);assert.equal(state.counter,null);
 const invalid=await emit();assert.ok(invalid.error);assert.equal(state.counter,null);assert.equal(state.events.length,0);
},{noSettings:true}));
test('an audit failure rolls back both numbering and the issued status',()=>fixture(async({state,emit})=>{
 const result=await emit();assert.match(result.error.message,/Simulated/);assert.equal(state.counter,null);assert.equal(state.docs.get(draft._id).status,undefined);assert.equal(state.events.length,0);
},{failEvent:true}));
