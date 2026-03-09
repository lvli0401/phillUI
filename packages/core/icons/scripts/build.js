const svgtofont = require('svgtofont').default;
const path = require('path');
const fs = require('fs');
const { optimize } = require('svgo');
const Case = require('case');

const rootDir = path.resolve(__dirname, '..');
const srcDir = path.resolve(rootDir, 'svg');
const distDir = path.resolve(rootDir, 'dist');
  const vueDir = path.resolve(distDir, 'vue');
const uniappDir = path.resolve(distDir, 'uniapp');
const uniappCompDir = path.resolve(distDir, 'uniapp-components');
const uniappImgDir = path.resolve(uniappDir, 'images');

// Ensure directories exist
[distDir, vueDir, uniappDir, uniappCompDir, uniappImgDir].forEach(dir => {
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
});

function isMultiColor(svgContent) {
  const colorRegex = /(fill|stroke)="(?!none|currentColor|\$)(#[0-9a-fA-F]{3,6}|rgba?|hsla?)/gi;
  const matches = svgContent.match(colorRegex);
  if (!matches) return false;
  const colors = new Set(matches.map(m => m.split('"')[1].toLowerCase()));
  return colors.size > 1;
}

async function build() {
  const files = fs.readdirSync(srcDir).filter(f => f.endsWith('.svg'));
  const singleColorIcons = [];
  const multiColorIcons = [];
  const iconData = [];
  const svgMappings = {};

  console.log(`Building icons from ${srcDir} to ${distDir}...`);

  for (const file of files) {
    const name = file.replace('.svg', '');
    const pascalName = Case.pascal(name);
    const content = fs.readFileSync(path.join(srcDir, file), 'utf-8');
    
    const multi = isMultiColor(content);
    
    // Optimize
    const svgoPlugins = ['preset-default', 'removeDimensions'];
    if (!multi) {
      svgoPlugins.push({
        name: 'convertColors',
        params: { currentColor: true }
      });
    }

    let optimized = optimize(content, { 
      path: file,
      plugins: svgoPlugins
    }).data;

    const innerSvg = optimized.replace(/<svg[^>]*>|<\/svg>/g, '');
    const base64Data = Buffer.from(optimized, 'utf8').toString('base64');
    const dataUri = `data:image/svg+xml;base64,${base64Data}`;

    // 1. Generate Standard Vue Component using <image> with base64 URI
    const vueContent = `<template>
  <image :src="src" v-bind="$attrs" />
</template>
<script setup>
const src = ${JSON.stringify(dataUri)};
</script>`;
    fs.writeFileSync(path.join(vueDir, `${pascalName}.vue`), vueContent);

    // 2. Optimized Standalone SVG for Native/MP
    // Always include image version and base64 mapping
    if (multi) multiColorIcons.push(name);
    svgMappings[name] = { dataUri, inner: innerSvg, multi };
    // Also emit standalone image for fallback
    fs.writeFileSync(path.join(uniappImgDir, file), optimized);

    iconData.push({ name, pascalName, multi });
  }

  // 3. Generate Vue Entry
  const entryContent = iconData.map(i => `export { default as Icon${i.pascalName} } from './vue/${i.pascalName}.vue';`).join('\n');
  fs.writeFileSync(path.join(distDir, 'index.js'), entryContent);

  // 4. Build Native Font (UniApp Native Single-color)
  let fontMappings = {};
  if (singleColorIcons.length > 0) {
    const tempFontSrc = path.join(rootDir, 'temp-font-src');
    if (!fs.existsSync(tempFontSrc)) fs.mkdirSync(tempFontSrc);
    singleColorIcons.forEach(f => fs.copyFileSync(path.join(srcDir, f), path.join(tempFontSrc, f)));

    await svgtofont({
      src: tempFontSrc,
      dist: uniappDir,
      fontName: 'upicon-custom',
      css: false,
      outSVGReact: false,
      outSVGPath: false,
      typescript: true,
      emptyDist: false,
      getIconUnicode: (name, unicode) => {
        fontMappings[name] = unicode;
      }
    });
    fs.rmSync(tempFontSrc, { recursive: true, force: true });
    console.log('Native font generated.');
  }

  // 5. Generate Mappings and per-icon modules for on-demand loading
  fs.writeFileSync(path.join(uniappDir, 'icons-svg.js'), `export default ${JSON.stringify(svgMappings, null, 2)}`);
  fs.writeFileSync(path.join(uniappDir, 'icons-svg.uts'), `export default ${JSON.stringify(svgMappings, null, 2)} as UTSJSONObject`);
  const svgsDir = path.join(uniappDir, 'svgs');
  if (!fs.existsSync(svgsDir)) fs.mkdirSync(svgsDir, { recursive: true });
  Object.entries(svgMappings).forEach(([n, rec]) => {
    const mod = `export default ${JSON.stringify(rec, null, 2)};`;
    fs.writeFileSync(path.join(svgsDir, `${n}.js`), mod);
  });
  fs.writeFileSync(path.join(uniappDir, 'icons-generated.js'), `export default ${JSON.stringify(fontMappings, null, 2)}`);
  fs.writeFileSync(path.join(uniappDir, 'icons-generated.uts'), `export default ${JSON.stringify(fontMappings, null, 2)} as UTSJSONObject`);
  fs.writeFileSync(path.join(uniappDir, 'icons-custom.json'), JSON.stringify(iconData.map(i => i.name), null, 2));
  fs.writeFileSync(path.join(uniappDir, 'icons-multicolor.json'), JSON.stringify(multiColorIcons, null, 2));

  console.log('All icons built to dist successfully.');
}

build().catch(console.error);
