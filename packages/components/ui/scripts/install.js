#!/usr/bin/env node
const fs = require('fs');
const path = require('path');

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
  const uniModulesBase = fs.existsSync(srcDir) ? path.join(srcDir, 'uni_modules') : path.join(projectRoot, 'uni_modules');
  const targetDir = path.join(uniModulesBase, '@phillui', 'ui');

  let pkgPath;
  try {
    pkgPath = path.resolve(__dirname, '..');
  } catch (e) {
    console.error('[phillui/ui] Cannot resolve package root.');
    process.exit(1);
  }
  const distDir = path.join(pkgPath, 'dist');
  const distUView = path.join(distDir, 'phillui');
  if (!fs.existsSync(distDir)) {
    console.error('[phillui/ui] dist not found. Please run build before install.');
    process.exit(1);
  }

  const isX = fs.existsSync(path.join(projectRoot, 'App.uvue')) || fs.existsSync(path.join(srcDir, 'App.uvue'));
  const exclude = isX ? [] : ['*.uvue', '*.uts'];

  try {
    if (!fs.existsSync(uniModulesBase)) fs.mkdirSync(uniModulesBase, { recursive: true });
    rimraf(targetDir);
    fs.mkdirSync(targetDir, { recursive: true });
    copyDir(distUView, targetDir, exclude);
    const extras = fs.readdirSync(distDir).filter(n => n !== 'phillui');
    extras.forEach(name => {
      const src = path.join(distDir, name);
      if (!fs.statSync(src).isDirectory()) return;
      const dest = path.join(uniModulesBase, name);
      rimraf(dest);
      fs.mkdirSync(dest, { recursive: true });
      copyDir(src, dest, exclude);
    });
    console.log(`[phillui/ui] Installed to ${targetDir} ${isX ? '(UniApp X)' : '(UniApp, Exclude .uvue/.uts)'}`);
  } catch (e) {
    console.error('[phillui/ui] Installation failed:', e.message);
    process.exit(1);
  }
}

main();
