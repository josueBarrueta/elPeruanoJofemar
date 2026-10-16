import {test} from 'node:test';
import assert from 'node:assert/strict';
import {tableOrders} from '../dist/routes/table-orders.js';
import {TableOrder} from '../dist/models/table-order.model.js';
const checkout=tableOrders.stack.find(layer=>layer.route?.path==='/:id/checkout').route.stack[0].handle;
const id='1234567890abcdef12345678';
const request=payment=>({params:{id},body:{revision:3,payment}});
const response=()=>({code:200,body:null,status(n){this.code=n;return this;},json(data){this.body=data;return this;}});
const oldFind=TableOrder.findOne,oldUpdate=TableOrder.findOneAndUpdate;
function mock(find,update){TableOrder.findOne=()=>({lean:async()=>find});TableOrder.findOneAndUpdate=(...args)=>({lean:async()=>update(...args)});}
test('checkout atomically records payment against the expected open revision',async()=>{
 let query,update;
 try{
  mock({lines:[{}],totalCents:4350},(q,u)=>{query=q;update=u;return {_id:id,status:'closed',payment:u.$set.payment};});
  const res=response();await checkout(request({method:'cash',tendered:50}),res);
  assert.deepEqual(query,{_id:id,status:'open',revision:3});assert.equal(update.$inc.revision,1);assert.equal(update.$set.payment.changeCents,650);assert.equal(res.body.payment.cashCents,4350);
 }finally{TableOrder.findOne=oldFind;TableOrder.findOneAndUpdate=oldUpdate;}
});
test('stale or already closed orders cannot record another payment',async()=>{
 try{mock(null,()=>{throw Error('Must not write');});const res=response();await checkout(request({method:'card'}),res);assert.equal(res.code,409);}
 finally{TableOrder.findOne=oldFind;TableOrder.findOneAndUpdate=oldUpdate;}
});
test('a concurrent change rejects checkout without a second payment record',async()=>{
 try{mock({lines:[{}],totalCents:4350},()=>null);const res=response();await checkout(request({method:'card'}),res);assert.equal(res.code,409);}
 finally{TableOrder.findOne=oldFind;TableOrder.findOneAndUpdate=oldUpdate;}
});
test('empty tables can be released without a payment or sale',async()=>{
 try{let update;mock({lines:[],totalCents:0},(_q,u)=>{update=u;return {status:'closed'};});const res=response();await checkout(request(undefined),res);assert.equal(res.code,200);assert.equal(update.$set.payment,undefined);}
 finally{TableOrder.findOne=oldFind;TableOrder.findOneAndUpdate=oldUpdate;}
});
test('underpayment cannot reach the database update',async()=>{
 try{mock({lines:[{}],totalCents:4350},()=>{throw Error('Must not write');});await assert.rejects(()=>checkout(request({method:'cash',tendered:20}),response()),/no cubre/);}
 finally{TableOrder.findOne=oldFind;TableOrder.findOneAndUpdate=oldUpdate;}
});
