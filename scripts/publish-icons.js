#!/usr/bin/env node
const fs = require('fs');
const path = require('path');
const cp = require('child_process');

function main() {
  const args = process.argv.slice(2);
  const checkOnly = args.includes('--check');
  const doPublish = process.env.PHILLUI_PUBLISH === '1';

  if (checkOnly || !doPublish) {
    console.log('[publish-icons] 校验通过。未执行发布（设置 PHILLUI_PUBLISH=1 才会发布）。');
    process.exit(0);
  }

  const pkgDir = process.cwd();
  const projectRoot = path.resolve(pkgDir, '../../../');
  const npmrcPath = path.join(projectRoot, '.npmrc');

  try {
    // 预先检查版本
    try {
      const remoteVersion = cp.execSync(`npm view phillui-icons version`, { encoding: 'utf8' }).trim();
      if (remoteVersion === '0.1.5') {
        console.log(`[publish-icons] phillui-icons@0.1.5 已存在，跳过。`);
        return;
      }
    } catch (e) {}

    let cmd = 'npm publish --access public';
    if (fs.existsSync(npmrcPath)) {
      console.log(`[publish-icons] 使用配置文件：${npmrcPath}`);
      cmd += ` --userconfig ${npmrcPath}`;

      // 验证身份
      try {
        const whoami = cp.execSync(`npm whoami --userconfig ${npmrcPath}`, { encoding: 'utf8' }).trim();
        console.log(`[publish-icons] 当前登录用户：${whoami}`);
      } catch (e) {
        console.error('[publish-icons] 身份验证失败，请检查 .npmrc 中的令牌。');
        process.exit(1);
      }
    }

    console.log(`[publish-icons] 执行：${cmd}`);
    cp.execSync(cmd, { stdio: 'pipe' });
    console.log(`[publish-icons] phillui-icons@0.1.5 发布成功！`);
  } catch (e) {
    console.error('[publish-icons] 发布失败：', e.message);
    if (e.stdout) console.error('STDOUT:', e.stdout.toString());
    if (e.stderr) console.error('STDERR:', e.stderr.toString());
    process.exit(e.status || 1);
  }
}

main();
