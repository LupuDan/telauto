import type { ReactNode } from 'react'
import { Logo } from '../Logo'

/**
 * Login / register / reset (plan de design, 6.7): centred form, at most 400 px wide,
 * the logo above it and nothing else to distract.
 */
export function AuthCard({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div className="mx-auto w-full max-w-[400px] py-2 sm:py-6">
      <div className="mb-6 flex justify-center">
        <Logo variant="full" />
      </div>
      <section className="rounded-panel border border-line bg-surface p-5 sm:p-6">
        <h1 className="mb-5 type-h1 text-ink">{title}</h1>
        {children}
      </section>
    </div>
  )
}
