// Syndicate the existing curated feed; original publishers retain their article URLs.
const TOPICS = { bitcoin: 'Bitcoin', ethereum: 'Ethereum', solana: 'Solana', markets: 'Markets', regulation: 'Regulation' };
const xml = value => String(value ?? '').replace(/[^\u0009\u000a\u000d\u0020-\ud7ff\ue000-\ufffd\u{10000}-\u{10ffff}]/gu, '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&apos;'}[c]));
function articleUrl(value) {
  try { const u = new URL(value); return /^https?:$/.test(u.protocol) && !u.username && !u.password ? u.href : ''; } catch { return ''; }
}
function renderFeed(data, topic = '') {
  const home = 'https://blockbriefnews.com/', self = home + 'feed.xml' + (topic ? '?topic=' + topic : '');
  const items = data.items.filter(x => !topic || (x.categories || [x.category]).includes(topic))
    .filter(x => x.title && articleUrl(x.link) && Number.isFinite(Date.parse(x.pubDate)))
    .sort((a,b) => Date.parse(b.pubDate) - Date.parse(a.pubDate));
  const title = 'BlockBrief News' + (topic ? ' — ' + TOPICS[topic] : '');
  return '<?xml version="1.0" encoding="UTF-8"?>\n<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom"><channel>' +
    `<title>${xml(title)}</title><link>${home}${topic ? topic + '/' : ''}</link><description>Crypto headlines and summaries with links to original reporting. Publisher articles remain in their original language.</description><language>en</language><ttl>5</ttl><atom:link href="${xml(self)}" rel="self" type="application/rss+xml"/>` +
    (Number.isFinite(Date.parse(data.updatedAt)) ? `<lastBuildDate>${new Date(data.updatedAt).toUTCString()}</lastBuildDate>` : '') +
    items.map(x => `<item><title>${xml(x.title)}</title><link>${xml(articleUrl(x.link))}</link><guid isPermaLink="true">${xml(articleUrl(x.link))}</guid><description>${xml('Source: ' + x.source + '. ' + (x.description || ''))}</description><pubDate>${new Date(x.pubDate).toUTCString()}</pubDate>${(x.categories || [x.category]).filter(Boolean).map(c => '<category>' + xml(c) + '</category>').join('')}</item>`).join('') + '</channel></rss>\n';
}
async function handler(req, res) {
  res.setHeader('Allow', 'GET, HEAD');
  res.setHeader('X-Content-Type-Options', 'nosniff');
  // A feed is for discovery/subscription; indexed landing pages use the XML sitemap.
  res.setHeader('X-Robots-Tag', 'noindex, follow');
  if (!['GET','HEAD'].includes(req.method)) { res.setHeader('Cache-Control','no-store'); return res.status(405).end(); }
  const topic = req.query?.topic || '';
  if (typeof topic !== 'string' || (topic && !Object.hasOwn(TOPICS,topic))) { res.setHeader('Cache-Control','no-store'); return res.status(400).end(); }
  try {
    // Fixed origin shares the production news cache and never fetches user-supplied URLs.
    const response = await fetch('https://blockbriefnews.com/api/news', { signal: AbortSignal.timeout(12000) });
    if (!response.ok) throw new Error('News unavailable');
    const data = await response.json();
    if (!data.ok || !Array.isArray(data.items)) throw new Error('Invalid news response');
    const body = renderFeed(data, topic);
    res.setHeader('Content-Type','application/rss+xml; charset=utf-8');
    res.setHeader('Cache-Control','public, s-maxage=300, stale-while-revalidate=600');
    return req.method === 'HEAD' ? res.status(200).end() : res.status(200).send(body);
  } catch {
    res.setHeader('Cache-Control','no-store');
    res.setHeader('Content-Type','text/plain; charset=utf-8');
    return req.method === 'HEAD' ? res.status(503).end() : res.status(503).send('News feed temporarily unavailable. Please try again shortly.');
  }
}
module.exports = handler;
module.exports.renderFeed = renderFeed;
