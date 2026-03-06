#!/usr/bin/env node
const fs = require('fs');
const path = require('path');
const cp = require('child_process');

function readJSON(p) {
  return JSON.parse(fs.readFileSync(p, 'utf8'));
}

function main() {
  const args = process.argv.slice(2);
  const checkOnly = args.includes('--check');

  const pkgDir = process.cwd();
  const tokensPkgPath = path.join(pkgDir, 'package.json');
  if (!fs.existsSync(tokensPkgPath)) {
    console.error('[publish-tokens] 未在 tokens 包目录下执行。');
    process.exit(1);
  }
  const tokensPkg = readJSON(tokensPkgPath);

  // 不再强制 tokens 与 ui 版本一致，仅在 tokens 发布后联动 UI 发布

  if (checkOnly) {
    console.log('[publish-tokens] 校验通过（未执行发布）。');
    process.exit(0);
  }

  try {
    const publishCmd = 'pnpm publish --no-git-checks --access public';
    console.log(`[publish-tokens] 执行：${publishCmd}`);
    cp.execSync(publishCmd, { stdio: 'inherit' });
  } catch (e) {
    console.error('[publish-tokens] 发布失败：', e.message);
    process.exit(e.status || 1);
  }

  // 联动发布 UI
  try {
    const uiPublishCmd = 'node ../../../scripts/publish-ui.js';
    console.log(`[publish-tokens] 联动执行 UI 发布：${uiPublishCmd}`);
    cp.execSync(uiPublishCmd, { stdio: 'inherit', cwd: path.resolve(pkgDir, '../../components/ui') });
  } catch (e) {
    console.error('[publish-tokens] 联动发布 UI 失败：', e.message);
    process.exit(e.status || 1);
  }
}

main();
