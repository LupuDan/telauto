import type { Language } from '../i18n'

const LOCALES: Record<Language, string> = { ro: 'ro-MD', ru: 'ru-MD' }

export function toLanguage(lng: string | undefined): Language {
  return lng === 'ru' ? 'ru' : 'ro'
}

/** "1 noiembrie 2026" / "1 ноября 2026 г." */
export function formatDate(value: string | Date, lng: string | undefined): string {
  const date = typeof value === 'string' ? new Date(value) : value
  return new Intl.DateTimeFormat(LOCALES[toLanguage(lng)], { dateStyle: 'long' }).format(date)
}

/** "noiembrie 2026" / "ноябрь 2026 г." */
export function formatMonthYear(value: string | Date, lng: string | undefined): string {
  const date = typeof value === 'string' ? new Date(value) : value
  return new Intl.DateTimeFormat(LOCALES[toLanguage(lng)], { month: 'long', year: 'numeric' }).format(date)
}

/**
 * Normalizes a phone number for storage: removes spaces, dashes, dots and brackets,
 * and turns Moldovan local numbers ("069123456") into international format ("+37369123456").
 * Returns "" for empty input.
 */
export function normalizePhone(input: string): string {
  let phone = input.replace(/[\s\-().]/g, '')
  if (phone.startsWith('00')) {
    phone = `+${phone.slice(2)}`
  }
  if (/^0[0-9]{8}$/.test(phone)) {
    phone = `+373${phone.slice(1)}`
  }
  return phone
}

export const PHONE_PATTERN = /^\+?[0-9]{8,15}$/

/** "1 500 MDL" / "12 300 €" */
export function formatPrice(price: number, currency: string, lng: string | undefined): string {
  const number = new Intl.NumberFormat(LOCALES[toLanguage(lng)], { maximumFractionDigits: 2 }).format(price)
  return currency === 'EUR' ? `${number} €` : `${number} MDL`
}

/** Picks the name column for the current language from rows like { name_ro, name_ru }. */
export function localizedName(row: { name_ro: string; name_ru: string }, lng: string | undefined): string {
  return toLanguage(lng) === 'ru' ? row.name_ru : row.name_ro
}
