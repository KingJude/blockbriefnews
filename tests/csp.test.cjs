const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { inlineHashes, policyFor, update } = require('../scripts/update-csp.cjs');

test('Deployed policy matches all current inline scripts', () => {
  const policy = update({ check: true });
  assert.ok(policy.includes("script-src 'self' 'sha256-"));
  assert.ok(policy.includes("script-src-attr 'none'"));
  assert.ok(!policy.includes('unsafe-inline') && !policy.includes('unsafe-eval'));
});
test('Hashes preserve script whitespace and normalize HTML line endings', () => {
  const code = '<script>\nconst a = 1;\n</script>';
  assert.deepEqual(inlineHashes(code), inlineHashes(code.replace(/\n/g, '\r\n')));
  assert.notDeepEqual(inlineHashes(code), inlineHashes('<script>const a = 1;</script>'));
  assert.deepEqual(inlineHashes('<script src="/app.js"></script>'), []);
});
test('A changed script fails the check until the policy is regenerated', () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'blockbrief-csp-'));
  try {
    fs.writeFileSync(path.join(dir, 'index.html'), '<script>const a=1;</script>');
    fs.writeFileSync(path.join(dir, 'vercel.json'), JSON.stringify({ headers: [{ source: '/(.*)', headers: [{ key: 'Content-Security-Policy', value: '' }] }] }));
    update({ dir });update({ check: true, dir });
    fs.writeFileSync(path.join(dir, 'index.html'), '<script>const a=2;</script>');
    assert.throws(() => update({ check: true, dir }), /out of date/);
    update({ dir });update({ check: true, dir });
    fs.writeFileSync(path.join(dir, '_csp-probe.html'), '<script>unapproved()</script>');
    assert.ok(!policyFor(dir).includes(inlineHashes('<script>unapproved()</script>')[0]));
  } finally { fs.rmSync(dir, { recursive: true, force: true }); }
});
