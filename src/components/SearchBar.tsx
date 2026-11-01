import { useState, type FormEvent } from 'react'
import { useTranslation } from 'react-i18next'
import { useNavigate, useSearchParams } from 'react-router'

export function SearchBar() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const [params] = useSearchParams()
  const [query, setQuery] = useState(params.get('q') ?? '')

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const q = query.trim()
    navigate(q ? `/search?${new URLSearchParams({ q })}` : '/search')
  }

  return (
    <form role="search" onSubmit={handleSubmit} className="flex w-full">
      <label htmlFor="site-search" className="sr-only">
        {t('header.searchLabel')}
      </label>
      <input
        id="site-search"
        type="search"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder={t('header.searchPlaceholder')}
        maxLength={100}
        className="min-w-0 flex-1 rounded-l-lg border border-r-0 border-slate-300 bg-surface px-3 py-2 text-base outline-none focus:border-brand-600 focus:ring-2 focus:ring-brand-100"
      />
      <button
        type="submit"
        className="rounded-r-lg bg-brand-700 px-4 py-2 text-sm font-semibold text-white hover:bg-brand-800 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-600"
      >
        {t('header.searchButton')}
      </button>
    </form>
  )
}
