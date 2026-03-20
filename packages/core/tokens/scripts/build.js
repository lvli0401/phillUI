const fs = require('fs')
const path = require('path')

const rootDir = path.resolve(__dirname, '..')
const distDir = path.join(rootDir, 'dist')
const srcPaletteJson = path.join(rootDir, 'src', 'palette.json')
const srcThemesJson = path.join(rootDir, 'src', 'themes.json')

function cleanDist() {
  if (fs.existsSync(distDir)) fs.rmSync(distDir, { recursive: true, force: true })
  fs.mkdirSync(distDir, { recursive: true })
}

function renderTemplate(template, vars) {
  return template.replace(/\{\{(\w+)\}\}/g, (_, key) => (key in vars ? String(vars[key]) : ''))
}

function formatGenerated(content) {
  return String(content).replace(/\r\n/g, '\n').replace(/[ \t]+\n/g, '\n').trimEnd() + '\n'
}

function cssVarsBlock(selector, vars) {
  const lines = Object.entries(vars).map(([k, v]) => `  ${k}: ${v};`)
  return `${selector} {\n${lines.join('\n')}\n}\n`
}

function resolveTokenValue(input, palette, stack) {
  if (typeof input !== 'string') return input
  const refMatch = input.match(/^\{([^}]+)\}$/)
  if (!refMatch) return input
  const refKey = refMatch[1]
  if (stack.includes(refKey)) {
    throw new Error(`palette has circular reference: ${[...stack, refKey].join(' -> ')}`)
  }
  const next = palette[refKey]
  if (typeof next !== 'string') {
    throw new Error(`palette reference not found: ${refKey}`)
  }
  return resolveTokenValue(next, palette, [...stack, refKey])
}

function resolveTheme(theme, palette, name) {
  const resolved = {}
  Object.entries(theme).forEach(([k, v]) => {
    const next = resolveTokenValue(v, palette, [])
    if (typeof next !== 'string') {
      throw new Error(`themes.${name} value must be string: ${k}`)
    }
    if (String(next).match(/^\{[^}]+\}$/)) {
      throw new Error(`themes.${name} unresolved reference at ${k}: ${next}`)
    }
    resolved[k] = next
  })
  return resolved
}

function readTokenData() {
  if (!fs.existsSync(srcPaletteJson)) throw new Error(`palette.json not found at ${srcPaletteJson}`)
  if (!fs.existsSync(srcThemesJson)) throw new Error(`themes.json not found at ${srcThemesJson}`)
  const palette = JSON.parse(fs.readFileSync(srcPaletteJson, 'utf-8')) || {}
  const themes = JSON.parse(fs.readFileSync(srcThemesJson, 'utf-8')) || {}
  if (!themes.light || !themes.dark) throw new Error('themes.json must contain light and dark')
  const checkTheme = (theme, name) => {
    const keys = Object.keys(theme || {})
    if (keys.length === 0) throw new Error(`themes.${name} must not be empty`)
    keys.forEach(k => {
      if (!String(k).startsWith('--tsm-')) throw new Error(`themes.${name} key must start with --tsm-: ${k}`)
    })
  }
  checkTheme(themes.light, 'light')
  checkTheme(themes.dark, 'dark')
  const light = resolveTheme(themes.light, palette, 'light')
  const dark = resolveTheme(themes.dark, palette, 'dark')
  return { palette, themes: { light, dark } }
}

function writeFile(filePath, content) {
  fs.mkdirSync(path.dirname(filePath), { recursive: true })
  fs.writeFileSync(filePath, formatGenerated(content))
}

