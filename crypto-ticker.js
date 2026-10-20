(() => {
  'use strict';

  const INTERVAL = { coinmarketcap: 300_000, jupiter: 5_000 };
  const MAX_AGE = { coinmarketcap: 1_800_000, jupiter: 120_000 };
  // Remote data never controls token identity, HTML, or link destinations.
  const COINS = [
    { key: 'cmc:1', symbol: 'BTC', name: 'Bitcoin', source: 'coinmarketcap', url: 'https://coinmarketcap.com/currencies/bitcoin/', iconSrc: '/assets/coins/ticker/bitcoin.png' },
    { key: 'cmc:1027', symbol: 'ETH', name: 'Ethereum', source: 'coinmarketcap', url: 'https://coinmarketcap.com/currencies/ethereum/', iconSrc: '/assets/coins/ticker/ethereum.png' },
    { key: 'jup:So11111111111111111111111111111111111111112', symbol: 'SOL', name: 'Solana', source: 'jupiter', url: 'https://jup.ag/tokens/So11111111111111111111111111111111111111112', iconSrc: '/assets/coins/ticker/solana.png' },
    { key: 'cmc:1839', symbol: 'BNB', name: 'BNB', source: 'coinmarketcap', url: 'https://coinmarketcap.com/currencies/bnb/', iconSrc: '/assets/coins/ticker/bnb.png' },
    { key: 'cmc:52', symbol: 'XRP', name: 'XRP', source: 'coinmarketcap', url: 'https://coinmarketcap.com/currencies/xrp/', iconSrc: '/assets/coins/ticker/xrp.png' },
    { key: 'cmc:74', symbol: 'DOGE', name: 'Dogecoin', source: 'coinmarketcap', url: 'https://coinmarketcap.com/currencies/dogecoin/', iconSrc: '/assets/coins/ticker/dogecoin.png' },
    { key: 'jup:rMVmRp5DJch9sVxJTgchcDbgkK3phgmEd9a8Yk3PLEX', symbol: 'SDEX', name: 'SolanaDEX', source: 'jupiter', url: 'https://jup.ag/tokens/rMVmRp5DJch9sVxJTgchcDbgkK3phgmEd9a8Yk3PLEX', iconSrc: '/assets/coins/ticker/sdex.png' },
    { key: 'jup:3LaXmnVQxMMArywUBJjGA5EKbUdJ17PFor3M5oeupump', symbol: 'FRIED', name: 'FRIED', source: 'jupiter', url: 'https://jup.ag/tokens/3LaXmnVQxMMArywUBJjGA5EKbUdJ17PFor3M5oeupump', iconSrc: '/assets/coins/ticker/fried.webp' },
  ];

  const CACHE_PREFIX = 'bbncrypto-tickerv1:';
  const CACHE_MAX_CHARS = 8192; // At most 16 KiB of UTF-16 session data per source.
  const MAX_RETRY_MS = 32 * 24 * 60 * 60 * 1000;
  const formatters = new Map();
  const finite = value => typeof value === 'number' && Number.isFinite(value);
  const emptyQuote = coin => ({ ...coin, price: null, change24h: null, updatedAt: null });
  function quoteStatus(quote, now) {
    if (!finite(quote.price) || quote.price <= 0 || !finite(quote.updatedAt)) return 'unavailable';
    const age = now - quote.updatedAt;
    if (age < -60_000 || age > MAX_AGE[quote.source]) return 'unavailable';
    return age >= INTERVAL[quote.source] ? 'stale' : 'ok';
  }
  function formatPrice(price) {
    if (!finite(price) || price <= 0) return '—';
    if (price < 1e-10) return `$${price.toExponential(3)}`;
    const digits = price >= 1 ? 2 : Math.min(12, Math.max(4, 3 - Math.floor(Math.log10(price))));
    const key = `${price >= 1 ? 2 : 0}:${digits}`;
    let formatter = formatters.get(key);
    if (!formatter) {
      formatter = new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: price >= 1 ? 2 : 0, maximumFractionDigits: digits });
      formatters.set(key, formatter);
    }
    return formatter.format(price);
  }
  function normalizeFeed(value, source) {
    if (!value || value.source !== source || !Array.isArray(value.quotes) || value.quotes.length > 30) throw new Error('Price feed unavailable');
    const now = Date.now();
    const quotes = COINS.filter(coin => coin.source === source).map(coin => {
      const row = value.quotes.find(row => row && row.key === coin.key && row.source === source);
      if (!row) return emptyQuote(coin);
      const price = finite(row.price) && row.price > 0 ? row.price : null;
      const updatedAt = Number.isSafeInteger(row.updatedAt) && row.updatedAt > 0 && row.updatedAt <= now + 60_000 ? row.updatedAt : null;
      return { ...coin, price, change24h: price !== null && finite(row.change24h) ? row.change24h : null, updatedAt };
    });
    return {
      source,
      status: ['ok', 'stale', 'unavailable', 'unconfigured'].includes(value.status) ? value.status : 'unavailable',
      fetchedAt: Number.isSafeInteger(value.fetchedAt) && value.fetchedAt > 0 && value.fetchedAt <= now ? value.fetchedAt : null,
      quotes,
    };
  }
  function readCachedFeed(source) {
    try {
      const raw = sessionStorage.getItem(CACHE_PREFIX + source);
      if (!raw || raw.length > CACHE_MAX_CHARS) return null;
      const cached = JSON.parse(raw), now = Date.now();
      if (cached.version !== 1 || !Number.isSafeInteger(cached.cachedAt) || cached.cachedAt <= 0 || cached.cachedAt > now || now - cached.cachedAt > MAX_AGE[source]) return null;
      const feed = normalizeFeed(cached.feed, source);
      if (!['ok', 'stale'].includes(feed.status) || feed.fetchedAt === null || feed.fetchedAt > cached.cachedAt || feed.quotes.some(quote => quote.updatedAt > cached.cachedAt) || !feed.quotes.some(quote => quoteStatus(quote, now) !== 'unavailable')) return null;
      // Stored nextAt never controls a delay. Derive it from verified timestamps.
      return { feed, nextAt: Math.min(cached.cachedAt + INTERVAL[source], feed.fetchedAt + INTERVAL[source]) };
    } catch { return null; }
  }
  function cacheFeed(state) {
    const now = Date.now(), feed = state.feed;
    if (!feed || !['ok', 'stale'].includes(feed.status) || feed.fetchedAt === null || !feed.quotes.some(quote => quoteStatus(quote, now) !== 'unavailable')) return;
    try {
      const value = JSON.stringify({ version: 1, cachedAt: now, nextAt: Math.min(state.nextAt, now + INTERVAL[state.source]), feed });
      if (value.length <= CACHE_MAX_CHARS) sessionStorage.setItem(CACHE_PREFIX + state.source, value);
    } catch { /* Prices still work when session storage is unavailable. */ }
  }
  function retryDelay(response) {
    if (response.status !== 429 && response.status !== 503) return 0;
    const header = response.headers?.get('retry-after');
    if (!header) return 0;
    const delay = /^\d+$/.test(header.trim()) ? Number(header) * 1000 : Date.parse(header) - Date.now();
    return finite(delay) ? Math.min(MAX_RETRY_MS, Math.max(0, delay)) : 0;
  }
  function element(tag, className, text) {
    const node = document.createElement(tag);
    if (className) node.className = className;
    if (text !== undefined) node.textContent = text;
    return node;
  }
  function externalLink(url, className, text) {
    const link = element('a', className, text);
    link.href = url;
    link.target = '_blank';
    link.rel = 'noopener noreferrer';
    return link;
  }
  function setText(node, text) { if (node.textContent !== text) node.textContent = text; }

  function start() {
    const roots = [...document.querySelectorAll('[data-crypto-ticker]')].filter(root => root.dataset.cryptoTickerReady !== 'true');
    if (!roots.length) return;
    let active = true;
    let ageTimer;
    const states = Object.fromEntries(Object.keys(INTERVAL).map(source => {
      const cached = readCachedFeed(source);
      return [source, { source, feed: cached?.feed ?? null, nextAt: cached?.nextAt ?? 0, running: false, controller: null, timer: undefined }];
    }));
    const displays = new Map();
    const widgets = roots.map(root => {
      root.dataset.cryptoTickerReady = 'true';
      root.setAttribute('aria-label', 'Cryptocurrency price ticker');
      root.setAttribute('translate', 'no');
      root.lang = 'en';
      const viewport = element('div', 'bbn-ticker-viewport');
      viewport.tabIndex = 0;
      viewport.setAttribute('aria-label', 'Scroll to browse cryptocurrency prices');
      const track = element('div', 'bbn-ticker-track');
      const cells = [];
      for (const duplicate of [false, true]) {
        const group = element('ul', 'bbn-ticker-group');
        if (duplicate) group.setAttribute('aria-hidden', 'true');
        for (const coin of COINS) {
          const item = element('li', 'bbn-ticker-item');
          const link = externalLink(coin.url, 'bbn-ticker-link');
          if (duplicate) link.tabIndex = -1;
          const identity = element('span', 'bbn-ticker-identity');
          const icon = element('img', 'bbn-ticker-icon');
          icon.src = coin.iconSrc;
          icon.alt = '';
          icon.width = 36;
          icon.height = 36;
          icon.decoding = 'async';
          const label = element('span', 'bbn-ticker-label');
          label.append(element('span', 'bbn-ticker-symbol', coin.symbol), element('span', 'bbn-ticker-name', coin.name));
          identity.append(icon, label);
          link.append(identity);
          const values = element('span', 'bbn-ticker-quote');
          const price = element('strong', '', '—');
          const change = element('span', 'bbn-ticker-change');
          const percent = element('span', '', '24h —');
          const note = element('small', '');
          change.append(percent, note);
          values.append(price, change);
          link.append(values);
          item.append(link);
          group.append(item);
          cells.push({ coin, link, price, change, percent, note });
        }
        track.append(group);
      }
      viewport.append(track);
      root.replaceChildren(viewport);
      return { cells };
    });

    function render() {
      clearTimeout(ageTimer);
      const now = Date.now();
      let nextEdge = Infinity;
      for (const coin of COINS) {
        const quote = states[coin.source].feed?.quotes.find(quote => quote.key === coin.key) ?? emptyQuote(coin);
        const status = quoteStatus(quote, now);
        const key = [quote.price, quote.change24h, quote.updatedAt, status].join('|');
        if (displays.get(coin.key)?.key !== key) {
          const price = status === 'unavailable' ? null : quote.price;
          const change = status === 'unavailable' ? null : quote.change24h;
          displays.set(coin.key, {
            key, price: formatPrice(price), percent: change === null ? '24h —' : `${change > 0 ? '+' : ''}${change.toFixed(2)}%`,
            note: status === 'stale' && price !== null ? ' · stale' : change !== null ? ' 24h' : '',
            className: `bbn-ticker-change${change === null || status !== 'ok' ? '' : change >= 0 ? ' bbn-ticker-gain' : ' bbn-ticker-loss'}`,
            title: `${coin.name}${quote.updatedAt ? ` · Updated ${new Date(quote.updatedAt).toISOString()}` : ''}`,
          });
        }
        if (status !== 'unavailable') {
          for (const edge of [quote.updatedAt + INTERVAL[coin.source], quote.updatedAt + MAX_AGE[coin.source] + 1]) if (edge > now) nextEdge = Math.min(nextEdge, edge);
        }
      }
      for (const widget of widgets) {
        for (const cell of widget.cells) {
          const display = displays.get(cell.coin.key);
          if (cell.renderKey === display.key) continue;
          cell.renderKey = display.key;
          setText(cell.price, display.price);
          setText(cell.percent, display.percent);
          setText(cell.note, display.note);
          cell.change.className = display.className;
          cell.link.title = display.title;
        }
      }
      // Wake only when a visible quote crosses its stale or expiry boundary.
      if (active && !document.hidden && nextEdge !== Infinity) ageTimer = setTimeout(render, Math.max(1, nextEdge - now));
    }
    function schedule(state) {
      clearTimeout(state.timer);
      if (active && !document.hidden) state.timer = setTimeout(() => refresh(state), Math.min(2_147_483_647, Math.max(0, state.nextAt - Date.now())));
    }
    async function refresh(state) {
      clearTimeout(state.timer);
      if (!active || document.hidden || state.running) return;
      if (Date.now() < state.nextAt) { schedule(state); return; }
      state.running = true;
      state.nextAt = Date.now() + INTERVAL[state.source];
      const controller = new AbortController();
      state.controller = controller;
      // Shared server caching batches Solana prices across both websites.
      const timeout = setTimeout(() => controller.abort(), state.source === 'jupiter' ? 14_000 : 18_000);
      let retryAfterMs = 0;
      try {
        const response = await fetch(`/api/crypto-ticker?source=${state.source}`, { signal: controller.signal, cache: 'no-store', credentials: 'same-origin' });
        if (!response.ok) { retryAfterMs = retryDelay(response); throw new Error('Price feed unavailable'); }
        const feed = normalizeFeed(await response.json(), state.source);
        if (active && !controller.signal.aborted) {
          state.feed = feed;
          if (feed.status === 'unavailable') state.nextAt = Date.now() + Math.min(INTERVAL[state.source], 10_000);
          cacheFeed(state);
          render();
        }
      } catch {
        if (active) {
          state.feed = state.feed ? { ...state.feed, status: 'stale' } : { status: 'unavailable', quotes: COINS.filter(coin => coin.source === state.source).map(emptyQuote) };
          // A cache fill may have outlived a disconnected caller. Read the shared
          // cache again soon without changing either provider's refresh limit.
          state.nextAt = Date.now() + Math.max(Math.min(INTERVAL[state.source], 10_000), retryAfterMs);
          render();
        }
      } finally {
        clearTimeout(timeout);
        state.controller = null;
        state.running = false;
        schedule(state);
      }
    }
    function resume() {
      if (!active || document.hidden) return;
      render();
      for (const state of Object.values(states)) void refresh(state);
    }
    document.addEventListener('visibilitychange', () => {
      if (document.hidden) {
        clearTimeout(ageTimer);
        for (const state of Object.values(states)) clearTimeout(state.timer);
      } else resume();
    });
    window.addEventListener('pagehide', () => {
      active = false;
      clearTimeout(ageTimer);
      for (const state of Object.values(states)) {
        clearTimeout(state.timer);
        state.controller?.abort();
        if (!state.feed) state.nextAt = 0;
      }
    });
    window.addEventListener('pageshow', event => {
      if (event.persisted) { active = true; resume(); }
    });
    render();
    resume();
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start, { once: true });
  else start();
})();
