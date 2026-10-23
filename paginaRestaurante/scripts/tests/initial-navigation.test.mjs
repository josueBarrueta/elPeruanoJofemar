import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { createContext, runInContext } from 'node:vm';
import ts from 'typescript';

function fixture() {
  class NavigationEnd { constructor(url) { this.urlAfterRedirects = url; } }
  let navigate;
  const frames = [];
  const pages = [];
  const context = createContext({
    exports: {},
    require: name => name === '@angular/core' ? {Component: () => target => target} :
      name === '@angular/router' ? {NavigationEnd} : {},
    document: {body: {classList: {toggle() {}}}},
    window: {requestAnimationFrame: fn => frames.push(fn), clearTimeout() {}, setTimeout: () => 1},
  });
  const source = readFileSync(new URL('../../src/app/app.ts', import.meta.url), 'utf8');
  runInContext(ts.transpileModule(source, {compilerOptions: {target:ts.ScriptTarget.ES2022, module:ts.ModuleKind.CommonJS, experimentalDecorators:true}}).outputText, context);
  const app = new context.exports.AppComponent({events:{subscribe:fn=>navigate=fn}}, {update(){}}, {page:path=>pages.push(path)});
  return {app,frames,pages,go:url=>navigate(new NavigationEnd(url))};
}

test('the initial visit paints the page without scheduling an opaque route loader', () => {
  const {app,frames,pages,go} = fixture();
  assert.equal(app.isRouteTransitioning, false);
  go('/');
  assert.equal(app.isRouteTransitioning, false);
  assert.equal(frames.length, 0);
  assert.deepEqual(pages, ['/']);
});

test('hash navigation stays immediate while a real screen change keeps its transition', () => {
  const {app,frames,pages,go} = fixture();
  go('/'); go('/#nuestra-carta');
  assert.equal(frames.length, 0);
  go('/login');
  assert.equal(app.showPublicConsent, false);
  assert.equal(frames.length, 1);
  frames[0]();
  assert.equal(app.isRouteTransitioning, true);
  assert.deepEqual(pages, ['/', '/login']);
});
