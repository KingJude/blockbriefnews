const {test} = require('node:test');
const assert = require('node:assert/strict');
const {pathToFileURL} = require('node:url');
const path = require('node:path');
const fs = require('node:fs');
require('node:child_process').execFileSync(process.execPath, [path.resolve(__dirname,'../cloudflare/build.cjs')]);
const modulePromise = import(pathToFileURL(path.resolve(__dirname,'../.cloudflare/worker.mjs')));

test('Cloudflare migration preserves redirects, methods, headers, assets and failure behavior', async t => {
  const {default:worker} = await modulePromise;
  const calls=[];
  const env={ASSETS:{fetch:async req=>{calls.push(req.url);return new Response('asset',{headers:{'Content-Type':'text/html'}})}}};
  const ctx={waitUntil(){}};
  const get=(pathname,options)=>worker.fetch(new Request('https://blockbriefnews.com'+pathname,options),env,ctx);
  for(const pathname of ['/home.html','/future-home.html','/home-logo.html','/index.html']) {
    const response=await get(pathname+'?language=en');
    assert.equal(response.status,308);assert.equal(response.headers.get('Location'),'https://blockbriefnews.com/?language=en');
  }
  const www=await worker.fetch(new Request('https://www.blockbriefnews.com/bitcoin/?x=1'),env,ctx);
  assert.equal(www.headers.get('Location'),'https://blockbriefnews.com/bitcoin/?x=1');
  const http=await worker.fetch(new Request('http://blockbriefnews.com/bitcoin/?x=1'),env,ctx);
  assert.equal(http.headers.get('Location'),'https://blockbriefnews.com/bitcoin/?x=1');
  for(const endpoint of ['/api/news','/api/crypto-ticker?source=jupiter','/api/fried','/feed.xml']) {
    const response=await get(endpoint,{method:'POST'});
    assert.equal(response.status,405);assert.equal(response.headers.get('Cache-Control'),'no-store');
  }
  for(const endpoint of ['/api/crypto-ticker?source=jupiter&source=coinmarketcap','/feed.xml?topic=bitcoin&topic=ethereum','/feed.xml?topic=__proto__']) {
    assert.equal((await get(endpoint)).status,400);
  }
  const asset=await get('/bitcoin/');
  assert.equal(await asset.text(),'asset');
  assert.equal(asset.headers.get('X-Content-Type-Options'),'nosniff');
  assert.equal(asset.headers.get('Strict-Transport-Security'),'max-age=63072000');
  assert.match(asset.headers.get('Content-Security-Policy'),/script-src-attr 'none'/);
  assert.equal(asset.headers.get('X-BlockBrief-Host'),'cloudflare');
  assert.equal((await get('/bitcoin/',{method:'HEAD'})).body,null);
  assert.equal((await get('/api/not-real')).status,404);
  const preview=await worker.fetch(new Request('https://preview.workers.dev/'),env,ctx);
  assert.equal(preview.headers.get('X-Robots-Tag'),'noindex, nofollow');
  assert.equal(asset.headers.has('X-Robots-Tag'),false);
});

test('News and RSS use the Worker cache without calls to the old website', async t => {
  const {default:worker} = await modulePromise;
  const cache=new Map(),upstreams=[],tasks=[];
  const originalFetch=global.fetch,originalCaches=global.caches;
  global.caches={default:{match:async r=>cache.get(r.url)?.clone(),put:async(r,v)=>{cache.set(r.url,v.clone())}}};
  global.fetch=async url=>{
    upstreams.push(String(url));
    assert.ok(!String(url).includes('blockbriefnews.com'));
    return new Response(`<rss><channel><item><title>Bitcoin network update</title><link>https://www.coindesk.com/test</link><description>Bitcoin network infrastructure.</description><pubDate>${new Date().toUTCString()}</pubDate></item></channel></rss>`);
  };
  try {
    const ctx={waitUntil(p){tasks.push(p)}};
    const run=p=>worker.fetch(new Request('https://blockbriefnews.com'+p),{},ctx);
    const first=await run('/api/news?nocache=one');
    assert.equal(first.status,200); assert.ok((await first.json()).count>0);
    assert.equal(upstreams.length,8);assert.equal(cache.size,1);
    const rss=await run('/feed.xml?topic=bitcoin');
    assert.equal(rss.status,200);assert.match(await rss.text(),/<rss version="2.0"/);
    await run('/api/news?nocache=two');assert.equal(upstreams.length,8);
    const key=[...cache.keys()][0];
    const stale=cache.get(key);stale.headers.set('X-News-Fresh-Until',String(Date.now()-1));
    global.fetch=async()=>{throw new Error('unavailable')};
    assert.equal((await run('/api/news')).status,200);await Promise.all(tasks);
    assert.equal(cache.get(key).status,200);
    cache.clear();assert.equal((await run('/api/news')).status,502);assert.equal(cache.size,0);
    assert.equal((await run('/feed.xml')).status,503);assert.equal(cache.size,0);
  } finally {global.fetch=originalFetch;global.caches=originalCaches;}
});

