/** Initials on a pale blue circle when there is no photo (plan de design, section 5). */
export function Avatar({ name, size = 'md' }: { name: string; size?: 'sm' | 'md' | 'lg' }) {
  const initials = name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((word) => word.charAt(0).toLocaleUpperCase())
    .join('')
  const sizes = { sm: 'size-9 text-sm', md: 'size-12 text-base', lg: 'size-16 text-xl' }
  return (
    <span
      aria-hidden="true"
      className={`flex shrink-0 items-center justify-center rounded-full bg-brand-50 font-semibold text-brand ${sizes[size]}`}
    >
      {initials || '?'}
    </span>
  )
}
