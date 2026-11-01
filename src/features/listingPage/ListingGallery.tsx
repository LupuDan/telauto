import { useEffect, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { publicPhotoUrl } from '../listings/photos'

/**
 * Photo gallery: swipe on phones (CSS scroll-snap), arrows and thumbnails on computers,
 * and a full-screen view (native <dialog>, Esc closes it).
 */
export function ListingGallery({ photos, title, fallbackIcon }: { photos: string[]; title: string; fallbackIcon?: string }) {
  const { t } = useTranslation()
  const [index, setIndex] = useState(0)
  const stripRef = useRef<HTMLDivElement>(null)
  const dialogRef = useRef<HTMLDialogElement>(null)

  function goTo(next: number) {
    const target = Math.max(0, Math.min(photos.length - 1, next))
    const strip = stripRef.current
    if (strip) strip.scrollTo({ left: target * strip.clientWidth, behavior: 'smooth' })
    setIndex(target)
  }

  // keep the counter right while swiping
  function handleScroll() {
    const strip = stripRef.current
    if (!strip || strip.clientWidth === 0) return
    const current = Math.round(strip.scrollLeft / strip.clientWidth)
    if (current !== index) setIndex(current)
  }

  useEffect(() => {
    const dialog = dialogRef.current
    if (!dialog) return
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'ArrowLeft') setIndex((value) => Math.max(0, value - 1))
      if (event.key === 'ArrowRight') setIndex((value) => Math.min(photos.length - 1, value + 1))
    }
    dialog.addEventListener('keydown', onKey)
    return () => dialog.removeEventListener('keydown', onKey)
  }, [photos.length])

  if (photos.length === 0) {
    return (
      <div className="flex aspect-[4/3] items-center justify-center rounded-xl bg-slate-100 text-6xl" aria-hidden="true">
        {fallbackIcon}
      </div>
    )
  }

  const arrowClass =
    'absolute top-1/2 hidden size-11 -translate-y-1/2 items-center justify-center rounded-full bg-white/90 text-xl shadow hover:bg-white focus-visible:outline-2 focus-visible:outline-brand-600 disabled:opacity-0 sm:flex'

  return (
    <div className="space-y-2">
      <div className="relative overflow-hidden rounded-xl bg-slate-900">
        <div
          ref={stripRef}
          onScroll={handleScroll}
          className="flex aspect-[4/3] snap-x snap-mandatory overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
        >
          {photos.map((path, photoIndex) => (
            <button
              key={path}
              type="button"
              onClick={() => {
                setIndex(photoIndex)
                dialogRef.current?.showModal()
              }}
              className="size-full shrink-0 snap-center"
              aria-label={t('listing.openPhoto', { n: photoIndex + 1, total: photos.length })}
            >
              <img
                src={publicPhotoUrl(path)}
                alt={photoIndex === 0 ? title : ''}
                loading={photoIndex === 0 ? 'eager' : 'lazy'}
                decoding="async"
                className="size-full object-contain"
              />
            </button>
          ))}
        </div>
        <button
          type="button"
          className={`${arrowClass} left-2`}
          onClick={() => goTo(index - 1)}
          disabled={index === 0}
          aria-label={t('listing.previousPhoto')}
        >
          ←
        </button>
        <button
          type="button"
          className={`${arrowClass} right-2`}
          onClick={() => goTo(index + 1)}
          disabled={index === photos.length - 1}
          aria-label={t('listing.nextPhoto')}
        >
          →
        </button>
        <span className="absolute right-2 bottom-2 rounded-md bg-black/60 px-2 py-0.5 text-xs text-white" aria-live="polite">
          {index + 1} / {photos.length}
        </span>
      </div>

      {photos.length > 1 && (
        <ul className="flex gap-2 overflow-x-auto pb-1">
          {photos.map((path, photoIndex) => (
            <li key={path} className="shrink-0">
              <button
                type="button"
                onClick={() => goTo(photoIndex)}
                aria-label={t('listing.showPhoto', { n: photoIndex + 1 })}
                aria-current={photoIndex === index ? 'true' : undefined}
                className={`block size-16 overflow-hidden rounded-lg border-2 ${
                  photoIndex === index ? 'border-brand-700' : 'border-transparent opacity-70 hover:opacity-100'
                }`}
              >
                <img src={publicPhotoUrl(path)} alt="" loading="lazy" className="size-full object-cover" />
              </button>
            </li>
          ))}
        </ul>
      )}

      <dialog
        ref={dialogRef}
        aria-label={title}
        className="m-0 h-full max-h-none w-full max-w-none bg-black p-0 text-white backdrop:bg-black"
        onClose={() => {
          // show the same photo in the page gallery after closing
          const strip = stripRef.current
          if (strip) strip.scrollTo({ left: index * strip.clientWidth })
        }}
        onClick={(event) => {
          if (event.target === event.currentTarget) dialogRef.current?.close()
        }}
      >
        <div className="relative flex h-full items-center justify-center">
          <img src={publicPhotoUrl(photos[index])} alt="" className="max-h-full max-w-full object-contain" />
          <button
            type="button"
            onClick={() => dialogRef.current?.close()}
            className="absolute top-3 right-3 flex size-11 items-center justify-center rounded-full bg-white/20 text-2xl hover:bg-white/30"
            aria-label={t('listing.closePhoto')}
          >
            ×
          </button>
          {index > 0 && (
            <button
              type="button"
              onClick={() => setIndex(index - 1)}
              className="absolute left-3 flex size-12 items-center justify-center rounded-full bg-white/20 text-2xl hover:bg-white/30"
              aria-label={t('listing.previousPhoto')}
            >
              ←
            </button>
          )}
          {index < photos.length - 1 && (
            <button
              type="button"
              onClick={() => setIndex(index + 1)}
              className="absolute right-3 flex size-12 items-center justify-center rounded-full bg-white/20 text-2xl hover:bg-white/30"
              aria-label={t('listing.nextPhoto')}
            >
              →
            </button>
          )}
          <span className="absolute bottom-3 rounded-md bg-black/60 px-2 py-0.5 text-sm">
            {index + 1} / {photos.length}
          </span>
        </div>
      </dialog>
    </div>
  )
}
