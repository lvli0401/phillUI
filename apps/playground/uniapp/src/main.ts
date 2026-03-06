import { createSSRApp } from "vue";
import App from "./App.vue";
import ultraUI from '@/uni_modules/@phillUI/ui/index.js';

export function createApp() {
  const app = createSSRApp(App);
  app.use(ultraUI);
  return {
    app,
  };
}
