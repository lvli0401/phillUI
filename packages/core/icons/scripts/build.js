const path = require('path');
const fs = require('fs');
const { optimize } = require('svgo');
const Case = require('case');

const rootDir = path.resolve(__dirname, '..');
const srcDir = path.resolve(rootDir, 'svg');
const distDir = path.resolve(rootDir, 'dist');
// web: 仅供 PC/Web 使用（始终内联 SVG）
const webDir = path.resolve(distDir, 'web');
const webVueDir = path.resolve(webDir, 'vue');
// mobile：供 uni-app 使用（H5 内联 SVG；非 H5 用 PNG/SVG）
const mobileDir = path.resolve(distDir, 'mobile');
const mobileVueDir = path.resolve(mobileDir, 'vue');
const mobileUvueDir = path.resolve(mobileDir, 'uvue');

async function build() {
  // clean dist first, then (re)create subdirs to avoid writeFileSync ENOENT
  if (fs.existsSync(distDir)) fs.rmSync(distDir, { recursive: true, force: true });
  [distDir, webDir, webVueDir, mobileDir, mobileVueDir, mobileUvueDir].forEach(dir => {
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  });
  
  // read image files
  const files = fs.readdirSync(srcDir).filter(f => f.endsWith('.svg'));
  const iconData = [];
  // Optional rasterizer
  let sharp = null;
  try { sharp = require('sharp'); } catch (e) { sharp = null; }

  console.log(`Building icons from ${srcDir} to ${distDir}...`);

  for (const file of files) {
    const name = file.replace('.svg', '');
    const pascalName = Case.pascal(name);
    const kebab = Case.kebab(name);
    const easycomName = `icon-${kebab}`;
    const content = fs.readFileSync(path.join(srcDir, file), 'utf-8');
    // Optimize（不区分单/多色，统一按默认优化）
    const svgoPlugins = ['preset-default', 'removeDimensions'];

    let optimized = optimize(content, { 
      path: file,
      plugins: svgoPlugins
    }).data;

    const innerSvg = optimized.replace(/<svg[^>]*>|<\/svg>/g, '');

    // 1) web/vue：始终内联 SVG，供 PC/Web 使用（模板）
    const webTpl = fs.readFileSync(path.join(__dirname, 'templates/web.vue.tpl'), 'utf-8');
    const webOut = webTpl.replace('__INNER_SVG__', innerSvg);
    fs.writeFileSync(path.join(webVueDir, `${pascalName}.vue`), webOut);

    // 2) mobile/vue（模板）
    const mobileVueTpl = fs.readFileSync(path.join(__dirname, 'templates/mobile.vue.tpl'), 'utf-8');
    // 计算运行时图片 URL（非 H5 使用）
    const runtimePngUrl = `@/uni_modules/@phill-component/icons/mobile/uvue/${easycomName}/${name}.png`;
    const mobileVueImgUrl = runtimePngUrl;

    const mobileVueOut = mobileVueTpl
      .replace('__INNER_SVG__', innerSvg)
      .replace(/__IMG_SRC__/g, mobileVueImgUrl);
    fs.writeFileSync(path.join(mobileVueDir, `${easycomName}.vue`), mobileVueOut);

    // 3) mobile/uvue：H5 用 SVG；非 H5 用 PNG/SVG
    const uvueComponentdir = path.join(mobileUvueDir, easycomName);
    if (!fs.existsSync(uvueComponentdir)) fs.mkdirSync(uvueComponentdir, { recursive: true });
    try {
      const pngPath = path.join(uvueComponentdir, `${name}.png`);
      await sharp(Buffer.from(optimized)).resize(128, 128, { fit: 'contain' }).png().toFile(pngPath);
    } catch (e) {
      console.warn(`[icons] PNG rasterize failed for ${name}:`, e.message);
    }
    const mobileUvueTpl = fs.readFileSync(path.join(__dirname, 'templates/mobile.uvue.tpl'), 'utf-8');
    const mobileUvueOut = mobileUvueTpl
      .replace('__INNER_SVG__', innerSvg)
      .replace(/__IMG_SRC__/g, runtimePngUrl);
    fs.writeFileSync(path.join(uvueComponentdir, `${easycomName}.uvue`), mobileUvueOut);

    iconData.push({ name, pascalName, kebab });
  }

  // 5) 生成入口：web/index.js、mobile/vue/index.js、mobile/uvue/index.uts
  const webEntry = iconData.map(i => `export { default as Icon${i.pascalName} } from './${i.pascalName}.vue';`).join('\n');
  fs.writeFileSync(path.join(webVueDir, 'index.js'), webEntry);

  // 不再输出 icons-svg.js/uts 等映射与其它冗余目录

  console.log('All icons built to dist successfully.');
}

build().catch(console.error);
