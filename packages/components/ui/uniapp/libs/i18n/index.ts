import zhHans from './locales/zh-Hans.json';
import zhHant from './locales/zh-Hant.json';
import en from './locales/en.json';

type LocaleDict = Record<string, string>;

const locales = {
  en: en as LocaleDict,
  'zh-Hant': zhHant as LocaleDict,
  'zh-Hans': zhHans as LocaleDict,
} as const;

type LocaleKey = keyof typeof locales;
type Params = Record<string, string | number>;

const settings: { lang: LocaleKey; locales: typeof locales } = {
  lang: (uni.getLocale() as LocaleKey) || 'zh-Hans',
  locales,
};

uni.onLocaleChange((result: { locale: string }) => {
  if (result.locale in locales) settings.lang = result.locale as LocaleKey;
});

export function t(value: string, params: Params = {}): string {
  if (value == null || value === '') return value as unknown as string;

  const key = value.replaceAll('.', '_');
  const lang = settings.lang in locales ? settings.lang : 'zh-Hans';

  let result = locales[lang]?.[key] ?? value;
  Object.keys(params).forEach(paramKey => {
    const reg = new RegExp(`{${paramKey}}`, 'g');
    result = result.replace(reg, String(params[paramKey]));
  });
  return result;
}

export default { settings };
