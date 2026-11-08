# blockbriefnews
BlockBrief — Crypto News Without the Noise

## Cloudflare hosting

Cloudflare Worker: `blockbriefnews-production`. Source remains in this GitHub repository.
The migration keeps all public pages and the existing API handlers. News and RSS
share the Worker's edge cache; cache failures fall back to the providers instead
of interrupting healthy feeds, and RSS does not call back to the Vercel site.
News downloads are bounded to 4 MiB per publisher and retain the eight-second
timeout. Oversized or unavailable sources do not discard other publishers' news. Market
prices continue to use SolanaDEX's shared provider feeds, with the existing
freshness validation and retry behavior. No database or private API key is needed.

Build and validate before publishing:

```sh
npx wrangler deploy
```

The root `wrangler.jsonc` is discoverable by Cloudflare Builds. Its custom build
runs all tests, checks Content Security Policy, and prepares the Worker and assets
for local CLI deployments. Cloudflare Builds is configured with that same command
explicitly, so validation also runs in CI. The build copies only public assets,
derives security headers and redirects from
`vercel.json`, and adapts the dependency-free CommonJS API handlers into an ES
module Worker. Generated files are ignored by Git. The Worker adds an
`X-BlockBrief-Release` response header for deployment verification. Its temporary
workers.dev address is marked noindex. `www` redirects to the canonical apex.

DNS uses the Cloudflare account's assigned nameservers. Keep the existing Vercel
project and its DNS records available for rollback until the new production
domain is verified. Domain registration and renewal remain at Vercel; changing
the host does not transfer domain registration.

Cloudflare Builds is connected to `KingJude/blockbriefnews` and watches `main`.
Its production configuration uses root directory `/`, build command
`node --test tests/*.test.cjs && node scripts/update-csp.cjs --check && node cloudflare/build.cjs`,
and deploy command `npx wrangler deploy`. Changes merged into `main` trigger
validation and publishing automatically. Preview builds are disabled. The build
token is managed in Cloudflare and is not stored in this repository.


## Content Security Policy

Production allows JavaScript served by this site and explicitly hashed inline scripts. Inline HTML event handlers, unapproved inline scripts and dynamic evaluation are blocked. Existing CSS, data providers and world-clock embedding retain their current behavior.

After changing an inline script or JSON-LD block in an HTML page, regenerate the policy:

```sh
node scripts/update-csp.cjs
node scripts/update-csp.cjs --check
node --test tests/*.test.cjs
```

Commit the updated `vercel.json` with the HTML changes. Verify the homepage, topic pages, story links, quotes, language selector and world clock before merging. Cloudflare's production build runs the CSP check and tests before publishing; a failed check stops the deployment.

Temporary preview probes use names beginning with `_` and are deliberately excluded from the inline-script allowlist. Remove them before publishing production. Do not add `unsafe-inline` or `unsafe-eval` to bypass a failed check.

## News feed discovery

Eight sources are configured: CoinDesk, Decrypt, Cointelegraph, CNBC,
Bitcoin Magazine, U.Today, Coin Bureau and the SEC. Bitcoin Magazine replaced
CoinGape after both of CoinGape's official RSS endpoints rejected Cloudflare
requests with HTTP 403. Original publication dates, publisher names and article
links are retained; unavailable sources are reported in the news API's `errors`.

`/feed.xml` provides RSS 2.0 with publication dates, source attribution and links to the original publishers. Topic feeds use `?topic=bitcoin`, `ethereum`, `solana`, `markets` or `regulation`; matching pages advertise the appropriate feed in HTML metadata. Feed responses share the existing production news API, use five-minute CDN caching, and return uncached errors when news is unavailable.

The RSS feed is for discovery and subscriptions. It is not a replacement for the site's XML sitemap: its article links belong to original publishers. Continue submitting `/sitemap.xml` for BlockBrief's canonical landing pages. Transient story briefs remain noindex; permanent article archives and Search Console verification require separate work.

## Scrolling crypto ticker

The homepage, topic pages and story view load the shared scrolling ticker below navigation. `/api/crypto-ticker?source=coinmarketcap` serves native BTC, ETH, BNB, XRP and DOGE; `source=jupiter` serves the configured SOL, SDEX and FRIED Solana mints. The internal Cloudflare service hop preserves only Cloudflare's trusted visitor IP so the shared service can enforce its limits; cookies, authorization, Origin and client-provided forwarding headers are not forwarded. No additional provider key is stored. The provider caches and credit budgets remain shared between both sites.

The browser checks majors every five minutes and Solana-token prices every five seconds while the page is visible. Provider timestamps still determine freshness: delayed-but-not-expired quotes keep their original timestamps and neutral styling while displaying the `24h` label, and expired quotes are hidden. Scrolling pauses on hover or keyboard focus; keyboard browsing and reduced motion are supported. The homepage cards share the ticker's browser scheduler, requests, session cache, retry limits and expiry timer, so a page loads each source once and updates both views together. The cards reuse the ticker's existing coin images. Manual refresh respects provider intervals and Retry-After. The legacy `/api/fried` compatibility response uses the same local proxy with exact-key and timestamp validation; the FRIED card's DEX Screener URL is navigation only, not a market-data request.
