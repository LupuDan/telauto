import type { ReactNode } from 'react'

/** Centered card used by the login / register / reset pages. */
export function AuthCard({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="mx-auto w-full max-w-md rounded-card border border-line bg-surface p-5 shadow-sm sm:p-6">
      <h1 className="mb-5 text-2xl font-semibold">{title}</h1>
      {children}
    </section>
  )
}
