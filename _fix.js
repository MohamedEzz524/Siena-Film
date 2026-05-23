// Re-extract referenced URLs from HTML, then download any missing/broken local files.
// Handles: srcset comma-splits, HTML-entity &quot; inside style="url(&quot;...&quot;)", parens in filenames.
const fs = require('fs');
const path = require('path');
const https = require('https');
const { URL } = require('url');

const HTML_FILES = ['index.html', 'work.html', 'about.html', 'contact.html'];
const ASSET_HOSTS = /(cdn\.prod\.website-files\.com|cdn\.jsdelivr\.net|siena-film-foundation\.vercel\.app|d3e54v103j8qbb\.cloudfront\.net)/;

function extractUrls(text) {
  // Replace HTML entities that delimit URLs so the matcher stops correctly
  text = text.replace(/&quot;/g, '"').replace(/&amp;/g, '&');
  const re = /(cdn\.prod\.website-files\.com|cdn\.jsdelivr\.net|siena-film-foundation\.vercel\.app|d3e54v103j8qbb\.cloudfront\.net)\/[^"'\s,]*/g;
  const out = new Set();
  let m;
  while ((m = re.exec(text)) !== null) {
    let u = m[0];
    u = u.replace(/[:;]+$/, '');
    if (u.length > 5) out.add(u);
  }
  return out;
}

const urls = new Set();
for (const f of HTML_FILES) {
  const text = fs.readFileSync(f, 'utf8');
  for (const u of extractUrls(text)) urls.add(u);
}
console.log(`Referenced unique URLs: ${urls.size}`);

const todo = [];
for (const u of urls) {
  const local = u; // already relative path
  let sz = 0;
  try { sz = fs.statSync(local).size; } catch {}
  if (sz < 500) todo.push(u);
}
console.log(`Missing or broken (<500 bytes): ${todo.length}`);

function fetchOne(urlPath) {
  return new Promise((resolve) => {
    const fullUrl = 'https://' + urlPath;
    const outPath = urlPath;
    fs.mkdirSync(path.dirname(outPath), { recursive: true });
    const u = new URL(fullUrl);
    const opts = {
      hostname: u.hostname, path: u.pathname + u.search, method: 'GET',
      headers: { 'User-Agent': 'Mozilla/5.0', 'Accept': '*/*', 'Referer': 'https://www.siena.film/' },
    };
    const req = https.request(opts, (res) => {
      if (res.statusCode === 301 || res.statusCode === 302) {
        res.resume();
        return resolve({ url: urlPath, status: res.statusCode + ' redirect to ' + res.headers.location });
      }
      if (res.statusCode !== 200) {
        res.resume();
        return resolve({ url: urlPath, status: res.statusCode });
      }
      const chunks = [];
      res.on('data', (c) => chunks.push(c));
      res.on('end', () => {
        const buf = Buffer.concat(chunks);
        fs.writeFileSync(outPath, buf);
        resolve({ url: urlPath, status: 200, bytes: buf.length });
      });
    });
    req.on('error', (e) => resolve({ url: urlPath, status: 'ERR ' + e.message }));
    req.end();
  });
}

(async () => {
  const CONCURRENCY = 12;
  let i = 0, ok = 0, fail = 0;
  async function worker() {
    while (i < todo.length) {
      const my = i++;
      const r = await fetchOne(todo[my]);
      if (r.status === 200) ok++; else { fail++; console.log(`FAIL [${r.status}] ${r.url}`); }
    }
  }
  await Promise.all(Array.from({ length: CONCURRENCY }, worker));
  console.log(`\nDone. ok=${ok} fail=${fail}`);
})();
