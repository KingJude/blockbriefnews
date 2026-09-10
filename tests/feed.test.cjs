const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const vm=require('node:vm');
const {renderFeed}=require('../api/feed.js');
const old={title:'Bitcoin & markets <update>',source:'A & B',link:'https://example.com/a?x=1&y=2',description:'"Quoted" <text>',pubDate:'2026-09-01T00:00:00Z',categories:['bitcoin','markets']};
const recent={...old,title:'Ethereum news',link:'https://example.com/b',pubDate:'2026-09-02T00:00:00Z',categories:['ethereum']};
test('RSS escapes content, keeps original URLs and orders real dates newest first',()=>{
 const body=renderFeed({items:[old,recent,{...old,link:'javascript:alert(1)'},{...old,pubDate:'invalid'}]});
 assert.equal((body.match(/<item>/g)||[]).length,2);
 assert.ok(body.indexOf('Ethereum news')<body.indexOf('Bitcoin &amp; markets &lt;update&gt;'));
 assert.ok(body.includes('https://example.com/a?x=1&amp;y=2'));
 assert.ok(body.includes('Source: A &amp; B. &quot;Quoted&quot; &lt;text&gt;'));
});
test('Topic feeds include matching multi-topic stories and allow an empty channel',()=>{
 assert.equal((renderFeed({items:[old,recent]},'markets').match(/<item>/g)||[]).length,1);
 assert.equal((renderFeed({items:[old,recent]},'solana').match(/<item>/g)||[]).length,0);
});
test('Feed rejects invalid requests, handles failures without caching and honors HEAD',async()=>{
 let calls=0,fail=false;
 const c=vm.createContext({module:{exports:{}},URL,AbortSignal,fetch:async()=>{calls++;if(fail)throw Error('offline');return{ok:true,json:async()=>({ok:true,items:[old]})}}});
 vm.runInContext(fs.readFileSync(path.join(__dirname,'../api/feed.js'),'utf8'),c);
 const response=()=>({headers:{},setHeader(k,v){this.headers[k]=v},status(n){this.code=n;return this},end(){return this},send(b){this.body=b;return this}});
 for(const req of [{method:'POST'},{method:'GET',query:{topic:'unknown'}},{method:'GET',query:{topic:['bitcoin']}}]){const r=response();await c.module.exports(req,r);assert.ok([400,405].includes(r.code));assert.equal(r.headers['Cache-Control'],'no-store')}
 assert.equal(calls,0);
 let r=response();await c.module.exports({method:'HEAD'},r);assert.equal(r.code,200);assert.equal(r.body,undefined);
 fail=true;r=response();await c.module.exports({method:'GET'},r);assert.equal(r.code,503);assert.equal(r.headers['Cache-Control'],'no-store');
});
