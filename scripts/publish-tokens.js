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
  const tokensPkgPath = path.join(pkgDir, 'package.json');
  if (!fs.existsSync(tokensPkgPath)) {
    console.error('[publish-tokens] 未在 tokens 包目录下执行。');
    process.exit(1);
  }
  const tokensPkg = readJSON(tokensPkgPath);

  // 不再强制 tokens 与 ui 版本一致，仅在 tokens 发布后联动 UI 发布

  if (checkOnly || !doPublish) {
    console.log('[publish-tokens] 校验通过。未执行发布（设置 PHILLUI_PUBLISH=1 才会发布）。');
    process.exit(0);
  }

  const npmToken = process.env.NPM_TOKEN;
  const npmrcPath = path.join(pkgDir, '.npmrc');
  let npmrcCreated = false;

  try {
    if (npmToken) {
      console.log('[publish-tokens] 检测到 NPM_TOKEN，创建临时 .npmrc...');
      fs.writeFileSync(npmrcPath, `//registry.npmjs.org/:_authToken=${npmToken}\n`);
      npmrcCreated = true;
    }

    const publishCmd = 'pnpm publish --no-git-checks --access public';
    console.log(`[publish-tokens] 执行：${publishCmd}`);
    cp.execSync(publishCmd, { stdio: 'inherit' });
  } catch (e) {
    // 检查版本是否已存在
    try {
      const remoteVersion = cp.execSync(`npm view ${tokensPkg.name} version`, { encoding: 'utf8' }).trim();
      if (remoteVersion === tokensPkg.version) {
        console.log(`[publish-tokens] ${tokensPkg.name}@${tokensPkg.version} 已存在，跳过。`);
        return; // 使用 return 而不是 process.exit，以便后续清理
      }
    } catch (viewErr) {
      // 忽略 view 错误
    }
    console.error('[publish-tokens] 发布失败：', e.message);
    process.exit(e.status || 1);
  } finally {
    if (npmrcCreated && fs.existsSync(npmrcPath)) {
      console.log('[publish-tokens] 清理临时 .npmrc');
      fs.unlinkSync(npmrcPath);
    }
  }
}

main();
