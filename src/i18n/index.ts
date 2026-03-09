import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import AsyncStorage from '@react-native-async-storage/async-storage';
import ru from './locales/ru';

const LANGUAGE_KEY = 'app_language';

i18n.use(initReactI18next).init({
  resources: {
    ru: { translation: ru },
  },
  lng: 'ru',
  fallbackLng: 'ru',
  interpolation: { escapeValue: false },
  react: { useSuspense: false },
});

/**
 * Lazy-load and switch to a non-Russian language.
 * Only Russian is bundled; others are loaded on demand.
 */
export async function loadLanguage(lang: string): Promise<void> {
  if (lang === 'ru') {
    await i18n.changeLanguage('ru');
    await AsyncStorage.setItem(LANGUAGE_KEY, 'ru');
    return;
  }

  if (!i18n.hasResourceBundle(lang, 'translation')) {
    let translations: Record<string, string>;
    switch (lang) {
      case 'uz':
        translations = (await import('./locales/uz')).default;
        break;
      case 'tg':
        translations = (await import('./locales/tg')).default;
        break;
      case 'ky':
        translations = (await import('./locales/ky')).default;
        break;
      case 'kk':
        translations = (await import('./locales/kk')).default;
        break;
      case 'hy':
        translations = (await import('./locales/hy')).default;
        break;
      case 'ro':
        translations = (await import('./locales/ro')).default;
        break;
      default:
        return;
    }
    i18n.addResourceBundle(lang, 'translation', translations);
  }

  await i18n.changeLanguage(lang);
  await AsyncStorage.setItem(LANGUAGE_KEY, lang);
}

/**
 * Initialize language from saved preference on app start.
 */
export async function initLanguage(): Promise<string> {
  const saved = await AsyncStorage.getItem(LANGUAGE_KEY);
  if (saved && saved !== 'ru') {
    await loadLanguage(saved);
  }
  return saved || 'ru';
}

export default i18n;
