import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useState, type FormEvent } from 'react'
import { useTranslation } from 'react-i18next'
import { Button } from '../../components/ui/Button'
import { ErrorState } from '../../components/ui/ErrorState'
import { LoadingState } from '../../components/ui/LoadingState'
import { inputClass } from '../../components/ui/fieldStyles'
import { supabase } from '../../lib/supabase'
import { useReferenceOptions, type ReferenceOption } from '../reference/hooks'
import { ActionError, ConfirmButton } from './ui'

type Section = 'vehicles' | 'phones'
type Kind = 'vehicle_make' | 'vehicle_model' | 'phone_brand' | 'phone_model'

const MAX_NAME = { vehicle_make: 40, vehicle_model: 60, phone_brand: 40, phone_model: 60 } as const

async function addItem(kind: Kind, name: string, parentId: number | null) {
  const value = name.trim()
  const { error } =
    kind === 'vehicle_make'
      ? await supabase.from('vehicle_makes').insert({ name: value })
      : kind === 'vehicle_model'
        ? await supabase.from('vehicle_models').insert({ name: value, make_id: parentId ?? -1 })
        : kind === 'phone_brand'
          ? await supabase.from('phone_brands').insert({ name: value, sort_order: 100 })
          : // new phone models go to the top of the list (the newest models are first)
            await supabase.from('phone_models').insert({ name: value, brand_id: parentId ?? -1, sort_order: 0 })
  if (error) throw error
}

async function renameItem(kind: Kind, id: number, name: string) {
  const value = { name: name.trim() }
  const { error } =
    kind === 'vehicle_make'
      ? await supabase.from('vehicle_makes').update(value).eq('id', id)
      : kind === 'vehicle_model'
        ? await supabase.from('vehicle_models').update(value).eq('id', id)
        : kind === 'phone_brand'
          ? await supabase.from('phone_brands').update(value).eq('id', id)
          : await supabase.from('phone_models').update(value).eq('id', id)
  if (error) throw error
}

/** Deletes only what no listing, compatibility or garage uses (admin_delete_reference in 0015). */
async function deleteItem(kind: Kind, id: number) {
  const { error } = await supabase.rpc('admin_delete_reference', { p_kind: kind, p_id: id })
  if (error) throw error
}

/** Car makes and models, phone brands and models. */
export function ReferencesTab() {
  const { t } = useTranslation()
  const [section, setSection] = useState<Section>('vehicles')
  const [parentId, setParentId] = useState<number | null>(null)

  const parentKind: Kind = section === 'vehicles' ? 'vehicle_make' : 'phone_brand'
  const childKind: Kind = section === 'vehicles' ? 'vehicle_model' : 'phone_model'
  const parents = useReferenceOptions(section === 'vehicles' ? 'vehicleMake' : 'phoneBrand')
  const children = useReferenceOptions(section === 'vehicles' ? 'vehicleModel' : 'phoneModel', parentId)
  const parentName = parents.data?.find((item) => item.id === parentId)?.name

  return (
    <div className="space-y-4">
      <div className="flex gap-2" role="group" aria-label={t('admin.references.section')}>
        {(['vehicles', 'phones'] as const).map((value) => (
          <Button
            key={value}
            variant={section === value ? 'primary' : 'secondary'}
            aria-pressed={section === value}
            onClick={() => {
              setSection(value)
              setParentId(null)
            }}
          >
            {value === 'vehicles' ? t('admin.references.vehicles') : t('admin.references.phones')}
          </Button>
        ))}
      </div>
      <p className="text-sm text-slate-600">{t('admin.references.hint')}</p>

      <div className="grid gap-4 md:grid-cols-2">
        <ReferenceColumn
          title={section === 'vehicles' ? t('admin.references.makes') : t('admin.references.brands')}
          kind={parentKind}
          query={parents}
          parentId={null}
          selectedId={parentId}
          onSelect={setParentId}
        />
        {parentId !== null ? (
          <ReferenceColumn
            key={`${section}-${parentId}`}
            title={t('admin.references.modelsOf', { name: parentName ?? '' })}
            kind={childKind}
            query={children}
            parentId={parentId}
          />
        ) : (
          <p className="rounded-card border border-dashed border-line-strong bg-surface p-6 text-center text-sm text-slate-500">
            {t('admin.references.chooseParent')}
          </p>
        )}
      </div>
    </div>
  )
}

