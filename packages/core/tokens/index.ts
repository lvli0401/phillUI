import tokenData from './src/tokens.json'

export type ThemeMode = keyof typeof tokenData.themes
export type Tokens = Record<string, string>

export const themes = tokenData.themes
export const lightTokens = tokenData.themes.light
export const darkTokens = tokenData.themes.dark
