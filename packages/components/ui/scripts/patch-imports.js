const fs = require('fs');
const path = require('path');

/**
 * Patch imports in dist
 * Replace: import dayjs from 'dayjs' -> import from ./vendor/dayjs.min.js
 *          import Clipboard from 'clipboard' -> ./vendor/clipboard.min.js
 *          @/uni_modules/lime-dayuts -> relative path to dist/lime-dayuts (if present)
 */

const distRoot = path.resolve(__dirname, '../dist');
const distUViewPath = path.join(distRoot, '@phill-component/ui');

function walk(dir, callback) {
  fs.readdirSync(dir).forEach(f => {
    const p = path.join(dir, f);
    const stat = fs.statSync(p);
    if (stat.isDirectory()) walk(p, callback);
    else callback(p);
  });
}

const replacements = [
  {
    pattern: /import\s+dayjs\s+from\s+['"]dayjs['"]/g,
    replacement: (filePath) => {
      const relPath = path.relative(path.dirname(filePath), path.join(distUViewPath, 'vendor/dayjs.min.js'));
      return `import dayjs from './${relPath}'`;
    }
  },
  {
    pattern: /import\s+Clipboard\s+from\s+['"]clipboard['"]/g,
    replacement: (filePath) => {
      const relPath = path.relative(path.dirname(filePath), path.join(distUViewPath, 'vendor/clipboard.min.js'));
      return `import Clipboard from './${relPath}'`;
    }
  },
  {
    pattern: /@\/uni_modules\/phillui-icons/g,
    replacement: () => '@phill-component/icons'
  },
  {
    pattern: /@\/uni_modules\/phillui-tokens/g,
    replacement: () => '@phill-component/tokens'
  },
  {
    pattern: /['"]phillui-tokens['"]/g,
    replacement: () => "'@phill-component/tokens'"
  },
  {
    pattern: /['"]phillui-icons['"]/g,
    replacement: () => "'@phill-component/icons'"
  }
];

function patchFile(filePath) {
  if (!['.js', '.vue', '.uvue', '.uts'].some(ext => filePath.endsWith(ext))) return;
  let content = fs.readFileSync(filePath, 'utf8');
  let changed = false;
  replacements.forEach(conf => {
    if (conf.pattern.test(content)) {
      content = content.replace(conf.pattern, conf.replacement(filePath));
      changed = true;
    }
  });
  if (changed) {
    fs.writeFileSync(filePath, content, 'utf8');
    console.log('[Patch]', path.relative(distRoot, filePath));
  }
}

if (fs.existsSync(distUViewPath)) {
  walk(distUViewPath, patchFile);
  console.log('[Patch] Complete.');
} else {
  console.warn('[Patch] dist/phillui not found, skip.');
}
