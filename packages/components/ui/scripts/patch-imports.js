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
    // Handle any @/uni_modules/ references and convert to relative
    pattern: /@\/uni_modules\/([^'"]+)/g,
    replacement: (filePath) => (match, group1) => {
      // Current file is in packages/components/ui/dist/phillui/...
      // distUViewPath is packages/components/ui/dist/phillui
      
      // Relative path from current file directory to phillui (dist root)
      const relToDist = path.relative(path.dirname(filePath), distUViewPath).split(path.sep).join('/');
      
      // If we are in components/up-icon/up-icon.vue
      // path.dirname(filePath) is .../phillui/components/up-icon
      // relToDist is "../../"
      // uni_modules root is 1 level above phillui
      // So relative path to group1 (phillui-icons/...) is relToDist + "/../" + group1
      
      let finalPath = path.join(relToDist, '..', group1).split(path.sep).join('/');
      if (!finalPath.startsWith('.')) {
        finalPath = './' + finalPath;
      }
      return finalPath;
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
