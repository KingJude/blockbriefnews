const FEEDS = [
  { name: "CoinDesk", url: "https://www.coindesk.com/arc/outboundfeeds/rss/", weight: 5 },
  { name: "Decrypt", url: "https://decrypt.co/feed", weight: 3 },
  { name: "Cointelegraph", url: "https://cointelegraph.com/rss", weight: 3 },
  { name: "CNBC", url: "https://search.cnbc.com/rs/search/combinedcms/view.xml?partnerId=wrss01&id=10000664", weight: 5, cryptoOnly: true },
  { name: "CoinGape", url: "https://coingape.com/feed/", weight: 3 },
  { name: "U.Today", url: "https://u.today/rss", weight: 3 },
  { name: "Coin Bureau", url: "https://coinbureau.com/explore", weight: 3, format: "coinbureau" },
  { name: "SEC", url: "https://www.sec.gov/news/pressreleases.rss", weight: 6, cryptoOnly: true }
];

function decodeEntities(value = "") {
  return value.replace(/<!\[CDATA\[([\s\S]*?)\]\]>/gi, "$1").replace(/&amp;/g, "&").replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&quot;/g, '"').replace(/&#39;|&apos;/g, "'").replace(/&#x2F;/gi, "/").replace(/&#(\d+);/g, (_, n) => String.fromCharCode(Number(n))).replace(/&#x([0-9a-f]+);/gi, (_, n) => String.fromCharCode(parseInt(n, 16)));
}
function stripHtml(value = "") { return decodeEntities(value).replace(/<script[\s\S]*?<\/script>/gi," ").replace(/<style[\s\S]*?<\/style>/gi," ").replace(/<[^>]+>/g," ").replace(/\s+/g," ").trim(); }
function tagValue(block,tags){ for(const tag of tags){ const escaped=tag.replace(":","\\:"); const m=block.match(new RegExp(`<${escaped}(?:\\s[^>]*)?>([\\s\\S]*?)<\\/${escaped}>`,"i")); if(m)return decodeEntities(m[1]).trim(); } return ""; }
function articleUrl(value) {
  if (typeof value !== 'string' || /[\u0000-\u0020"<>]/.test(value)) return '';
  try { const url = new URL(value); return /^https?:$/.test(url.protocol) && !url.username && !url.password ? url.href : ''; } catch { return ''; }
}
function atomLink(block) {
  for (const match of block.matchAll(/<link\b([^>]+)>/gi)) {
    const attrs = match[1], rel = attrs.match(/\brel=["']([^"']+)["']/i)?.[1];
    if (rel && rel !== 'alternate') continue;
    const href = attrs.match(/\bhref=["']([^"']+)["']/i)?.[1];
    if (href) return decodeEntities(href).trim();
  }
  return '';
}
function parseFeed(xml, feed) {
  const rss = xml.match(/<item\b[\s\S]*?<\/item>/gi) || [], atom = xml.match(/<entry\b[\s\S]*?<\/entry>/gi) || [];
  const items = [];
  for (const block of (rss.length ? rss : atom).slice(0, 50)) {
    const title = stripHtml(tagValue(block, ['title'])).slice(0, 500);
    const link = articleUrl(rss.length ? tagValue(block, ['link', 'guid']) : atomLink(block));
    const description = stripHtml(tagValue(block, ['description','content:encoded','content','summary'])).slice(0, 1000);
    const timestamp = Date.parse(stripHtml(tagValue(block, ['pubDate','dc:date','published','updated'])));
    // Undated or malformed stories must never be promoted as newly published.
    if (!title || !link || !Number.isFinite(timestamp) || timestamp > Date.now() + 300000) continue;
    items.push({source:feed.name,sourceWeight:feed.weight||0,title,description,link,pubDate:new Date(timestamp).toISOString()});
  }
  return items;
}

 // Coin Bureau no longer publishes its old RSS feed. Read only the public
 // article-card titles, summaries and publication dates from its Explore page.
function parseCoinBureau(html, feed) {
  const items = [], seen = new Set();
  for (const match of html.matchAll(/<a\b[^>]*href=["'](\/[^"'?#]+\/[^"'?#]+)["'][^>]*>([\s\S]*?)<\/a>/gi)) {
    const [, path, card] = match;
    const title = stripHtml(tagValue(card, ["h3"]));
    const paragraphs = [...card.matchAll(/<p\b[^>]*>([\s\S]*?)<\/p>/gi)].map(m => stripHtml(m[1]));
    const date = paragraphs.find(p => /^(January|February|March|April|May|June|July|August|September|October|November|December) \d{1,2}(?:st|nd|rd|th)?, \d{4}$/.test(p));
    const timestamp = date ? Date.parse(date.replace(/(\d)(st|nd|rd|th)/, "$1") + " 00:00:00 UTC") : NaN;
    if (!title || !Number.isFinite(timestamp) || timestamp > Date.now() + 300000 || seen.has(path)) continue;
    seen.add(path);
    items.push({ source: feed.name, sourceWeight: feed.weight || 0, title,
      description: paragraphs.filter(p => p !== date).join(" ").slice(0, 500),
      link: new URL(path, "https://coinbureau.com").href, pubDate: new Date(timestamp).toISOString() });
  }
  if (!items.length) throw new Error("Coin Bureau article listing unavailable");
  return items.slice(0, 25);
}

function categoryFor(title,description){ const t=`${title} ${description}`.toLowerCase(); if(/\bsolana\b|\bsol\b/.test(t))return"solana"; if(/\bethereum\b|\beth\b/.test(t))return"ethereum"; if(/\bbitcoin\b|\bbtc\b/.test(t))return"bitcoin"; if(/\bsec\b|\bcftc\b|regulat|policy|congress|senate|court|law|etf|legislat|enforcement/.test(t))return"regulation"; return"markets"; }
const CRYPTO_RE=/bitcoin|\bbtc\b|ethereum|\beth\b|solana|\bsol\b|crypto|digital asset|blockchain|stablecoin|tokeni[sz]|defi|web3|coinbase|binance|kraken/;
function categoriesFor(title, description) {
  const text = `${title} ${description}`.toLowerCase(), categories = new Set([categoryFor(title, description)]);
  if (/\bbitcoin\b|\bbtc\b/.test(text)) categories.add('bitcoin');
  if (/\bethereum\b|\beth\b/.test(text)) categories.add('ethereum');
  if (/\bsolana\b|\bsol\b/.test(text)) categories.add('solana');
  if (/\bsec\b|\bcftc\b|regulat|policy|congress|senate|court|\blaw\b|legislat|enforcement/.test(text)) categories.add('regulation');
  if (/market|price|\betf\b|exchange|trading|rally|selloff|liquidat/.test(text)) categories.add('markets');
  return [...categories];
}
function normalizeTitle(s=""){ return s.toLowerCase().replace(/[^a-z0-9 ]/g," ").replace(/\b(the|a|an|to|of|for|and|in|on|as|with|at|by|from)\b/g," ").replace(/\s+/g," ").trim(); }
function similarity(a,b){ const na=normalizeTitle(a),nb=normalizeTitle(b);if(na&&na===nb)return 1;const A=new Set(na.split(" ").filter(x=>x.length>2)),B=new Set(nb.split(" ").filter(x=>x.length>2));if(Math.min(A.size,B.size)<4)return 0;let common=0;for(const x of A)if(B.has(x))common++;return common/(A.size+B.size-common); }
function importance(item){ const t=`${item.title} ${item.description}`.toLowerCase(); let s=item.sourceWeight||0; const rules=[[/hack|exploit|breach|stolen|attack|rollback|outage|bankrupt|insolven|fraud/,8],[/sec|cftc|regulat|law|legislat|court|congress|senate|government|enforcement/,7],[/etf|federal reserve|fed |interest rate|inflation|treasury/,6],[/bitcoin|ethereum|solana/,4],[/binance|coinbase|kraken|tether|circle|stablecoin/,4],[/billion|million|record|surge|plunge|rally|selloff|liquidat/,3]]; for(const [r,n] of rules)if(r.test(t))s+=n; const age=(Date.now()-new Date(item.pubDate).getTime())/36e5; if(Number.isFinite(age))s+=Math.max(0,6-Math.min(age,24)/4); return s; }
async function fetchFeed(feed){ const c=new AbortController(),timer=setTimeout(()=>c.abort(),8000); try{ const r=await fetch(feed.url,{signal:c.signal,headers:{"User-Agent":"BlockBrief/1.1 (+https://blockbriefnews.com)","Accept":"application/rss+xml, application/atom+xml, application/xml, text/xml, */*"}}); if(!r.ok)throw new Error(`${feed.name} returned ${r.status}`); const body=await r.text(); let items=feed.format==="coinbureau"?parseCoinBureau(body,feed):parseFeed(body,feed); if(!items.length)throw new Error(`${feed.name} returned no readable articles`); if(feed.cryptoOnly)items=items.filter(x=>CRYPTO_RE.test(`${x.title} ${x.description}`.toLowerCase())); return items; } finally{clearTimeout(timer);} }
module.exports = async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Allow', 'GET, HEAD, OPTIONS');
  if (req.method === 'OPTIONS') return res.status(204).end();
  if (!['GET','HEAD'].includes(req.method)) { res.setHeader('Cache-Control','no-store'); return res.status(405).json({error:'Method not allowed'}); }
  const settled = await Promise.allSettled(FEEDS.map(fetchFeed)), merged = [], errors = [];
  settled.forEach((r,i) => r.status === 'fulfilled' ? merged.push(...r.value) : errors.push(`${FEEDS[i].name}: ${r.reason?.message || 'feed unavailable'}`));
  merged.sort((a,b) => Date.parse(b.pubDate)-Date.parse(a.pubDate));
  const unique = [];
  for (const item of merged) {
    if (unique.some(x => x.link === item.link || similarity(x.title,item.title) >= 0.82)) continue;
    unique.push(item);
  }
  const items = unique.map(x => ({...x,category:categoryFor(x.title,x.description),categories:categoriesFor(x.title,x.description),score:importance(x)}))
    .sort((a,b) => Date.parse(b.pubDate)-Date.parse(a.pubDate) || b.score-a.score).slice(0,36).map(({sourceWeight,...x}) => x);
  res.setHeader('Cache-Control',items.length ? 's-maxage=180, stale-while-revalidate=600' : 'no-store');
  if(req.method === 'HEAD') return res.status(items.length ? 200 : 502).end();
  return res.status(items.length ? 200 : 502).json({ok:items.length>0,updatedAt:new Date().toISOString(),count:items.length,items,errors});
};
