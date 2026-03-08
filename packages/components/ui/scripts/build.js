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

// Config
const PKG_NAME = '@phill-component/ui';
const packageRoot = path.resolve(__dirname, '..');
const repoRoot = path.resolve(packageRoot, '../..');
const distPath = path.join(packageRoot, 'dist');
const distUView = path.join(distPath, PKG_NAME);
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
  const reReadmeLinks = /(uview[- ]?ultra(?:-plus)?|uview[- ]?plus|uviewui|uview|ext\.dcloud\.net\.cn)/i;
  walk(distUView, (fp) => {
    if (!/\.(js|ts|vue|uvue|uts|scss|css|md)$/.test(fp)) return;
    let content = fs.readFileSync(fp, 'utf8');
    const original = content;
    content = content.split('\n').filter(line => !reFilePath.test(line)).join('\n');
    // 替换 tokens 导入
    content = content.replace(/['"]phillui-tokens['"]/g, "'@phill-component/tokens'");
    // 替换 icons 导入
    content = content.replace(/['"]phillui-icons['"]/g, "'@phill-component/icons'");
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

function main() {
  clean();
  syncSourceToDist();
  scrubDist();
  runRollup();
  patchImports();
  console.log('[Build] Done.');
}

main();
