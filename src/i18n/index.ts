import i18n from 'i18next'
import { initReactI18next } from 'react-i18next'
import ro from './ro.json'
import ru from './ru.json'

export const SUPPORTED_LANGUAGES = ['ro', 'ru'] as const
export type Language = (typeof SUPPORTED_LANGUAGES)[number]

const DEFAULT_LANGUAGE: Language = 'ro'
const STORAGE_KEY = 'telauto.language'

function isLanguage(value: unknown): value is Language {
  return SUPPORTED_LANGUAGES.includes(value as Language)
}

function readStoredLanguage(): Language {
  try {
    const stored = localStorage.getItem(STORAGE_KEY)
    return isLanguage(stored) ? stored : DEFAULT_LANGUAGE
  } catch {
    return DEFAULT_LANGUAGE
  }
}

void i18n.use(initReactI18next).init({
  resources: {
    ro: { translation: ro },
    ru: { translation: ru },
  },
  lng: readStoredLanguage(),
  fallbackLng: DEFAULT_LANGUAGE,
  supportedLngs: SUPPORTED_LANGUAGES,
  // React already escapes rendered text, so i18next must not escape again.
  interpolation: { escapeValue: false },
  returnNull: false,
})

function syncDocumentLanguage(lng: string) {
  document.documentElement.lang = lng
}

syncDocumentLanguage(i18n.language)

i18n.on('languageChanged', (lng) => {
  syncDocumentLanguage(lng)
  try {
    localStorage.setItem(STORAGE_KEY, lng)
  } catch {
    // Storage may be unavailable (private mode); the choice then lasts only for this visit.
  }
})

export function changeLanguage(lng: Language) {
  return i18n.changeLanguage(lng)
}

export default i18n
