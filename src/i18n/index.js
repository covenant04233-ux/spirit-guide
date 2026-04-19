import i18n from 'i18next'
import { initReactI18next } from 'react-i18next'
import en from '../locales/en.json'
import zhCN from '../locales/zh-CN.json'
import zhTW from '../locales/zh-TW.json'

const resources = {
  en: { translation: en },
  'zh-CN': { translation: zhCN },
  'zh-TW': { translation: zhTW },
}

const stored =
  typeof localStorage !== 'undefined' ? localStorage.getItem('sgt_lang') : null
const fallbackLng = 'zh-CN'

i18n.use(initReactI18next).init({
  resources,
  lng: stored && resources[stored] ? stored : fallbackLng,
  fallbackLng: ['zh-CN', 'en'],
  interpolation: { escapeValue: false },
})

export function setAppLanguage(code) {
  if (!resources[code]) return
  i18n.changeLanguage(code)
  try {
    localStorage.setItem('sgt_lang', code)
  } catch {
    /* ignore */
  }
}

export default i18n
