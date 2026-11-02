/**
 * Look of text boxes and lists (plan de design, section 5). Text is 16 px so iPhones do not zoom in.
 * `width` replaces the default full width (e.g. 'w-auto'):
 * two width classes on the same element conflict, so never add a second one from outside.
 */
export const inputClass = (hasError: boolean, width = 'w-full') =>
  `block ${width} min-h-11 rounded-field border bg-surface px-3 py-2 text-base text-ink placeholder:text-muted outline-none transition-colors focus:ring-2 disabled:bg-paper disabled:text-muted ${
    hasError
      ? 'border-danger focus:border-danger focus:ring-danger-50'
      : 'border-line-strong focus:border-brand focus:ring-brand-100'
  }`

/** Label above every field. */
export const labelClass = 'mb-1.5 block text-sm font-medium text-ink'

/** Help text under a field. */
export const hintClass = 'mt-1.5 text-sm text-muted'
