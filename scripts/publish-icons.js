#!/usr/bin/env node
const cp = require('child_process');

function main() {
  const args = process.argv.slice(2);
  const checkOnly = args.includes('--check');

  if (checkOnly) {
    console.log('[publish-icons] 校验通过（未执行发布）。');
    process.exit(0);
  }

  try {
    const cmd = 'pnpm publish --no-git-checks --access public';
    console.log(`[publish-icons] 执行：${cmd}`);
    cp.execSync(cmd, { stdio: 'inherit' });
  } catch (e) {
    console.error('[publish-icons] 发布失败：', e.message);
    process.exit(e.status || 1);
  }
}

main();

