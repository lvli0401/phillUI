const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

/**
 * Build script for phillUI (subpackage)
 * 1. Clean dist
 * 2. Sync package sources to dist (exclude node_modules, scripts, dist)
 * 2.5. Stage scoped deps (@phill-component/icons, @phill-component/tokens) into dist
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
  console.log('[Build] Sync sources to dist/@phill-component/ui...');
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

function existsDir(p) {
  try {
    return fs.existsSync(p) && fs.statSync(p).isDirectory();
  } catch {
    return false;
  }
}

function rsyncDir(src, dest) {
  fs.mkdirSync(path.dirname(dest), { recursive: true });
  execSync(`rsync -aq "${src}/" "${dest}/"`);
}

/**
 * Stage scoped dependencies into dist so install.js can copy them into uni_modules
 * - @phill-component/icons -> dist/@phill-component/icons
 * - @phill-component/tokens -> dist/@phill-component/tokens
 */
function stageScopedDeps() {
  const candidates = [
    {
      name: '@phill-component/icons',
      nodeModulesPath: path.join(packageRoot, 'node_modules/@phill-component/icons'),
      repoPath: path.resolve(packageRoot, '../../core/icons'),
      distSubdir: '@phill-component/icons',
      pick: 'dist', // copy dist dir
    },
    {
      name: '@phill-component/tokens',
      nodeModulesPath: path.join(packageRoot, 'node_modules/@phill-component/tokens'),
      repoPath: path.resolve(packageRoot, '../../core/tokens'),
      distSubdir: '@phill-component/tokens',
      pick: 'dist', // copy dist dir
    },
  ];

  candidates.forEach(dep => {
    let sourceBase = null;
    if (existsDir(dep.nodeModulesPath)) {
      sourceBase = dep.nodeModulesPath;
    } else if (existsDir(dep.repoPath)) {
      sourceBase = dep.repoPath;
    }
    if (!sourceBase) {
      console.warn(`[Build] Skip staging ${dep.name} (not found)`);
      return;
    }
    const destBase = path.join(distPath, dep.distSubdir);
    fs.mkdirSync(destBase, { recursive: true });
    if (dep.pick === 'dist') {
      const src = path.join(sourceBase, 'dist');
      if (existsDir(src)) {
        rsyncDir(src, path.join(destBase, 'dist'));
        if (dep.name === '@phill-component/tokens') {
          const indexTs = path.join(src, 'index.ts');
          if (fs.existsSync(indexTs)) fs.copyFileSync(indexTs, path.join(destBase, 'index.ts'));
          const indexUts = path.join(src, 'index.uts');
          if (fs.existsSync(indexUts)) fs.copyFileSync(indexUts, path.join(destBase, 'index.uts'));
          const tokensScss = path.join(src, 'tokens.scss');
          if (fs.existsSync(tokensScss)) fs.copyFileSync(tokensScss, path.join(destBase, 'tokens.scss'));
        }
        console.log(`[Build] Staged ${dep.name} dist -> ${path.relative(packageRoot, destBase)}`);
      } else {
        console.warn(`[Build] ${dep.name} has no dist folder at ${src}, skipped`);
      }
    } else {
      // tokens: copy index.js and tokens directory if present
      const indexJs = path.join(sourceBase, 'index.js');
      if (fs.existsSync(indexJs)) {
        fs.copyFileSync(indexJs, path.join(destBase, 'index.js'));
      }
      const indexUts = path.join(sourceBase, 'index.uts');
      if (fs.existsSync(indexUts)) {
        fs.copyFileSync(indexUts, path.join(destBase, 'index.uts'));
      }
      const tokensScss = path.join(sourceBase, 'tokens.scss');
      if (fs.existsSync(tokensScss)) {
        fs.copyFileSync(tokensScss, path.join(destBase, 'tokens.scss'));
      }
      const tokensDir = path.join(sourceBase, 'tokens');
      if (existsDir(tokensDir)) {
        rsyncDir(tokensDir, path.join(destBase, 'tokens'));
      }
      console.log(`[Build] Staged ${dep.name} -> ${path.relative(packageRoot, destBase)}`);
    }
  });
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
  walk(distUView, fp => {
    if (!/\.(js|ts|vue|uvue|uts|scss|css|md)$/.test(fp)) return;
    let content = fs.readFileSync(fp, 'utf8');
    const original = content;
    content = content
      .split('\n')
      .filter(line => !reFilePath.test(line))
      .join('\n');
    // 替换 tokens 导入
    content = content.replace(/['"]phillui-tokens['"]/g, "'@phill-component/tokens'");
    // 替换 icons 导入
    content = content.replace(/['"]phillui-icons['"]/g, "'@phill-component/icons'");
    // clean README external links
    if (path.basename(fp).toLowerCase() === 'readme.md') {
      content = content
        .split('\n')
        .filter(line => !reReadmeLinks.test(line))
        .join('\n');
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
  stageScopedDeps();
  scrubDist();
  runRollup();
  patchImports();
  console.log('[Build] Done.');
}

main();
