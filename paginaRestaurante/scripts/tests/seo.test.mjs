import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, readFileSync, writeFileSync, existsSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { createContext, runInContext } from 'node:vm';
import ts from 'typescript';
import { preparePages } from '../prepare-pages.mjs';

const homepage = readFileSync(new URL('../../src/index.html', import.meta.url), 'utf8');
test('published routes have separate metadata and private/fallback files are noindex', () => {
  const dir = mkdtempSync(join(tmpdir(), 'jofemar-seo-'));
  try {
    writeFileSync(join(dir, 'index.html'), homepage);
    preparePages(dir);
    assert(!existsSync(join(dir, 'resenas/index.html')));
    for (const file of ['admin/index.html', 'login/index.html', '404.html']) {
      const html = readFileSync(join(dir, file), 'utf8');
      assert.match(html, /name="robots" content="noindex, nofollow"/);
      assert(!html.includes('rel="canonical"'));
      assert(!html.includes('id="restaurant-schema"'));
    }
    assert.equal(readFileSync(join(dir, 'index.html'), 'utf8'), homepage);
    assert(existsSync(join(dir, '.nojekyll')));
    preparePages(dir);
    assert(!existsSync(join(dir, 'resenas/index.html')));
  } finally { rmSync(dir, {recursive:true, force:true}); }
});

test('preparation fails clearly on an invalid build', () => {
  const dir = mkdtempSync(join(tmpdir(), 'jofemar-invalid-'));
  try {
    writeFileSync(join(dir, 'index.html'), '<html></html>');
    assert.throws(() => preparePages(dir), /missing required SEO metadata/);
  } finally { rmSync(dir, {recursive:true, force:true}); }
});

const consentJs = ts.transpileModule(
  readFileSync(new URL('../../src/app/consent/consent.service.ts', import.meta.url), 'utf8').replace(/import .*from '@angular\/core';/, ''),
  { compilerOptions: {target:ts.ScriptTarget.ES2022, module:ts.ModuleKind.CommonJS, experimentalDecorators:true} }
).outputText;
function consentFixture({saved = null, blocked = false, referrer = '', hostname = 'elperuanojofemar.com'} = {}) {
  let storage = saved && JSON.stringify(saved), reloads = 0;
  const scripts = [], listeners = {};
  const win = { addEventListener:(name, fn)=>listeners[name]=fn, location:{hostname, reload:()=>reloads++} };
  const doc = { referrer, cookie:'', head:{appendChild:script=>scripts.push(script)}, createElement:()=>({}), getElementById:()=>({remove(){}}) };
  const context = createContext({exports:{}, URL, Date, Injectable:()=>value=>value,
    signal:value=>Object.assign(()=>value,{set:next=>value=next}), window:win, document:doc,
    localStorage:{getItem:()=>{if(blocked)throw Error();return storage;},setItem:(_,value)=>{if(blocked)throw Error();storage=value;}} });
  runInContext(consentJs, context);
  const service = new context.exports.ConsentService();
  return {service, scripts, win, listeners, reloads:()=>reloads, expire:()=>storage=JSON.stringify({analytics:true,savedAt:0})};
}

test('rejecting, pending and private routes do not load analytics or send contact events', () => {
  const f = consentFixture();
  f.service.page('/'); f.service.trackContact('whatsapp');
  assert.equal(f.scripts.length,0); assert.equal(f.win.dataLayer,undefined);
  f.service.save(false); f.service.trackContact('phone');
  assert.equal(f.win.dataLayer,undefined);
  f.service.page('/admin'); f.service.save(true); f.service.trackContact('phone');
  assert.equal(f.scripts.length,0);
});

test('accepted public pages and contact events strip queries and keep a safe organic referrer', () => {
  const f = consentFixture({referrer:'https://www.google.com/search?q=private&email=private'});
  f.service.page('/?email=private#secret'); f.service.save(true);
  f.service.trackContact('whatsapp'); f.service.trackContact('phone');
  assert.equal(f.scripts.length,1);
  const events=Array.from(f.win.dataLayer,x=>Array.from(x)).filter(x=>x[0]==='event');
  assert.equal(JSON.stringify(events.map(x=>x[1])),JSON.stringify(['page_view','click_whatsapp','click_phone']));
  assert.equal(events[0][2].page_referrer,'https://www.google.com/');
  assert(!JSON.stringify(events).includes('private'));
  const count=f.win.dataLayer.length;
  f.service.page('/'); assert.equal(f.win.dataLayer.length,count);
  f.service.save(false); f.service.trackContact('phone');
  assert.equal(f.win.dataLayer.length,count);
  assert.equal(f.reloads(),1);
  assert.equal(f.win['ga-disable-G-XE4YF2K141'],true);
});

test('expired consent and unavailable storage are handled without measuring without permission', () => {
  const expired=consentFixture({saved:{analytics:true,savedAt:0}});
  expired.service.page('/'); assert.equal(expired.scripts.length,0);
  const blocked=consentFixture({blocked:true});
  blocked.service.page('/'); assert.equal(blocked.scripts.length,0);
  blocked.service.save(true); assert.equal(blocked.scripts.length,1);
  const active=consentFixture(); active.service.page('/'); active.service.save(true); active.expire();
  const count=active.win.dataLayer.length; active.service.trackContact('phone');
  assert.equal(active.win.dataLayer.length,count); assert.equal(active.reloads(),1);
});

test('every static local asset referenced by the homepage exists', () => {
  const paths = [...homepage.matchAll(/(?:href|src)="\/?(assets\/[^"?]+)"/g)].map(match=>match[1]);
  for(const asset of paths) {
    assert(existsSync(new URL(`../../src/${asset}`,import.meta.url)) || existsSync(new URL(`../../public/${asset}`,import.meta.url)),asset);
  }
});

test('local previews never send events to production analytics', () => {
  const f = consentFixture({hostname:'127.0.0.1'});
  f.service.page('/'); f.service.save(true); f.service.trackContact('whatsapp');
  assert.equal(f.scripts.length,0); assert.equal(f.win.dataLayer,undefined);
});

test('restaurant schema remains consistent in the initial HTML and client navigation', () => {
  const htmlSchema=JSON.parse(homepage.match(/<script id="restaurant-schema" type="application\/ld\+json">([\s\S]*?)<\/script>/)[1]);
  const code=ts.transpileModule(readFileSync(new URL('../../src/app/restaurant-schema.ts',import.meta.url),'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS}}).outputText;
  const context=createContext({exports:{}}); runInContext(code,context);
  assert.equal(JSON.stringify(context.exports.RESTAURANT_SCHEMA),JSON.stringify(htmlSchema));
});

test('public contact links are measured and the removed reviews page is not linked', () => {
  const html=readFileSync(new URL('../../src/app/home/home.component.html',import.meta.url),'utf8');
  const links=Array.from(html.matchAll(/<a\b[^>]*>/g),match=>match[0]);
  const whatsapp=links.filter(link=>link.includes('[href]="whatsappUrl"'));
  assert(whatsapp.length>0);
  for(const link of whatsapp) assert(link.includes("consent.trackContact('whatsapp')"));
  for(const link of links.filter(link=>link.includes('href="tel:'))) assert(link.includes("consent.trackContact('phone')"));
  assert(!links.some(link=>link.includes('href="/resenas/"')));
});
