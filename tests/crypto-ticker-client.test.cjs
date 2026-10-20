const assert = require('node:assert/strict');
const { readFileSync } = require('node:fs');
const { runInNewContext } = require('node:vm');
const test = require('node:test');

const script = readFileSync(new URL('../crypto-ticker.js', `file://${__filename}`), 'utf8');
const START = Date.parse('2026-10-20T04:00:00Z');
const SOL = 'jup:So11111111111111111111111111111111111111112';
const SDEX = 'jup:rMVmRp5DJch9sVxJTgchcDbgkK3phgmEd9a8Yk3PLEX';
const FRIED = 'jup:3LaXmnVQxMMArywUBJjGA5EKbUdJ17PFor3M5oeupump';

class Node {
  constructor(tag) { this.tagName = tag.toUpperCase(); this.children = []; this.attributes = {}; this.dataset = {}; this.events = {}; this.className = ''; this.text = ''; }
  set textContent(text) { this.text = String(text); this.children = []; }
  get textContent() { return this.text + this.children.map(node => node.textContent).join(''); }
  set innerHTML(_) { throw new Error('The ticker must not render HTML from responses'); }
  append(...nodes) { this.children.push(...nodes); }
  replaceChildren(...nodes) { this.text = ''; this.children = nodes; }
  setAttribute(name, value) { this.attributes[name] = String(value); }
  getAttribute(name) { return this.attributes[name] ?? null; }
  addEventListener(name, action) { (this.events[name] ??= []).push(action); }
  dispatch(name, event = {}) { for (const action of this.events[name] ?? []) action(event); }
}
function all(node, predicate) {
  return [...(predicate(node) ? [node] : []), ...node.children.flatMap(child => all(child, predicate))];
}
const byClass = (root, name) => all(root, node => node.className.split(' ').includes(name));
const row = (key, source, extra = {}) => ({ key, source, symbol: 'untrusted', name: '<img src=x onerror=alert(1)>', url: 'javascript:alert(1)', price: 12_345.678, change24h: 2.5, updatedAt: START, ...extra });
const defaultFeed = (source, now = START) => ({
  source, status: 'ok', fetchedAt: now, quotes: source === 'coinmarketcap'
    ? [row('cmc:3717', source, { symbol: 'BTC', price: 999_999 }), row('cmc:1027', source), row('cmc:1', source)]
    : [row(SOL, source), row(SDEX, source), row(FRIED, source, { price: .0000345 })],
});

async function harness(feed = defaultFeed, rootCount = 1, options = {}) {
  let now = options.now ?? START, nextTimer = 0;
  const storage = options.storage ?? new Map();
  const formatting = { constructors: 0, calls: 0 };
  const sessionStorage = {
    getItem(key) { if (options.blockStorage) throw Error('Storage denied'); return storage.get(key) ?? null; },
    setItem(key, value) { if (options.blockStorage) throw Error('Storage denied'); storage.set(key, value); },
  };
  const instrumentedIntl = { NumberFormat: function(...args) {
    formatting.constructors++;
    const formatter = new Intl.NumberFormat(...args);
    return { format(value) { formatting.calls++; return formatter.format(value); } };
  } };
  const timers = new Map(), calls = [], roots = Array.from({ length: rootCount }, () => new Node('section'));
  const document = new Node('document');
  document.readyState = 'complete'; document.hidden = false;
  document.querySelectorAll = selector => { assert.equal(selector, '[data-crypto-ticker]'); return roots; };
  document.createElement = tag => new Node(tag);
  document.createTextNode = text => { const node = new Node('#text'); node.textContent = text; return node; };
  const window = new Node('window');
  class ClockDate extends Date { constructor(...args) { super(...(args.length ? args : [now])); } static now() { return now; } }
  const context = {
    document, window, Date: ClockDate, Intl: instrumentedIntl, AbortController, sessionStorage,
    setTimeout(action, delay) { assert.ok(delay <= 2_147_483_647, 'long backoffs must be scheduled in safe timer chunks'); const id = ++nextTimer; timers.set(id, { action, at: now + delay }); return id; },
    clearTimeout(id) { timers.delete(id); },
    async fetch(url, options) {
      const source = new URL(url, 'https://blockbriefnews.com').searchParams.get('source');
      assert.equal(new URL(url, 'https://blockbriefnews.com').pathname, '/api/crypto-ticker');
      assert.equal(options.cache, 'no-store');
      calls.push({ source, time: now });
      const value = await feed(source, now, options);
      return value && typeof value.ok === 'boolean' ? value : { ok: true, status: 200, headers: { get() { return null; } }, async json() { return value; } };
    },
  };
  async function flush() { for (let index = 0; index < 12; index++) await Promise.resolve(); }
  runInNewContext(script, context);
  await flush();
  return {
    root: roots[0], roots, calls, document, window, storage, formatting,
    runAgain() { runInNewContext(script, context); },
    async advance(ms) {
      const target = now + ms;
      while (true) {
        const due = [...timers].filter(([, timer]) => timer.at <= target).sort((a, b) => a[1].at - b[1].at)[0];
        if (!due) break;
        timers.delete(due[0]); now = due[1].at; due[1].action(); await flush();
      }
      now = target; await flush();
    },
    async setHidden(hidden) { document.hidden = hidden; document.dispatch('visibilitychange'); await flush(); },
  };
}

