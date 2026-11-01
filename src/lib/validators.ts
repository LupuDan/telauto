// Shared validation rules (plan, section 6). The database checks IMEI/VIN again (0001).

export const MIN_YEAR = 1950

export function maxYear(now: Date = new Date()): number {
  return now.getFullYear() + 1
}

export function isValidYear(year: number, now: Date = new Date()): boolean {
  return Number.isInteger(year) && year >= MIN_YEAR && year <= maxYear(now)
}

/** Removes spaces/dashes people often type: "35 123456 789012 3" -> "351234567890123". */
export function normalizeImei(input: string): string {
  return input.replace(/[\s-]/g, '')
}

/** IMEI = exactly 15 digits, last one is a Luhn check digit. */
export function isValidImei(input: string): boolean {
  const imei = normalizeImei(input)
  if (!/^\d{15}$/.test(imei)) return false
  let sum = 0
  for (let i = 0; i < 15; i++) {
    let digit = Number(imei[i])
    if (i % 2 === 1) {
      digit *= 2
      if (digit > 9) digit -= 9
    }
    sum += digit
  }
  return sum % 10 === 0
}

export function normalizeVin(input: string): string {
  return input.replace(/[\s-]/g, '').toUpperCase()
}

/** VIN = 17 characters, digits and letters except I, O, Q. */
export function isValidVin(input: string): boolean {
  return /^[A-HJ-NPR-Z0-9]{17}$/.test(normalizeVin(input))
}

/** Accepts "1 500", "1500,50", "1500.5". Returns NaN when not a number. */
export function parsePrice(input: string): number {
  const cleaned = input.replace(/\s/g, '').replace(',', '.')
  if (!/^\d+(\.\d{1,2})?$/.test(cleaned)) return Number.NaN
  return Number(cleaned)
}

export const MAX_PRICE = 99_999_999

export function isValidPrice(value: number): boolean {
  return Number.isFinite(value) && value > 0 && value <= MAX_PRICE
}

/** Parses a whole or decimal number typed by the user ("1,6" -> 1.6). */
export function parseNumber(input: string): number {
  const cleaned = input.replace(/\s/g, '').replace(',', '.')
  if (cleaned === '' || !/^-?\d+(\.\d+)?$/.test(cleaned)) return Number.NaN
  return Number(cleaned)
}
