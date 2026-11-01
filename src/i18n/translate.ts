import type { TFunction } from 'i18next'

/**
 * Translates a key that is only known at runtime (e.g. validation messages from zod,
 * error codes from Supabase). Static keys should use t('...') directly so they are type-checked.
 */
export function translateKey(t: TFunction, key: string, options?: Record<string, unknown>): string {
  return (t as unknown as (k: string, o?: Record<string, unknown>) => string)(key, options)
}