test('mounts once per section, shares page requests and uses only exact configured identities and safe links', async () => {
  const page = await harness(defaultFeed, 2);
  assert.equal(page.calls.length, 2, 'multiple sections share one initial request per provider');
  const cells = byClass(page.root, 'bbn-ticker-item');
  assert.equal(cells.length, 16, 'the second copy supports continuous scrolling');
  assert.deepEqual(cells.slice(0, 8).map(cell => byClass(cell, 'bbn-ticker-symbol')[0].textContent), ['BTC', 'ETH', 'SOL', 'BNB', 'XRP', 'DOGE', 'SDEX', 'FRIED']);
  assert.equal(byClass(cells[0], 'bbn-ticker-quote')[0].children[0].textContent, '$12,345.68');
  assert.equal(byClass(cells[2], 'bbn-ticker-quote')[0].children[0].textContent, '$12,345.68', 'native SOL uses its configured Jupiter mint');
  assert.equal(byClass(cells[3], 'bbn-ticker-quote')[0].children[0].textContent, '—', 'missing known-key data never becomes an invented price');
  assert.equal(byClass(cells[7], 'bbn-ticker-quote')[0].children[0].textContent, '$0.0000345');
  assert.doesNotMatch(page.root.textContent, /untrusted|onerror|999,999/);
  const links = all(page.root, node => node.tagName === 'A');
  assert.ok(links.every(link => /^https:\/\/(?:coinmarketcap\.com|jup\.ag)\//.test(link.href)));
  assert.equal(byClass(page.root, 'bbn-ticker-group')[1].getAttribute('aria-hidden'), 'true');
  assert.ok(cells.slice(8).every(cell => cell.children[0].tabIndex === -1));
  page.runAgain();
  assert.equal(page.calls.length, 2, 'loading the asset again does not duplicate polling');
});

test('labels old provider quotes stale and blanks them on expiry without another CMC request', async () => {
  const page = await harness(source => ({ source, status: 'ok', quotes: source === 'coinmarketcap' ? [row('cmc:1', source, { updatedAt: START - 1_795_000 })] : [] }));
  const btc = byClass(page.root, 'bbn-ticker-item')[0];
  assert.match(btc.textContent, /stale/);
  assert.doesNotMatch(byClass(btc, 'bbn-ticker-change')[0].className, /gain|loss/);
  await page.advance(6_000);
  assert.equal(byClass(btc, 'bbn-ticker-quote')[0].children[0].textContent, '—');
  assert.doesNotMatch(btc.textContent, /2\.50%/);
  assert.equal(page.calls.filter(call => call.source === 'coinmarketcap').length, 1);
});

test('polling stops while hidden and resumes due feeds with independent provider intervals', async () => {
  const page = await harness();
  await page.advance(4_999);
  assert.equal(page.calls.filter(call => call.source === 'jupiter').length, 1);
  await page.advance(1);
  assert.equal(page.calls.filter(call => call.source === 'coinmarketcap').length, 1);
  assert.equal(page.calls.filter(call => call.source === 'jupiter').length, 2);
  await page.setHidden(true);
  await page.advance(300_000);
  assert.equal(page.calls.length, 3);
  await page.setHidden(false);
  assert.equal(page.calls.filter(call => call.source === 'coinmarketcap').length, 2);
  assert.equal(page.calls.filter(call => call.source === 'jupiter').length, 3);
});

test('session snapshots restore prices immediately on navigation and read only when due', async () => {
  const first = await harness();
  assert.equal(first.storage.size, 2);
  assert.ok([...first.storage.values()].every(value => value.length * 2 <= 16_384));
  const page = await harness(defaultFeed, 1, { storage: first.storage, now: START + 1_000 });
  assert.equal(page.calls.length, 0, 'fresh snapshots skip both initial reads');
  assert.match(byClass(page.root, 'bbn-ticker-item')[0].textContent, /12,345\.68/);
  await page.advance(3_999);
  assert.equal(page.calls.length, 0);
  await page.advance(1);
  assert.deepEqual(page.calls.map(call => call.source), ['jupiter']);
  assert.equal(byClass(page.root, 'bbn-ticker-item')[0].children[0].title, 'Bitcoin · Updated 2026-10-20T04:00:00.000Z', 'a restored snapshot keeps its original quote timestamp');
});

test('stale cached feeds render immediately and refresh despite a recent cache receipt', async () => {
  const first = await harness();
  for (const oldQuote of [false, true]) {
    const storage = new Map(first.storage);
    const cached = JSON.parse(storage.get('bbncrypto-tickerv1:coinmarketcap'));
    cached.feed.status = oldQuote ? 'ok' : 'stale';
    const updatedAt = oldQuote ? START - 300_001 : START;
    cached.feed.quotes = cached.feed.quotes.map(quote => ({ ...quote, updatedAt, name: 'poisoned identity', url: 'javascript:alert(1)' }));
    storage.set('bbncrypto-tickerv1:coinmarketcap', JSON.stringify(cached));
    // Hold the replacement response so the immediately restored view is observable.
    const page = await harness(source => source === 'coinmarketcap' ? new Promise(() => {}) : defaultFeed(source), 1, { storage, now: START + 1_000 });
    assert.deepEqual(page.calls.map(call => call.source), ['coinmarketcap']);
    const btc = byClass(page.root, 'bbn-ticker-item')[0];
    assert.match(btc.textContent, /12,345\.68/);
    assert.equal(btc.children[0].title, `Bitcoin · Updated ${new Date(updatedAt).toISOString()}`);
    assert.equal(btc.children[0].href, 'https://coinmarketcap.com/currencies/bitcoin/');
    assert.doesNotMatch(page.root.textContent, /poisoned identity/);
    if (oldQuote) assert.match(btc.textContent, /stale/);
  }
});

test('expired, future, invalid and oversized session data never postpone fetching', async () => {
  const first = await harness();
  for (const mutate of [
    cached => ({ ...cached, cachedAt: START + 1 }),
    cached => ({ ...cached, feed: { ...cached.feed, fetchedAt: START + 1 } }),
    cached => ({ ...cached, feed: { ...cached.feed, quotes: cached.feed.quotes.map(quote => ({ ...quote, updatedAt: START + 1 })) } }),
    () => ({ version: 2 }),
    () => 'x'.repeat(8193),
  ]) {
    const storage = new Map([...first.storage].map(([key, raw]) => {
      const value = mutate(JSON.parse(raw));
      return [key, typeof value === 'string' ? value : JSON.stringify(value)];
    }));
    const page = await harness(defaultFeed, 1, { storage });
    assert.equal(page.calls.length, 2);
  }
  const expired = await harness(defaultFeed, 1, { storage: first.storage, now: START + 1_800_001 });
  assert.equal(expired.calls.length, 2);
});

test('poisoned session identities and delays are normalized instead of trusted', async () => {
  const first = await harness();
  const storage = new Map([...first.storage].map(([key, raw]) => {
    const cached = JSON.parse(raw);
    cached.nextAt = START + 32 * 86_400_000;
    cached.feed.quotes = cached.feed.quotes.map(quote => ({ ...quote, name: 'poisoned', url: 'javascript:alert(1)', symbol: 'WBTC' }));
    return [key, JSON.stringify(cached)];
  }));
  const page = await harness(defaultFeed, 1, { storage, now: START + 4_999 });
  assert.equal(page.calls.length, 0);
  assert.doesNotMatch(page.root.textContent, /poisoned|WBTC/);
  assert.ok(all(page.root, node => node.tagName === 'A').every(link => link.href.startsWith('https://')));
  await page.advance(1);
  assert.deepEqual(page.calls.map(call => call.source), ['jupiter'], 'untrusted nextAt cannot extend the five-second cadence');
});

test('blocked session storage leaves live polling operational and failures are not cached', async () => {
  const page = await harness(defaultFeed, 1, { blockStorage: true });
  assert.equal(page.calls.length, 2);
  assert.match(page.root.textContent, /12,345\.68/);
  await page.advance(5_000);
  assert.equal(page.calls.filter(call => call.source === 'jupiter').length, 2);
  const empty = await harness(source => ({ source, fetchedAt: START, status: 'unavailable', quotes: [] }));
  assert.equal(empty.storage.size, 0);
});

test('429 retry-after pauses only the affected provider and survives visibility changes', async () => {
  const page = await harness(source => source === 'jupiter'
    ? { ok: false, status: 429, headers: { get() { return '30'; } } }
    : defaultFeed(source));
  await page.advance(15_000);
  await page.setHidden(true);
  await page.advance(5_000);
  await page.setHidden(false);
  await page.advance(9_999);
  assert.equal(page.calls.filter(call => call.source === 'jupiter').length, 1);
  await page.advance(1);
  assert.equal(page.calls.filter(call => call.source === 'jupiter').length, 2);
  assert.equal(page.calls.filter(call => call.source === 'coinmarketcap').length, 1);
});

test('HTTP-date and monthly-limit backoffs stay bounded and bfcache resumes only due feeds', async () => {
  for (const header of [new Date(START + 60_000).toUTCString(), '999999999']) {
    const page = await harness(source => source === 'jupiter'
      ? { ok: false, status: 503, headers: { get() { return header; } } }
      : defaultFeed(source));
    await page.advance(59_999);
    assert.equal(page.calls.filter(call => call.source === 'jupiter').length, 1);
  }
  const page = await harness();
  page.window.dispatch('pagehide');
  await page.advance(10_000);
  assert.equal(page.calls.length, 2);
  page.window.dispatch('pageshow', { persisted: true });
  await page.advance(0);
  assert.equal(page.calls.filter(call => call.source === 'jupiter').length, 2);
  assert.equal(page.calls.filter(call => call.source === 'coinmarketcap').length, 1);
});

test('CMC transport errors retry in ten seconds and slow requests never overlap', async () => {
  const page = await harness(source => { if (source === 'coinmarketcap') throw Error('Offline'); return defaultFeed(source); });
  await page.advance(9_999);
  assert.equal(page.calls.filter(call => call.source === 'coinmarketcap').length, 1);
  await page.advance(1);
  assert.equal(page.calls.filter(call => call.source === 'coinmarketcap').length, 2);
  const slow = await harness(source => source === 'jupiter' ? new Promise(() => {}) : defaultFeed(source));
  await slow.advance(10_000);
  assert.equal(slow.calls.filter(call => call.source === 'jupiter').length, 1);
});

test('display formatting is shared by duplicate copies and idle time adds no formatting work', async () => {
  const page = await harness(defaultFeed, 2);
  assert.equal(page.formatting.calls, 5, 'five available coin quotes format once across all copies');
  assert.equal(page.formatting.constructors, 2, 'the price precision formats are reused');
  await page.advance(4_999);
  assert.equal(page.formatting.calls, 5, 'no per-second reformatting while quotes stay unchanged');
});
