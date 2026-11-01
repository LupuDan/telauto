import { useTranslation } from 'react-i18next'
import { useParams } from 'react-router'
import { usePageMeta } from '../app/usePageMeta'
import { SearchResults } from '../features/search/SearchResults'
import { categoryBySlug } from '../lib/categories'
import { NotFoundPage } from './NotFoundPage'

export function CategoryPage() {
  const { t } = useTranslation()
  const { slug } = useParams()
  const category = categoryBySlug(slug)
  const name = category ? t(`categories.${category.slug}`) : ''
  usePageMeta(t('search.categoryMetaTitle', { name }), t('search.categoryMetaDescription', { name }))

  if (!category) return <NotFoundPage />
  return <SearchResults key={category.slug} category={category} heading={name} />
}
