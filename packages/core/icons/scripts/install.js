#!/usr/bin/env node
const fs = require('fs');
const path = require('path');

/**
 * Install @phillui/icons into uni_modules for UniApp projects.
 * - Detects project root (INIT_CWD preferred) and whether 'src' exists.
 * - Copies this package's dist assets into <project>/(src/)?uni_modules/@phillui/icons/dist
 */

function resolvePackageRoot() {
  // When executed from node_modules: __dirname -> <pkg>/scripts
  // In workspace/dev: __dirname -> repo/packages/core/icons/scripts
  const scriptsDir = __dirname;
  const candidate = path.resolve(scriptsDir, '..'); // <pkg>
  if (fs.existsSync(path.join(candidate, 'dist'))) return candidate;
  const alt = path.resolve(scriptsDir, '../..'); // in case of different layouts
  if (fs.existsSync(path.join(alt, 'dist'))) return alt;
  throw new Error('Cannot locate @phillui/icons package root (dist not found).');
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
  const targetPkgDir = path.join(uniModulesBase, '@phillui', 'icons');
  const targetDistDir = path.join(targetPkgDir, 'dist');

  const pkgRoot = resolvePackageRoot();
  const sourceDistDir = path.join(pkgRoot, 'dist');

  const isX = fs.existsSync(path.join(projectRoot, 'App.uvue')) || fs.existsSync(path.join(srcDir, 'App.uvue'));
  const exclude = isX ? [] : ['*.uvue', '*.uts'];

  try {
    if (!fs.existsSync(uniModulesBase)) fs.mkdirSync(uniModulesBase, { recursive: true });
    // Clean old content
    rimraf(targetPkgDir);
    fs.mkdirSync(targetPkgDir, { recursive: true });
    // Only copy dist (uniapp and vue build outputs)
    copyDir(sourceDistDir, targetDistDir, exclude);
    // Lightweight package.json for uni_modules (optional but helps tooling)
    const lightPkgJson = {
      name: '@phillui/icons',
      description: 'Icons assets for phillUI in UniApp uni_modules',
    };
    fs.writeFileSync(path.join(targetPkgDir, 'package.json'), JSON.stringify(lightPkgJson, null, 2));
    console.log(`[phillui/icons] Installed to ${targetDistDir} ${isX ? '(UniApp X)' : '(UniApp, Exclude .uvue/.uts)'}`);

    // Optional: Patch vite alias to map @phillui/icons -> src/uni_modules/@phillui/icons
    // Not strictly required after switching to relative imports, but helpful for direct imports.
    patchViteAlias(projectRoot, !!fs.existsSync(srcDir));
  } catch (e) {
    console.error('[phillui/icons] Installation failed:', e.message);
    process.exit(1);
  }
}

function patchViteAlias(projectRoot, hasSrc) {
  const candidates = ['vite.config.ts', 'vite.config.js'].map(f => path.join(projectRoot, f));
  const vitePath = candidates.find(p => fs.existsSync(p));
  if (!vitePath) return;
  try {
    let code = fs.readFileSync(vitePath, 'utf8');
    if (code.includes('/* phillui-icons-alias */') || code.includes('@phillui/icons')) {
      return; // already patched
    }
    const replacementPath = hasSrc ? 'path.resolve(__dirname, \'src/uni_modules/@phillui/icons\')'
                                   : 'path.resolve(__dirname, \'uni_modules/@phillui/icons\')';
    // Ensure path import
    if (!/import\s+path\s+from\s+['"]path['"]/.test(code)) {
      code = code.replace(/import\s+uni\s+from\s+['"]@dcloudio\/vite-plugin-uni['"]\s*;?/, (m) => `${m}\nimport path from "path";`);
    }
    // Insert alias entry
    if (/alias\s*:\s*\[/.test(code)) {
      code = code.replace(/alias\s*:\s*\[/, (m) => `${m}\n        /* phillui-icons-alias */ { find: /^@phillui\\/icons/, replacement: ${replacementPath} },`);
    } else if (/resolve\s*:\s*\{/.test(code)) {
      code = code.replace(/resolve\s*:\s*\{/, (m) => `${m}\n      alias: [\n        /* phillui-icons-alias */ { find: /^@phillui\\/icons/, replacement: ${replacementPath} }\n      ],`);
    } else {
      // Fallback: inject a resolve block after plugins
      code = code.replace(/plugins\s*:\s*\[[\s\S]*?\],/, (m) => `${m}\n    resolve: {\n      alias: [\n        /* phillui-icons-alias */ { find: /^@phillui\\/icons/, replacement: ${replacementPath} }\n      ]\n    },`);
    }
    fs.writeFileSync(vitePath, code, 'utf8');
    console.log('[phillui/icons] Patched Vite alias for @phillui/icons.');
  } catch (e) {
    console.warn('[phillui/icons] Skip patching Vite alias:', e.message);
  }
}

main();
