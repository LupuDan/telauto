import { zodResolver } from '@hookform/resolvers/zod'
import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { useTranslation } from 'react-i18next'
import { Link, useNavigate, useSearchParams } from 'react-router'
import { usePageMeta } from '../app/usePageMeta'
import { Alert } from '../components/ui/Alert'
import { AuthCard } from '../components/ui/AuthCard'
import { Button } from '../components/ui/Button'
import { LoadingState } from '../components/ui/LoadingState'
import { TextField } from '../components/ui/TextField'
import { useFieldError } from '../components/ui/useFieldError'
import { requestPasswordReset, setNewPassword } from '../features/auth/api'
import { useAuth } from '../features/auth/authContext'
import { errorToKey } from '../features/auth/authErrors'
import {
  newPasswordSchema,
  resetRequestSchema,
  type NewPasswordValues,
  type ResetRequestValues,
} from '../features/auth/schemas'
import { translateKey } from '../i18n/translate'

/**
 * #/reset             -> ask for a reset link by email
 * #/reset?step=new    -> after opening the email link (user is logged in): choose the new password
 */
export function ResetPage() {
  const { t } = useTranslation()
  usePageMeta(t('auth.resetMetaTitle'))
  const [params] = useSearchParams()
  const { user, loading } = useAuth()

  if (params.get('step') === 'new') {
    if (loading) return <LoadingState />
    return user ? <NewPasswordForm /> : <LinkInvalid />
  }
  return <RequestForm />
}

function RequestForm() {
  const { t } = useTranslation()
  const fieldError = useFieldError()
  const [errorKey, setErrorKey] = useState<string | null>(null)
  const [sent, setSent] = useState(false)
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<ResetRequestValues>({ resolver: zodResolver(resetRequestSchema) })

  async function onSubmit(values: ResetRequestValues) {
    setErrorKey(null)
    try {
      await requestPasswordReset(values.email)
      setSent(true)
    } catch (error) {
      setErrorKey(errorToKey(error))
    }
  }

  return (
    <AuthCard title={t('auth.resetTitle')}>
      {sent ? (
        <div className="space-y-4">
          <Alert kind="success">{t('auth.resetRequestSent')}</Alert>
          <p className="text-sm text-slate-500">{t('auth.resetSameBrowserHint')}</p>
        </div>
      ) : (
        <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-4">
          <p className="text-slate-600">{t('auth.resetRequestText')}</p>
          {errorKey && <Alert kind="error">{translateKey(t, errorKey)}</Alert>}
          <TextField
            label={t('auth.email')}
            type="email"
            autoComplete="email"
            inputMode="email"
            error={fieldError(errors.email)}
            {...register('email')}
          />
          <Button type="submit" fullWidth loading={isSubmitting}>
            {t('auth.resetRequestButton')}
          </Button>
        </form>
      )}
      <p className="mt-6 text-center text-sm">
        <Link to="/login" className="font-semibold text-brand hover:underline">
          {t('auth.goToLogin')}
        </Link>
      </p>
    </AuthCard>
  )
}

function NewPasswordForm() {
  const { t } = useTranslation()
  const fieldError = useFieldError()
  const navigate = useNavigate()
  const [errorKey, setErrorKey] = useState<string | null>(null)
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<NewPasswordValues>({ resolver: zodResolver(newPasswordSchema) })

  async function onSubmit(values: NewPasswordValues) {
    setErrorKey(null)
    try {
      await setNewPassword(values.password)
      navigate('/account?notice=password-changed', { replace: true })
    } catch (error) {
      setErrorKey(errorToKey(error))
    }
  }

  return (
    <AuthCard title={t('auth.resetNewTitle')}>
      <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-4">
        {errorKey && <Alert kind="error">{translateKey(t, errorKey)}</Alert>}
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
        <Button type="submit" fullWidth loading={isSubmitting}>
          {t('auth.resetNewButton')}
        </Button>
      </form>
    </AuthCard>
  )
}

function LinkInvalid() {
  const { t } = useTranslation()
  return (
    <AuthCard title={t('auth.confirmErrorTitle')}>
      <p className="text-slate-600">{t('auth.recoveryOtherDevice')}</p>
      <p className="mt-6 text-center text-sm">
        <Link to="/reset" className="font-semibold text-brand hover:underline">
          {t('auth.resetRequestAgain')}
        </Link>
      </p>
    </AuthCard>
  )
}
