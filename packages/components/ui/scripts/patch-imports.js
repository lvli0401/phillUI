const fs = require('fs');
const path = require('path');

/**
 * Patch imports in dist
 * - Replace dayjs/clipboard to vendor files
 * - Rewrite absolute/alias uni_modules paths to relative paths within dist
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

function relToIconsDir(filePath) {
  const iconsDir = path.join(distRoot, '@phill-component/icons');
  const rel = path.relative(path.dirname(filePath), iconsDir).split(path.sep).join('/');
  return rel.endsWith('/') ? rel : rel + '/';
}

function relToTokensDir(filePath) {
  const tokensDir = path.join(distRoot, '@phill-component/tokens');
  const rel = path.relative(path.dirname(filePath), tokensDir).split(path.sep).join('/');
  return rel.endsWith('/') ? rel : rel + '/';
}

const replacements = [
  // Rewrite absolute/alias uni_modules paths to relative (icons)
  {
    pattern: /(['"])\/uni_modules\/@phill-component\/icons\//g,
    replacement: (filePath, _m0, quote) => `${quote}${relToIconsDir(filePath)}`
  },
  {
    pattern: /@\/uni_modules\/@phill-component\/icons\//g,
    replacement: (filePath) => relToIconsDir(filePath)
  },
  // Rewrite absolute/alias uni_modules paths to relative (tokens)
  {
    pattern: /(['"])\/uni_modules\/@phill-component\/tokens\//g,
    replacement: (filePath, _m0, quote) => `${quote}${relToTokensDir(filePath)}`
  },
  {
    pattern: /@\/uni_modules\/@phill-component\/tokens\//g,
    replacement: (filePath) => relToTokensDir(filePath)
  },
  // Bare specifiers: export/import from '@phill-component/icons' -> relative to staged dist
  {
    pattern: /from\s+(['"])@phill-component\/icons\1/g,
    replacement: (filePath, _q) => {
      const base = relToIconsDir(filePath);
      return `from '${base}dist/index.js'`;
    }
  },
  {
    pattern: /from\s+(['"])@phill-component\/tokens\1/g,
    replacement: (filePath, _q) => {
      const base = relToTokensDir(filePath);
      return `from '${base}index.js'`;
    }
  },
  // Legacy relative path fixes from phillui-* to new icons/tokens dirs
  {
    pattern: /\.\.\/\.\.\/\.\.\/phillui-icons\//g,
    replacement: (filePath) => relToIconsDir(filePath)
  },
  {
    pattern: /\.\.\/\.\.\/\.\.\/phillui-tokens\//g,
    replacement: (filePath) => relToTokensDir(filePath)
  },
  // Vendor redirects
  {
    pattern: /import\s+dayjs\s+from\s+['"]dayjs['"]/g,
    replacement: (filePath) => {
      const relPath = path.relative(path.dirname(filePath), path.join(distUViewPath, 'vendor/dayjs.min.js')).split(path.sep).join('/');
      return `import dayjs from './${relPath}'`;
    }
  },
  {
    pattern: /import\s+Clipboard\s+from\s+['"]clipboard['"]/g,
    replacement: (filePath) => {
      const relPath = path.relative(path.dirname(filePath), path.join(distUViewPath, 'vendor/clipboard.min.js')).split(path.sep).join('/');
      return `import Clipboard from './${relPath}'`;
    }
  }
];

function patchFile(filePath) {
  if (!['.js', '.vue', '.uvue', '.uts'].some(ext => filePath.endsWith(ext))) return;
  let content = fs.readFileSync(filePath, 'utf8');
  let changed = false;
  replacements.forEach(conf => {
    if (conf.pattern.test(content)) {
      content = content.replace(conf.pattern, (...args) => conf.replacement(filePath, ...args));
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
  console.warn('[Patch] dist/@phill-component/ui not found, skip.');
}
