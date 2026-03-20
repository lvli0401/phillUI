import { reactive } from 'vue';
import { darkTokens, lightTokens, tokensToCssVars } from '@/uni_modules/@phill-component/tokens/dist/index.js';

const STORAGE_KEY = 'tsm_theme_mode';

const state = reactive({
  mode: 'light',
  cssVars: {},
});

function applyCssVars(vars) {
  Object.keys(state.cssVars).forEach(k => delete state.cssVars[k]);
  Object.assign(state.cssVars, vars);
}

export function getThemeMode() {
  return state.mode;
}

export function useThemeCssVars() {
  return state.cssVars;
}

export function setThemeMode(mode) {
  const nextMode = mode === 'dark' ? 'dark' : 'light';
  state.mode = nextMode;
  try {
    uni.setStorageSync(STORAGE_KEY, nextMode);
  } catch {}

  const tokens = nextMode === 'dark' ? darkTokens : lightTokens;
  const vars = tokensToCssVars(tokens);
  applyCssVars(vars);

  if (typeof document !== 'undefined' && document?.documentElement?.style) {
    const root = document.documentElement;
    Object.entries(vars).forEach(([k, v]) => root.style.setProperty(k, v));
  }
}

export function toggleThemeMode() {
  setThemeMode(state.mode === 'dark' ? 'light' : 'dark');
}

export function initThemeMode() {
  let saved = null;
  try {
    saved = uni.getStorageSync(STORAGE_KEY);
  } catch {}
  setThemeMode(saved === 'dark' ? 'dark' : 'light');
}
