import { useMutation } from '@tanstack/react-query'
import { useId, useState, type FormEvent } from 'react'
import { useTranslation } from 'react-i18next'
import { Alert } from '../../components/ui/Alert'
import { Button } from '../../components/ui/Button'
import { FieldLabel } from '../../components/ui/FieldMessage'
import { inputClass } from '../../components/ui/fieldStyles'
import { Sheet } from '../../components/ui/Sheet'
import { translateKey } from '../../i18n/translate'
import { supabase } from '../../lib/supabase'
import { useAuth } from '../auth/authContext'
import { AppError, errorToKey } from '../auth/authErrors'

// Reasons allowed by the database (reports_reason_check in 0007).
const REPORT_REASONS = ['scam', 'prohibited', 'wrong_category', 'duplicate', 'other'] as const
type Reason = (typeof REPORT_REASONS)[number]

export type ReportTarget = { listingId: string } | { messageId: string }

async function sendReport(reporterId: string, target: ReportTarget, reason: Reason, details: string) {
  const { error } = await supabase.from('reports').insert({
    reporter_id: reporterId,
    listing_id: 'listingId' in target ? target.listingId : null,
    message_id: 'messageId' in target ? target.messageId : null,
    reason,
    details: details.trim(),
  })
  // one report per person per listing / message (unique index)
  if (error?.code === '23505') throw new AppError('reports.already')
  if (error) throw error
}

/**
 * "Raportează": a small window with the reason. 3 reports from different users hide a listing
 * until an admin checks it (database rule in 0007).
 */
/** Render it only while open (it starts empty every time). */
export function ReportDialog({ target, onClose }: { target: ReportTarget; onClose: () => void }) {
  const { t } = useTranslation()
  const { user } = useAuth()
  const detailsId = useId()
  const [reason, setReason] = useState<Reason | ''>('')
  const [details, setDetails] = useState('')
  const report = useMutation({
    mutationFn: () => sendReport(user?.id ?? '', target, reason as Reason, details),
  })

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!reason) return
    report.mutate()
  }

  const isListing = 'listingId' in target

  return (
    // same window as everywhere: slides up on phones, centred on computers
    <Sheet open onClose={onClose} title={isListing ? t('reports.titleListing') : t('reports.titleMessage')}>
      {report.isSuccess ? (
        <div className="space-y-4">
          <Alert kind="success">{t('reports.thanks')}</Alert>
          <Button fullWidth onClick={onClose}>
            {t('common.close')}
          </Button>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-5">
          <fieldset className="space-y-2">
            <legend className="mb-1.5 text-sm font-medium text-ink">{t('reports.reasonLabel')}</legend>
            {REPORT_REASONS.map((value) => (
              <label
                key={value}
                className="flex min-h-11 cursor-pointer items-center gap-3 rounded-field border border-line-strong px-3 hover:bg-paper has-[:checked]:border-brand has-[:checked]:bg-brand-50"
              >
                <input
                  type="radio"
                  name="reason"
                  value={value}
                  checked={reason === value}
                  onChange={() => setReason(value)}
                  className="size-4 accent-brand"
                />
                <span className="text-ink">{translateKey(t, `reports.reasons.${value}`)}</span>
              </label>
            ))}
          </fieldset>
          <div>
            <FieldLabel htmlFor={detailsId} label={t('reports.detailsLabel')} />
            <textarea
              id={detailsId}
              value={details}
              onChange={(event) => setDetails(event.target.value)}
              maxLength={1000}
              rows={3}
              className={inputClass(false)}
            />
          </div>
          {report.isError && <Alert kind="error">{translateKey(t, errorToKey(report.error))}</Alert>}
          <div className="grid gap-2 sm:grid-cols-2">
            <Button type="submit" variant="danger" loading={report.isPending} disabled={!reason} fullWidth>
              {t('reports.send')}
            </Button>
            <Button variant="secondary" onClick={onClose} fullWidth>
              {t('garage.cancel')}
            </Button>
          </div>
        </form>
      )}
    </Sheet>
  )
}
