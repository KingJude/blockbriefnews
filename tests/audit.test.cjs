// Run from the repository root: node --test tests/audit.test.cjs
const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const vm=require('node:vm');
const root=path.join(__dirname,'..');
const read=p=>fs.readFileSync(path.join(root,p),'utf8');
function moduleContext(file,fetcher=async()=>{throw Error('offline')}){
  const c=vm.createContext({module:{exports:{}},URL,Date,AbortController,AbortSignal,Buffer,Response,setTimeout,clearTimeout,fetch:fetcher});
  vm.runInContext(read(file),c);return c;
}
const news=moduleContext('api/news.js');
const feed={name:'Test',weight:1};
const rss=(title='Bitcoin SEC approval',link='https://example.com/article',date='2026-01-01T12:00:00Z')=>`<rss><channel><item><title>${title}</title><link>${link}</link><pubDate>${date}</pubDate><description>Crypto regulation</description></item></channel></rss>`;
function response(){return {headers:{},setHeader(k,v){this.headers[k]=v},status(n){this.statusCode=n;return this},json(body){this.body=body;return this},end(){this.ended=true;return this}}}
test('RSS requires genuine dates and safe public web URLs',()=>{
  assert.equal(news.parseFeed(rss(),feed).length,1);
  for(const date of ['', 'invalid', '2099-01-01']) assert.equal(news.parseFeed(rss(undefined,undefined,date),feed).length,0);
  for(const url of ['javascript:alert(1)','https://user:pass@example.com/a','https://example.com/\" onclick=\"alert(1)']) assert.equal(news.parseFeed(rss(undefined,url),feed).length,0);
});
test('Atom selects the article alternate link instead of a self feed',()=>{
  const xml='<entry><title>Bitcoin</title><link rel="self" href="https://example.com/feed"/><link rel="alternate" href="https://example.com/story"/><published>2026-01-01</published></entry>';
  assert.equal(news.parseFeed(xml,feed)[0].link,'https://example.com/story');
});
test('Cross-topic articles appear in every relevant topic',()=>{
  const cats=news.categoriesFor('SEC approves Bitcoin ETF as prices rise','');
  for(const category of ['bitcoin','regulation','markets']) assert.ok(cats.includes(category));
});
test('Market-flow words do not accidentally match ETF or law topic keywords',()=>{
  const examples = [
    ['144 Billion SHIB Netflow Sends Warning Amid 5% Price Rally', 'Exchange activity suggests the rally may be short-lived.'],
    ['Token netflows rise', 'Traders track exchange activity.'],
    ['A flawless network upgrade', 'Trading resumes after the upgrade.']
  ];
  for (const [title, description] of examples) {
    assert.equal(news.categoryFor(title, description), 'markets');
    assert.ok(!news.categoriesFor(title, description).includes('regulation'));
  }
  for (const title of ['New ETF filing', 'New ETFs launch', 'Crypto law passes']) {
    assert.equal(news.categoryFor(title, ''), 'regulation');
    assert.ok(news.categoriesFor(title, '').includes('regulation'));
  }
});
test('Primary topic follows the headline before secondary summary mentions',()=>{
  const title='Cardano Price Prediction: Will ADA Break $0.30 or Fall to $0.20 This Week?';
  const description='Bitcoin traded higher while Ethereum held support.';
  assert.equal(news.categoryFor(title,description),'markets');
  assert.deepEqual([...news.categoriesFor(title,description)].sort(),['bitcoin','ethereum','markets']);
  assert.equal(news.categoryFor('Scaling fees fall','Ethereum layer 2 activity increased.'),'ethereum');
  assert.equal(news.categoryFor('Digital Asset Bill of Rights proposed','Bitcoin holders react.'),'regulation');
});
test('Tax-policy reporting reaches Regulation without treating token fees as policy',()=>{
  const title='Illinois draft crypto tax rules detail DeFi, stablecoin treatment';
  const description='Draft rules explain how a digital asset transaction tax applies to stablecoins and self-custody transfers.';
  assert.equal(news.categoryFor(title,description),'regulation');
  assert.ok(news.categoriesFor(title,description).includes('regulation'));
  for(const title of ['New crypto tax guidance released','Draft taxation-policy proposals published','Bitcoin tax rules clarified']) {
    assert.ok(news.categoriesFor(title,'').includes('regulation'));
  }
  assert.equal(news.categoryFor('Bitcoin tax rules clarified',''),'bitcoin');
  for(const title of ['Token transfer tax falls to 2%','Taxi payment app adds crypto','DeFi trading rules for beginners']) {
    assert.equal(news.categoryFor(title,''),'markets');
    assert.ok(!news.categoriesFor(title,'').includes('regulation'));
  }
});
test('Deduplication does not discard unrelated short headlines',()=>{
  assert.equal(news.similarity('Bitcoin price rises','Bitcoin price falls'),0);
  assert.equal(news.similarity('Bitcoin price rises','Bitcoin price rises'),1);
});
test('News survives partial provider failure and sorts by publication date',async()=>{
  let i=0;
  const c=moduleContext('api/news.js',async()=>{const n=++i;if(n>2)throw Error('provider down');return {ok:true,text:async()=>rss(n===1?'Bitcoin price rises':'Ethereum upgrade launches',`https://example.com/${n}`,n===1?'2026-01-01':'2026-01-02')}});
  const res=response();await c.module.exports({method:'GET'},res);
  assert.equal(res.statusCode,200);assert.equal(res.body.count,2);
  assert.equal(res.body.items[0].title,'Ethereum upgrade launches');assert.equal(res.body.errors.length,6);
});
test('Total news failure is uncached and HEAD returns no body',async()=>{
  for(const method of ['GET','HEAD']){const res=response();await news.module.exports({method},res);assert.equal(res.statusCode,502);assert.equal(res.headers['Cache-Control'],'no-store');if(method==='HEAD')assert.equal(res.body,undefined)}
});
test('Both APIs reject unsupported methods before contacting providers',async()=>{
  let calls=0;
  for(const file of ['api/news.js','api/fried.js']){const c=moduleContext(file,async()=>{calls++;throw Error()});for(const method of ['POST','OPTIONS']){const res=response();await c.module.exports({method},res);assert.equal(res.statusCode,method==='POST'?405:204)}}
  assert.equal(calls,0);
});
test('FRIED compatibility API reads only the exact shared Jupiter quote',async()=>{
  const mint='3LaXmnVQxMMArywUBJjGA5EKbUdJ17PFor3M5oeupump';
  const updatedAt=Date.now()-1000;
  const feed={source:'jupiter',status:'ok',quotes:[
    {key:'jup:impostor',source:'jupiter',symbol:'FRIED',price:99,change24h:99,updatedAt},
    {key:`jup:${mint}`,source:'jupiter',symbol:'FRIED',price:.003,change24h:-1.25,updatedAt}
  ]};
  let request;
  const c=moduleContext('api/fried.js',async(url,options)=>{request={url,options};return new Response(JSON.stringify(feed),{status:200})});
  const res=response();await c.module.exports({method:'GET'},res);
  assert.equal(request.url,'https://solanadex.io/api/crypto-ticker/scroll?source=jupiter');
  assert.deepEqual({...request.options.headers},{Accept:'application/json'});assert.equal(request.options.redirect,'error');
  assert.equal(res.statusCode,200);assert.equal(res.body.usd,.003);assert.equal(res.body.usd_24h_change,-1.25);
  assert.equal(res.body.mint,mint);assert.equal(res.body.source,'Jupiter');assert.equal(res.body.updatedAt,updatedAt);
  assert.equal(res.headers['Cache-Control'],'no-store');
  const head=response();await c.module.exports({method:'HEAD'},head);assert.equal(head.statusCode,200);assert.equal(head.body,undefined);
  const fail=response();await moduleContext('api/fried.js').module.exports({method:'HEAD'},fail);assert.equal(fail.statusCode,503);assert.equal(fail.body,undefined);assert.equal(fail.headers['Cache-Control'],'no-store');
});
test('FRIED compatibility API rejects missing, expired, malformed and oversized shared data',async()=>{
  const mint='3LaXmnVQxMMArywUBJjGA5EKbUdJ17PFor3M5oeupump';
  const valid={key:`jup:${mint}`,source:'jupiter',symbol:'FRIED',price:.003,change24h:null,updatedAt:Date.now()-1000};
  const bodies=[
    {source:'jupiter',status:'ok',quotes:[{...valid,key:'jup:impostor'}]},
    {source:'jupiter',status:'stale',quotes:[{...valid,updatedAt:Date.now()-120001}]},
    {source:'coinmarketcap',status:'ok',quotes:[valid]},
    '{not-json',
    'x'.repeat(32769)
  ];
  for(const body of bodies){
    const value=typeof body==='string'?body:JSON.stringify(body);
    const c=moduleContext('api/fried.js',async()=>new Response(value,{status:200}));
    const res=response();await c.module.exports({method:'GET'},res);
    assert.equal(res.statusCode,503);assert.equal(res.body.ok,false);assert.equal(res.headers['Cache-Control'],'no-store');
  }
});
test('Published market-data paths use only the local shared-feed proxies',()=>{
  const active=['api/fried.js','api/crypto-ticker.js','index.html','future-home.html','home.html'];
  for(const file of active) assert.doesNotMatch(read(file),/api\.(?:coingecko|dexscreener|geckoterminal)\.com/i,file);
  const home=read('index.html');
  for(const value of ['/api/crypto-ticker?source=coinmarketcap','/api/crypto-ticker?source=jupiter','cmc:1','cmc:1027','jup:So11111111111111111111111111111111111111112','jup:3LaXmnVQxMMArywUBJjGA5EKbUdJ17PFor3M5oeupump']) assert.ok(home.includes(value),value);
  assert.match(home,/https:\/\/dexscreener\.com\/solana\/3LaXmnVQxMMArywUBJjGA5EKbUdJ17PFor3M5oeupump/);
});
test('HTML inline scripts compile, structured metadata parses and skip targets exist',()=>{
  for(const file of ['index.html','future-home.html',...['bitcoin','ethereum','solana','markets','regulation','story'].map(x=>`${x}/index.html`)] ){
    const html=read(file);assert.match(html, /class="skip-link"/);assert.match(html, /tabindex="-1"/);
    for(const m of html.matchAll(/<script\b([^>]*)>([\s\S]*?)<\/script>/gi)){if(m[1].includes('application/ld+json'))JSON.parse(m[2]);else new vm.Script(m[2],{filename:file})}
  }
  for(const file of ['world-clock.js','languages.js','header-position.js','fried-ad.js'])new vm.Script(read(file),{filename:file});
  JSON.parse(read('vercel.json'));
});
test('Failed homepage refresh keeps previously loaded stories',async()=>{
  const code=[...read('index.html').matchAll(/<script\b[^>]*>([\s\S]*?)<\/script>/g)].at(-1)[1];
  const text={textContent:''};
  const c=vm.createContext({URL,Date,AbortSignal,fetch:async()=>{throw Error('offline')},document:{getElementById:()=>text}});
  vm.runInContext(code.slice(0,code.indexOf("document.querySelectorAll('.filter[data-filter]')")),c);
  vm.runInContext("allNews=[{title:'Already loaded'}]",c);await c.loadNews();
  assert.equal(vm.runInContext('allNews[0].title',c),'Already loaded');assert.match(text.textContent,/previously loaded/);
  assert.ok(!c.actions({link:'https://example.com/?q=" onclick="alert(1)'}).includes('href="https://example.com/?q="'));
});
test('World clock avoids repeated DOM writes within a minute and while hidden',()=>{
  let Clock,writes=0;const document={hidden:false};
  const c=vm.createContext({HTMLElement:class{},customElements:{get:()=>undefined,define:(name,type)=>{Clock=type}},document,Intl,Date,URL});
  vm.runInContext(read('world-clock.js'),c);
  const format={format:()=> '12:00',formatToParts:()=>[{type:'hour',value:'12'},{type:'minute',value:'0'},{type:'timeZoneName',value:'GMT'}]};
  const field={set textContent(value){writes++},setAttribute(){writes++}};
  const widget={views:[{parts:format,time:format,date:format,card:{querySelector:()=>field}}]};
  Clock.prototype.tick.call(widget);assert.equal(writes,5);
  Clock.prototype.tick.call(widget);assert.equal(writes,5);
  document.hidden=true;widget.views[0].lastMinute=undefined;
  Clock.prototype.tick.call(widget);assert.equal(writes,5);
});
