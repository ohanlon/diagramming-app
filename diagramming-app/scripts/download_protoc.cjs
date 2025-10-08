#!/usr/bin/env node
console.error('Protobuf support has been removed; download_protoc is deprecated.');
process.exit(1);
// This helper attempts to download a matching binary for your platform and
// extract it. It does not require protoc to be installed globally.

const https = require('https');
const fs = require('fs');
const os = require('os');
const path = require('path');
const { spawnSync } = require('child_process');

const VERSION = process.env.PROTOC_VERSION || '23.4.1';
const OUT_DIR = path.resolve(__dirname, '..', 'tools', 'protoc');
const REPO_TMP = path.resolve(__dirname, '..', 'tools', 'tmp');
ensureDir(REPO_TMP);
const TMP_DIR = REPO_TMP;

function pickAssetFromRelease(releaseJson) {
  const platform = process.platform;
  const arch = process.arch;
  const assets = releaseJson.assets || [];
  const nameList = assets.map(a => ({ name: a.name, url: a.browser_download_url }));

  const contains = (s, substr) => s.toLowerCase().indexOf(substr.toLowerCase()) !== -1;

  const platformCandidates = [];
  if (platform === 'win32') platformCandidates.push('win', 'win64', 'windows');
  if (platform === 'darwin') platformCandidates.push('osx', 'mac', 'darwin');
  if (platform === 'linux') platformCandidates.push('linux');

  const archCandidates = [];
  if (arch === 'arm64' || arch === 'aarch64') archCandidates.push('aarch_64', 'aarch64', 'arm64', 'arm');
  archCandidates.push('x86_64', 'x86-64', 'x64', 'amd64');

  // Try to find an asset that matches both platform and arch variants
  for (const p of platformCandidates) {
    for (const a of archCandidates) {
      for (const item of nameList) {
        if (contains(item.name, p) && contains(item.name, a) && item.name.toLowerCase().endsWith('.zip')) {
          return item.url;
        }
      }
    }
  }

  // Fallback: try any zip that contains the platform substring
  for (const p of platformCandidates) {
    for (const item of nameList) {
      if (contains(item.name, p) && item.name.toLowerCase().endsWith('.zip')) return item.url;
    }
  }

  return null;
}

function download(url, dest) {
  return new Promise((resolve, reject) => {
    const file = fs.createWriteStream(dest);
    console.log('Downloading', url);
    const req = https.get(url, (res) => {
      if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
        // follow redirects
        return download(res.headers.location, dest).then(resolve).catch(reject);
      }
      if (res.statusCode !== 200) {
        file.close();
        fs.unlinkSync(dest);
        return reject(new Error('HTTP status ' + res.statusCode));
      }
      res.pipe(file);
      file.on('finish', () => {
        file.close();
        resolve();
      });
    });
    req.on('error', (err) => {
      try { file.close(); } catch (e) {}
      try { fs.unlinkSync(dest); } catch (e) {}
      reject(err);
    });
  });
}

function extractZip(zipPath, targetDir) {
  return new Promise((resolve) => {
  // Prefer a JS-based extractor if the 'extract-zip' package is available
    try {
      // eslint-disable-next-line global-require
      const extract = require('extract-zip');
      extract(zipPath, { dir: targetDir }, (err) => {
        if (err) return resolve(false);
        return resolve(true);
      });
      return;
    } catch (e) {
      // Not installed or failed; fall back to platform tools
    }

  // Use platform native tools: PowerShell's Expand-Archive on Windows, unzip on Unix.
  if (process.platform === 'win32') {
    // Try PowerShell Expand-Archive first
    try {
      const psh = 'powershell';
      const args = ['-NoProfile', '-NonInteractive', '-Command', `Expand-Archive -Force -Path '${zipPath}' -DestinationPath '${targetDir}'`];
      // Try a few times because on Windows newly downloaded files may be locked
      // briefly by antivirus or other system processes.
      (async () => {
        for (let attempt = 0; attempt < 5; attempt++) {
          const r = spawnSync(psh, args, { stdio: 'inherit' });
          if (r.status === 0) return resolve(true);
          // small delay before retrying
          await new Promise((r2) => setTimeout(r2, 250));
        }
        // fall through to other fallbacks
      })();
    } catch (e) {
      // ignore and try fallback
    }
    // Fallback: try tar (Windows 10+ includes bsdtar)
    try {
      const tar = spawnSync('tar', ['-xf', zipPath, '-C', targetDir], { stdio: 'inherit' });
      if (tar.status === 0) return true;
    } catch (e) {
      // ignore
    }
    console.warn('Failed to extract zip on Windows. Try extracting manually or ensure PowerShell/bsdtar are available:', zipPath);
    return false;
  }
  // unix-like: try unzip then tar
    try {
      const unzip = spawnSync('unzip', ['-o', zipPath, '-d', targetDir], { stdio: 'inherit' });
      if (unzip.status === 0) return resolve(true);
    } catch (e) {}
    try {
      const tar = spawnSync('tar', ['-xf', zipPath, '-C', targetDir], { stdio: 'inherit' });
      if (tar.status === 0) return resolve(true);
    } catch (e) {}
    console.warn('zip extraction failed. Please install unzip or tar, or extract the archive manually:', zipPath);
    return resolve(false);
  });
}

