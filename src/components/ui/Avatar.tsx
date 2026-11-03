/**
 * Profile photo, or the initials on a pale blue circle when there is no photo (plan de design, section 5).
 * xl = 56 px (header of "Contul meu"), 2xl = 64 px (public profile).
 */
export function Avatar({
  name,
  src,
  size = 'md',
}: {
  name: string
  src?: string | null
  size?: 'sm' | 'md' | 'lg' | 'xl' | '2xl'
}) {
  const initials = name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((word) => word.charAt(0).toLocaleUpperCase())
    .join('')
  const sizes = {
    sm: 'size-9 text-sm',
    md: 'size-12 text-base',
    lg: 'size-16 text-xl',
    xl: 'size-14 text-lg',
    '2xl': 'size-16 text-2xl',
  }
  if (src) {
    return (
      <img
        src={src}
        alt=""
        loading="lazy"
        decoding="async"
        className={`shrink-0 rounded-full bg-paper object-cover ${sizes[size]}`}
      />
    )
  }
  return (
    <span
      aria-hidden="true"
      className={`flex shrink-0 items-center justify-center rounded-full bg-brand-50 font-semibold text-brand ${sizes[size]}`}
    >
      {initials || '?'}
    </span>
  )
}
