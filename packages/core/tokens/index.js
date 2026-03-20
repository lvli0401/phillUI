export const lightTokens = {
  colorPrimary: '#2979ff',
  colorSuccess: '#00c853',
  colorWarning: '#ff9100',
  colorError: '#ff4d4f',
  colorInfo: '#909399',
  colorTextBase: '#303133',
  colorTextSecondary: '#646a73',
  colorBgBase: '#f5f6f7',
  colorBgContainer: '#ffffff',
  colorBorder: '#ebedf0',
  borderRadius: '4px',
  fontSizeBase: '14px',
};

export const darkTokens = {
  colorPrimary: '#4a9eff',
  colorSuccess: '#4ade80',
  colorWarning: '#fb923c',
  colorError: '#f87171',
  colorInfo: '#a1a1aa',
  colorTextBase: '#ffffff',
  colorTextSecondary: '#a1a1aa',
  colorBgBase: '#000000',
  colorBgContainer: '#1c1c1e',
  colorBorder: '#3a3a3c',
  borderRadius: '4px',
  fontSizeBase: '14px',
};

export function tokensToCssVars(tokens) {
  const vars = {};
  Object.entries(tokens).forEach(([key, value]) => {
    const cssVar = `--tsm-${key.replace(/([A-Z])/g, '-$1').toLowerCase()}`;
    vars[cssVar] = value;
  });
  return vars;
}

const STORAGE_KEY = 'tsm_theme_mode';

export function getThemeMode() {
  try {
    const saved = uni.getStorageSync(STORAGE_KEY);
    return saved === 'dark' ? 'dark' : 'light';
  } catch {
    return 'light';
  }
}

export function setThemeMode(mode) {
  const nextMode = mode === 'dark' ? 'dark' : 'light';
  const tokens = nextMode === 'dark' ? darkTokens : lightTokens;
  const vars = tokensToCssVars(tokens);
  try {
    uni.setStorageSync(STORAGE_KEY, nextMode);
  } catch {}
  try {
    uni.$tsm = uni.$tsm || {};
    uni.$tsm.mode = nextMode;
    uni.$tsm.cssVars = vars;
  } catch {}

  if (typeof document !== 'undefined' && document?.documentElement?.style) {
    const root = document.documentElement;
    Object.entries(vars).forEach(([k, v]) => root.style.setProperty(k, v));
  }

  return vars;
}

export function toggleThemeMode() {
  return setThemeMode(getThemeMode() === 'dark' ? 'light' : 'dark');
}
