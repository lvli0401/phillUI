import resolve from '@rollup/plugin-node-resolve';
import commonjs from '@rollup/plugin-commonjs';
import terser from '@rollup/plugin-terser';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const vendorPath = path.resolve(__dirname, 'dist/@phill-component/ui/vendor');
const subNodeModules = path.resolve(__dirname, 'node_modules');

export default [
  {
    input: path.join(subNodeModules, 'dayjs/dayjs.min.js'),
    output: {
      file: path.join(vendorPath, 'dayjs.min.js'),
      format: 'esm',
      sourcemap: false
    },
    plugins: [resolve(), commonjs(), terser()]
  },
  {
    input: path.join(subNodeModules, 'clipboard/dist/clipboard.min.js'),
    output: {
      file: path.join(vendorPath, 'clipboard.min.js'),
      format: 'esm',
      name: 'Clipboard',
      sourcemap: false
    },
    plugins: [resolve(), commonjs(), terser()]
  }
];