function ensureDir(dir) {
  try { fs.mkdirSync(dir, { recursive: true }); } catch (e) {}
}

(async function main() {
  ensureDir(OUT_DIR);
  // Using GitHub Releases API to pick correct asset for platform
  // Fetch release JSON from GitHub Releases (latest or the specified version)
  const releaseUrl = process.env.PROTOC_VERSION ? `https://api.github.com/repos/protocolbuffers/protobuf/releases/tags/v${process.env.PROTOC_VERSION}` : 'https://api.github.com/repos/protocolbuffers/protobuf/releases/latest';
  const releaseJson = await new Promise((resolve, reject) => {
    const opts = {
      headers: { 'User-Agent': 'diagramming-app-protoc-installer' }
    };
    https.get(releaseUrl, opts, (res) => {
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
  }).catch((err) => {
    console.error('Failed to fetch release metadata from GitHub:', err.message || err);
    process.exit(1);
  });

  const assetUrl = pickAssetFromRelease(releaseJson);
  if (!assetUrl) {
    console.error('No suitable protoc asset found for your platform in release', releaseJson.tag_name || releaseJson.name);
    process.exit(1);
  }

  const name = assetUrl.split('/').pop();
  const dest = path.join(TMP_DIR, name);
  try {
    await download(assetUrl, dest);
  } catch (e) {
    console.error('Download failed for', assetUrl, e.message || e);
    process.exit(1);
  }
  const extractTarget = path.join(TMP_DIR, `protoc_extracted_${Date.now()}`);
  ensureDir(extractTarget);
  const ok = await extractZip(dest, extractTarget);
  if (!ok) {
    console.error('Extraction failed for', dest);
    process.exit(1);
  }
  const entries = fs.readdirSync(extractTarget);
  const root = entries.length === 1 ? path.join(extractTarget, entries[0]) : extractTarget;
  for (const e of fs.readdirSync(root)) {
    const src = path.join(root, e);
    const dst = path.join(OUT_DIR, e);
    try {
      if (fs.existsSync(dst)) fs.rmSync(dst, { recursive: true, force: true });
      // Use recursive copy to avoid cross-device rename failures
      fs.cpSync(src, dst, { recursive: true });
    } catch (err) {
      console.warn('Failed to copy extracted file', src, '->', dst, err);
    }
  }
  // Ensure protoc executable permission on unix
  const protocBin = process.platform === 'win32' ? path.join(OUT_DIR, 'bin', 'protoc.exe') : path.join(OUT_DIR, 'bin', 'protoc');
  if (fs.existsSync(protocBin) && process.platform !== 'win32') {
    try { fs.chmodSync(protocBin, 0o755); } catch (e) {}
  }
  if (!fs.existsSync(protocBin)) {
    console.error('Extraction completed but protoc binary not found in expected location:', protocBin);
    console.error('You may need to extract the downloaded archive manually or install protoc on your system.');
    process.exit(1);
  }
  console.log('Protoc installed to', OUT_DIR);
  console.log('Add', path.join(OUT_DIR, 'bin'), 'to your PATH or invoke', path.join(OUT_DIR, 'bin', 'protoc'));
  try { fs.unlinkSync(dest); } catch (e) {}
  try { fs.rmSync(extractTarget, { recursive: true, force: true }); } catch (e) {}
})();
