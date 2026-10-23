import {test} from 'node:test';
import assert from 'node:assert/strict';
import mongoose from 'mongoose';
import {AdminSession,createAdminAuth,sessionHash,bearerToken,SESSION_DURATION_MS} from '../dist/auth/admin-auth.js';
const credentials={email:'admin@example.test',password:'test-password-only'};
const response=()=>({code:200,body:null,headers:{},setHeader(key,value){this.headers[key]=value;},status(code){this.code=code;return this;},json(body){this.body=body;return this;},send(){return this;}});
async function fixture(run){
 const sessions=new Map();let connected=true;let time=Date.now();
 const desc=Object.getOwnPropertyDescriptor(mongoose.connection,'readyState');
 Object.defineProperty(mongoose.connection,'readyState',{configurable:true,get:()=>connected?1:0});
 const original={create:AdminSession.create,exists:AdminSession.exists,deleteOne:AdminSession.deleteOne};
 AdminSession.create=async data=>{sessions.set(data._id,{...data});return data;};
 AdminSession.exists=async query=>{const row=sessions.get(query._id);return row?.credentialVersion===query.credentialVersion && row.expiresAt > query.expiresAt.$gt?{_id:query._id}:null;};
 AdminSession.deleteOne=async query=>{sessions.delete(query._id);return {};};
 const instance=(password=credentials.password)=>createAdminAuth(credentials.email,password,()=>time);
 const post=async(auth,path,body,token)=>{const handler=auth.router.stack.find(layer=>layer.route?.path===path).route.stack[0].handle;const res=response();await handler({body,headers:{authorization:token?`Bearer ${token}`:undefined}},res);return res;};
 const authenticate=async(auth,token)=>{const res=response();let allowed=false;await auth.requireAdmin({headers:{authorization:`Bearer ${token}`}},res,()=>{allowed=true;});return {res,allowed};};
 try{await run({sessions,instance,post,authenticate,disconnect:()=>connected=false,advance:ms=>time+=ms,reconnect:()=>connected=true});}
 finally{Object.assign(AdminSession,original);if(desc)Object.defineProperty(mongoose.connection,'readyState',desc);else delete mongoose.connection.readyState;}
}
test('sessions survive a new server instance and only a hash is stored',()=>fixture(async({sessions,instance,post,authenticate})=>{
 const first=instance(),login=await post(first,'/login',credentials);
 assert.match(login.body.token,/^[a-f0-9]{64}$/);assert.ok(!sessions.has(login.body.token));assert.ok(sessions.has(sessionHash(login.body.token)));
 assert.equal((await authenticate(first,login.body.token)).allowed,true);
 assert.equal((await authenticate(instance(),login.body.token)).allowed,true);
}));
test('logout revokes only that browser session; other devices stay connected',()=>fixture(async({instance,post,authenticate})=>{
 const auth=instance(),a=(await post(auth,'/login',credentials)).body.token,b=(await post(auth,'/login',credentials)).body.token;
 assert.notEqual(a,b);assert.equal((await post(auth,'/logout',{},a)).code,204);
 assert.equal((await authenticate(auth,a)).res.code,401);assert.equal((await authenticate(auth,b)).allowed,true);
}));
test('a database outage is temporary and does not invalidate a saved session',()=>fixture(async({instance,post,authenticate,disconnect,reconnect,sessions})=>{
 const auth=instance(),token=(await post(auth,'/login',credentials)).body.token;
 disconnect();const result=await authenticate(auth,token);assert.equal(result.res.code,503);assert.equal(result.allowed,false);assert.equal(sessions.size,1);
 reconnect();assert.equal((await authenticate(instance(),token)).allowed,true);
}));
test('incorrect credentials, forged tokens and password rotation do not authorize access',()=>fixture(async({instance,post,authenticate,sessions})=>{
 const auth=instance();assert.equal((await post(auth,'/login',{...credentials,password:'incorrect'})).code,401);assert.equal(sessions.size,0);
 const token=(await post(auth,'/login',credentials)).body.token;
 assert.equal((await authenticate(auth,'0'.repeat(64))).res.code,401);
 assert.equal((await authenticate(instance('new-password'),token)).res.code,401);
}));
test('malformed bearer headers are never accepted',()=>{
 for(const header of [undefined,'','Bearer short','Basic '+ 'a'.repeat(64),'Bearer '+ 'a'.repeat(64)+' extra'])assert.equal(bearerToken(header),null);
 assert.equal(bearerToken('Bearer '+'a'.repeat(64)),'a'.repeat(64));
});

test('sessions expire at exactly eight hours even before TTL cleanup',()=>fixture(async({instance,post,authenticate,advance,sessions})=>{
 const auth=instance(),token=(await post(auth,'/login',credentials)).body.token;
 advance(SESSION_DURATION_MS-1);assert.equal((await authenticate(instance(),token)).allowed,true);
 advance(1);assert.equal((await authenticate(auth,token)).res.code,401);assert.equal(sessions.size,1);
}));
test('legacy sessions without expiry cannot authorize requests',()=>fixture(async({instance,post,authenticate,sessions})=>{
 const auth=instance(),token=(await post(auth,'/login',credentials)).body.token;
 delete sessions.get(sessionHash(token)).expiresAt;
 assert.equal((await authenticate(auth,token)).res.code,401);
}));
test('login limits attempts and permits retry after fifteen minutes',()=>fixture(async({instance,post,advance,sessions})=>{
 const auth=instance();
 for(let i=0;i<10;i++)assert.equal((await post(auth,'/login',{...credentials,password:'wrong'})).code,401);
 const blocked=await post(auth,'/login',credentials);assert.equal(blocked.code,429);assert.equal(blocked.headers['Retry-After'],'900');assert.equal(sessions.size,0);
 advance(15*60*1000);assert.equal((await post(auth,'/login',credentials)).code,200);
}));
