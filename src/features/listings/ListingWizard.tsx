import { zodResolver } from '@hookform/resolvers/zod'
import { useQueryClient } from '@tanstack/react-query'
import { useEffect, useState, type ReactNode } from 'react'
import { FormProvider, useForm, useFormContext, useWatch } from 'react-hook-form'
import { useTranslation } from 'react-i18next'
import { CategoryIcon } from '../../components/CategoryIcon'
import { useNavigate } from 'react-router'
import { Alert } from '../../components/ui/Alert'
import { Button } from '../../components/ui/Button'
import { CheckboxField } from '../../components/ui/CheckboxField'
import { SelectField } from '../../components/ui/SelectField'
import { TextField } from '../../components/ui/TextField'
import { inputClass } from '../../components/ui/fieldStyles'
import { useFieldError } from '../../components/ui/useFieldError'
import { translateKey } from '../../i18n/translate'
import { CATEGORIES, CATEGORY_SLUGS, categoryBySlug, type CategoryConfig } from '../../lib/categories'
import { localizedName, normalizePhone, PHONE_PATTERN } from '../../lib/format'
import { useAuth } from '../auth/authContext'
import { errorToKey } from '../auth/authErrors'
import { updateMyPhone } from '../profile/api'
import { profileKeys, useMyPhone, useProfile } from '../profile/hooks'
import { useLocalities } from '../reference/hooks'
import { createListing, DraftSavedError, updateListing, type ListingStatus, type SaveProgress } from './api'
import { AttributeFields } from './AttributeFields'
import { CompatibilityEditor } from './CompatibilityEditor'
import { clearLocalDraft, saveLocalDraft } from './draft'
import { listingKeys } from './hooks'
import { PhotoUploader } from './PhotoUploader'
import type { PhotoItem } from './photos'
import {
  EMPTY_COMPATIBILITY,
  EMPTY_LISTING,
  listingSchema,
  STEP_FIELDS,
  WIZARD_STEPS,
  type ListingFormValues,
  type WizardStep,
} from './schema'

type Props =
  | { mode: 'new'; initialValues: ListingFormValues; initialPhotos?: PhotoItem[] }
  | {
      mode: 'edit'
      listingId: string
      status: ListingStatus
      initialValues: ListingFormValues
      initialPhotos: PhotoItem[]
    }