const INDEX_TS_TEMPLATE = `import { reactive } from 'vue'

export type ThemeMode = 'light' | 'dark'
export type Tokens = Record<string, string>

export const themes: Record<ThemeMode, Tokens> = {
  light: {{themesLight}},
  dark: {{themesDark}},
}

export const lightTokens = themes.light
export const darkTokens = themes.dark

const STORAGE_KEY = 'tsm_theme_mode'

const state = reactive({
  mode: 'light' as ThemeMode,
  cssVars: {} as Tokens,
})

function applyCssVars(vars: Tokens) {
  Object.keys(state.cssVars).forEach(k => {
    // @ts-ignore
    delete state.cssVars[k]
  })
  Object.assign(state.cssVars, vars)
}

export function getThemeMode(): ThemeMode {
  return state.mode
}

export function useThemeCssVars(): Tokens {
  return state.cssVars
}

export function setThemeMode(mode: ThemeMode): void {
  const nextMode: ThemeMode = mode === 'dark' ? 'dark' : 'light'
  state.mode = nextMode
  try {
    uni.setStorageSync(STORAGE_KEY, nextMode)
  } catch {}

  const vars = nextMode === 'dark' ? darkTokens : lightTokens
  applyCssVars(vars)

  if (typeof document !== 'undefined' && document?.documentElement?.style) {
    const root = document.documentElement
    Object.entries(vars).forEach(([k, v]) => root.style.setProperty(k, v))
  }
}

export function toggleThemeMode(): void {
  setThemeMode(state.mode === 'dark' ? 'light' : 'dark')
}

export function initThemeMode(): void {
  let saved: any = null
  try {
    saved = uni.getStorageSync(STORAGE_KEY)
  } catch {}
  setThemeMode(saved === 'dark' ? 'dark' : 'light')
}
`

const INDEX_UTS_TEMPLATE = `import { reactive } from 'vue'

export type ThemeMode = 'light' | 'dark'
export type Tokens = any

export const themes = {
  light: {{themesLight}},
  dark: {{themesDark}},
} as any

export const lightTokens = themes.light as any
export const darkTokens = themes.dark as any

const STORAGE_KEY = 'tsm_theme_mode'

const state = reactive({
  mode: 'light',
  tokens: {} as any,
  cssVars: {} as any,
})

const initKeys = Object.keys(lightTokens)
initKeys.forEach((k: string) => {
  // @ts-ignore
  state.tokens[k] = lightTokens[k]
})

// #ifdef WEB || MP-WEIXIN
initKeys.forEach((k: string) => {
  // @ts-ignore
  state.cssVars[k] = lightTokens[k]
})
// #endif

export function getThemeMode(): string {
  return state.mode
}

export function useThemeTokens(): any {
  return state.tokens
}

export function useThemeCssVars(): any {
  return state.cssVars
}

export function setThemeMode(mode: string): void {
  const nextMode = mode == 'dark' ? 'dark' : 'light'
  state.mode = nextMode
  uni.setStorageSync(STORAGE_KEY, nextMode)

  const nextTokens = nextMode == 'dark' ? darkTokens : lightTokens
  const keys = Object.keys(nextTokens)
  keys.forEach((k: string) => {
    // @ts-ignore
    state.tokens[k] = nextTokens[k]
  })

  // #ifdef WEB || MP-WEIXIN
  keys.forEach((k: string) => {
    // @ts-ignore
    state.cssVars[k] = nextTokens[k]
  })
  // #endif
}

export function toggleThemeMode(): void {
  setThemeMode(state.mode == 'dark' ? 'light' : 'dark')
}

export function initThemeMode(): void {
  const saved = uni.getStorageSync(STORAGE_KEY) as string | null
  setThemeMode(saved == 'dark' ? 'dark' : 'light')
}
`

function buildTokensScss(themes) {
  const lightVars = themes.light
  const darkVars = themes.dark

  const parts = []
  parts.push(cssVarsBlock(':root', lightVars))
  parts.push(cssVarsBlock('page', lightVars))
  parts.push(cssVarsBlock(`:root[data-tsm-theme='dark']`, darkVars))
  parts.push(cssVarsBlock(`.tsm-theme-dark`, darkVars))
  return parts.join('\n')
}

function build() {
  cleanDist()
  const { themes } = readTokenData()
  const templateVars = {
    themesLight: JSON.stringify(themes.light, null, 2),
    themesDark: JSON.stringify(themes.dark, null, 2),
  }
  writeFile(path.join(distDir, 'index.ts'), renderTemplate(INDEX_TS_TEMPLATE, templateVars))
  writeFile(path.join(distDir, 'index.uts'), renderTemplate(INDEX_UTS_TEMPLATE, templateVars))
  writeFile(path.join(distDir, 'tokens.scss'), buildTokensScss(themes))
}

build()
