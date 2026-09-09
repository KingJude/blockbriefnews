// Run from the repository root: node --test tests/audit.test.cjs
const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const vm=require('node:vm');
const root=path.join(__dirname,'..');
const read=p=>fs.readFileSync(path.join(root,p),'utf8');
function moduleContext(file,fetcher=async()=>{throw Error('offline')}){
  const c=vm.createContext({module:{exports:{}},URL,Date,AbortController,AbortSignal,setTimeout,clearTimeout,fetch:fetcher});
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
test('FRIED validates mint and selects greatest liquidity, with honest failures',async()=>{
  const mint='3LaXmnVQxMMArywUBJjGA5EKbUdJ17PFor3M5oeupump';
  const pair=(address,usd,liquidity)=>({chainId:'solana',baseToken:{address},priceUsd:usd,liquidity:{usd:liquidity}});
  const c=moduleContext('api/fried.js',async()=>({ok:true,json:async()=>[pair('impostor',99,999999),pair(mint,.002,50),pair(mint,.003,100)]}));
  const res=response();await c.module.exports({method:'GET'},res);assert.equal(res.body.usd,.003);assert.equal(res.body.mint,mint);
  const fail=response();await moduleContext('api/fried.js').module.exports({method:'HEAD'},fail);assert.equal(fail.statusCode,503);assert.equal(fail.body,undefined);assert.equal(fail.headers['Cache-Control'],'no-store');
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
