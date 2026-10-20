// Reuse SolanaDEX's shared provider cache and credit budget; no API key is sent to browsers.
const SOURCES = { coinmarketcap: 300000, dexscreener: 10000 };
const STATUSES = new Set(['ok', 'stale', 'unavailable', 'unconfigured']);

module.exports = async function handler(req, res) {
  res.setHeader('Allow', 'GET, HEAD');
  res.setHeader('Cache-Control', 'no-store');
  if (!['GET', 'HEAD'].includes(req.method)) return res.status(405).json({ error: 'Method not allowed' });
  const url = new URL(req.url, 'https://blockbriefnews.com');
  const source = url.searchParams.get('source');
  if (!Object.hasOwn(SOURCES, source) || [...url.searchParams.keys()].some(key => key !== 'source') || url.searchParams.getAll('source').length !== 1) {
    return res.status(400).json({ error: 'Choose a supported price source' });
  }
  try {
    // Do not forward visitor cookies, Origin or authorization to the shared feed.
    const upstream = await fetch(`https://solanadex.io/api/crypto-ticker/scroll?source=${source}`, {
      headers: { Accept: 'application/json' },
      signal: AbortSignal.timeout(source === 'dexscreener' ? 30000 : 16000),
      redirect: 'error'
    });
    if (!upstream.ok) throw new Error('Feed unavailable');
    const reader = upstream.body.getReader();
    const chunks = [];
    let bytes = 0;
    try {
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        bytes += value.byteLength;
        if (bytes > 32768) throw new Error('Feed too large');
        chunks.push(Buffer.from(value));
      }
    } finally { await reader.cancel(); }
    const feed = JSON.parse(Buffer.concat(chunks).toString('utf8'));
    if (feed.source !== source || !STATUSES.has(feed.status) || !Array.isArray(feed.quotes) || feed.quotes.length > 30) throw new Error('Invalid feed');
    const body = {
      source, status: feed.status,
      fetchedAt: Number.isFinite(feed.fetchedAt) ? feed.fetchedAt : null,
      refreshAfterMs: SOURCES[source],
      quotes: feed.quotes.filter(quote => quote && quote.source === source).map(quote => ({
        key: String(quote.key).slice(0,120),
        symbol: String(quote.symbol).slice(0,20),
        name: String(quote.name).slice(0,80),
        price: Number.isFinite(quote.price) && quote.price > 0 ? quote.price : null,
        change24h: Number.isFinite(quote.change24h) ? quote.change24h : null,
        updatedAt: Number.isFinite(quote.updatedAt) ? quote.updatedAt : null,
        source
      }))
    };
    // Short edge caching absorbs concurrent page loads. Quote timestamps still determine freshness.
    if (feed.status === 'ok' || feed.status === 'stale') {
      res.setHeader('Vercel-CDN-Cache-Control', 'public, s-maxage=2');
    }
    if (req.method === 'HEAD') return res.status(200).end();
    return res.status(200).json(body);
  } catch {
    if (req.method === 'HEAD') return res.status(503).end();
    return res.status(503).json({ source, status: 'unavailable', fetchedAt: null, refreshAfterMs: SOURCES[source], quotes: [] });
  }
};
