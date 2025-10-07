#!/usr/bin/env node
// Simple helper to run protoc-based generation for the project.
// This script checks for protoc and a Connect ES plugin, and runs protoc
// with reasonable defaults. If tools are missing it prints actionable
// instructions rather than failing silently.

const { spawnSync } = require('child_process');
const fs = require('fs');
const path = require('path');

function checkTool(cmd, args = ['--version']) {
  try {
    const r = spawnSync(cmd, args, { stdio: 'pipe' });
    return r.status === 0 || (r.stdout && r.stdout.length > 0);
  } catch (e) {
    return false;
  }
}

function runProtoc(args) {
  console.log('Running: protoc', args.join(' '));
  const r = spawnSync('protoc', args, { stdio: 'inherit' });
  return r.status === 0;
}

function ensureDir(dir) {
  try {
    fs.mkdirSync(dir, { recursive: true });
  } catch (e) {
    // ignore
  }
}

function main() {
  const projectRoot = path.resolve(__dirname, '..');
  const protoDir = path.join(projectRoot, 'proto');
  const outDir = path.join(projectRoot, 'src', 'generated');

  if (!fs.existsSync(protoDir)) {
    console.error('proto directory not found:', protoDir);
    process.exit(1);
  }

  // First prefer a local vendored protoc we may have downloaded into tools/protoc
  const localProtocPath = path.join(projectRoot, 'tools', 'protoc', 'bin', process.platform === 'win32' ? 'protoc.exe' : 'protoc');
  const hasLocalProtoc = fs.existsSync(localProtocPath);
  const hasProtoc = hasLocalProtoc || checkTool('protoc');
  if (hasLocalProtoc) console.log('Using local protoc at', localProtocPath);
  if (!hasProtoc) {
    console.error('\nprotoc is not installed or not on PATH.');
    console.error('Install protoc for your platform and ensure `protoc` is on your PATH.');
    console.error('On macOS: brew install protobuf');
    console.error('On Windows: download protoc from https://github.com/protocolbuffers/protobuf/releases and add protoc.exe to your PATH');
    console.error('On Linux: use your package manager (example: apt install -y protobuf-compiler)');
    console.error('\nOnce protoc is installed re-run this script (npm run proto:gen:protoc).');
    process.exit(1);
  }

  // Prefer a plugin named protoc-gen-connect-es if present
  const hasConnectPlugin = checkTool('protoc-gen-connect-es');

  if (!hasConnectPlugin) {
    console.warn('\nprotoc-gen-connect-es plugin not found on PATH.');
    console.warn('If you want to generate Connect ES client code, install the plugin and re-run.');
    console.warn('See https://connect.build or https://buf.build for plugin downloads and docs.');
    console.warn('\nFalling back to JS output only (no Connect-generated client).');
  }

  ensureDir(outDir);

  // Generate JS runtime stubs (use commonjs style for compatibility) if a
  // JS plugin is available. Some protoc distributions do not include a
  // built-in JS generator and require 'protoc-gen-js' on PATH; attempt to
  // detect that plugin and skip JS generation if not present.
  const protoFiles = fs.readdirSync(protoDir).filter(f => f.endsWith('.proto')).map(f => path.join('proto', f));
  const jsArgs = ['-I', 'proto', `--js_out=import_style=commonjs:./src/generated`, ...protoFiles];
  const hasProtocGenJs = checkTool('protoc-gen-js');
  if (!hasProtocGenJs) {
    console.warn('protoc-gen-js plugin not found on PATH; skipping --js_out generation.');
  } else {
    // If we have a local protoc, invoke it directly
    if (hasLocalProtoc) {
      const r = spawnSync(localProtocPath, jsArgs, { stdio: 'inherit' });
      if (r.status !== 0) {
        console.error('protoc JS generation failed (local protoc)');
        process.exit(1);
      }
    } else {
      if (!runProtoc(jsArgs)) {
        console.error('protoc JS generation failed');
        process.exit(1);
      }
    }
  }

  if (hasConnectPlugin) {
    // Try generating Connect ES code. The exact flag name depends on plugin; many
    // Connect plugins expose a `--connect_out` or specific `--connect-es_out` flag.
    const connectArgsCandidates = [
      ['-I', 'proto', '--plugin=protoc-gen-connect-es=protoc-gen-connect-es', '--connect_es_out=./src/generated', ...protoFiles],
      ['-I', 'proto', '--plugin=protoc-gen-connect-es=protoc-gen-connect-es', '--connect-es_out=./src/generated', ...protoFiles],
      ['-I', 'proto', '--plugin=protoc-gen-connect=protoc-gen-connect', '--connect_out=./src/generated', ...protoFiles],
    ];
    let ok = false;
    for (const args of connectArgsCandidates) {
      try {
        const r = spawnSync('protoc', args, { stdio: 'inherit' });
        if (r.status === 0) {
          ok = true;
          break;
        }
      } catch (e) {
        // try next
      }
    }
    if (!ok) {
      console.warn('\nConnect codegen attempted but failed for all candidate flags.');
      console.warn('Please ensure your protoc plugin supports one of the common flags (connect_es_out/connect-es_out/connect_out)');
      console.warn('If you need help installing a plugin, consult the project README or Connect/buf docs.');
    }
  }

  console.log('\nCodegen complete. Generated files are in src/generated');
}

main();
