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

  if (checkOnly || !doPublish) {
    console.log('[publish-ui] 校验通过。未执行发布（设置 PHILLUI_PUBLISH=1 才会发布）。');
    process.exit(0);
  }

  const projectRoot = path.resolve(pkgDir, '../../../');
  const npmrcPath = path.join(projectRoot, '.npmrc');

  try {
    // 预先检查版本
    try {
      const remoteVersion = cp.execSync(`npm view ${uiPkg.name} version`, { encoding: 'utf8' }).trim();
      if (remoteVersion === uiPkg.version) {
        console.log(`[publish-ui] ${uiPkg.name}@${uiPkg.version} 已存在，跳过。`);
        return;
      }
    } catch (e) {}

    let cmd = 'npm publish --access public';
    if (fs.existsSync(npmrcPath)) {
      console.log(`[publish-ui] 使用配置文件：${npmrcPath}`);
      cmd += ` --userconfig ${npmrcPath}`;

      // 验证身份
      try {
        const whoami = cp.execSync(`npm whoami --userconfig ${npmrcPath}`, { encoding: 'utf8' }).trim();
        console.log(`[publish-ui] 当前登录用户：${whoami}`);
      } catch (e) {
        console.error('[publish-ui] 身份验证失败，请检查 .npmrc 中的令牌。');
        process.exit(1);
      }
    }

    console.log(`[publish-ui] 执行：${cmd}`);
    cp.execSync(cmd, { stdio: 'pipe' });
    console.log(`[publish-ui] ${uiPkg.name}@${uiPkg.version} 发布成功！`);
  } catch (e) {
    console.error('[publish-ui] 发布失败：', e.message);
    if (e.stdout) console.error('STDOUT:', e.stdout.toString());
    if (e.stderr) console.error('STDERR:', e.stderr.toString());
    process.exit(e.status || 1);
  }
}

main();
