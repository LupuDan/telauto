import { useTranslation } from 'react-i18next'
import { SpecSheet, type SpecRow } from '../../components/ui/SpecSheet'
import { translateKey } from '../../i18n/translate'
import type { CategoryConfig, ReferenceFieldDef, StoredAttributes } from '../../lib/categories'
import { formatAttributeValue } from '../listings/attributeDisplay'
import { useReferenceOptions } from '../reference/hooks'

/** Product sheet of a listing, generated from src/lib/categories.ts (plan de design: SpecSheet). */
export function AttributeList({
  category,
  attributes,
  extraRows = [],
}: {
  category: CategoryConfig
  attributes: StoredAttributes
  /** rows that do not come from attributes (condition) */
  extraRows?: SpecRow[]
}) {
  const { t, i18n } = useTranslation()
  const lng = i18n.resolvedLanguage

  const rows: SpecRow[] = [...extraRows]
  for (const field of category.fields) {
    let value: SpecRow['value'] = null
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
      const text = formatAttributeValue(t, field, attributes[field.key], lng)
      // numbers with a unit read "180 000 km" in the sheet too
      value =
        text && field.type === 'number' && field.unit
          ? `${text}${field.unit === '%' ? '' : ' '}${field.unit}`
          : text
    }
    if (value !== null && value !== '') {
      const label = translateKey(t, `fields.${field.key}.label`).replace(/\s*\((km|%|l)\)$/, '')
      rows.push({ key: field.key, label, value })
    }
  }

  return <SpecSheet rows={rows} />
}

function ReferenceName({ field, id, parentId }: { field: ReferenceFieldDef; id: number; parentId: number | null }) {
  const options = useReferenceOptions(field.source, field.dependsOn ? parentId : null)
  return <>{options.data?.find((option) => option.id === id)?.name ?? '…'}</>
}
