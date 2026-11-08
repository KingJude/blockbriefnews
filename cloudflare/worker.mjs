import newsHandler from '../api/news.js';
import feedHandler from '../api/feed.js';
import tickerHandler from '../api/crypto-ticker.js';
import friedHandler from '../api/fried.js';
import { HEADERS, REDIRECTS, RELEASE } from './generated-config.mjs';

// Adapt the existing, tested API handlers without a Node HTTP server.
export async function invoke(handler, request, options) {
  const url = new URL(request.url);
  const query = Object.create(null);
  for (const key of new Set(url.searchParams.keys())) {
    const values = url.searchParams.getAll(key);
    query[key] = values.length === 1 ? values[0] : values;
  }
  const headers = new Headers();
  let status = 200, body = null;
  const res = {
    setHeader(key, value) { headers.set(key, String(value)); return this; },
    status(value) { status = value; return this; },
    json(value) { headers.set('Content-Type', 'application/json; charset=utf-8'); body = JSON.stringify(value); return this; },
    send(value) { body = value; return this; },
    end(value) { body = value ?? null; return this; }
  };
  await handler({method: request.method, url: url.pathname + url.search, query}, res, options);
  return new Response(request.method === 'HEAD' || status === 204 ? null : body, {status, headers});
}

const pendingNews = new Map();
async function refreshNews(key, cache) {
  if (!pendingNews.has(key)) {
    const pending = (async () => {
      const response = await invoke(newsHandler, new Request(key));
      if (response.ok && cache) {
        const stored = new Response(response.clone().body, response);
        stored.headers.set('Cache-Control', 'public, max-age=780');
        stored.headers.set('X-News-Fresh-Until', String(Date.now() + 180000));
        stored.headers.set('X-News-Expires-At', String(Date.now() + 780000));
        await cache.put(new Request(key), stored);
      }
      return {status: response.status, headers: [...response.headers], body: await response.text()};
    })();
    pendingNews.set(key, pending);
    pending.finally(() => pendingNews.delete(key)).catch(() => {});
  }
  const snapshot = await pendingNews.get(key);
  // Only plain data may cross request contexts in Workers; never share Response streams.
  return new Response(snapshot.body, {status:snapshot.status,headers:snapshot.headers});
}

export async function loadNews(origin, ctx, cache = globalThis.caches?.default) {
  // Ignore arbitrary query strings and visitor headers in the shared public cache.
  const key = origin + '/api/news?release=' + RELEASE;
  const cached = cache ? await cache.match(new Request(key)) : null;
  if (cached && Number(cached.headers.get('X-News-Expires-At')) > Date.now()) {
    if (Number(cached.headers.get('X-News-Fresh-Until')) <= Date.now()) {
      ctx.waitUntil(refreshNews(key, cache).then(() => {}).catch(() => {}));
    }
    const response = new Response(cached.body, cached);
    response.headers.set('Cache-Control', 's-maxage=180, stale-while-revalidate=600');
    response.headers.delete('X-News-Fresh-Until');
    response.headers.delete('X-News-Expires-At');
    return response;
  }
  return refreshNews(key, cache);
}

function finish(response, request) {
  const url = new URL(request.url);
  const result = new Response(request.method === 'HEAD' ? null : response.body, response);
  for (const [key, value] of Object.entries(HEADERS)) result.headers.set(key, value);
  if (url.pathname.startsWith('/api/')) result.headers.set('X-Robots-Tag', 'noindex');
  if (!['blockbriefnews.com', 'www.blockbriefnews.com'].includes(url.hostname)) {
    result.headers.set('X-Robots-Tag', 'noindex, nofollow');
  }
  result.headers.set('X-BlockBrief-Host', 'cloudflare');
  result.headers.set('X-BlockBrief-Release', RELEASE);
  return result;
}

async function loadTicker(request, ctx, options) {
  const url = new URL(request.url);
  const cache = globalThis.caches?.default;
  const canCache = cache && ['GET','HEAD'].includes(request.method)
    && url.searchParams.toString() === 'source=coinmarketcap';
  const key = new Request(url.origin + '/api/crypto-ticker?source=coinmarketcap&release=' + RELEASE);
  if (canCache) {
    const stored = await cache.match(key);
    if (stored && Number(stored.headers.get('X-Ticker-Expires-At')) > Date.now()) {
      const response = new Response(stored.body, stored);
      response.headers.set('Cache-Control','no-store');
      response.headers.delete('X-Ticker-Expires-At');
      return response;
    }
  }
  const response = await invoke(tickerHandler, canCache ? new Request(request.url) : request, options);
  const cacheable = response.ok && response.headers.has('Vercel-CDN-Cache-Control');
  response.headers.delete('Vercel-CDN-Cache-Control');
  if (canCache && cacheable) {
    const stored = new Response(response.clone().body,response);
    stored.headers.set('Cache-Control','public, max-age=2');
    stored.headers.set('X-Ticker-Expires-At',String(Date.now()+2000));
    ctx.waitUntil(cache.put(key,stored).catch(()=>{}));
  }
  return response;
}

export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);
    const onError = error => console.error('BlockBrief API', url.pathname, String(error?.message || 'request failed'));
    const marketOptions = {onError, fetch: (target, init) => {
      // Workers rejects redirect:"error". Manual mode plus the handler's !ok
      // check preserves the same refusal to follow redirects to another host.
      const upstreamRequest = new Request(target, {...init, redirect:'manual'});
      return env.MARKET_FEED ? env.MARKET_FEED.fetch(upstreamRequest) : fetch(upstreamRequest);
    }};
    let response;
    try {
      if (url.hostname === 'www.blockbriefnews.com' || url.protocol !== 'https:') {
        if (url.hostname === 'www.blockbriefnews.com') url.hostname = 'blockbriefnews.com';
        url.protocol = 'https:';
        response = Response.redirect(url.href, 308);
      } else if (REDIRECTS[url.pathname]) {
        response = Response.redirect(new URL(REDIRECTS[url.pathname] + url.search, url.origin), 308);
      } else if (/^\/api\/news\/?$/.test(url.pathname) && ['GET', 'HEAD'].includes(request.method)) {
        response = await loadNews(url.origin, ctx);
      } else if (/^\/api\/news\/?$/.test(url.pathname)) {
        response = await invoke(newsHandler, request);
      } else if (url.pathname === '/feed.xml' || /^\/api\/feed\/?$/.test(url.pathname)) {
        response = await invoke(feedHandler, request, {onError, loadNews: () => loadNews(url.origin, ctx)});
      } else if (/^\/api\/crypto-ticker\/?$/.test(url.pathname)) {
        response = await loadTicker(request, ctx, marketOptions);
      } else if (/^\/api\/fried\/?$/.test(url.pathname)) {
        response = await invoke(friedHandler, request, marketOptions);
      } else if (url.pathname.startsWith('/api/')) {
        response = new Response('Not found', {status: 404, headers: {'Cache-Control': 'no-store'}});
      } else {
        response = await env.ASSETS.fetch(request);
      }
    } catch {
      response = new Response('Temporarily unavailable', {status: 503, headers: {'Cache-Control': 'no-store'}});
    }
    return finish(response, request);
  }
};
