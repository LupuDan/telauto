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
  return new Intl.DateTimeFormat(LOCALES[toLanguage(lng)], { month: 'long', year: 'numeric' })
    .format(date)
    .replace(/\s*г\.$/, '')
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

/**
 * Formats a number with a space between thousands in both languages ("12 500", "180 000"),
 * as the design plan asks (section 7). ro-MD would use dots ("12.500"), so the group separator
 * is replaced with a non-breaking space; the decimal separator stays the language's own (","),
 */
function groupedNumber(value: number, lng: string | undefined): string {
  return new Intl.NumberFormat(LOCALES[toLanguage(lng)], { maximumFractionDigits: 2, useGrouping: 'always' })
    .formatToParts(value)
    .map((part) => (part.type === 'group' ? ' ' : part.value))
    .join('')
}

/** "180 000" */
export function formatNumber(value: number, lng: string | undefined): string {
  return groupedNumber(value, lng)
}

// currency words follow the number, like the units km and GB
const CURRENCY_WORD: Record<Language, string> = { ro: 'lei', ru: 'лей' }

/** "12 500 lei" / "12 500 лей" / "8 900 €" */
export function formatPrice(price: number, currency: string, lng: string | undefined): string {
  const number = groupedNumber(price, lng)
  return currency === 'EUR' ? `${number} €` : `${number} ${CURRENCY_WORD[toLanguage(lng)]}`
}

/** Currency shown inside price fields: "lei" / "лей" / "€". */
export function currencyUnit(currency: string, lng: string | undefined): string {
  return currency === 'EUR' ? '€' : CURRENCY_WORD[toLanguage(lng)]
}

const TODAY_WORDS: Record<Language, { today: string; yesterday: string }> = {
  ro: { today: 'azi', yesterday: 'ieri' },
  ru: { today: 'сегодня', yesterday: 'вчера' },
}

function startOfDay(date: Date): number {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate()).getTime()
}

/**
 * Date of a listing or message (plan de design, section 7):
 * "azi, 14:32", "ieri, 09:10", "3 noiembrie", and "3 noiembrie 2025" for other years.
 */
export function formatListingDate(value: string | Date, lng: string | undefined, now: Date = new Date()): string {
  const date = typeof value === 'string' ? new Date(value) : value
  const language = toLanguage(lng)
  const locale = LOCALES[language]
  const days = Math.round((startOfDay(now) - startOfDay(date)) / 86_400_000)
  if (days === 0 || days === 1) {
    const time = new Intl.DateTimeFormat(locale, { hour: '2-digit', minute: '2-digit', hour12: false }).format(date)
    return `${days === 0 ? TODAY_WORDS[language].today : TODAY_WORDS[language].yesterday}, ${time}`
  }
  const sameYear = date.getFullYear() === now.getFullYear()
  return new Intl.DateTimeFormat(locale, { day: 'numeric', month: 'long', ...(sameYear ? {} : { year: 'numeric' }) })
    .format(date)
    .replace(/\s*г\.$/, '')
}

/** Short form for tight lists (conversations): "14:32" today, otherwise like formatListingDate. */
export function formatShortDate(value: string | Date, lng: string | undefined): string {
  return formatListingDate(value, lng)
}

/** Picks the name column for the current language from rows like { name_ro, name_ru }. */
export function localizedName(row: { name_ro: string; name_ru: string }, lng: string | undefined): string {
  return toLanguage(lng) === 'ru' ? row.name_ru : row.name_ro
}
