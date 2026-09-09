// Match the official FRIED mint, never a symbol-only search.
const MINT = '3LaXmnVQxMMArywUBJjGA5EKbUdJ17PFor3M5oeupump';

module.exports = async function handler(req, res) {
  res.setHeader('Allow', 'GET, HEAD, OPTIONS');
  if (req.method === 'OPTIONS') return res.status(204).end();
  if (!['GET','HEAD'].includes(req.method)) { res.setHeader('Cache-Control','no-store'); return res.status(405).json({ok:false,error:'Method not allowed'}); }
  try {
    const response = await fetch(`https://api.dexscreener.com/token-pairs/v1/solana/${MINT}`, {
      signal: AbortSignal.timeout(8000)
    });
    if (!response.ok) throw new Error('Market provider unavailable');
    const pairs = await response.json();
    const pair = (Array.isArray(pairs) ? pairs : [])
      .filter(p => p.chainId === 'solana' && p.baseToken?.address === MINT && Number.isFinite(Number(p.priceUsd)) && Number(p.priceUsd) > 0)
      .sort((a, b) => (Number(b.liquidity?.usd) || 0) - (Number(a.liquidity?.usd) || 0))[0];
    if (!pair) throw new Error('No FRIED quote');
    res.setHeader('Cache-Control', 'public, s-maxage=60, stale-while-revalidate=120');
    if (req.method === 'HEAD') return res.status(200).end();
    return res.status(200).json({
      ok: true, symbol: 'FRIED', mint: MINT, usd: Number(pair.priceUsd),
      usd_24h_change: Number.isFinite(pair.priceChange?.h24) ? pair.priceChange.h24 : null,
      source: 'DEX Screener', updatedAt: new Date().toISOString()
    });
  } catch {
    res.setHeader('Cache-Control', 'no-store');
    if (req.method === 'HEAD') return res.status(503).end();
    return res.status(503).json({ ok: false, symbol: 'FRIED', error: 'FRIED price temporarily unavailable' });
  }
};
