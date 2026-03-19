import zhHans from './locales/zh-Hans.json';
import zhHant from './locales/zh-Hant.json';
import en from './locales/en.json';

let settings = {
  lang: uni.getLocale(),
  locales: {
    en,
    'zh-Hant': zhHant,
    'zh-Hans': zhHans,
  },
};

uni.onLocaleChange(locale => {
  settings.lang = locale;
});

/**
 * 多语言方法
 */
export function t(value, params = {}) {
  // console.log(settings.locales[settings.lang])
  if (value != '' && value != null) {
    value = value.replaceAll('.', '_');
    let lang = settings.lang;
    if (!settings.locales[settings.lang]) {
      lang = 'zh-Hans';
    }
    let result = settings.locales[lang][value] || value;
    // 替换{xxx}格式的变量
    Object.keys(params).forEach(key => {
      const reg = new RegExp(`{${key}}`, 'g');
      result = result.replace(reg, params[key]);
    });
    return result;
  } else {
    return value;
  }
}

export default {
  settings: settings,
};
