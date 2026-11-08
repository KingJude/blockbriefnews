const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');
const {execFileSync} = require('node:child_process');
const root = path.resolve(__dirname, '..');
const out = path.join(root, '.cloudflare');
const assets = path.join(out, 'public');
fs.rmSync(out, {recursive:true, force:true});
fs.mkdirSync(assets, {recursive:true});
const config = JSON.parse(fs.readFileSync(path.join(root, 'vercel.json'), 'utf8'));
const headers = Object.fromEntries(config.headers.find(x => x.source === '/(.*)').headers.map(x => [x.key, x.value]));
const redirects = Object.fromEntries(config.redirects.map(x => [x.source, x.destination]));
const release = crypto.createHash('sha256');
const tracked = execFileSync('git', ['ls-files', '-z'], {cwd:root}).toString().split('\0').filter(Boolean);
const published = tracked.filter(file => !/^(api|scripts|tests|cloudflare|\.git)\//.test(file) && !file.startsWith('.') && !['README.md','AUDIT.md','vercel.json','placeholder.tmp','home.html','future-home.html'].includes(file));
for (const file of published) {
  const content = fs.readFileSync(path.join(root, file));
  release.update(file).update(content);
  const dest = path.join(assets, file);
  fs.mkdirSync(path.dirname(dest), {recursive:true}); fs.writeFileSync(dest, content);
}
let worker = fs.readFileSync(path.join(__dirname, 'worker.mjs'), 'utf8');
worker = worker.replace(/^import (\w+) from '\.\.\/(api\/[^']+)';$/gm, (_, variable, file) => {
  const code = fs.readFileSync(path.join(root,file), 'utf8');
  if (/\brequire\s*\(/.test(code)) throw new Error('Add a bundler before using API module dependencies');
  return `const ${variable} = (() => { const module = {exports: {}};\n${code}\nreturn module.exports; })();`;
});
worker = worker.replace(/^import \{ HEADERS, REDIRECTS, RELEASE \} from '.\/generated-config.mjs';$/m, '');
release.update(worker).update(JSON.stringify(headers)).update(JSON.stringify(redirects));
const releaseId = release.digest('hex').slice(0,16);
worker = `import {Buffer} from 'node:buffer';\nconst HEADERS=${JSON.stringify(headers)};\nconst REDIRECTS=${JSON.stringify(redirects)};\nconst RELEASE=${JSON.stringify(releaseId)};\n` + worker;
fs.writeFileSync(path.join(out,'worker.mjs'),worker);
const assetHeaders = '/*\n' + Object.entries(headers).map(([k,v])=>`  ${k}: ${v}`).join('\n') + '\n/assets/branding/*\n  Cache-Control: public, max-age=31536000, immutable\n';
fs.writeFileSync(path.join(assets,'_headers'),assetHeaders);
// _headers is uploaded as metadata, not as a public file.
const manifest = {};
for (const file of published) {
  const bytes=fs.readFileSync(path.join(assets,file));
  manifest['/'+file]={hash:crypto.createHash('sha256').update(bytes.toString('base64')+path.extname(file).slice(1)).digest('hex').slice(0,32),size:bytes.length};
}
fs.writeFileSync(path.join(out,'manifest.json'),JSON.stringify(manifest));
const metadata={main_module:'worker.mjs',compatibility_date:'2026-11-08',compatibility_flags:['nodejs_compat'],bindings:[{name:'ASSETS',type:'assets'},{name:'MARKET_FEED',type:'service',service:'solanadex-main-production'}],assets:{config:{html_handling:'auto-trailing-slash',not_found_handling:'none',run_worker_first:true,_headers:assetHeaders}},observability:{enabled:true}};
fs.writeFileSync(path.join(out,'metadata.json'),JSON.stringify(metadata));
fs.writeFileSync(path.join(out,'release.json'),JSON.stringify({release:releaseId,files:published.length,source:execFileSync('git',['rev-parse','HEAD'],{cwd:root}).toString().trim()},null,2));
console.log(JSON.stringify({release:releaseId,files:published.length,workerBytes:Buffer.byteLength(worker),assetBytes:Object.values(manifest).reduce((a,x)=>a+x.size,0)}));
