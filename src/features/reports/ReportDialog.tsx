import { useMutation } from '@tanstack/react-query'
import { useEffect, useId, useRef, useState, type FormEvent } from 'react'
import { useTranslation } from 'react-i18next'
import { Alert } from '../../components/ui/Alert'
import { Button } from '../../components/ui/Button'
import { inputClass } from '../../components/ui/fieldStyles'
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
  const dialogRef = useRef<HTMLDialogElement>(null)
  const detailsId = useId()
  const [reason, setReason] = useState<Reason | ''>('')
  const [details, setDetails] = useState('')
  const report = useMutation({
    mutationFn: () => sendReport(user?.id ?? '', target, reason as Reason, details),
  })

  useEffect(() => {
    const dialog = dialogRef.current
    if (dialog && !dialog.open) dialog.showModal()
  }, [])

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!reason) return
    report.mutate()
  }

  const isListing = 'listingId' in target

  return (
    <dialog
      ref={dialogRef}
      onClose={onClose}
      aria-labelledby={`${detailsId}-title`}
      className="m-auto w-[min(32rem,calc(100%-2rem))] rounded-card p-0 shadow-xl backdrop:bg-black/50"
    >
      <form onSubmit={handleSubmit} className="space-y-4 p-5">
        <div className="flex items-start justify-between gap-2">
          <h2 id={`${detailsId}-title`} className="text-lg font-semibold">
            {isListing ? t('reports.titleListing') : t('reports.titleMessage')}
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="flex size-9 items-center justify-center rounded-field text-xl text-slate-500 hover:bg-slate-100"
            aria-label={t('listing.closePhoto')}
          >
            ×
          </button>
        </div>

        {report.isSuccess ? (
          <>
            <Alert kind="success">{t('reports.thanks')}</Alert>
            <Button fullWidth onClick={onClose}>
              {t('listing.closePhoto')}
            </Button>
          </>
        ) : (
          <>
            <fieldset className="space-y-2">
              <legend className="mb-1 text-sm font-medium text-slate-700">{t('reports.reasonLabel')}</legend>
              {REPORT_REASONS.map((value) => (
                <label key={value} className="flex min-h-11 cursor-pointer items-center gap-3 rounded-field border border-line px-3 hover:bg-paper">
                  <input
                    type="radio"
                    name="reason"
                    value={value}
                    checked={reason === value}
                    onChange={() => setReason(value)}
                    className="size-4 accent-brand"
                  />
                  <span className="text-sm">{translateKey(t, `reports.reasons.${value}`)}</span>
                </label>
              ))}
            </fieldset>
            <div>
              <label htmlFor={detailsId} className="mb-1 block text-sm font-medium text-slate-700">
                {t('reports.detailsLabel')}
              </label>
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
            <div className="flex gap-2">
              <Button type="submit" variant="danger" loading={report.isPending} disabled={!reason} className="flex-1">
                {t('reports.send')}
              </Button>
              <Button variant="secondary" onClick={onClose}>
                {t('garage.cancel')}
              </Button>
            </div>
          </>
        )}
      </form>
    </dialog>
  )
}
