import { useEffect, useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Link, useNavigate, useSearchParams } from 'react-router'
import { ListingGrid, ListingGridSkeleton } from '../../components/ListingCard'
import { Pagination } from '../../components/Pagination'
import { Button } from '../../components/ui/Button'
import { ErrorState } from '../../components/ui/ErrorState'
import { inputClass } from '../../components/ui/fieldStyles'
import { translateKey } from '../../i18n/translate'
import type { CategoryConfig } from '../../lib/categories'
import { MyCarFilter } from '../garage/MyCarFilter'
import { useSearchListings } from './api'
import { FilterPanel } from './FilterPanel'
import {
  countActiveFilters,
  filtersToParams,
  filtersToSearchArgs,
  PAGE_SIZE,
  parseFilters,
  SORT_OPTIONS,
  type SearchFilters,
  type SortOption,
} from './filters'

/** Results with filters, sorting and pages. Used by #/c/:slug (one category) and #/search (all). */
export function SearchResults({ category, heading }: { category?: CategoryConfig; heading: string }) {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const [params] = useSearchParams()
  const [panelOpen, setPanelOpen] = useState(false)

  const filters = useMemo(() => parseFilters(params, category), [params, category])
  const args = useMemo(() => filtersToSearchArgs(filters, category), [filters, category])
  const result = useSearchListings(args)

  const basePath = category ? `/c/${category.slug}` : '/search'
  const hrefFor = (next: SearchFilters, path = basePath) => {
    const query = filtersToParams(next).toString()
    return query ? `${path}?${query}` : path
  }

  function applyFilters(next: SearchFilters, categorySlug?: string) {
    setPanelOpen(false)
    navigate(hrefFor(next, categorySlug ? `/c/${categorySlug}` : basePath))
  }

  function changeSort(sort: SortOption) {
    navigate(hrefFor({ ...filters, sort, page: 1 }))
  }

  // new page or new filters: start at the top of the list
  useEffect(() => {
    window.scrollTo({ top: 0 })
  }, [params])

  // mobile panel: Esc closes it and the page behind does not scroll
  useEffect(() => {
    if (!panelOpen) return
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setPanelOpen(false)
    }
    document.addEventListener('keydown', onKey)
    document.body.classList.add('overflow-hidden', 'lg:overflow-auto')
    return () => {
      document.removeEventListener('keydown', onKey)
      document.body.classList.remove('overflow-hidden', 'lg:overflow-auto')
    }
  }, [panelOpen])

  const total = result.data?.total ?? 0
  const pageCount = Math.min(Math.ceil(total / PAGE_SIZE), 400)
  const activeCount = countActiveFilters(filters)

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-semibold">{heading}</h1>
        <p className="text-sm text-slate-600" aria-live="polite">
          {result.data ? t('search.resultCount', { count: total }) : 'Â '}
        </p>
      </div>

      <div className="lg:grid lg:grid-cols-[18rem_1fr] lg:gap-6">
        <aside
          className={
            panelOpen
              ? 'fixed inset-0 z-50 overflow-y-auto bg-surface p-4 lg:static lg:z-auto lg:overflow-visible lg:p-0'
              : 'hidden lg:block'
          }
          role={panelOpen ? 'dialog' : undefined}
          aria-modal={panelOpen ? true : undefined}
          aria-label={t('search.filtersTitle')}
        >
          {/* desktop: stays visible while scrolling, below the sticky header; scrolls inside if taller than the screen */}
          <div className="lg:sticky lg:top-20 lg:max-h-[calc(100dvh-12rem)] lg:overflow-y-auto lg:rounded-card lg:border lg:border-line lg:bg-surface lg:p-4 lg:shadow-sm">
            <FilterPanel
              key={`${category?.slug ?? 'all'}?${params.toString()}`}
              category={category}
              filters={filters}
              onApply={applyFilters}
              onClose={() => setPanelOpen(false)}
            />
          </div>
        </aside>

        <section className="min-w-0 space-y-4" aria-label={t('search.results')}>
          <div className="flex items-center gap-2">
            <Button variant="secondary" className="lg:hidden" onClick={() => setPanelOpen(true)}>
              {t('search.filtersButton')}
              {activeCount > 0 && (
                <span className="rounded-full bg-brand px-2 text-xs text-white">{activeCount}</span>
              )}
            </Button>
            <label htmlFor="sort" className="ml-auto text-sm text-slate-600">
              {t('search.sortLabel')}
            </label>
            <select
              id="sort"
              value={filters.sort}
              onChange={(event) => changeSort(event.target.value as SortOption)}
              className={inputClass(false, 'w-auto')}
            >
              {SORT_OPTIONS.map((option) => (
                <option key={option} value={option}>
                  {translateKey(t, `search.sort.${option}`)}
                </option>
              ))}
            </select>
          </div>

          {category?.hasCompatibility && (
            <MyCarFilter
              filters={filters}
              onChange={(vehicle) =>
                navigate(
                  hrefFor({
                    ...filters,
                    page: 1,
                    compatMake: vehicle ? String(vehicle.makeId) : '',
                    compatModel: vehicle?.modelId ? String(vehicle.modelId) : '',
                    compatYear: vehicle ? String(vehicle.year) : '',
                  }),
                )
              }
            />
          )}

          {result.isPending ? (
            <ListingGridSkeleton />
          ) : result.isError ? (
            <ErrorState error={result.error} onRetry={() => void result.refetch()} />
          ) : result.data.items.length === 0 ? (
            <div className="rounded-card border border-dashed border-line-strong bg-surface p-8 text-center">
              <p className="font-semibold text-slate-800">{t('search.emptyTitle')}</p>
              <p className="mt-1 text-slate-600">{t('search.emptyText')}</p>
              {(activeCount > 0 || filters.q) && (
                <Link to={basePath} className="mt-4 inline-block font-semibold text-brand hover:underline">
                  {t('search.clearAll')}
                </Link>
              )}
            </div>
          ) : (
            <div className={result.isPlaceholderData ? 'opacity-60 transition-opacity' : undefined}>
              <ListingGrid listings={result.data.items} />
            </div>
          )}

          <Pagination
            page={filters.page}
            pageCount={pageCount}
            hrefFor={(page) => hrefFor({ ...filters, page })}
          />
        </section>
      </div>
    </div>
  )
}
