import type { App, Plugin } from 'vue';
import Button from './components/button/button.vue';
import {
  getThemeMode,
  initThemeMode,
  setThemeMode,
  toggleThemeMode,
  useThemeCssVars,
} from '@/uni_modules/@phill-component/tokens/index';

type TsmApi = {
  getThemeMode: typeof getThemeMode;
  setThemeMode: typeof setThemeMode;
  toggleThemeMode: typeof toggleThemeMode;
  cssVars: ReturnType<typeof useThemeCssVars>;
};

const install = (app: App): void => {
  app.component(Button.name!, Button);

  initThemeMode();

  const uniWithTsm = uni as unknown as { $tsm?: Partial<TsmApi> };
  uniWithTsm.$tsm = uniWithTsm.$tsm || {};
  uniWithTsm.$tsm.getThemeMode = getThemeMode;
  uniWithTsm.$tsm.setThemeMode = setThemeMode;
  uniWithTsm.$tsm.toggleThemeMode = toggleThemeMode;
  uniWithTsm.$tsm.cssVars = useThemeCssVars();

  const globalProps = app.config.globalProperties as { $tsm?: Partial<TsmApi> };
  globalProps.$tsm = uniWithTsm.$tsm;
};

const plugin: Plugin = { install };

export { getThemeMode, initThemeMode, setThemeMode, toggleThemeMode, useThemeCssVars };

export default plugin;
