#!/usr/bin/env node
const fs = require('fs');
const path = require('path');

/**
 * Install phillui-icons into uni_modules for UniApp projects.
 * - Detects project root (INIT_CWD preferred) and whether 'src' exists.
 * - Copies this package's dist assets into <project>/(src/)?uni_modules/phillui-icons/dist
 */

function resolvePackageRoot() {
  // When executed from node_modules: __dirname -> <pkg>/scripts
  // In workspace/dev: __dirname -> repo/packages/core/icons/scripts
  const scriptsDir = __dirname;
  const candidate = path.resolve(scriptsDir, '..'); // <pkg>
  if (fs.existsSync(path.join(candidate, 'dist'))) return candidate;
  const alt = path.resolve(scriptsDir, '../..'); // in case of different layouts
  if (fs.existsSync(path.join(alt, 'dist'))) return alt;
  throw new Error('Cannot locate phillui-icons package root (dist not found).');
}

function copyDir(src, dest, exclude = []) {
  if (!fs.existsSync(src)) return;
  if (!fs.existsSync(dest)) fs.mkdirSync(dest, { recursive: true });
  for (const entry of fs.readdirSync(src)) {
    if (exclude.some(pattern => {
      if (pattern.startsWith('*.')) return entry.endsWith(pattern.slice(1));
      return entry === pattern;
    })) continue;

    const s = path.join(src, entry);
    const d = path.join(dest, entry);
    const stat = fs.lstatSync(s);
    if (stat.isDirectory()) {
      copyDir(s, d, exclude);
    } else if (stat.isSymbolicLink()) {
      const real = fs.realpathSync(s);
      const realStat = fs.statSync(real);
      if (realStat.isDirectory()) {
        copyDir(real, d, exclude);
      } else {
        fs.copyFileSync(real, d);
      }
    } else {
      fs.copyFileSync(s, d);
    }
  }
}

function rimraf(p) {
  if (fs.existsSync(p)) fs.rmSync(p, { recursive: true, force: true });
}

function main() {
  const projectRoot = process.env.INIT_CWD || process.cwd();
  const srcDir = path.join(projectRoot, 'src');
  const uniModulesBase = fs.existsSync(srcDir)
    ? path.join(srcDir, 'uni_modules')
    : path.join(projectRoot, 'uni_modules');
  const targetPkgDir = path.join(uniModulesBase, '@phill-component/icons');

  const pkgRoot = resolvePackageRoot();
  const sourceDistDir = path.join(pkgRoot, 'dist');

  const isX = fs.existsSync(path.join(projectRoot, 'App.uvue')) || fs.existsSync(path.join(srcDir, 'App.uvue'));
  const exclude = isX ? [] : ['*.uvue', '*.uts'];

  try {
    if (!fs.existsSync(uniModulesBase)) fs.mkdirSync(uniModulesBase, { recursive: true });
    // Clean old content
    rimraf(targetPkgDir);
    fs.mkdirSync(targetPkgDir, { recursive: true });
    // Copy into package root (no "dist" folder needed for consumers)
    copyDir(path.join(sourceDistDir, 'mobile'), path.join(targetPkgDir, 'mobile'), exclude);
    copyDir(path.join(sourceDistDir, 'web'), path.join(targetPkgDir, 'web'), exclude);
    // Lightweight package.json for uni_modules (optional but helps tooling)
    const lightPkgJson = {
      name: 'phillui-icons',
      description: 'Icons assets for phillUI in UniApp uni_modules',
      main: 'mobile/vue/index.js',
    };
    fs.writeFileSync(path.join(targetPkgDir, 'package.json'), JSON.stringify(lightPkgJson, null, 2));
    console.log(`[phillui/icons] Installed to ${targetPkgDir} ${isX ? '(UniApp X)' : '(UniApp, Exclude .uvue/.uts)'}`);

    patchPagesJson(projectRoot, fs.existsSync(srcDir), isX);
  } catch (e) {
    console.error('[phillui/icons] Installation failed:', e.message);
    process.exit(1);
  }
}

function patchPagesJson(projectRoot, hasSrc, isX) {
  const pagesPath = hasSrc ? path.join(projectRoot, 'src/pages.json') : path.join(projectRoot, 'pages.json');
  if (!fs.existsSync(pagesPath)) return;

  try {
    const raw = fs.readFileSync(pagesPath, 'utf8');
    const json = JSON.parse(raw);
    json.easycom = json.easycom || {};
    json.easycom.autoscan = json.easycom.autoscan !== false;
    json.easycom.custom = json.easycom.custom || {};

    const key = '^icon-(.*)$';
    const value = isX
      ? '@/uni_modules/@phill-component/icons/mobile/uvue/icon-$1/icon-$1.uvue'
      : '@/uni_modules/@phill-component/icons/mobile/vue/icon-$1.vue';
    if (json.easycom.custom[key] !== value) {
      json.easycom.custom[key] = value;
      fs.writeFileSync(pagesPath, JSON.stringify(json, null, 2));
      console.log('[phillui/icons] Patched pages.json easycom mapping for icons.');
    }
  } catch (e) {
    console.warn('[phillui/icons] Skip patching pages.json:', e.message);
  }
}

function patchViteAlias(projectRoot, hasSrc) {
  const candidates = ['vite.config.ts', 'vite.config.js'].map(f => path.join(projectRoot, f));
  const vitePath = candidates.find(p => fs.existsSync(p));
  if (!vitePath) return;
  try {
    let code = fs.readFileSync(vitePath, 'utf8');
    if (code.includes('/* phillui-icons-alias */') || code.includes('phillui-icons')) {
      return; // already patched
    }
    const replacementPath = hasSrc ? 'path.resolve(__dirname, \'src/uni_modules/phillui-icons\')'
                                   : 'path.resolve(__dirname, \'uni_modules/phillui-icons\')';
    // Ensure path import
    if (!/import\s+path\s+from\s+['"]path['"]/.test(code)) {
      code = code.replace(/import\s+uni\s+from\s+['"]@dcloudio\/vite-plugin-uni['"]\s*;?/, (m) => `${m}\nimport path from "path";`);
    }
    // Insert alias entry
    if (/alias\s*:\s*\[/.test(code)) {
      code = code.replace(/alias\s*:\s*\[/, (m) => `${m}\n        /* phillui-icons-alias */ { find: /phillui-icons/, replacement: ${replacementPath} },`);
    } else if (/resolve\s*:\s*\{/.test(code)) {
      code = code.replace(/resolve\s*:\s*\{/, (m) => `${m}\n      alias: [\n        /* phillui-icons-alias */ { find: /phillui-icons/, replacement: ${replacementPath} }\n      ],`);
    } else {
      // Fallback: inject a resolve block after plugins
      code = code.replace(/plugins\s*:\s*\[[\s\S]*?\],/, (m) => `${m}\n    resolve: {\n      alias: [\n        /* phillui-icons-alias */ { find: /phillui-icons/, replacement: ${replacementPath} }\n      ]\n    },`);
    }
    fs.writeFileSync(vitePath, code, 'utf8');
    console.log('[phillui/icons] Patched Vite alias for phillui-icons.');
  } catch (e) {
    console.warn('[phillui/icons] Skip patching Vite alias:', e.message);
  }
}

main();
