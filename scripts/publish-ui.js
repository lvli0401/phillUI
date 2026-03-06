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
  const doPublish = process.env.PHILLUI_PUBLISH === '1';

  const pkgDir = process.cwd();
  const uiPkgPath = path.join(pkgDir, 'package.json');
  if (!fs.existsSync(uiPkgPath)) {
    console.error('[publish-ui] 未在包目录下执行。');
    process.exit(1);
  }
  const uiPkg = readJSON(uiPkgPath);

  // 不再强制 tokens 与 ui 版本一致

  if (checkOnly || !doPublish) {
    console.log('[publish-ui] 校验通过。未执行发布（设置 PHILLUI_PUBLISH=1 才会发布）。');
    process.exit(0);
  }

  try {
    const cmd = 'pnpm publish --no-git-checks --access public';
    console.log(`[publish-ui] 执行：${cmd}`);
    cp.execSync(cmd, { stdio: 'inherit' });
  } catch (e) {
    console.error('[publish-ui] 发布失败：', e.message);
    process.exit(e.status || 1);
  }
}

main();
