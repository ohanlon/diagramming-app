#!/usr/bin/env node
// Attempt to download Connect plugin binaries (protoc-gen-connect* and protoc-gen-connect-es)
// from the 'connectrpc/connect' GitHub releases and install them to tools/plugins/bin.

const https = require('https');
const fs = require('fs');
const path = require('path');


console.error('Protobuf support has been removed; download_connect_plugins is deprecated.');
process.exit(1);
function ensureDir(d) { try { fs.mkdirSync(d, { recursive: true }); } catch (e) {} }
ensureDir(OUT_DIR); ensureDir(TMP_DIR);

function pickAsset(assets, nameContains) {
  const candidates = assets.map(a => ({ name: a.name, url: a.browser_download_url }));
  const contains = (s, sub) => s.toLowerCase().indexOf(sub.toLowerCase()) !== -1;
  // Prefer platform and arch matches
  for (const item of candidates) {
    if (contains(item.name, nameContains) && (contains(item.name, PLATFORM) || contains(item.name, 'win') || contains(item.name, 'linux') || contains(item.name, 'osx'))) return item.url;
  }
  // fallback to any asset with nameContains
  for (const item of candidates) {
    if (contains(item.name, nameContains)) return item.url;
  }
  return null;
}

function download(url, dest) {
  return new Promise((res, rej) => {
    const f = fs.createWriteStream(dest);
    https.get(url, (r) => {
      if (r.statusCode >= 300 && r.headers.location) return download(r.headers.location, dest).then(res).catch(rej);
      if (r.statusCode !== 200) return rej(new Error('HTTP ' + r.statusCode));
      r.pipe(f);
      f.on('finish', () => { f.close(); res(); });
    }).on('error', (err) => { try { f.close(); } catch (e) {} ; rej(err); });
  });
}

function extractZip(zipPath, dest) {
  // use extract-zip if available
  try {
    const extract = require('extract-zip');
    return new Promise((res, rej) => { extract(zipPath, { dir: dest }, (err) => err ? rej(err) : res()); });
  } catch (e) {}
  // fallback to system
  if (PLATFORM === 'win32') {
    const r = spawnSync('powershell', ['-NoProfile', '-NonInteractive', '-Command', `Expand-Archive -Force -Path '${zipPath}' -DestinationPath '${dest}'`], { stdio: 'inherit' });
    return r.status === 0 ? Promise.resolve() : Promise.reject(new Error('Expand-Archive failed'));
  }
  const r2 = spawnSync('unzip', ['-o', zipPath, '-d', dest], { stdio: 'inherit' });
  return r2.status === 0 ? Promise.resolve() : Promise.reject(new Error('unzip failed'));
}

(async function main() {
  const repoCandidates = ['connectrpc/connect', 'bufbuild/connect', 'bufbuild/connect'];
  async function fetchJson(url, redirects = 0) {
    return new Promise((resolve, reject) => {
      const opts = { headers: { 'User-Agent': 'connect-plugin-installer' } };
      https.get(url, opts, (res) => {
        if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location && redirects < 5) {
          return fetchJson(res.headers.location, redirects + 1).then(resolve).catch(reject);
        }
        let data = '';
        res.on('data', (c) => data += c.toString());
        res.on('end', () => {
          if (res.statusCode >= 200 && res.statusCode < 300) {
            try { resolve(JSON.parse(data)); } catch (e) { reject(e); }
          } else {
            reject(new Error('GitHub API returned status ' + res.statusCode));
          }
        });
      }).on('error', reject);
    });
  }

  let releaseJson = null;
  let usedRepo = null;
  for (const candidate of repoCandidates) {
    const url = 'https://api.github.com/repos/' + candidate + '/releases/latest';
    try {
      console.log('Querying GitHub release for', candidate);
      releaseJson = await fetchJson(url);
      usedRepo = candidate;
      break;
    } catch (err) {
      console.warn('Failed to fetch release for', candidate, err.message || err);
      continue;
    }
  }
  if (!releaseJson) {
    console.error('Failed to find releases for known Connect repositories. Please install plugins manually.');
    process.exit(1);
  }

  const assets = releaseJson.assets || [];
  if (!assets.length) { console.error('No release assets found for', REPO); process.exit(1); }

  const desired = [ 'protoc-gen-connect-es', 'protoc-gen-connect-node', 'protoc-gen-connect' ];
  let installed = [];
  for (const name of desired) {
    const url = pickAsset(assets, name);
    if (!url) { console.warn('No asset found for', name); continue; }
    console.log('Found asset for', name, '->', url);
    const filename = path.basename(url.split('?')[0]);
    const destZip = path.join(TMP_DIR, filename);
    try {
      await download(url, destZip);
      const extractTarget = path.join(TMP_DIR, 'extracted_' + Date.now()); ensureDir(extractTarget);
      await extractZip(destZip, extractTarget);
      // find binary inside extracted tree
      const walk = (d) => {
        const items = fs.readdirSync(d);
        for (const it of items) {
          const p = path.join(d, it);
          const stat = fs.statSync(p);
          if (stat.isFile() && (it.toLowerCase().indexOf(name) !== -1 || it.indexOf('protoc-gen') !== -1)) return p;
          if (stat.isDirectory()) {
            const found = walk(p);
            if (found) return found;
          }
        }
        return null;
      };
      const bin = walk(extractTarget);
      if (!bin) { console.warn('Could not find plugin binary inside archive for', name); continue; }
      // copy to OUT_DIR
      const outPath = path.join(OUT_DIR, path.basename(bin));
      fs.copyFileSync(bin, outPath);
      if (PLATFORM !== 'win32') try { fs.chmodSync(outPath, 0o755); } catch (e) {}
      console.log('Installed plugin to', outPath);
      installed.push({ name, outPath });
      try { fs.unlinkSync(destZip); } catch (e) {}
    } catch (e) {
      console.warn('Failed to install plugin', name, e.message || e);
    }
  }

  if (!installed.length) {
    console.error('No plugins installed. You may install them manually or run the npm installer if packages are available.');
    process.exit(1);
  }

  console.log('Installed plugins:');
  for (const p of installed) console.log(' -', p.name, '->', p.outPath);
  console.log('Add', OUT_DIR, 'to your PATH or invoke binaries from there.');
})();
