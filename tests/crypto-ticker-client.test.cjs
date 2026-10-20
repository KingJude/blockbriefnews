const assert = require('node:assert/strict');
const { readFileSync } = require('node:fs');
const { runInNewContext } = require('node:vm');
const test = require('node:test');

const script = readFileSync(new URL('../crypto-ticker.js', `file://${__filename}`), 'utf8');
const START = Date.parse('2026-10-20T04:00:00Z');
const SDEX = 'dex:solana:rMVmRp5DJch9sVxJTgchcDbgkK3phgmEd9a8Yk3PLEX';
const FRIED = 'dex:solana:3LaXmnVQxMMArywUBJjGA5EKbUdJ17PFor3M5oeupump';

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
const defaultFeed = source => ({
  source, status: 'ok', quotes: source === 'coinmarketcap'
    ? [row('cmc:3717', source, { symbol: 'BTC', price: 999_999 }), row('cmc:1027', source), row('cmc:1', source)]
    : [row(SDEX, source), row(FRIED, source, { price: .0000345 })],
});

async function harness(feed = defaultFeed, rootCount = 1) {
  let now = START, nextTimer = 0;
  const timers = new Map(), calls = [], roots = Array.from({ length: rootCount }, () => new Node('section'));
  const document = new Node('document');
  document.readyState = 'complete'; document.hidden = false;
  document.querySelectorAll = selector => { assert.equal(selector, '[data-crypto-ticker]'); return roots; };
  document.createElement = tag => new Node(tag);
  document.createTextNode = text => { const node = new Node('#text'); node.textContent = text; return node; };
  const window = new Node('window');
  class ClockDate extends Date { constructor(...args) { super(...(args.length ? args : [now])); } static now() { return now; } }
  const context = {
    document, window, Date: ClockDate, Intl, AbortController,
    setTimeout(action, delay) { const id = ++nextTimer; timers.set(id, { action, at: now + delay }); return id; },
    clearTimeout(id) { timers.delete(id); },
    async fetch(url, options) {
      const source = new URL(url, 'https://blockbriefnews.com').searchParams.get('source');
      assert.equal(new URL(url, 'https://blockbriefnews.com').pathname, '/api/crypto-ticker');
      assert.equal(options.cache, 'no-store');
      calls.push({ source, time: now });
      return { ok: true, async json() { return feed(source, now); } };
    },
  };
  async function flush() { for (let index = 0; index < 12; index++) await Promise.resolve(); }
  runInNewContext(script, context);
  await flush();
  return {
    root: roots[0], roots, calls, document,
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
  assert.equal(byClass(cells[2], 'bbn-ticker-quote')[0].children[0].textContent, '—', 'missing known-key data never becomes an invented price');
  assert.equal(byClass(cells[7], 'bbn-ticker-quote')[0].children[0].textContent, '$0.0000345');
  assert.doesNotMatch(page.root.textContent, /untrusted|onerror|999,999/);
  const links = all(page.root, node => node.tagName === 'A');
  assert.ok(links.every(link => /^https:\/\/(?:coinmarketcap\.com|dexscreener\.com)\//.test(link.href)));
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
  await page.advance(10_000);
  assert.equal(page.calls.filter(call => call.source === 'coinmarketcap').length, 1);
  assert.equal(page.calls.filter(call => call.source === 'dexscreener').length, 2);
  await page.setHidden(true);
  await page.advance(300_000);
  assert.equal(page.calls.length, 3);
  await page.setHidden(false);
  assert.equal(page.calls.filter(call => call.source === 'coinmarketcap').length, 2);
  assert.equal(page.calls.filter(call => call.source === 'dexscreener').length, 3);
});
