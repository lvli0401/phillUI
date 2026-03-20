#!/usr/bin/env node
const fs = require('fs');
const path = require('path');

function resolvePackageRoot() {
  const scriptsDir = __dirname;
  const candidate = path.resolve(scriptsDir, '..');
  if (fs.existsSync(path.join(candidate, 'dist'))) return candidate;
  const alt = path.resolve(scriptsDir, '../..');
  if (fs.existsSync(path.join(alt, 'dist'))) return alt;
  throw new Error('Cannot locate @phill-component/tokens package root (dist not found).');
}

function copyDir(src, dest) {
  if (!fs.existsSync(src)) return;
  if (!fs.existsSync(dest)) fs.mkdirSync(dest, { recursive: true });
  for (const entry of fs.readdirSync(src)) {
    const s = path.join(src, entry);
    const d = path.join(dest, entry);
    const stat = fs.lstatSync(s);
    if (stat.isDirectory()) {
      copyDir(s, d);
    } else if (stat.isSymbolicLink()) {
      const real = fs.realpathSync(s);
      const realStat = fs.statSync(real);
      if (realStat.isDirectory()) {
        copyDir(real, d);
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
  const targetPkgDir = path.join(uniModulesBase, '@phill-component/tokens');

  const pkgRoot = resolvePackageRoot();
  const distDir = path.join(pkgRoot, 'dist');
  const targetDistDir = path.join(targetPkgDir, 'dist');

  try {
    if (!fs.existsSync(uniModulesBase)) fs.mkdirSync(uniModulesBase, { recursive: true });
    rimraf(targetPkgDir);
    fs.mkdirSync(targetPkgDir, { recursive: true });
    copyDir(distDir, targetDistDir);
    const lightPkgJson = {
      name: 'phillui-tokens',
      description: 'Design tokens for phillUI in UniApp uni_modules',
      main: 'dist/index.js'
    };
    fs.writeFileSync(path.join(targetPkgDir, 'package.json'), JSON.stringify(lightPkgJson, null, 2));
    console.log(`[phillUI-tokens] Installed to ${targetPkgDir}`);
  } catch (e) {
    console.error('[phillUI-tokens] Installation failed:', e.message);
    process.exit(1);
  }
}

main();