/** Steps: category -> photos -> details -> characteristics -> contact & publish (plan, section 7). */
export function ListingWizard(props: Props) {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const { user } = useAuth()
  const profile = useProfile(user?.id)

  const methods = useForm<ListingFormValues>({
    resolver: zodResolver(listingSchema),
    defaultValues: props.initialValues,
    mode: 'onTouched',
  })
  const { control, trigger, handleSubmit, getValues } = methods
  const categorySlug = useWatch({ control, name: 'categorySlug' })
  const category = categoryBySlug(categorySlug)

  const steps = props.mode === 'edit' ? WIZARD_STEPS.filter((s) => s !== 'category') : WIZARD_STEPS
  const [step, setStep] = useState<WizardStep>(steps[0])
  const [photos, setPhotos] = useState<PhotoItem[]>(props.initialPhotos ?? [])
  const [photoError, setPhotoError] = useState<string>()
  const [submitError, setSubmitError] = useState<string | null>(null)
  const [progress, setProgress] = useState<SaveProgress | null>(null)

  const stepIndex = steps.indexOf(step)
  const isDraftEdit = props.mode === 'edit' && props.status === 'draft'
  const willPublish = props.mode === 'new' || isDraftEdit

  // Local draft: keep what was typed (new listings only; photos cannot be stored).
  const allValues = useWatch({ control })
  useEffect(() => {
    if (props.mode !== 'new') return
    const timer = window.setTimeout(() => saveLocalDraft(allValues as ListingFormValues), 400)
    return () => window.clearTimeout(timer)
  }, [allValues, props.mode])

  function goTo(next: WizardStep) {
    setStep(next)
    window.scrollTo({ top: 0 })
  }

  function photosOk(): boolean {
    if (!category) return false
    if (photos.length < category.minPhotos) {
      setPhotoError(t('listingForm.photosMin', { count: category.minPhotos }))
      return false
    }
    setPhotoError(undefined)
    return true
  }

  async function next() {
    if (step === 'photos' && !photosOk()) return
    const fields = STEP_FIELDS[step]
    if (fields.length > 0 && !(await trigger([...fields], { shouldFocus: true }))) return
    goTo(steps[stepIndex + 1])
  }

  function chooseCategory(slug: string) {
    if (getValues('categorySlug') !== slug) {
      const hasCompatibility = categoryBySlug(slug)?.hasCompatibility ?? false
      methods.reset({
        ...getValues(),
        categorySlug: slug,
        attributes: {},
        imei: '',
        vin: '',
        // auto parts need at least one compatibility row: show an empty one right away
        compatibility: hasCompatibility ? [{ ...EMPTY_COMPATIBILITY }] : [],
      })
    }
    goTo('photos')
  }

  async function onSubmit(values: ListingFormValues) {
    if (!user || !category) return
    if (!photosOk()) {
      goTo('photos')
      return
    }
    setSubmitError(null)
    try {
      if (props.mode === 'new') {
        await createListing(user.id, values, photos, setProgress)
        clearLocalDraft()
      } else {
        await updateListing(user.id, props.listingId, values, photos, { publish: isDraftEdit }, setProgress)
        void queryClient.invalidateQueries({ queryKey: listingKeys.edit(props.listingId) })
      }
      void queryClient.invalidateQueries({ queryKey: listingKeys.mine(user.id) })
      navigate(`/account?tab=listings&notice=${willPublish ? 'published' : 'saved'}`, { replace: true })
    } catch (error) {
      setProgress(null)
      if (error instanceof DraftSavedError) {
        // the listing exists as a draft: continue on its edit page
        clearLocalDraft()
        void queryClient.invalidateQueries({ queryKey: listingKeys.mine(user.id) })
        navigate(`/a/${error.listingId}/edit?error=${encodeURIComponent(errorToKey(error.reason))}`, {
          replace: true,
        })
        return
      }
      setSubmitError(errorToKey(error))
    }
  }

  // Validation failed on the last step: jump to the first step with an error.
  function onInvalid(errors: Record<string, unknown>) {
    const firstStep = steps.find((s) => (STEP_FIELDS[s] as readonly string[]).some((field) => field in errors))
    if (firstStep) goTo(firstStep)
  }

  const blocked = profile.data?.is_blocked === true

  return (
    <FormProvider {...methods}>
      <form
        onSubmit={(event) => {
          // Enter in a field moves to the next step; only the last step really submits.
          if (step !== 'publish') {
            event.preventDefault()
            if (step !== 'category') void next()
            return
          }
          void handleSubmit(onSubmit, onInvalid)(event)
        }}
        noValidate
        className="mx-auto max-w-3xl"
      >
        <StepIndicator steps={steps} current={stepIndex} />

        {blocked && (
          <div className="mb-4">
            <Alert kind="warning">{t('account.blockedNotice')}</Alert>
          </div>
        )}

        <section className="rounded-card border border-line bg-surface p-4 shadow-sm sm:p-6">
          <h2 className="mb-4 text-xl font-semibold">{translateKey(t, `listingForm.steps.${step}`)}</h2>

          {step === 'category' && <CategoryStep selected={categorySlug} onChoose={chooseCategory} />}

          {step === 'photos' && category && (
            <PhotoUploader
              photos={photos}
              onChange={(next) => {
                setPhotos(next)
                if (photoError && next.length >= category.minPhotos) setPhotoError(undefined)
              }}
              minPhotos={category.minPhotos}
              error={photoError}
            />
          )}

          {step === 'details' && category && <DetailsStep category={category} />}

          {step === 'characteristics' && category && (
            <div className="space-y-6">
              <AttributeFields category={category} />
              {category.privateField && <PrivateField field={category.privateField} />}
              {category.hasCompatibility && <CompatibilityEditor />}
            </div>
          )}

          {step === 'publish' && category && (
            <PublishStep category={category} photosCount={photos.length} />
          )}

          {submitError && (
            <div className="mt-4">
              <Alert kind="error">{translateKey(t, submitError)}</Alert>
            </div>
          )}
          {progress && (
            <div className="mt-4" aria-live="polite">
              <Alert kind="info">
                {progress.stage === 'photos'
                  ? t('listingForm.progressPhotos', { done: progress.done, total: progress.total })
                  : progress.stage === 'publishing'
                    ? t('listingForm.progressPublishing')
                    : t('listingForm.progressSaving')}
              </Alert>
            </div>
          )}
        </section>

        {step !== 'category' && (
          <div className="mt-4 flex items-center justify-between gap-3">
            <Button
              variant="secondary"
              disabled={stepIndex === 0 || Boolean(progress)}
              onClick={() => goTo(steps[stepIndex - 1])}
            >
              ← {t('listingForm.back')}
            </Button>
            {step === 'publish' ? (
              <Button type="submit" loading={Boolean(progress)} disabled={blocked}>
                {willPublish ? t('listingForm.publish') : t('listingForm.saveChanges')}
              </Button>
            ) : (
              <Button onClick={() => void next()}>{t('listingForm.next')} →</Button>
            )}
          </div>
        )}

        {props.mode === 'new' && step !== 'category' && (
          <p className="mt-4 text-center text-xs text-slate-500">
            {t('listingForm.localDraftHint')}{' '}
            <button
              type="button"
              className="underline"
              onClick={() => {
                clearLocalDraft()
                methods.reset(EMPTY_LISTING)
                setPhotos([])
                goTo('category')
              }}
            >
              {t('listingForm.startOver')}
            </button>
          </p>
        )}
      </form>
    </FormProvider>
  )
}

