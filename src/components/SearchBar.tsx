import { Search } from 'lucide-react'
import { useState, type FormEvent } from 'react'
import { useTranslation } from 'react-i18next'
import { useNavigate, useSearchParams } from 'react-router'
import { inputClass } from './ui/fieldStyles'

/** Search box of the header. Enter (or "Caută" from 640 px) opens the results. */
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
    <form role="search" onSubmit={handleSubmit} className="flex w-full gap-2">
      <label htmlFor="site-search" className="sr-only">
        {t('header.searchLabel')}
      </label>
      <div className="relative min-w-0 flex-1">
        <Search
          aria-hidden="true"
          className="pointer-events-none absolute top-1/2 left-3 size-5 -translate-y-1/2 text-muted"
          strokeWidth={1.75}
        />
        <input
          id="site-search"
          type="search"
          enterKeyHint="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder={t('header.searchPlaceholder')}
          maxLength={100}
          className={`${inputClass(false)} bg-paper pl-10`}
        />
      </div>
      <button
        type="submit"
        className="hidden min-h-11 shrink-0 items-center rounded-field bg-brand px-4 text-base font-semibold text-white hover:bg-brand-700 md:inline-flex"
      >
        {t('header.searchButton')}
      </button>
    </form>
  )
}
