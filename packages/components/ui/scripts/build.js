const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

/**
 * Build script for phillUI (subpackage)
 * 1. Clean dist
 * 2. Sync package sources to dist (exclude node_modules, scripts, dist)
 * 3. Bundle vendors into dist/vendor via rollup
 * 4. Patch imports inside dist
 * 5. Optionally sync to playground for local dev
 */

const packageRoot = path.resolve(__dirname, '..');
const repoRoot = path.resolve(packageRoot, '../..');
const distPath = path.join(packageRoot, 'dist');
const distUView = path.join(distPath, 'phillui');
const utsLibsSrc = path.join(packageRoot, 'uts-libs');

function clean() {
  if (fs.existsSync(distPath)) {
    execSync(`rm -rf "${distPath}"`);
  }
  fs.mkdirSync(distPath, { recursive: true });
}

function syncSourceToDist() {
  console.log('[Build] Sync sources to dist/phillui...');
  fs.mkdirSync(distUView, { recursive: true });
  execSync(
    `rsync -aq --exclude='node_modules' --exclude='dist' --exclude='scripts' --exclude='rollup.config.mjs' --exclude='uts-libs' "${packageRoot}/" "${distUView}/"`
  );
  if (fs.existsSync(utsLibsSrc)) {
    const libs = fs.readdirSync(utsLibsSrc).filter(n => fs.statSync(path.join(utsLibsSrc, n)).isDirectory());
    libs.forEach(lib => {
      const src = path.join(utsLibsSrc, lib);
      const dest = path.join(distPath, lib);
      execSync(`rsync -aq "${src}/" "${dest}/"`);
    });
  }
}

function runRollup() {
  console.log('[Build] Running Rollup vendors...');
  execSync('pnpm run rollup', { stdio: 'inherit', cwd: packageRoot });
}

function patchImports() {
  console.log('[Build] Patching imports...');
  require('./patch-imports.js');
}

function scrubDist() {
  function walk(dir, fn) {
    fs.readdirSync(dir).forEach(f => {
      const p = path.join(dir, f);
      const stat = fs.statSync(p);
      if (stat.isDirectory()) walk(p, fn);
      else fn(p);
    });
  }
  const reFilePath = /@FilePath/;
  const reReadmeLinks = /(uview-ultra\.lingyun\.net|uview-ultra-plus|uview-ultra)/i;
  walk(distUView, (fp) => {
    if (!/\.(js|ts|vue|uvue|uts|scss|css|md)$/.test(fp)) return;
    let content = fs.readFileSync(fp, 'utf8');
    const original = content;
    content = content.split('\n').filter(line => !reFilePath.test(line)).join('\n');
    // clean README external links
    if (path.basename(fp).toLowerCase() === 'readme.md') {
      content = content.split('\n').filter(line => !reReadmeLinks.test(line)).join('\n');
    }
    if (content !== original) {
      fs.writeFileSync(fp, content, 'utf8');
      console.log('[Scrub]', path.relative(distPath, fp));
    }
  });
}

function syncPlayground() {
  const uiTargets = [
    path.join(repoRoot, 'apps/playground/uniapp/src/uni_modules/@phillUI/ui'),
    path.join(repoRoot, 'apps/playground/uniapp-x/uni_modules/@phillUI/ui')
  ];
  uiTargets.forEach(target => {
    if (fs.existsSync(path.dirname(target))) {
      console.log(`[Build] Sync to ${path.relative(repoRoot, target)}...`);
      if (fs.existsSync(target)) execSync(`rm -rf "${target}"`);
      execSync(`rsync -aq "${distUView}/" "${target}/"`);
    }
  });
  const extraLibs = fs.existsSync(distPath) ? fs.readdirSync(distPath).filter(n => n !== 'phillui') : [];
  extraLibs.forEach(lib => {
    const src = path.join(distPath, lib);
    if (!fs.statSync(src).isDirectory()) return;
    [path.join(repoRoot, 'apps/playground/uniapp/src/uni_modules', lib), path.join(repoRoot, 'apps/playground/uniapp-x/uni_modules', lib)].forEach(dest => {
      if (fs.existsSync(path.dirname(dest))) {
        if (fs.existsSync(dest)) execSync(`rm -rf "${dest}"`);
        execSync(`rsync -aq "${src}/" "${dest}/"`);
      }
    });
  });
}

function main() {
  clean();
  syncSourceToDist();
  scrubDist();
  runRollup();
  patchImports();
  // Dev convenience
  syncPlayground();
  console.log('[Build] Done.');
}

main();
