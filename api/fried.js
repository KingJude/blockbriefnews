// Keep this compatibility endpoint on SolanaDEX's shared Jupiter batch.
const MINT = '3LaXmnVQxMMArywUBJjGA5EKbUdJ17PFor3M5oeupump';
const KEY = `jup:${MINT}`;
const FEED_URL = 'https://solanadex.io/api/crypto-ticker/scroll?source=jupiter';
const MAX_BYTES = 32_768;

module.exports = async function handler(req, res) {
  res.setHeader('Allow', 'GET, HEAD, OPTIONS');
  if (req.method === 'OPTIONS') return res.status(204).end();
  if (!['GET','HEAD'].includes(req.method)) { res.setHeader('Cache-Control','no-store'); return res.status(405).json({ok:false,error:'Method not allowed'}); }
  try {
    const response = await fetch(FEED_URL, {
      headers: { Accept: 'application/json' },
      signal: AbortSignal.timeout(12000),
      redirect: 'error'
    });
    if (!response.ok) throw new Error('Market provider unavailable');
    const reader = response.body.getReader();
    const chunks = [];
    let bytes = 0;
    try {
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        bytes += value.byteLength;
        if (bytes > MAX_BYTES) throw new Error('Feed too large');
        chunks.push(Buffer.from(value));
      }
    } finally { await reader.cancel(); }
    const feed = JSON.parse(Buffer.concat(chunks).toString('utf8'));
    if (feed?.source !== 'jupiter' || !['ok', 'stale'].includes(feed.status) || !Array.isArray(feed.quotes) || feed.quotes.length > 30) throw new Error('Invalid shared feed');
    const quote = feed.quotes.find(row => row?.key === KEY && row.source === 'jupiter' && row.symbol === 'FRIED');
    const now = Date.now();
    const fresh = Number.isSafeInteger(quote?.updatedAt)
      && quote.updatedAt > 0
      && quote.updatedAt <= now + 60_000
      && now - quote.updatedAt <= 120_000;
    if (!quote || !Number.isFinite(quote.price) || quote.price <= 0 || !fresh) throw new Error('No FRIED quote');
    res.setHeader('Cache-Control', 'no-store');
    if (req.method === 'HEAD') return res.status(200).end();
    return res.status(200).json({
      ok: true, symbol: 'FRIED', mint: MINT, usd: quote.price,
      usd_24h_change: Number.isFinite(quote.change24h) ? quote.change24h : null,
      source: 'Jupiter', updatedAt: quote.updatedAt
    });
  } catch {
    res.setHeader('Cache-Control', 'no-store');
    if (req.method === 'HEAD') return res.status(503).end();
    return res.status(503).json({ ok: false, symbol: 'FRIED', error: 'FRIED price temporarily unavailable' });
  }
};
