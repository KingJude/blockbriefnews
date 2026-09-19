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

## September 17, 2026 check and FRIED banner correction

- Live desktop inspection confirmed that the FRIED marquee was about 807px wide, but each repeated message was only about 406px. As the track moved, its end entered the visible area before resetting. The shared stylesheet now gives the track at least twice the marquee width and distributes that width equally between its two copies. Reduced-motion mode resets this minimum and retains one static message. All eight existing placements reference stylesheet version 3.
- Production checks: six canonical pages return 200 with self-referencing canonicals and valid parsed structured data. Search Console URL Inspection reports all six as submitted and indexed; the sitemap has no errors or warnings (last read September 15). The news API returned 36 newest-first items, newest September 17 at 00:23:44 UTC, with no source errors. The homepage rendered the existing logo, official coin icons, all four prices and the world clock.
- Search measurement: August 18–September 14 recorded 1,705 impressions and 0 clicks, compared with no reported impressions or clicks in July 21–August 17. Google marks data settled through September 14; September 15 onward is incomplete. Most reported impressions concern the unrelated `theblockchainbrief` brand, so this is not evidence of improved relevance. Metadata and indexing requests are unchanged. The initial topic HTML still depends on JavaScript to load headlines; adding crawlable initial news content remains a separate opportunity, not an indexing failure.
- Validation: all 17 existing tests and the 1,015-byte CSP check pass. GitHub reports the Vercel branch deployment successful. Visual verification of the changed preview is blocked by Vercel authentication; the connected Vercel tools cannot retrieve the deployment or fetch its protected URL. A local browser check is also unavailable in this environment. The temporary preview harness is removed. Do not merge until authenticated preview verification has checked scrolling, narrow-screen English/Chinese/Spanish layouts, pause/resume, header position and logo/CTA behavior. No production change is claimed.


## September 19, 2026 topic context and indexing monitoring

- Baseline: current main `25e11efae6697ff772df4ca5741bffd97fb34e4a`; no open PRs at the start of this change. GSC Wizard reports 2,408 impressions and 0 clicks for August 20–September 16, compared with no reported impressions or clicks for July 23–August 19 (equal 28-day periods). Data is settled through September 16; September 17 onward is incomplete. Most query impressions mention the unrelated `theblockchainbrief` brand. Relevant query volumes are too small to attribute a ranking or CTR effect to recent changes.
- Google URL Inspection reports all six canonical pages submitted and indexed. The sitemap was read September 19 with zero errors/warnings. Its API indexed count is not used to determine indexing. Added those six canonical URLs to GSC Wizard's Indexing Tracker; this monitors status and does not submit URLs for Google indexing. Intentional HTTP, www and legacy-home redirects remain in place.
- The five topic pages had only about 63–66 words of initial body text and no useful cross-topic navigation. Added distinct, static reading guides beneath the live headlines, each with four descriptive topic links and a primary reference. Readers can check the network, measurement period or policy status relevant to a headline. This is a relevance/discovery improvement to test over subsequent settled periods, not a claimed ranking gain.
- Primary references checked September 19: [Bitcoin transaction basics](https://bitcoin.org/en/how-it-works), [Ethereum scaling](https://ethereum.org/developers/docs/scaling/), [Solana transactions](https://solana.com/docs/core/transactions), [CoinGecko market data](https://docs.coingecko.com/reference/coins-markets), and [SEC rules and regulations](https://www.sec.gov/rules-regulations). The SEC reference is explicitly U.S.-specific. No original reporting, bylines or Article schema are invented.
- All new guide text supports English, Simplified Chinese and Spanish through the existing UI switcher. Existing titles, descriptions, canonicals and structured data are unchanged. Sitemap last-modified dates advance only for the five topic pages whose content changed. Transient story briefs remain noindex; publisher attribution and links remain intact.
- Local validation: all 17 existing tests pass, `node scripts/update-csp.cjs --check` passes (1,015 bytes), and `node --check languages.js` passes. A structural check confirms one H1 per topic, four crawlable related-topic links per guide, all 35 new strings translated, and byte-identical pre-existing inline scripts/JSON-LD. The feed, prices, ad, clock, header and domain configuration are unchanged.
- Deployment validation is pending the Vercel preview. Do not treat this entry as confirmation that the change is live.
