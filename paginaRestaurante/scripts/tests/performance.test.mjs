import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { createContext, runInContext } from 'node:vm';
import { createRequire } from 'node:module';
import { NEVER, defer, of } from 'rxjs';
import { TestScheduler } from 'rxjs/testing';
import ts from 'typescript';

const require = createRequire(import.meta.url);
const source = readFileSync(new URL('../../src/app/public-menu-request.ts',import.meta.url),'utf8');
const js = ts.transpileModule(source,{compilerOptions:{target:ts.ScriptTarget.ES2022,module:ts.ModuleKind.CommonJS}}).outputText;
const context = createContext({exports:{},require}); runInContext(js,context);
const request = context.exports.publicMenuRequest;

test('a slow menu shows fallback and recovers from a successful retry', () => {
  const scheduler = new TestScheduler(assert.deepEqual);
  let attempts=0, fallbacks=0, result;
  scheduler.run(({flush})=>{
    request(defer(()=>++attempts===1?NEVER:of(['current menu'])),()=>fallbacks++).subscribe(value=>result=value);
    flush();
  });
  assert.equal(attempts,2); assert.equal(fallbacks,1);
  assert.deepEqual(result,['current menu']);
});

test('a permanently unavailable menu stops after bounded retries', () => {
  const scheduler = new TestScheduler(assert.deepEqual);
  let fallbacks=0, error, finishedAt;
  scheduler.run(({flush})=>{
    request(NEVER,()=>fallbacks++).subscribe({error:e=>{error=e;finishedAt=scheduler.now();}});
    flush();
  });
  assert.equal(fallbacks,3); assert.equal(error.name,'TimeoutError'); assert.equal(finishedAt,53400);
});

test('leaving the page cancels pending menu retries', () => {
  const scheduler = new TestScheduler(assert.deepEqual);
  let fallbacks=0;
  scheduler.run(({flush})=>{
    const subscription=request(NEVER,()=>fallbacks++).subscribe();
    scheduler.schedule(()=>subscription.unsubscribe(),5000);
    flush();
  });
  assert.equal(fallbacks,0);
});
