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

  const npmToken = process.env.NPM_TOKEN;
  const npmrcPath = path.join(pkgDir, '.npmrc');
  let npmrcCreated = false;

  try {
    if (npmToken) {
      console.log('[publish-ui] 检测到 NPM_TOKEN，创建临时 .npmrc...');
      const content = `registry=https://registry.npmjs.org/\n//registry.npmjs.org/:_authToken=${npmToken}\n`;
      fs.writeFileSync(npmrcPath, content);
      npmrcCreated = true;
    }

    const cmd = 'npm publish --access public';
    console.log(`[publish-ui] 执行：${cmd}`);
    cp.execSync(cmd, { stdio: 'pipe' });
  } catch (e) {
    const errOutput = e.stdout?.toString() + e.stderr?.toString() + e.message;
    if (errOutput.includes('403') || errOutput.includes('previously published versions') || errOutput.includes('404')) {
      try {
        const remoteVersion = cp.execSync(`npm view ${uiPkg.name} version`, { encoding: 'utf8' }).trim();
        if (remoteVersion === uiPkg.version) {
          console.log(`[publish-ui] ${uiPkg.name}@${uiPkg.version} 已存在，跳过。`);
          return;
        }
      } catch (viewErr) {}
    }
    console.error('[publish-ui] 发布失败：', e.message);
    process.exit(e.status || 1);
  } finally {
    if (npmrcCreated && fs.existsSync(npmrcPath)) {
      console.log('[publish-ui] 清理临时 .npmrc');
      fs.unlinkSync(npmrcPath);
    }
  }
}

main();
