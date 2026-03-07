const fs = require('fs');
const path = require('path');

/**
 * Patch imports in dist
 * Replace: import dayjs from 'dayjs' -> import from ./vendor/dayjs.min.js
 *          import Clipboard from 'clipboard' -> ./vendor/clipboard.min.js
 *          @/uni_modules/lime-dayuts -> relative path to dist/lime-dayuts (if present)
 */

const distRoot = path.resolve(__dirname, '../dist');
const distUViewPath = path.join(distRoot, 'phillui');

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
    pattern: /@\/uni_modules\/lime-dayuts/g,
    replacement: (filePath) => {
      // In dist, phillui sources are in dist/phillui
      // But they will be installed into uni_modules/@phillui/ui
      // So the relative path from a file in dist/phillui/components/...
      // to dist/lime-dayuts needs to account for the extra level in @phillui/ui
      const relToDist = path.relative(path.dirname(filePath), path.dirname(distUViewPath)).split(path.sep).join('/');
      // Add an extra '../' because phillui is installed in @phillui/ui (2 levels) 
      // instead of just phillui (1 level) in uni_modules
      return `./../${relToDist}/lime-dayuts`;
    }
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
