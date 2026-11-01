import { describe, expect, it } from 'vitest'
import {
  isValidImei,
  isValidPrice,
  isValidVin,
  isValidYear,
  MAX_PRICE,
  maxYear,
  normalizeImei,
  normalizeVin,
  parseNumber,
  parsePrice,
} from './validators'

describe('IMEI (15 cifre + cifra de control Luhn)', () => {
  it('acceptă IMEI-uri valide', () => {
    expect(isValidImei('490154203237518')).toBe(true)
    expect(isValidImei('356938035643809')).toBe(true)
  })
  it('acceptă spații și cratime scrise de oameni', () => {
    expect(isValidImei('49 015420 323751 8')).toBe(true)
    expect(isValidImei('49-015420-323751-8')).toBe(true)
    expect(normalizeImei('49 015420-323751 8')).toBe('490154203237518')
  })
  it('refuză cifra de control greșită', () => {
    expect(isValidImei('490154203237519')).toBe(false)
    expect(isValidImei('123456789012345')).toBe(false)
  })
  it('refuză lungimea greșită și literele', () => {
    expect(isValidImei('49015420323751')).toBe(false)
    expect(isValidImei('4901542032375180')).toBe(false)
    expect(isValidImei('49015420323751A')).toBe(false)
    expect(isValidImei('')).toBe(false)
  })
})

describe('VIN (17 caractere, fără I, O, Q)', () => {
  it('acceptă VIN-uri valide, și cu litere mici', () => {
    expect(isValidVin('1HGCM82633A004352')).toBe(true)
    expect(isValidVin('wvwzzz1jzxw000001')).toBe(true)
    expect(normalizeVin('wvw zzz1jz-xw000001')).toBe('WVWZZZ1JZXW000001')
  })
  it('refuză literele I, O, Q', () => {
    expect(isValidVin('1HGCM82633A00435I')).toBe(false)
    expect(isValidVin('1HGCM82633A00435O')).toBe(false)
    expect(isValidVin('1HGCM82633A00435Q')).toBe(false)
  })
  it('refuză lungimea greșită și semnele', () => {
    expect(isValidVin('1HGCM82633A00435')).toBe(false)
    expect(isValidVin('1HGCM82633A0043521')).toBe(false)
    expect(isValidVin('1HGCM82633A00435!')).toBe(false)
  })
})

describe('Preț (mai mare ca 0)', () => {
  it('înțelege formatele obișnuite', () => {
    expect(parsePrice('1500')).toBe(1500)
    expect(parsePrice('1 500')).toBe(1500)
    expect(parsePrice('1500,50')).toBe(1500.5)
    expect(parsePrice('1500.5')).toBe(1500.5)
  })
  it('refuză textul, negativele și prea multe zecimale', () => {
    expect(parsePrice('abc')).toBeNaN()
    expect(parsePrice('-5')).toBeNaN()
    expect(parsePrice('10,555')).toBeNaN()
    expect(parsePrice('')).toBeNaN()
  })
  it('prețul trebuie să fie > 0 și sub limita maximă', () => {
    expect(isValidPrice(0)).toBe(false)
    expect(isValidPrice(0.01)).toBe(true)
    expect(isValidPrice(MAX_PRICE)).toBe(true)
    expect(isValidPrice(MAX_PRICE + 1)).toBe(false)
    expect(isValidPrice(Number.NaN)).toBe(false)
  })
})

describe('An (1950 – anul curent + 1)', () => {
  const now = new Date('2026-06-01')
  it('limitele', () => {
    expect(maxYear(now)).toBe(2027)
    expect(isValidYear(1950, now)).toBe(true)
    expect(isValidYear(2027, now)).toBe(true)
    expect(isValidYear(1949, now)).toBe(false)
    expect(isValidYear(2028, now)).toBe(false)
    expect(isValidYear(2015.5, now)).toBe(false)
  })
})

describe('Numere scrise de utilizator', () => {
  it('acceptă virgula ca separator zecimal', () => {
    expect(parseNumber('1,6')).toBe(1.6)
    expect(parseNumber('180 000')).toBe(180000)
    expect(parseNumber('')).toBeNaN()
    expect(parseNumber('1.6.2')).toBeNaN()
  })
})
