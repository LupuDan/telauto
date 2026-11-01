import { zodResolver } from '@hookform/resolvers/zod'
import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { useTranslation } from 'react-i18next'
import { Alert } from '../../components/ui/Alert'
import { Button } from '../../components/ui/Button'
import { SelectField } from '../../components/ui/SelectField'
import { TextField } from '../../components/ui/TextField'
import { useFieldError } from '../../components/ui/useFieldError'
import { changeLanguage } from '../../i18n'
import { translateKey } from '../../i18n/translate'
import { localizedName, toLanguage } from '../../lib/format'
import { errorToKey } from '../auth/authErrors'
import { useLocalities } from '../reference/hooks'
import type { PublicProfile } from './api'
import { useUpdateMyProfile } from './hooks'
import { profileSettingsSchema, type ProfileSettingsInput, type ProfileSettingsOutput } from './schemas'

type Props = { userId: string; profile: PublicProfile; phone: string }

export function ProfileSettingsForm({ userId, profile, phone }: Props) {
  const { t, i18n } = useTranslation()
  const fieldError = useFieldError()
  const localities = useLocalities()
  const update = useUpdateMyProfile(userId)
  const [saved, setSaved] = useState(false)

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting, isDirty },
  } = useForm<ProfileSettingsInput, unknown, ProfileSettingsOutput>({
    resolver: zodResolver(profileSettingsSchema),
    defaultValues: {
      displayName: profile.display_name,
      localityId: profile.locality_id ? String(profile.locality_id) : '',
      phone,
      language: toLanguage(profile.language),
    },
  })

  async function onSubmit(values: ProfileSettingsOutput) {
    setSaved(false)
    try {
      await update.mutateAsync({
        displayName: values.displayName,
        localityId: values.localityId ? Number(values.localityId) : null,
        language: values.language,
        phone: values.phone,
      })
    } catch {
      return // shown through update.isError
    }
    reset({ ...values })
    setSaved(true)
    if (values.language !== i18n.resolvedLanguage) {
      void changeLanguage(values.language)
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-4" onChange={() => setSaved(false)}>
      {update.isError && <Alert kind="error">{translateKey(t, errorToKey(update.error))}</Alert>}
      {saved && !isDirty && <Alert kind="success">{t('account.saved')}</Alert>}

      <TextField
        label={t('account.displayName')}
        autoComplete="name"
        maxLength={60}
        error={fieldError(errors.displayName)}
        {...register('displayName')}
      />

      <SelectField label={t('account.locality')} error={fieldError(errors.localityId)} {...register('localityId')}>
        <option value="">{t('account.localityNone')}</option>
        {(localities.data ?? []).map((locality) => (
          <option key={locality.id} value={String(locality.id)}>
            {localizedName(locality, i18n.resolvedLanguage)}
          </option>
        ))}
      </SelectField>

      <TextField
        label={t('account.phone')}
        type="tel"
        autoComplete="tel"
        inputMode="tel"
        placeholder="+373 69 123 456"
        hint={t('account.phoneHint')}
        error={fieldError(errors.phone)}
        {...register('phone')}
      />

      <SelectField label={t('account.language')} {...register('language')}>
        <option value="ro">{t('language.ro')}</option>
        <option value="ru">{t('language.ru')}</option>
      </SelectField>

      <Button type="submit" loading={isSubmitting}>
        {t('account.save')}
      </Button>
    </form>
  )
}
