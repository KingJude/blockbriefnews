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
