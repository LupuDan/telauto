import { describe, expect, it } from 'vitest'
import { normalizePhone, PHONE_PATTERN } from './format'

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
