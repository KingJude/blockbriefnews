const { test } = require('node:test');
const assert = require('node:assert/strict');
const vm = require('node:vm');
const fs = require('node:fs');
const path = require('node:path');
const root = path.resolve(__dirname, '..');
function handler(fetch) {
  const context = vm.createContext({module:{exports:{}},URL,AbortSignal,Buffer,fetch});
  vm.runInContext(fs.readFileSync(path.join(root,'api/crypto-ticker.js'),'utf8'),context);
  return context.module.exports;
}
function response() {
  return {headers:{},setHeader(k,v){this.headers[k]=v;},status(code){this.statusCode=code;return this;},json(body){this.body=body;return this;},end(){this.ended=true;return this;}};
}
const quote = {key:'cmc:1',symbol:'BTC',name:'Bitcoin',price:120000,change24h:2,updatedAt:1234,source:'coinmarketcap'};
const feed = {source:'coinmarketcap',status:'ok',fetchedAt:5678,refreshAfterMs:300000,quotes:[quote]};
test('Ticker uses the fixed shared feed without forwarding credentials or visitor headers',async()=>{
  let fetched;
  const run=handler(async(url,options)=>{fetched={url,options};return Response.json({...feed,secret:'not public',quotes:[{...quote,secret:'not public'}]});});
  const res=response();
  await run({method:'GET',url:'/api/crypto-ticker?source=coinmarketcap',headers:{cookie:'private',origin:'https://blockbriefnews.com'}},res);
  assert.equal(fetched.url,'https://solanadex.io/api/crypto-ticker/scroll?source=coinmarketcap');
  assert.deepEqual(Object.keys(fetched.options.headers),['Accept']);
  assert.equal(fetched.options.redirect,'error');
  assert.equal(res.statusCode,200);
  assert.equal(res.body.quotes[0].symbol,'BTC');
  assert.equal(res.body.quotes[0].updatedAt,1234);
  assert.equal(res.body.fetchedAt,5678);
  assert.ok(!JSON.stringify(res.body).includes('secret'));
  assert.equal(res.headers['Vercel-CDN-Cache-Control'],'public, s-maxage=2');
});
test('Jupiter proxy preserves the shared five-second prices without adding edge-cache delay',async()=>{
  const mint='3LaXmnVQxMMArywUBJjGA5EKbUdJ17PFor3M5oeupump';
  let fetched;
  const run=handler(async(url,options)=>{
    fetched={url,options};
    return Response.json({source:'jupiter',status:'ok',fetchedAt:5678,refreshAfterMs:5000,quotes:[{...quote,key:`jup:${mint}`,symbol:'FRIED',source:'jupiter'}]});
  });
  const res=response();
  await run({method:'GET',url:'/api/crypto-ticker?source=jupiter'},res);
  assert.equal(fetched.url,'https://solanadex.io/api/crypto-ticker/scroll?source=jupiter');
  assert.deepEqual(Object.keys(fetched.options.headers),['Accept']);
  assert.equal(res.statusCode,200);
  assert.equal(res.body.refreshAfterMs,5000);
  assert.equal(res.body.quotes[0].key,`jup:${mint}`);
  assert.equal(res.body.quotes[0].source,'jupiter');
  assert.equal(res.headers['Cache-Control'],'no-store');
  assert.equal(res.headers['Vercel-CDN-Cache-Control'],undefined);
});
test('Ticker rejects unknown sources, extra parameters and duplicate sources without fetching',async()=>{
  let calls=0;const run=handler(async()=>{calls++;});
  for(const query of ['', '?source=wbtc', '?source=dexscreener', '?source=coinmarketcap&url=https://example.com', '?source=coinmarketcap&source=dexscreener']){
    const res=response();await run({method:'GET',url:'/api/crypto-ticker'+query},res);assert.equal(res.statusCode,400);
  }
  const res=response();await run({method:'POST',url:'/api/crypto-ticker?source=coinmarketcap'},res);assert.equal(res.statusCode,405);
  assert.equal(calls,0);
});
test('Ticker fails honestly for invalid, oversized and failed shared feeds',async()=>{
  for(const fetch of [async()=>{throw Error('offline');},async()=>Response.json({...feed,source:'dexscreener'}),async()=>new Response('x'.repeat(32769))]){
    const res=response();await handler(fetch)({method:'GET',url:'/api/crypto-ticker?source=coinmarketcap'},res);
    assert.equal(res.statusCode,503);assert.equal(res.body.status,'unavailable');assert.equal(res.body.quotes.length,0);assert.equal(res.headers['Cache-Control'],'no-store');assert.equal(res.headers['Vercel-CDN-Cache-Control'],undefined);assert.equal(res.headers['Retry-After'],'10');
  }
});
test('Ticker preserves stale timestamps and HEAD omits the body',async()=>{
  const run=handler(async()=>Response.json({...feed,status:'stale'}));
  const res=response();await run({method:'GET',url:'/api/crypto-ticker?source=coinmarketcap'},res);
  assert.equal(res.body.status,'stale');assert.equal(res.body.quotes[0].updatedAt,1234);
  const head=response();await run({method:'HEAD',url:'/api/crypto-ticker?source=coinmarketcap'},head);
  assert.equal(head.statusCode,200);assert.equal(head.body,undefined);assert.ok(head.ended);
});
test('Ticker forwards bounded retry-after and 429 while upstream errors remain uncached',async()=>{
  for(const [status,header,expectedStatus,expectedDelay] of [[429,'30',429,'30'],[503,'45',503,'45'],[429,'999999999',429,String(32*86400)],[500,'3600',503,'5'],[429,'invalid',429,'5']]){
    const run=handler(async()=>new Response('',{status,headers:{'Retry-After':header}}));
    const res=response();await run({method:'GET',url:'/api/crypto-ticker?source=jupiter'},res);
    assert.equal(res.statusCode,expectedStatus);
    assert.equal(res.headers['Retry-After'],expectedDelay);
    assert.equal(res.headers['Cache-Control'],'no-store');
    assert.equal(res.headers['Vercel-CDN-Cache-Control'],undefined);
    assert.equal(res.body.quotes.length,0);
  }
});
test('Every published news page keeps the ticker below navigation without the FRIED ad',()=>{
  for(const file of ['index.html',...['bitcoin','ethereum','solana','markets','regulation','story'].map(name=>name+'/index.html')]){
    const html=fs.readFileSync(path.join(root,file),'utf8');
    assert.equal((html.match(/data-crypto-ticker/g)||[]).length,1);
    assert.match(html,/<script src="\/crypto-ticker.js\?v=6" defer><\/script>/);
    assert.ok(html.indexOf('site-header-spacer')<html.indexOf('data-crypto-ticker'));
    assert.ok(html.indexOf('data-crypto-ticker')<html.indexOf('<main'));
    assert.doesNotMatch(html,/fried-banner|\/fried-ad\.(?:css|js)/);
  }
});
