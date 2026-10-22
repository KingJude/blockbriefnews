# blockbriefnews
BlockBrief — Crypto News Without the Noise


## Content Security Policy

Production allows JavaScript served by this site and explicitly hashed inline scripts. Inline HTML event handlers, unapproved inline scripts and dynamic evaluation are blocked. Existing CSS, data providers and world-clock embedding retain their current behavior.

After changing an inline script or JSON-LD block in an HTML page, regenerate the policy:

```sh
node scripts/update-csp.cjs
node scripts/update-csp.cjs --check
node --test tests/*.test.cjs
```

Commit the updated `vercel.json` with the HTML changes. Verify the Vercel preview's homepage, topic pages, story links, quotes, language selector and world clock before merging. The check detects stale hashes; it is a manual pre-publish check, not a configured CI gate.

Temporary preview probes use names beginning with `_` and are deliberately excluded from the inline-script allowlist. Remove them before publishing production. Do not add `unsafe-inline` or `unsafe-eval` to bypass a failed check.

## News feed discovery

`/feed.xml` provides RSS 2.0 with publication dates, source attribution and links to the original publishers. Topic feeds use `?topic=bitcoin`, `ethereum`, `solana`, `markets` or `regulation`; matching pages advertise the appropriate feed in HTML metadata. Feed responses share the existing production news API, use five-minute CDN caching, and return uncached errors when news is unavailable.

The RSS feed is for discovery and subscriptions. It is not a replacement for the site's XML sitemap: its article links belong to original publishers. Continue submitting `/sitemap.xml` for BlockBrief's canonical landing pages. Transient story briefs remain noindex; permanent article archives and Search Console verification require separate work.

## Scrolling crypto ticker

The homepage, topic pages and story view load the shared scrolling ticker below navigation. `/api/crypto-ticker?source=coinmarketcap` serves native BTC, ETH, BNB, XRP and DOGE; `source=jupiter` serves the configured SOL, SDEX and FRIED Solana mints. The proxy reads SolanaDEX's shared feed without forwarding visitor headers or storing another provider key. The provider caches and credit budgets remain shared between both sites.

The browser checks majors every five minutes and Solana-token prices every five seconds while the page is visible. Provider timestamps still determine freshness: delayed-but-not-expired quotes keep their original timestamps and neutral styling while displaying the `24h` label, and expired quotes are hidden. Scrolling pauses on hover or keyboard focus; keyboard browsing and reduced motion are supported. Existing homepage market cards keep their current sources.
