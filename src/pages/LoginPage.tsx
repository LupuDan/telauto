import { zodResolver } from '@hookform/resolvers/zod'
import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { useTranslation } from 'react-i18next'
import { Link, Navigate, useNavigate, useSearchParams } from 'react-router'
import { usePageMeta } from '../app/usePageMeta'
import { Alert } from '../components/ui/Alert'
import { AuthCard } from '../components/ui/AuthCard'
import { Button } from '../components/ui/Button'
import { TextField } from '../components/ui/TextField'
import { useFieldError } from '../components/ui/useFieldError'
import { resendConfirmation, signIn } from '../features/auth/api'
import { useAuth } from '../features/auth/authContext'
import { errorToKey } from '../features/auth/authErrors'
import { loginSchema, type LoginValues } from '../features/auth/schemas'
import { translateKey } from '../i18n/translate'
import { safeInternalPath } from '../lib/siteUrl'

export function LoginPage() {
  const { t } = useTranslation()
  usePageMeta(t('auth.loginMetaTitle'))
  const fieldError = useFieldError()
  const navigate = useNavigate()
  const [params] = useSearchParams()
  const next = safeInternalPath(params.get('next'), '/account')
  const { user, loading } = useAuth()

  const [errorKey, setErrorKey] = useState<string | null>(null)
  const [resendState, setResendState] = useState<'idle' | 'sending' | 'sent'>('idle')

  const {
    register,
    handleSubmit,
    getValues,
    formState: { errors, isSubmitting },
  } = useForm<LoginValues>({ resolver: zodResolver(loginSchema) })

  if (!loading && user) {
    return <Navigate to={next} replace />
  }

  async function onSubmit(values: LoginValues) {
    setErrorKey(null)
    setResendState('idle')
    try {
      await signIn(values.email, values.password)
      navigate(next, { replace: true })
    } catch (error) {
      setErrorKey(errorToKey(error))
    }
  }

  async function onResend() {
    setResendState('sending')
    try {
      await resendConfirmation(getValues('email').trim())
      setResendState('sent')
    } catch (error) {
      setResendState('idle')
      setErrorKey(errorToKey(error))
    }
  }

  return (
    <AuthCard title={t('auth.loginTitle')}>
      <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-4">
        {params.get('notice') === 'account-deleted' && <Alert kind="success">{t('account.deletedNotice')}</Alert>}
        {errorKey && (
          <Alert kind="error">
            <p>{translateKey(t, errorKey)}</p>
            {errorKey === 'errors.emailNotConfirmed' && resendState !== 'sent' && (
              <button
                type="button"
                onClick={onResend}
                disabled={resendState === 'sending'}
                className="mt-2 font-semibold underline"
              >
                {t('auth.resendConfirmation')}
              </button>
            )}
          </Alert>
        )}
        {resendState === 'sent' && <Alert kind="success">{t('auth.resendSuccess')}</Alert>}

        <TextField
          label={t('auth.email')}
          type="email"
          autoComplete="email"
          inputMode="email"
          error={fieldError(errors.email)}
          {...register('email')}
        />
        <TextField
          label={t('auth.password')}
          type="password"
          autoComplete="current-password"
          error={fieldError(errors.password)}
          {...register('password')}
        />

        <div className="text-right text-sm">
          <Link to="/reset" className="text-brand-700 hover:underline">
            {t('auth.forgotPassword')}
          </Link>
        </div>

        <Button type="submit" fullWidth loading={isSubmitting}>
          {t('auth.loginButton')}
        </Button>
      </form>

      <p className="mt-6 text-center text-sm text-slate-600">
        {t('auth.noAccount')}{' '}
        <Link to={`/register${params.get('next') ? `?next=${encodeURIComponent(next)}` : ''}`} className="font-semibold text-brand-700 hover:underline">
          {t('auth.registerLink')}
        </Link>
      </p>
    </AuthCard>
  )
}
