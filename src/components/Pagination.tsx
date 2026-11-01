import { useTranslation } from 'react-i18next'
import { Link } from 'react-router'

type PaginationProps = {
  page: number
  pageCount: number
  /** address of a given page (keeps the current filters) */
  hrefFor: (page: number) => string
}

/** Page numbers around the current page: 1 … 4 5 [6] 7 8 … 20 */
function visiblePages(page: number, pageCount: number): (number | 'gap')[] {
  const pages = new Set([1, pageCount, page - 2, page - 1, page, page + 1, page + 2])
  const sorted = [...pages].filter((p) => p >= 1 && p <= pageCount).sort((a, b) => a - b)
  const result: (number | 'gap')[] = []
  sorted.forEach((p, index) => {
    if (index > 0 && p - sorted[index - 1] > 1) result.push('gap')
    result.push(p)
  })
  return result
}

const itemClass =
  'flex min-h-11 min-w-11 items-center justify-center rounded-lg border px-3 text-sm font-semibold focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-600'

export function Pagination({ page, pageCount, hrefFor }: PaginationProps) {
  const { t } = useTranslation()
  if (pageCount <= 1) return null

  return (
    <nav aria-label={t('search.pagination')} className="flex flex-wrap items-center justify-center gap-2">
      {page > 1 && (
        <Link to={hrefFor(page - 1)} className={`${itemClass} border-slate-300 bg-white hover:bg-slate-50`}>
          <span aria-hidden="true">←</span>
          <span className="sr-only sm:not-sr-only sm:ml-1">{t('search.previous')}</span>
        </Link>
      )}
      {visiblePages(page, pageCount).map((item, index) =>
        item === 'gap' ? (
          <span key={`gap-${index}`} aria-hidden="true" className="px-1 text-slate-400">
            …
          </span>
        ) : item === page ? (
          <span key={item} aria-current="page" className={`${itemClass} border-brand-700 bg-brand-700 text-white`}>
            {item}
          </span>
        ) : (
          <Link
            key={item}
            to={hrefFor(item)}
            aria-label={t('search.pageN', { n: item })}
            className={`${itemClass} border-slate-300 bg-white hover:bg-slate-50`}
          >
            {item}
          </Link>
        ),
      )}
      {page < pageCount && (
        <Link to={hrefFor(page + 1)} className={`${itemClass} border-slate-300 bg-white hover:bg-slate-50`}>
          <span className="sr-only sm:not-sr-only sm:mr-1">{t('search.next')}</span>
          <span aria-hidden="true">→</span>
        </Link>
      )}
    </nav>
  )
}
