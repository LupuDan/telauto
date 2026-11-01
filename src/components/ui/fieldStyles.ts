/**
 * Look of text boxes and lists. `width` replaces the default full width (e.g. 'w-auto'):
 * two width classes on the same element conflict, so never add a second one from outside.
 */
export const inputClass = (hasError: boolean, width = 'w-full') =>
  `block ${width} rounded-lg border bg-surface px-3 py-2 text-base outline-none transition focus:ring-2 ${
    hasError
      ? 'border-red-500 focus:border-red-600 focus:ring-red-100'
      : 'border-slate-300 focus:border-brand-600 focus:ring-brand-100'
  }`
