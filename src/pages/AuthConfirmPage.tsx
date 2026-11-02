import { useEffect, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Link, useNavigate, useSearchParams } from 'react-router'
import { usePageMeta } from '../app/usePageMeta'
import { AuthCard } from '../components/ui/AuthCard'
import { LoadingState } from '../components/ui/LoadingState'
import { exchangeCode, verifyEmailToken } from '../features/auth/api'

type Result = 'checking' | 'confirmed' | 'confirmed-login' | 'recovery-other-device' | 'invalid'

/**
 * Landing page of the email links (see features/auth/authRedirect.ts).
 *   ?code=...&flow=signup|recovery           standard Supabase emails (PKCE)
 *   ?token_hash=...&type=email|recovery      custom email templates (supabase/templates)
 *   ?error_code=...                          link expired / already used
 */
export function AuthConfirmPage() {
  const { t } = useTranslation()
  usePageMeta(t('auth.confirmMetaTitle'))
  const navigate = useNavigate()
  const [params] = useSearchParams()
  const [result, setResult] = useState<Result>('checking')
  const started = useRef(false)

  useEffect(() => {
    if (started.current) return
    started.current = true

    const code = params.get('code')
    const flow = params.get('flow')
    const tokenHash = params.get('token_hash')
    const type = params.get('type')

    async function run(): Promise<Result | 'go-reset'> {
      if (params.get('error_code')) {
        return 'invalid'
      }
      if (tokenHash && (type === 'email' || type === 'recovery')) {
        try {
          await verifyEmailToken(tokenHash, type)
          return type === 'recovery' ? 'go-reset' : 'confirmed'
        } catch {
          return 'invalid'
        }
      }
      if (code) {
        try {
          await exchangeCode(code)
          return flow === 'recovery' ? 'go-reset' : 'confirmed'
        } catch {
          // The code only works in the browser where the request was made.
          // For sign-up the email is confirmed anyway (Supabase confirmed it before redirecting).
          if (flow === 'signup') return 'confirmed-login'
          if (flow === 'recovery') return 'recovery-other-device'
          return 'invalid'
        }
      }
      return 'invalid'
    }

    void run().then((outcome) => {
      if (outcome === 'go-reset') {
        navigate('/reset?step=new', { replace: true })
      } else {
        setResult(outcome)
      }
    })
  }, [params, navigate])

  if (result === 'checking') {
    return (
      <div aria-live="polite">
        <LoadingState />
      </div>
    )
  }

  if (result === 'confirmed' || result === 'confirmed-login') {
    return (
      <AuthCard title={t('auth.confirmSuccessTitle')}>
        <p className="text-ink">{t('auth.confirmSuccessText')}</p>
        <p className="mt-6 text-center">
          {result === 'confirmed' ? (
            <Link to="/account" className="font-semibold text-brand hover:underline">
              {t('auth.goToAccount')}
            </Link>
          ) : (
            <Link to="/login" className="font-semibold text-brand hover:underline">
              {t('auth.goToLogin')}
            </Link>
          )}
        </p>
      </AuthCard>
    )
  }

  return (
    <AuthCard title={t('auth.confirmErrorTitle')}>
      <p className="text-ink">
        {result === 'recovery-other-device' ? t('auth.recoveryOtherDevice') : t('auth.confirmErrorText')}
      </p>
      <div className="mt-6 flex flex-col items-center gap-2 text-sm">
        <Link to="/login" className="font-semibold text-brand hover:underline">
          {t('auth.goToLogin')}
        </Link>
        <Link to="/reset" className="text-brand hover:underline">
          {t('auth.resetRequestAgain')}
        </Link>
      </div>
    </AuthCard>
  )
}
