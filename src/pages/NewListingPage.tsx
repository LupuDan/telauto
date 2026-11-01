import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { usePageMeta } from '../app/usePageMeta'
import { Alert } from '../components/ui/Alert'
import { loadLocalDraft } from '../features/listings/draft'
import { ListingWizard } from '../features/listings/ListingWizard'
import { EMPTY_LISTING } from '../features/listings/schema'

export function NewListingPage() {
  const { t } = useTranslation()
  usePageMeta(t('listingForm.newMetaTitle'))
  // read the local draft once, when the page opens
  const [draft] = useState(() => loadLocalDraft())

  return (
    <div>
      <h1 className="mx-auto mb-4 max-w-3xl text-2xl font-bold">{t('listingForm.newTitle')}</h1>
      {draft && draft.categorySlug && (
        <div className="mx-auto mb-4 max-w-3xl">
          <Alert kind="info">{t('listingForm.draftRestored')}</Alert>
        </div>
      )}
      <ListingWizard mode="new" initialValues={draft ?? EMPTY_LISTING} />
    </div>
  )
}
