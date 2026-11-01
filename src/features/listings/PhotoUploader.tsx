import {
  closestCenter,
  DndContext,
  KeyboardSensor,
  PointerSensor,
  TouchSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from '@dnd-kit/core'
import {
  arrayMove,
  rectSortingStrategy,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
} from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { useRef, useState, type ChangeEvent } from 'react'
import { useTranslation } from 'react-i18next'
import { Alert } from '../../components/ui/Alert'
import { Spinner } from '../../components/ui/Spinner'
import { compressPhoto, MAX_PHOTOS, type PhotoItem } from './photos'

type Props = {
  photos: PhotoItem[]
  onChange: (photos: PhotoItem[]) => void
  minPhotos: number
  /** translated error (e.g. "add at least 3 photos") */
  error?: string
}

export function PhotoUploader({ photos, onChange, minPhotos, error }: Props) {
  const { t } = useTranslation()
  const inputRef = useRef<HTMLInputElement>(null)
  const [processing, setProcessing] = useState(0)
  const [failed, setFailed] = useState(0)

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
    // on phones: press and hold to drag, so normal scrolling still works
    useSensor(TouchSensor, { activationConstraint: { delay: 250, tolerance: 8 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  )

  const free = MAX_PHOTOS - photos.length - processing

  async function handleFiles(event: ChangeEvent<HTMLInputElement>) {
    const files = Array.from(event.target.files ?? []).slice(0, Math.max(free, 0))
    event.target.value = ''
    if (files.length === 0) return

    setFailed(0)
    setProcessing((n) => n + files.length)
    const added: PhotoItem[] = []
    let failures = 0
    for (const file of files) {
      try {
        const compressed = await compressPhoto(file)
        added.push({ id: crypto.randomUUID(), file: compressed, previewUrl: URL.createObjectURL(compressed) })
      } catch {
        failures += 1
      } finally {
        setProcessing((n) => n - 1)
      }
    }
    setFailed(failures)
    onChange([...photos, ...added])
  }

  function remove(id: string) {
    const photo = photos.find((item) => item.id === id)
    if (photo?.file) URL.revokeObjectURL(photo.previewUrl)
    onChange(photos.filter((item) => item.id !== id))
  }

  function move(index: number, direction: -1 | 1) {
    const target = index + direction
    if (target < 0 || target >= photos.length) return
    onChange(arrayMove(photos, index, target))
  }

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event
    if (!over || active.id === over.id) return
    const from = photos.findIndex((item) => item.id === active.id)
    const to = photos.findIndex((item) => item.id === over.id)
    onChange(arrayMove(photos, from, to))
  }

  return (
    <div className="space-y-3">
      <p className="text-sm text-slate-600">
        {t('listingForm.photosHint', { min: minPhotos, max: MAX_PHOTOS })}
      </p>

      {error && <Alert kind="error">{error}</Alert>}
      {failed > 0 && <Alert kind="warning">{t('listingForm.photoFailed', { count: failed })}</Alert>}

      <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
        <SortableContext items={photos.map((photo) => photo.id)} strategy={rectSortingStrategy}>
          <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
            {photos.map((photo, index) => (
              <SortablePhoto
                key={photo.id}
                photo={photo}
                index={index}
                count={photos.length}
                onRemove={() => remove(photo.id)}
                onMove={(direction) => move(index, direction)}
              />
            ))}
            {Array.from({ length: processing }, (_, i) => (
              <li
                key={`processing-${i}`}
                className="flex aspect-[4/3] items-center justify-center rounded-lg border border-slate-200 bg-slate-100 text-slate-500"
              >
                <Spinner />
                <span className="sr-only">{t('listingForm.photoProcessing')}</span>
              </li>
            ))}
            {free > 0 && (
              <li>
                <button
                  type="button"
                  onClick={() => inputRef.current?.click()}
                  className="flex aspect-[4/3] w-full flex-col items-center justify-center gap-1 rounded-lg border-2 border-dashed border-slate-300 bg-white text-sm font-semibold text-brand-700 hover:border-brand-600 hover:bg-brand-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-600"
                >
                  <span aria-hidden="true" className="text-2xl">
                    +
                  </span>
                  {t('listingForm.addPhotos')}
                  <span className="text-xs font-normal text-slate-500">
                    {photos.length}/{MAX_PHOTOS}
                  </span>
                </button>
              </li>
            )}
          </ul>
        </SortableContext>
      </DndContext>

      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp,image/heic,image/heif"
        multiple
        hidden
        onChange={handleFiles}
      />

      {photos.length > 1 && <p className="text-xs text-slate-500">{t('listingForm.photosReorderHint')}</p>}
    </div>
  )
}

type SortablePhotoProps = {
  photo: PhotoItem
  index: number
  count: number
  onRemove: () => void
  onMove: (direction: -1 | 1) => void
}

function SortablePhoto({ photo, index, count, onRemove, onMove }: SortablePhotoProps) {
  const { t } = useTranslation()
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: photo.id })

  return (
    <li
      ref={setNodeRef}
      style={{ transform: CSS.Transform.toString(transform), transition }}
      className={`relative overflow-hidden rounded-lg border bg-white ${
        isDragging ? 'z-10 border-brand-600 shadow-lg' : 'border-slate-200'
      }`}
    >
      <div
        {...attributes}
        {...listeners}
        aria-label={t('listingForm.photoDrag', { n: index + 1 })}
        className="aspect-[4/3] cursor-grab touch-manipulation active:cursor-grabbing"
      >
        <img
          src={photo.previewUrl}
          alt={t('listingForm.photoAlt', { n: index + 1 })}
          className="size-full object-cover select-none"
          draggable={false}
        />
      </div>

      {index === 0 && (
        <span className="absolute top-1.5 left-1.5 rounded bg-brand-700 px-1.5 py-0.5 text-xs font-semibold text-white">
          {t('listingForm.mainPhoto')}
        </span>
      )}

      <div className="flex items-center justify-between gap-1 border-t border-slate-200 p-1">
        <div className="flex gap-1">
          <IconButton label={t('listingForm.photoMoveLeft')} disabled={index === 0} onClick={() => onMove(-1)}>
            ←
          </IconButton>
          <IconButton label={t('listingForm.photoMoveRight')} disabled={index === count - 1} onClick={() => onMove(1)}>
            →
          </IconButton>
        </div>
        <IconButton label={t('listingForm.photoRemove')} onClick={onRemove} danger>
          ✕
        </IconButton>
      </div>
    </li>
  )
}

function IconButton({
  label,
  onClick,
  disabled,
  danger,
  children,
}: {
  label: string
  onClick: () => void
  disabled?: boolean
  danger?: boolean
  children: string
}) {
  return (
    <button
      type="button"
      aria-label={label}
      title={label}
      disabled={disabled}
      onClick={onClick}
      className={`flex size-9 items-center justify-center rounded-md text-base font-bold disabled:opacity-30 ${
        danger ? 'text-red-700 hover:bg-red-50' : 'text-slate-700 hover:bg-slate-100'
      }`}
    >
      <span aria-hidden="true">{children}</span>
    </button>
  )
}
