import { defineConfig } from "vite";
import uni from "@dcloudio/vite-plugin-uni";
import path from "path";

// https://vitejs.dev/config/
export default defineConfig(({mode}) => {
  return {
    plugins: [uni()],
    server: {
      port: 5175
    },
    resolve: {
      alias: [
        /* phillui-icons-alias */ { find: /^@phillui\/icons/, replacement: path.resolve(__dirname, 'src/uni_modules/@phillui/icons') }
      ],
      extensions: ['.mjs', '.js', '.ts', '.jsx', '.tsx', '.json', '.vue', '.nvue', '.uts']
    },
    css: {
      preprocessorOptions: {
        scss: {
          silenceDeprecations: ["import", "legacy-js-api"]
        }
      }
    }
  }
});
