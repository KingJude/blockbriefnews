// After editing inline scripts: node scripts/update-csp.cjs
// Before publishing: node scripts/update-csp.cjs --check
const fs = require('node:fs');
const path = require('node:path');
const { createHash } = require('node:crypto');
const root = path.resolve(__dirname, '..');

function inlineHashes(html) {
  // HTML parsing normalizes CRLF before executing inline scripts.
  html = html.replace(/\r\n?/g, '\n');
  return [...html.matchAll(/<script\b([^>]*)>([\s\S]*?)<\/script\s*>/gi)]
    .filter(([, attrs, code]) => !/\bsrc\s*=/i.test(attrs) && code.trim())
    .map(([, , code]) => `'sha256-${createHash('sha256').update(code).digest('base64')}'`);
}
function htmlFiles(dir) {
  return fs.readdirSync(dir, { withFileTypes: true }).flatMap(entry => {
    // Temporary preview probes are deliberately excluded from the allowlist.
    if (/^[._]/.test(entry.name) || ['node_modules', 'tests', 'scripts'].includes(entry.name)) return [];
    const file = path.join(dir, entry.name);
    return entry.isDirectory() ? htmlFiles(file) : entry.name.endsWith('.html') ? [file] : [];
  }).sort();
}
function policyFor(dir = root) {
  const hashes = [...new Set(htmlFiles(dir).flatMap(file => inlineHashes(fs.readFileSync(file, 'utf8'))))].sort();
  if (!hashes.length) throw new Error('No inline scripts found; refusing to generate an empty policy.');
  return `base-uri 'self'; object-src 'none'; form-action 'self'; script-src 'self' ${hashes.join(' ')}; script-src-attr 'none'`;
}
function update({ check = false, dir = root } = {}) {
  const file = path.join(dir, 'vercel.json');
  const config = JSON.parse(fs.readFileSync(file, 'utf8'));
  const header = config.headers?.find(rule => rule.source === '/(.*)')?.headers?.find(h => h.key.toLowerCase() === 'content-security-policy');
  if (!header) throw new Error('Missing global Content-Security-Policy header.');
  const expected = policyFor(dir);
  if (check && header.value !== expected) throw new Error('CSP is out of date. Run node scripts/update-csp.cjs, then verify a preview.');
  if (!check) { header.value = expected; fs.writeFileSync(file, JSON.stringify(config, null, 2) + '\n'); }
  return expected;
}
if (require.main === module) {
  try { const value = update({ check: process.argv.includes('--check') }); console.log(`CSP ${process.argv.includes('--check') ? 'verified' : 'updated'} (${Buffer.byteLength(value)} bytes).`); }
  catch (error) { console.error(error.message); process.exitCode = 1; }
}
module.exports = { inlineHashes, policyFor, update };
