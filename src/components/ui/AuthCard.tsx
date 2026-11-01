import type { ReactNode } from 'react'

/** Centered card used by the login / register / reset pages. */
export function AuthCard({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="mx-auto w-full max-w-md rounded-xl border border-slate-200 bg-surface p-5 shadow-sm sm:p-6">
      <h1 className="mb-5 text-2xl font-bold">{title}</h1>
      {children}
    </section>
  )
}
