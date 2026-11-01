import { zodResolver } from '@hookform/resolvers/zod'
import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { useTranslation } from 'react-i18next'
import { Alert } from '../../components/ui/Alert'
import { Button } from '../../components/ui/Button'
import { TextField } from '../../components/ui/TextField'
import { useFieldError } from '../../components/ui/useFieldError'
import { translateKey } from '../../i18n/translate'
import { changePassword } from '../auth/api'
import { errorToKey } from '../auth/authErrors'
import { changePasswordSchema, type ChangePasswordValues } from '../auth/schemas'

export function ChangePasswordForm({ email }: { email: string }) {
  const { t } = useTranslation()
  const fieldError = useFieldError()
  const [errorKey, setErrorKey] = useState<string | null>(null)
  const [done, setDone] = useState(false)
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<ChangePasswordValues>({ resolver: zodResolver(changePasswordSchema) })

  async function onSubmit(values: ChangePasswordValues) {
    setErrorKey(null)
    setDone(false)
    try {
      await changePassword(email, values.currentPassword, values.password)
      reset()
      setDone(true)
    } catch (error) {
      setErrorKey(errorToKey(error))
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-4">
      {errorKey && <Alert kind="error">{translateKey(t, errorKey)}</Alert>}
      {done && <Alert kind="success">{t('account.passwordChanged')}</Alert>}
      {/* hidden username helps password managers update the right entry */}
      <input type="email" autoComplete="username" value={email} readOnly hidden />
      <TextField
        label={t('auth.currentPassword')}
        type="password"
        autoComplete="current-password"
        error={fieldError(errors.currentPassword)}
        {...register('currentPassword')}
      />
      <TextField
        label={t('auth.newPassword')}
        type="password"
        autoComplete="new-password"
        hint={t('auth.passwordHint')}
        error={fieldError(errors.password)}
        {...register('password')}
      />
      <TextField
        label={t('auth.passwordConfirm')}
        type="password"
        autoComplete="new-password"
        error={fieldError(errors.passwordConfirm)}
        {...register('passwordConfirm')}
      />
      <Button type="submit" variant="secondary" loading={isSubmitting}>
        {t('account.changePassword')}
      </Button>
    </form>
  )
}
