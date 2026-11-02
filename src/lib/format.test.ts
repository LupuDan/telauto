import { describe, expect, it } from 'vitest'
import { formatListingDate, formatNumber, formatPrice, normalizePhone, PHONE_PATTERN } from './format'

describe('Telefon', () => {
  it('transformă numerele moldovenești locale în format internațional', () => {
    expect(normalizePhone('069123456')).toBe('+37369123456')
    expect(normalizePhone('069 12 34 56')).toBe('+37369123456')
    expect(normalizePhone('(069) 123-456')).toBe('+37369123456')
  })
  it('păstrează numerele internaționale', () => {
    expect(normalizePhone('+37369123456')).toBe('+37369123456')
    expect(normalizePhone('0037369123456')).toBe('+37369123456')
    expect(normalizePhone('+40 721 234 567')).toBe('+40721234567')
  })
  it('regula din baza de date acceptă rezultatul și refuză textul', () => {
    expect(PHONE_PATTERN.test(normalizePhone('069123456'))).toBe(true)
    expect(PHONE_PATTERN.test(normalizePhone('abc'))).toBe(false)
    expect(PHONE_PATTERN.test(normalizePhone('123'))).toBe(false)
  })
})

describe('Prețuri, numere și date (plan de design, secțiunea 7)', () => {
  const nbsp = (text: string) => text.replace(/ /g, ' ')
  it('spațiu între mii și moneda după sumă', () => {
    expect(nbsp(formatPrice(12500, 'MDL', 'ro'))).toBe('12 500 lei')
    expect(nbsp(formatPrice(8900, 'EUR', 'ro'))).toBe('8 900 €')
    expect(nbsp(formatPrice(12500, 'MDL', 'ru'))).toBe('12 500 лей')
    expect(nbsp(formatPrice(950, 'MDL', 'ro'))).toBe('950 lei')
  })
  it('numere cu spațiu între mii', () => {
    expect(nbsp(formatNumber(180000, 'ro'))).toBe('180 000')
    expect(nbsp(formatNumber(180000, 'ru'))).toBe('180 000')
    expect(nbsp(formatNumber(1.6, 'ro'))).toBe('1,6')
  })
  it('azi, ieri, apoi ziua și luna', () => {
    const now = new Date(2026, 10, 3, 18, 0)
    expect(formatListingDate(new Date(2026, 10, 3, 14, 32), 'ro', now)).toBe('azi, 14:32')
    expect(formatListingDate(new Date(2026, 10, 2, 9, 10), 'ro', now)).toBe('ieri, 09:10')
    expect(formatListingDate(new Date(2026, 10, 3, 14, 32), 'ru', now)).toBe('сегодня, 14:32')
    expect(formatListingDate(new Date(2026, 10, 2, 9, 10), 'ru', now)).toBe('вчера, 09:10')
    expect(formatListingDate(new Date(2026, 10, 1, 9, 10), 'ro', now)).toBe('1 noiembrie')
    expect(formatListingDate(new Date(2026, 10, 1, 9, 10), 'ru', now)).toBe('1 ноября')
    expect(formatListingDate(new Date(2025, 2, 5), 'ro', now)).toBe('5 martie 2025')
  })
})