function StepIndicator({ steps, current }: { steps: WizardStep[]; current: number }) {
  const { t } = useTranslation()
  return (
    <div className="mb-4">
      <p className="mb-2 text-sm text-slate-600">
        {t('listingForm.stepOf', { current: current + 1, total: steps.length })}
      </p>
      <ol className="flex gap-1" aria-hidden="true">
        {steps.map((s, i) => (
          <li key={s} className={`h-1.5 flex-1 rounded-full ${i <= current ? 'bg-brand' : 'bg-slate-200'}`} />
        ))}
      </ol>
    </div>
  )
}

function CategoryStep({ selected, onChoose }: { selected: string; onChoose: (slug: string) => void }) {
  const { t } = useTranslation()
  return (
    <ul className="grid grid-cols-2 gap-3">
      {CATEGORY_SLUGS.map((slug) => (
        <li key={slug}>
          <button
            type="button"
            onClick={() => onChoose(slug)}
            aria-pressed={selected === slug}
            className={`flex w-full flex-col items-center gap-2 rounded-card border p-4 text-center font-medium transition hover:border-brand focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand ${
              selected === slug ? 'border-brand bg-brand-50' : 'border-line bg-surface'
            }`}
          >
            <span className="text-brand">
              <CategoryIcon name={CATEGORIES[slug].icon} className="size-7" />
            </span>
            <span>{t(`categories.${slug}`)}</span>
            <span className="text-xs font-normal text-slate-500">
              {t('listingForm.minPhotosShort', { count: CATEGORIES[slug].minPhotos })}
            </span>
          </button>
        </li>
      ))}
    </ul>
  )
}

function DetailsStep({ category }: { category: CategoryConfig }) {
  const { t, i18n } = useTranslation()
  const fieldError = useFieldError()
  const localities = useLocalities()
  const {
    register,
    control,
    formState: { errors },
  } = useFormContext<ListingFormValues>()
  const description = useWatch({ control, name: 'description' }) ?? ''

  return (
    <div className="space-y-4">
      <TextField
        label={`${t('listingForm.title')} *`}
        hint={t('listingForm.titleHint')}
        maxLength={100}
        error={fieldError(errors.title)}
        {...register('title')}
      />

      <div>
        <label htmlFor="listing-description" className="mb-1 block text-sm font-medium text-slate-700">
          {t('listingForm.description')}
        </label>
        <textarea
          id="listing-description"
          rows={6}
          maxLength={5000}
          aria-invalid={errors.description ? true : undefined}
          className={inputClass(Boolean(errors.description))}
          {...register('description')}
        />
        <p className="mt-1 text-right text-xs text-slate-500">{description.length}/5000</p>
      </div>

      <div className="grid grid-cols-[1fr_7rem] gap-3">
        <TextField
          label={`${t('listingForm.price')} *`}
          inputMode="decimal"
          error={fieldError(errors.price)}
          {...register('price')}
        />
        <SelectField label={t('listingForm.currency')} {...register('currency')}>
          <option value="MDL">MDL</option>
          <option value="EUR">EUR</option>
        </SelectField>
      </div>
      <CheckboxField label={t('listingForm.negotiable')} {...register('negotiable')} />

      <fieldset>
        <legend className="mb-1 text-sm font-medium text-slate-700">{t('listingForm.condition')} *</legend>
        <div className="flex flex-wrap gap-2">
          {(['new', 'used'] as const).map((value) => (
            <label
              key={value}
              className="flex min-h-11 cursor-pointer items-center gap-2 rounded-field border border-line-strong bg-surface px-4 has-[:checked]:border-brand has-[:checked]:bg-brand-50"
            >
              <input type="radio" value={value} className="accent-brand" {...register('condition')} />
              {translateKey(t, `listingForm.conditionOptions.${category.conditionLabels}.${value}`)}
            </label>
          ))}
        </div>
        {errors.condition && <p className="mt-1 text-sm text-danger">{fieldError(errors.condition)}</p>}
      </fieldset>

      <SelectField
        label={`${t('listingForm.locality')} *`}
        error={fieldError(errors.localityId)}
        {...register('localityId')}
      >
        <option value="">{t('listingForm.choose')}</option>
        {(localities.data ?? []).map((locality) => (
          <option key={locality.id} value={String(locality.id)}>
            {localizedName(locality, i18n.resolvedLanguage)}
          </option>
        ))}
      </SelectField>
    </div>
  )
}

