import test from 'node:test';
import assert from 'node:assert/strict';
import express from 'express';
import sharp from 'sharp';
import { createMenuImagesRouter, optimizeMenuImage, menuPatch } from '../dist/models/menu-media.js';

const photo = async () => 'data:image/png;base64,' + (await sharp({create:{width:2200,height:1100,channels:4,background:{r:255,g:0,b:0,alpha:0.5}}}).png().toBuffer()).toString('base64');

test('photos are resized, retain transparency, and support browser caching', async () => {
  const original = await photo();
  const optimized = await optimizeMenuImage(original);
  const metadata = await sharp(optimized).metadata();
  assert.equal(metadata.format,'webp'); assert.equal(metadata.width,1600); assert.equal(metadata.height,800); assert.equal(metadata.hasAlpha,true);
  let loads=0;
  const app=express();
  app.use('/api/menu-images',createMenuImagesRouter(async()=>{loads++;return {image:original,updatedAt:new Date('2026-10-17T00:00:00.000Z')};}));
  const server=app.listen(0,'127.0.0.1'); await new Promise(resolve=>server.once('listening',resolve));
  try {
    const base=`http://127.0.0.1:${server.address().port}/api/menu-images/`;
    const url=base+'6ab53d13ea30aa110770e641?v=2026-10-17T00:00:00.000Z';
    const response=await fetch(url); assert.equal(response.status,200); assert.equal(response.headers.get('content-type'),'image/webp');
    assert.deepEqual(Buffer.from(await response.arrayBuffer()),optimized);
    const cached=await fetch(url,{headers:{'If-None-Match':response.headers.get('etag')}});
    assert.equal(cached.status,304); assert.equal(loads,1);
    assert.equal((await fetch(base+'not-an-id')).status,400);
  } finally { await new Promise(resolve=>server.close(resolve)); }
});

test('editing price and crop preserves originals, while replacement and removal work',()=>{
  const id='6ab53d13ea30aa110770e641';
  const preview=`https://elperuanojofemar.onrender.com/api/menu-images/${id}?v=old`;
  assert.deepEqual(menuPatch({_id:id,image:preview,price:12,imagePosition:'40% 60%',imageZoom:2},id),{price:12,imagePosition:'40% 60%',imageZoom:2});
  assert.equal(menuPatch({image:''},id).image,'');
  assert.equal(menuPatch({image:'data:image/png;base64,new'},id).image,'data:image/png;base64,new');
  assert.equal(menuPatch({image:'plato.png'},id).image,'plato.png');
  assert.equal(menuPatch({image:'https://example.com/photo.webp'},id).image,'https://example.com/photo.webp');
});

test('a broken or missing photo returns an error independently of the menu',async()=>{
  const app=express(); app.use('/images',createMenuImagesRouter(async id=>id.endsWith('1')?null:{image:'data:image/png;base64,invalid'}));
  const server=app.listen(0,'127.0.0.1');await new Promise(resolve=>server.once('listening',resolve));
  try {
    const base=`http://127.0.0.1:${server.address().port}/images/`;
    assert.equal((await fetch(base+'6ab53d13ea30aa110770e641')).status,404);
    const invalid=await fetch(base+'6ab53d13ea30aa110770e642');assert.equal(invalid.status,503);assert.equal(invalid.headers.get('cache-control'),'no-store');
  } finally {await new Promise(resolve=>server.close(resolve));}
});
