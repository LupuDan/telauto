import { useTranslation } from 'react-i18next'
import { useSearchParams } from 'react-router'
import { usePageMeta } from '../app/usePageMeta'
import { SearchResults } from '../features/search/SearchResults'

export function SearchPage() {
  const { t } = useTranslation()
  const [params] = useSearchParams()
  const q = (params.get('q') ?? '').trim().slice(0, 100)
  const heading = q ? t('search.headingQuery', { q }) : t('search.headingAll')
  usePageMeta(`${heading} – Telauto.md`)

  return <SearchResults heading={heading} />
}