function ReferenceColumn({
  title,
  kind,
  query,
  parentId,
  selectedId,
  onSelect,
}: {
  title: string
  kind: Kind
  query: ReturnType<typeof useReferenceOptions>
  parentId: number | null
  selectedId?: number | null
  onSelect?: (id: number) => void
}) {
  const { t } = useTranslation()
  const queryClient = useQueryClient()
  const [newName, setNewName] = useState('')
  const [filter, setFilter] = useState('')
  const refresh = () => queryClient.invalidateQueries({ queryKey: ['reference'] })

  const add = useMutation({
    mutationFn: () => addItem(kind, newName, parentId),
    onSuccess: () => {
      setNewName('')
      void refresh()
    },
  })

  function handleAdd(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (newName.trim()) add.mutate()
  }

  const items = (query.data ?? []).filter((item) => item.name.toLowerCase().includes(filter.trim().toLowerCase()))

  return (
    <section className="space-y-3 rounded-card border border-line bg-surface p-4 shadow-sm">
      <h3 className="font-semibold">{title}</h3>
      <form onSubmit={handleAdd} className="flex gap-2">
        <label className="sr-only" htmlFor={`new-${kind}`}>
          {t('admin.references.newName')}
        </label>
        <input
          id={`new-${kind}`}
          value={newName}
          maxLength={MAX_NAME[kind]}
          onChange={(event) => setNewName(event.target.value)}
          placeholder={t('admin.references.newName')}
          className={inputClass(false)}
        />
        <Button type="submit" loading={add.isPending} disabled={!newName.trim()}>
          {t('admin.references.add')}
        </Button>
      </form>
      <ActionError error={add.error} />
      <input
        type="search"
        value={filter}
        onChange={(event) => setFilter(event.target.value)}
        placeholder={t('admin.references.filter')}
        aria-label={t('admin.references.filter')}
        className={inputClass(false)}
      />

      {query.isPending ? (
        <LoadingState />
      ) : query.isError ? (
        <ErrorState error={query.error} onRetry={() => void query.refetch()} />
      ) : (
        <ul className="max-h-[28rem] divide-y divide-slate-100 overflow-y-auto rounded-field border border-slate-100">
          {items.map((item) => (
            <ReferenceRow
              key={item.id}
              item={item}
              kind={kind}
              selected={selectedId === item.id}
              onSelect={onSelect}
              onChanged={() => void refresh()}
            />
          ))}
          {items.length === 0 && <li className="p-3 text-sm text-slate-500">{t('admin.references.none')}</li>}
        </ul>
      )}
    </section>
  )
}

function ReferenceRow({
  item,
  kind,
  selected,
  onSelect,
  onChanged,
}: {
  item: ReferenceOption
  kind: Kind
  selected: boolean
  onSelect?: (id: number) => void
  onChanged: () => void
}) {
  const { t } = useTranslation()
  const [editing, setEditing] = useState(false)
  const [name, setName] = useState(item.name)
  const rename = useMutation({
    mutationFn: () => renameItem(kind, item.id, name),
    onSuccess: () => {
      setEditing(false)
      onChanged()
    },
  })
  const remove = useMutation({ mutationFn: () => deleteItem(kind, item.id), onSuccess: onChanged })

  if (editing) {
    return (
      <li className="space-y-2 p-2">
        <form
          className="flex gap-2"
          onSubmit={(event) => {
            event.preventDefault()
            if (name.trim()) rename.mutate()
          }}
        >
          <input
            value={name}
            maxLength={MAX_NAME[kind]}
            onChange={(event) => setName(event.target.value)}
            aria-label={t('admin.references.rename')}
            className={inputClass(false)}
            autoFocus
          />
          <Button type="submit" loading={rename.isPending}>
            {t('account.save')}
          </Button>
          <Button variant="secondary" onClick={() => setEditing(false)}>
            {t('garage.cancel')}
          </Button>
        </form>
        <ActionError error={rename.error} />
      </li>
    )
  }

  return (
    <li className={`space-y-1 p-2 ${selected ? 'bg-brand-50' : ''}`}>
      <div className="flex items-center gap-2">
        {onSelect ? (
          <button
            type="button"
            onClick={() => onSelect(item.id)}
            aria-pressed={selected}
            className="min-h-10 flex-1 truncate rounded px-1 text-left font-medium hover:underline"
          >
            {item.name} <span aria-hidden="true">›</span>
          </button>
        ) : (
          <span className="flex-1 truncate px-1">{item.name}</span>
        )}
        <Button variant="ghost" onClick={() => setEditing(true)}>
          {t('admin.references.rename')}
        </Button>
        <ConfirmButton
          confirmText={t('admin.confirm.delete')}
          loading={remove.isPending}
          onConfirm={() => remove.mutate()}
        >
          {t('myListings.delete')}
        </ConfirmButton>
      </div>
      <ActionError error={remove.error} />
    </li>
  )
}
