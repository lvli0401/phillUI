import Button from './components/button/button.vue';
import {
  initThemeMode,
  getThemeMode,
  setThemeMode,
  toggleThemeMode,
  useThemeCssVars,
} from '@/uni_modules/@phill-component/tokens/index.ts';

const install = Vue => {
  Vue.component(Button.name, Button);
  initThemeMode();
  uni.$tsm = uni.$tsm || {};
  uni.$tsm.getThemeMode = getThemeMode;
  uni.$tsm.setThemeMode = setThemeMode;
  uni.$tsm.toggleThemeMode = toggleThemeMode;
  uni.$tsm.cssVars = useThemeCssVars();
  Vue.config.globalProperties.$tsm = uni.$tsm;
};

export default { install };
