# BlockBriefNews production audit

Date: 2026-09-09. Baseline: `12917107e816823058a64347ef528f0ec9ae1a7b`.

Scope: public homepage, five topic pages, transient story briefs, news and FRIED APIs, shared navigation, advertisement, language interface, world clock, metadata and Vercel routing. Existing project and custom domain are retained.

## Findings fixed

| Priority | Finding | Resolution |
| --- | --- | --- |
| High | Publisher URLs reached topic/story HTML attributes without escaping. | Validate HTTP(S) URLs, reject credentials, escape rendered attributes; validate feed URLs at ingestion. |
| Medium | Missing publication dates became the current time and could lead the feed. | Reject missing, invalid and implausibly future dates; normalize valid dates and retain descending publication order. |
| Medium | Atom feeds could select self/feed URLs. | Select alternate article links. |
| Medium | Short-title similarity could remove distinct stories. | Require enough comparable words; use union-based similarity and exact URL/title deduplication. |
| Medium | Articles about both Bitcoin and regulation could miss the regulation page. | Preserve the primary category and add multi-topic matching to filters and topic pages. |
| Medium | A failed refresh removed already loaded headlines. | Retain earlier headlines with an explicit refresh status; add request timeouts and response validation. |
| Medium | Expired briefs offered no route to their original source. | Offer a validated HTTPS link for known publisher domains when the brief is absent. |
| Medium | Unsupported methods could trigger upstream quote requests; failed news responses could be cached. | Explicit GET/HEAD/OPTIONS handling, reject other methods before fetching, and use no-store for total failure. |
| Medium | Narrow screens could wrap the language selector into a third header row. | Adjust the small-screen logo width; preserve fixed navigation and measured spacer height. |
| Medium | Keyboard users lacked a skip link and filters lacked announced selected state. | Add translated skip links, visible focus, filter aria-pressed states, live refresh status, larger control targets and reduced-motion scrolling. |
| Low | The clock rewrote identical DOM text every second, triggering translation work. | Update each clock only when its displayed minute changes and skip hidden documents. |
| Low | Baseline response hardening headers were absent. | Add nosniff, referrer policy, permissions policy and a limited CSP for base URLs, objects and forms. Keep clock embedding functional. |

## Verification

- `node --test tests/audit.test.cjs`: 11 passing regression tests covering parsing, malicious links, topic matching, deduplication, partial/total provider failure, methods, exact FRIED mint/liquidity selection, script/JSON metadata syntax, refresh retention and clock DOM updates.
- Baseline public requests: homepage, five topic pages, story page, clock embed, robots, sitemap and both APIs returned HTTP 200. News returned 36 items with no reported source errors; FRIED returned the configured mint.
- Vercel preview: live headlines and all four quotes rendered; no broken images in inspected pages. Regulation filtering returned relevant cross-topic articles with the correct pressed state.
- Browser layout checks: 320, 390 and 768 pixel iframe viewports, plus desktop. No document-level horizontal overflow in inspected pages. Header top remained zero and spacer matched its height within one pixel. At 320 pixels the home header fell from about 191 to 128 pixels after the selector fix.
- English, Simplified Chinese and Spanish UI switching checked, including translated navigation and dynamic clock controls. Publisher headlines intentionally remain in their original language.
- World-clock city search found General Santos; adding the city, switching theme/time format, entering and exiting full screen worked. Standalone clock embedding remained available.
- Expired brief fallback displayed the known publisher link. The temporary layout harness is removed before merging.
- Existing canonical URLs, structured metadata, robots/sitemap, legacy-home redirects, logo and official coin assets are retained. Production checks are performed after the GitHub merge.

## Limits and remaining opportunities

- This is a source review and functional deployment audit, not a penetration test or WCAG certification. Real iPhone/Telegram WebView testing, Lighthouse/Core Web Vitals field data, Search Console indexing and private Vercel logs were not available.
- Follow-up: added lossless WebP delivery for the logo and browser icon. Decoded RGBA pixels exactly match the original PNGs. Logo: 942,399 → 680,460 bytes (27.8% smaller). Icon: 959,873 → 703,094 bytes (26.8% smaller). Content-hashed assets receive long-lived caching. PNG fallback, Apple touch icon, social images and original artwork remain available. Smaller responsive variants could reduce transfer further in a future asset pass.
- News cards are currently client-rendered and transient briefs are intentionally noindex. Durable, server-rendered article URLs and editorial archives would be a larger SEO architecture change. No claim of Google indexing or ranking gains is made.
- Quote/feed providers can still have outages or rate limits. The changes improve failure behavior without substituting fabricated news or prices.
- Follow-up: the CSP now restricts scripts to this origin and SHA-256 hashes of existing inline scripts. Unapproved inline scripts, HTML event handlers and dynamic evaluation are blocked. The script policy does not restrict CSS or data-provider connections. Run `node scripts/update-csp.cjs --check` before publishing; regenerate hashes after inline HTML script/JSON-LD edits. This is a manual check, not a CI gate.

## Script-policy follow-up verification

- All 14 regression tests passed, including stale-policy detection and hash whitespace handling.
- Preview browser probe: same-origin script executed; unapproved inline JavaScript, dynamic evaluation and an inline event handler were blocked. The preview-only Vercel feedback toolbar was also blocked as a third-party script.
- Under enforcement, the homepage loaded live headlines and four prices. English, Chinese and Spanish switching, filters, ad pause, clock theme/time format, city search and full-screen entry/exit worked. All five topic scripts rendered their results or an honest empty state.
- Temporary enforcement probes are removed before production. The policy is scoped to script execution; it is not a complete penetration test or a guarantee against all injection vulnerabilities.
