import type { FieldError } from 'react-hook-form'
import { useTranslation } from 'react-i18next'
import { translateKey } from '../../i18n/translate'

/** Returns a function that turns a react-hook-form error (message = translation key) into text. */
export function useFieldError() {
  const { t } = useTranslation()
  return (error: FieldError | undefined) => (error?.message ? translateKey(t, error.message) : undefined)
}
