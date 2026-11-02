import { CircleAlert } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { labelClass } from './fieldStyles'

/** Red error under a field, with an icon (linked to the field through aria-describedby). */
export function FieldError({ id, children }: { id: string; children: string }) {
  return (
    <p id={id} className="mt-1.5 flex items-start gap-1.5 text-sm text-danger">
      <CircleAlert aria-hidden="true" className="mt-0.5 size-4 shrink-0" strokeWidth={2} />
      <span>{children}</span>
    </p>
  )
}

/** Label above a field; optional fields get "(opțional)" (required ones have no asterisk). */
export function FieldLabel({ htmlFor, label, optional }: { htmlFor?: string; label: string; optional?: boolean }) {
  const { t } = useTranslation()
  const content = (
    <>
      {label}
      {optional && <span className="font-normal text-muted"> ({t('common.optional')})</span>}
    </>
  )
  return htmlFor ? (
    <label htmlFor={htmlFor} className={labelClass}>
      {content}
    </label>
  ) : (
    <span className={labelClass}>{content}</span>
  )
}
