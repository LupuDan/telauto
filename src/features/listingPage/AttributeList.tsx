import type { ReactNode } from 'react'
import { useTranslation } from 'react-i18next'
import { translateKey } from '../../i18n/translate'
import type { CategoryConfig, ReferenceFieldDef, StoredAttributes } from '../../lib/categories'
import { formatAttributeValue } from '../listings/attributeDisplay'
import { useReferenceOptions } from '../reference/hooks'

type Row = { key: string; label: string; value: ReactNode }

/** Characteristics table, generated from src/lib/categories.ts. */
export function AttributeList({
  category,
  attributes,
  extraRows = [],
}: {
  category: CategoryConfig
  attributes: StoredAttributes
  /** rows that do not come from attributes (condition, locality) */
  extraRows?: Row[]
}) {
  const { t, i18n } = useTranslation()
  const lng = i18n.resolvedLanguage

  const rows: Row[] = [...extraRows]
  for (const field of category.fields) {
    let value: ReactNode = null
    if (field.type === 'reference') {
      const other = field.otherKey ? attributes[field.otherKey] : undefined
      if (typeof other === 'string' && other) value = other
      else if (typeof attributes[field.key] === 'number') {
        const parent = field.dependsOn ? attributes[field.dependsOn] : undefined
        value = (
          <ReferenceName
            field={field}
            id={attributes[field.key] as number}
            parentId={typeof parent === 'number' ? parent : null}
          />
        )
      }
    } else {
      value = formatAttributeValue(t, field, attributes[field.key], lng)
    }
    if (value !== null && value !== '') {
      rows.push({ key: field.key, label: translateKey(t, `fields.${field.key}.label`), value })
    }
  }

  return (
    <dl className="divide-y divide-slate-100 rounded-xl border border-slate-200 bg-surface">
      {rows.map((row) => (
        <div key={row.key} className="grid grid-cols-2 gap-3 px-4 py-2.5 text-sm">
          <dt className="text-slate-600">{row.label}</dt>
          {/* user text: React shows it as plain text */}
          <dd className="font-medium break-words whitespace-pre-line text-slate-900">{row.value}</dd>
        </div>
      ))}
    </dl>
  )
}

function ReferenceName({ field, id, parentId }: { field: ReferenceFieldDef; id: number; parentId: number | null }) {
  const options = useReferenceOptions(field.source, field.dependsOn ? parentId : null)
  return <>{options.data?.find((option) => option.id === id)?.name ?? '…'}</>
}