function PrivateField({ field }: { field: 'imei' | 'vin' }) {
  const { t } = useTranslation()
  const fieldError = useFieldError()
  const {
    register,
    formState: { errors },
  } = useFormContext<ListingFormValues>()

  return (
    <div className="rounded-field border border-brand-100 bg-brand-50/50 p-4">
      <TextField
        label={t(field === 'imei' ? 'listingForm.imei' : 'listingForm.vin')}
        hint={t(field === 'imei' ? 'listingForm.imeiHint' : 'listingForm.vinHint')}
        inputMode={field === 'imei' ? 'numeric' : 'text'}
        autoCapitalize={field === 'vin' ? 'characters' : undefined}
        maxLength={field === 'imei' ? 20 : 21}
        autoComplete="off"
        error={fieldError(field === 'imei' ? errors.imei : errors.vin)}
        {...register(field)}
      />
    </div>
  )
}

function PublishStep({ category, photosCount }: { category: CategoryConfig; photosCount: number }) {
  const { t } = useTranslation()
  const { control } = useFormContext<ListingFormValues>()
  const [title, price, currency] = useWatch({ control, name: ['title', 'price', 'currency'] })

  return (
    <div className="space-y-6">
      <PhoneSection />
      <div>
        <h3 className="mb-2 font-semibold">{t('listingForm.summary')}</h3>
        <dl className="divide-y divide-slate-100 rounded-field border border-line text-sm">
          <SummaryRow label={t('listingForm.summaryCategory')}>{t(`categories.${category.slug}`)}</SummaryRow>
          <SummaryRow label={t('listingForm.title')}>{title}</SummaryRow>
          <SummaryRow label={t('listingForm.price')}>
            {price} {currency}
          </SummaryRow>
          <SummaryRow label={t('listingForm.summaryPhotos')}>{photosCount}</SummaryRow>
        </dl>
      </div>
      <p className="text-xs text-slate-500">{t('listingForm.publishHint')}</p>
    </div>
  )
}

function SummaryRow({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="flex justify-between gap-4 px-3 py-2">
      <dt className="text-slate-500">{label}</dt>
      <dd className="text-right font-medium break-words">{children}</dd>
    </div>
  )
}

/** Contact: the seller's phone from the profile, editable right here. */
function PhoneSection() {
  const { t } = useTranslation()
  const { user } = useAuth()
  const queryClient = useQueryClient()
  const phone = useMyPhone(user?.id)
  const [editing, setEditing] = useState(false)
  const [value, setValue] = useState('')
  const [error, setError] = useState<string>()
  const [saving, setSaving] = useState(false)

  async function save() {
    if (!user) return
    const normalized = normalizePhone(value)
    if (normalized !== '' && !PHONE_PATTERN.test(normalized)) {
      setError(t('validation.phone'))
      return
    }
    setSaving(true)
    try {
      await updateMyPhone(user.id, normalized)
      await queryClient.invalidateQueries({ queryKey: profileKeys.myPhone(user.id) })
      setEditing(false)
      setError(undefined)
    } catch (e) {
      setError(translateKey(t, errorToKey(e)))
    } finally {
      setSaving(false)
    }
  }

  return (
    <div>
      <h3 className="mb-2 font-semibold">{t('listingForm.contactTitle')}</h3>
      {editing ? (
        <div className="flex flex-wrap items-end gap-2">
          <TextField
            className="min-w-0 flex-1"
            label={t('account.phone')}
            type="tel"
            inputMode="tel"
            autoComplete="tel"
            value={value}
            error={error}
            onChange={(e) => setValue(e.target.value)}
          />
          <Button loading={saving} onClick={() => void save()}>
            {t('account.save')}
          </Button>
        </div>
      ) : (
        <div className="flex flex-wrap items-center justify-between gap-2 rounded-field border border-line p-3">
          <span className="text-sm">
            {phone.data ? (
              <>
                {t('account.phone')}: <strong>{phone.data}</strong>
              </>
            ) : (
              <span className="text-ink">{t('listingForm.noPhone')}</span>
            )}
          </span>
          <Button
            variant="ghost"
            onClick={() => {
              setValue(phone.data ?? '')
              setEditing(true)
            }}
          >
            {phone.data ? t('listingForm.changePhone') : t('listingForm.addPhone')}
          </Button>
        </div>
      )}
      <p className="mt-1 text-xs text-slate-500">{t('account.phoneHint')}</p>
    </div>
  )
}
