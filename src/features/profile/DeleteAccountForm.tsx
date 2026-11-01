import { useState, type FormEvent } from 'react'
import { useTranslation } from 'react-i18next'
import { useNavigate } from 'react-router'
import { Alert } from '../../components/ui/Alert'
import { Button } from '../../components/ui/Button'
import { TextField } from '../../components/ui/TextField'
import { translateKey } from '../../i18n/translate'
import { verifyCurrentPassword } from '../auth/api'
import { errorToKey } from '../auth/authErrors'
import { deleteMyAccount } from './api'

export function DeleteAccountForm({ userId, email }: { userId: string; email: string }) {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const [password, setPassword] = useState('')
  const [word, setWord] = useState('')
  const [errorKey, setErrorKey] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)

  const confirmWord = t('account.deleteWord')
  const wordOk = word.trim().toLocaleUpperCase() === confirmWord.toLocaleUpperCase()

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!wordOk || !password) return
    setErrorKey(null)
    setBusy(true)
    try {
      await verifyCurrentPassword(email, password)
      await deleteMyAccount(userId)
      navigate('/login?notice=account-deleted', { replace: true })
    } catch (error) {
      setErrorKey(errorToKey(error))
      setBusy(false)
    }
  }

  return (
    <form onSubmit={onSubmit} noValidate className="space-y-4">
      <p className="text-sm text-slate-700">{t('account.deleteText')}</p>
      {errorKey && <Alert kind="error">{translateKey(t, errorKey)}</Alert>}
      <input type="email" autoComplete="username" value={email} readOnly hidden />
      <TextField
        label={t('account.deletePasswordLabel')}
        type="password"
        autoComplete="current-password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
      />
      <TextField
        label={t('account.deleteConfirmLabel', { word: confirmWord })}
        autoComplete="off"
        value={word}
        onChange={(e) => setWord(e.target.value)}
      />
      <Button type="submit" variant="danger" loading={busy} disabled={!wordOk || !password}>
        {t('account.deleteButton')}
      </Button>
    </form>
  )
}
