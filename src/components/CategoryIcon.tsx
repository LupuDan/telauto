import { Car, Cog, Headphones, Refrigerator, Smartphone, type LucideIcon } from 'lucide-react'
import type { CategoryIconName } from '../lib/categories'

// Only the icons categories use are imported (so the rest of lucide-react stays out of the site).
// A new category with a new icon: add the icon here and its name to CategoryIconName.
const ICONS: Record<CategoryIconName, LucideIcon> = { Smartphone, Headphones, Car, Cog, Refrigerator }

/** Icon of a category: 20 px in the interface, 28 px on category tiles (plan de design, 3.4). */
export function CategoryIcon({ name, className = 'size-5' }: { name: CategoryIconName; className?: string }) {
  const Icon = ICONS[name]
  return <Icon aria-hidden="true" className={className} strokeWidth={1.75} />
}