test('Published asset manifest excludes source, tests and deployment files',()=>{
  const manifest=JSON.parse(fs.readFileSync(path.resolve(__dirname,'../.cloudflare/manifest.json')));
  assert.ok(manifest['/index.html']);assert.ok(manifest['/assets/world-clock-cities.json']);
  assert.ok(Object.keys(manifest).every(p=>!/^\/(?:api|tests|scripts|cloudflare|\.git)\//.test(p)));
  assert.equal(manifest['/vercel.json'],undefined);
});

test('Worker market binding preserves fixed destinations, redirect refusal and CMC cache only',async()=>{
  const {default:worker}=await modulePromise;
  const originalCaches=global.caches;
  const cache=new Map(),calls=[],tasks=[];
  global.caches={default:{match:async r=>cache.get(r.url)?.clone(),put:async(r,v)=>{cache.set(r.url,v.clone())}}};
  const env={MARKET_FEED:{fetch:async req=>{
    calls.push(req);
    assert.equal(req.redirect,'manual');
    assert.equal(req.headers.get('Authorization'),null);assert.equal(req.headers.get('Cookie'),null);
    assert.equal(req.headers.get('Origin'),null);assert.equal(req.headers.get('X-Forwarded-For'),null);
    assert.equal(req.headers.get('CF-Connecting-IP'),'192.0.2.10');
    assert.equal(new URL(req.url).origin,'https://solanadex.io');
    assert.equal(new URL(req.url).pathname,'/api/crypto-ticker/scroll');
    return Response.json({source:new URL(req.url).searchParams.get('source'),status:'ok',fetchedAt:Date.now(),quotes:[]});
  }}};
  const ctx={waitUntil(p){tasks.push(p)}};
  const run=source=>worker.fetch(new Request('https://blockbriefnews.com/api/crypto-ticker?source='+source,{headers:{Authorization:'private',Cookie:'private',Origin:'https://untrusted.example','X-Forwarded-For':'203.0.113.8','CF-Connecting-IP':'192.0.2.10'}}),env,ctx);
  try {
    assert.equal((await run('coinmarketcap')).status,200);await Promise.all(tasks);
    assert.equal((await run('coinmarketcap')).status,200);assert.equal(calls.length,1);
    assert.equal((await run('jupiter')).status,200);assert.equal((await run('jupiter')).status,200);assert.equal(calls.length,3);
    env.MARKET_FEED.fetch=async()=>new Response(null,{status:302,headers:{Location:'https://example.com'}});
    assert.equal((await run('jupiter')).status,503);
  } finally {global.caches=originalCaches;}
});

test('Worker does not invent visitor identities or disclose them to public transports',async()=>{
  const {default:worker}=await modulePromise;
  const originalFetch=global.fetch;
  const observed=[];
  const read=async req=>{observed.push(req.headers);return Response.json({source:'jupiter',status:'ok',fetchedAt:Date.now(),quotes:[]})};
  const url='https://blockbriefnews.com/api/crypto-ticker?source=jupiter';
  try {
    await worker.fetch(new Request(url,{headers:{'X-Forwarded-For':'203.0.113.8'}}),{MARKET_FEED:{fetch:read}},{waitUntil(){}});
    global.fetch=read;
    await worker.fetch(new Request(url,{headers:{'CF-Connecting-IP':'192.0.2.10'}}),{},{waitUntil(){}});
    assert.equal(observed.length,2);
    assert.ok(observed.every(headers=>!headers.has('CF-Connecting-IP')&&!headers.has('X-Forwarded-For')));
  } finally {global.fetch=originalFetch;}
});
