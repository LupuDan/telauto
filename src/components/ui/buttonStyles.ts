/**
 * Buttons (TELAUTO_PLAN_DESIGN_v1.md, section 5).
 * primary   – blue, white text (Trimite, Salvează)
 * action    – yellow tag, dark text: only "Adaugă anunț" and "Publică anunțul"
 * secondary – white, grey outline
 * ghost     – no background, blue text
 * danger    – red text and red outline (delete, report)
 * size "compact" is 36 px high on computers only; on phones every button stays 44 px.
 */
export type ButtonVariant = 'primary' | 'action' | 'secondary' | 'ghost' | 'danger'
export type ButtonSize = 'normal' | 'compact'

const VARIANTS: Record<ButtonVariant, string> = {
  primary: 'bg-brand text-white hover:bg-brand-700 active:bg-brand-700 disabled:opacity-55',
  action: 'bg-tag text-on-tag hover:bg-tag-600 active:bg-tag-600 disabled:opacity-55',
  secondary:
    'border border-line-strong bg-surface text-ink hover:bg-paper active:bg-slate-100 disabled:text-muted disabled:opacity-70',
  ghost: 'text-brand hover:bg-brand-50 active:bg-brand-100 disabled:text-muted',
  danger: 'border border-danger bg-surface text-danger hover:bg-danger-50 active:bg-danger-50 disabled:opacity-55',
}

const SIZES: Record<ButtonSize, string> = {
  normal: 'min-h-11 px-4',
  compact: 'min-h-11 px-4 lg:min-h-9 lg:px-3',
}

/** Classes of a button, also for links that look like buttons (<Link className={buttonClass(...)}>). */
export function buttonClass(variant: ButtonVariant = 'primary', size: ButtonSize = 'normal', fullWidth = false) {
  return `relative inline-flex items-center justify-center gap-2 rounded-field py-2 text-base font-semibold transition-colors select-none disabled:cursor-not-allowed ${
    VARIANTS[variant]
  } ${SIZES[size]} ${fullWidth ? 'w-full' : ''}`
}
