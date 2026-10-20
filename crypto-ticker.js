(() => {
  'use strict';

  const INTERVAL = { coinmarketcap: 300_000, dexscreener: 10_000 };
  const MAX_AGE = { coinmarketcap: 1_800_000, dexscreener: 120_000 };
  // Remote data never controls token identity, HTML, or link destinations.
  const COINS = [
    { key: 'cmc:1', symbol: 'BTC', name: 'Bitcoin', source: 'coinmarketcap', url: 'https://coinmarketcap.com/currencies/bitcoin/' },
    { key: 'cmc:1027', symbol: 'ETH', name: 'Ethereum', source: 'coinmarketcap', url: 'https://coinmarketcap.com/currencies/ethereum/' },
    { key: 'cmc:5426', symbol: 'SOL', name: 'Solana', source: 'coinmarketcap', url: 'https://coinmarketcap.com/currencies/solana/' },
    { key: 'cmc:1839', symbol: 'BNB', name: 'BNB', source: 'coinmarketcap', url: 'https://coinmarketcap.com/currencies/bnb/' },
    { key: 'cmc:52', symbol: 'XRP', name: 'XRP', source: 'coinmarketcap', url: 'https://coinmarketcap.com/currencies/xrp/' },
    { key: 'cmc:74', symbol: 'DOGE', name: 'Dogecoin', source: 'coinmarketcap', url: 'https://coinmarketcap.com/currencies/dogecoin/' },
    { key: 'dex:solana:rMVmRp5DJch9sVxJTgchcDbgkK3phgmEd9a8Yk3PLEX', symbol: 'SDEX', name: 'SolanaDEX', source: 'dexscreener', url: 'https://dexscreener.com/solana/rMVmRp5DJch9sVxJTgchcDbgkK3phgmEd9a8Yk3PLEX' },
    { key: 'dex:solana:3LaXmnVQxMMArywUBJjGA5EKbUdJ17PFor3M5oeupump', symbol: 'FRIED', name: 'FRIED', source: 'dexscreener', url: 'https://dexscreener.com/solana/3LaXmnVQxMMArywUBJjGA5EKbUdJ17PFor3M5oeupump' },
  ];

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
    return new Intl.NumberFormat('en-US', {
      style: 'currency', currency: 'USD', minimumFractionDigits: price >= 1 ? 2 : 0,
      maximumFractionDigits: price >= 1 ? 2 : Math.min(12, Math.max(4, 3 - Math.floor(Math.log10(price)))),
    }).format(price);
  }
  function normalizeFeed(value, source) {
    if (!value || value.source !== source || !Array.isArray(value.quotes)) throw new Error('Price feed unavailable');
    const now = Date.now();
    const quotes = COINS.filter(coin => coin.source === source).map(coin => {
      const row = value.quotes.find(row => row && row.key === coin.key && row.source === source);
      if (!row) return emptyQuote(coin);
      const price = finite(row.price) && row.price > 0 ? row.price : null;
      const updatedAt = Number.isSafeInteger(row.updatedAt) && row.updatedAt > 0 && row.updatedAt <= now + 60_000 ? row.updatedAt : null;
      return { ...coin, price, change24h: price !== null && finite(row.change24h) ? row.change24h : null, updatedAt };
    });
    return {
      status: ['ok', 'stale', 'unavailable', 'unconfigured'].includes(value.status) ? value.status : 'unavailable',
      quotes,
    };
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
    const states = Object.fromEntries(Object.keys(INTERVAL).map(source => [source, { source, feed: null, nextAt: 0, running: false, controller: null, timer: undefined }]));
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
          link.append(element('span', 'bbn-ticker-symbol', coin.symbol));
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
      const now = Date.now();
      for (const widget of widgets) {
        for (const cell of widget.cells) {
          const feed = states[cell.coin.source].feed;
          const quote = feed?.quotes.find(quote => quote.key === cell.coin.key) ?? emptyQuote(cell.coin);
          const status = quoteStatus(quote, now);
          const price = status === 'unavailable' ? null : quote.price;
          const change = status === 'unavailable' ? null : quote.change24h;
          setText(cell.price, formatPrice(price));
          setText(cell.percent, change === null ? '24h —' : `${change > 0 ? '+' : ''}${change.toFixed(2)}%`);
          setText(cell.note, status === 'stale' && price !== null ? ' · stale' : change !== null ? ' 24h' : '');
          cell.change.className = `bbn-ticker-change${change === null || status !== 'ok' ? '' : change >= 0 ? ' bbn-ticker-gain' : ' bbn-ticker-loss'}`;
          cell.link.title = `${cell.coin.name}${quote.updatedAt ? ` · Updated ${new Date(quote.updatedAt).toISOString()}` : ''}`;
        }
      }
    }
    function schedule(state) {
      clearTimeout(state.timer);
      if (active && !document.hidden) state.timer = setTimeout(() => refresh(state), Math.max(0, state.nextAt - Date.now()));
    }
    async function refresh(state) {
      clearTimeout(state.timer);
      if (!active || document.hidden || state.running) return;
      if (Date.now() < state.nextAt) { schedule(state); return; }
      state.running = true;
      state.nextAt = Date.now() + INTERVAL[state.source];
      const controller = new AbortController();
      state.controller = controller;
      // Allow the shared DEX cache to finish slower provider responses.
      const timeout = setTimeout(() => controller.abort(), state.source === 'dexscreener' ? 32_000 : 18_000);
      try {
        const response = await fetch(`/api/crypto-ticker?source=${state.source}`, { signal: controller.signal, cache: 'no-store', credentials: 'same-origin' });
        if (!response.ok) throw new Error('Price feed unavailable');
        const feed = normalizeFeed(await response.json(), state.source);
        if (active && !controller.signal.aborted) {
          state.feed = feed;
          if (feed.status === 'unavailable') state.nextAt = Date.now() + 10_000;
          render();
        }
      } catch {
        if (active) {
          state.feed = state.feed ? { ...state.feed, status: 'stale' } : { status: 'unavailable', quotes: COINS.filter(coin => coin.source === state.source).map(emptyQuote) };
          // A cache fill may have outlived a disconnected caller. Read the shared
          // cache again soon without changing either provider's refresh limit.
          state.nextAt = Math.min(state.nextAt, Date.now() + 10_000);
          render();
        }
      } finally {
        clearTimeout(timeout);
        state.controller = null;
        state.running = false;
        schedule(state);
      }
    }
    function renderAges() {
      clearTimeout(ageTimer);
      if (!active || document.hidden) return;
      render();
      ageTimer = setTimeout(renderAges, 1_000);
    }
    function resume() {
      if (!active || document.hidden) return;
      renderAges();
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
