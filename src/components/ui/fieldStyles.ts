export const inputClass = (hasError: boolean) =>
  `block w-full rounded-lg border bg-white px-3 py-2 text-base outline-none transition focus:ring-2 ${
    hasError
      ? 'border-red-500 focus:border-red-600 focus:ring-red-100'
      : 'border-slate-300 focus:border-brand-600 focus:ring-brand-100'
  }`
