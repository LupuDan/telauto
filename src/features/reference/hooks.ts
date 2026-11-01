import { useQuery } from '@tanstack/react-query'
import type { ReferenceSource } from '../../lib/categories'
import { supabase } from '../../lib/supabase'

export type Locality = { id: number; name_ro: string; name_ru: string; sort_order: number }
export type ReferenceOption = { id: number; name: string }

async function fetchLocalities(): Promise<Locality[]> {
  const { data, error } = await supabase.from('localities').select('id, name_ro, name_ru, sort_order')
  if (error) throw error
  // Chișinău and Bălți first (sort_order), then alphabetically with Romanian rules (ș, ț, î...)
  return [...data].sort((a, b) => a.sort_order - b.sort_order || a.name_ro.localeCompare(b.name_ro, 'ro'))
}

/** Municipalities and districts; they rarely change, so they are cached for the whole visit. */
export function useLocalities() {
  return useQuery({ queryKey: ['localities'], queryFn: fetchLocalities, staleTime: Infinity })
}

const byName = (a: ReferenceOption, b: ReferenceOption) => a.name.localeCompare(b.name, 'ro', { numeric: true })

async function fetchReference(source: ReferenceSource, parentId: number | null): Promise<ReferenceOption[]> {
  switch (source) {
    case 'phoneBrand': {
      const { data, error } = await supabase.from('phone_brands').select('id, name, sort_order').order('sort_order')
      if (error) throw error
      return data.map(({ id, name }) => ({ id, name }))
    }
    case 'phoneModel': {
      const { data, error } = await supabase
        .from('phone_models')
        .select('id, name, sort_order')
        .eq('brand_id', parentId ?? -1)
        .order('sort_order')
      if (error) throw error
      return data.map(({ id, name }) => ({ id, name }))
    }
    case 'vehicleMake': {
      const { data, error } = await supabase.from('vehicle_makes').select('id, name')
      if (error) throw error
      return [...data].sort(byName)
    }
    case 'vehicleModel': {
      const { data, error } = await supabase
        .from('vehicle_models')
        .select('id, name')
        .eq('make_id', parentId ?? -1)
      if (error) throw error
      return [...data].sort(byName)
    }
  }
}

/** Brands, makes and models. Models need the parent (brand/make) id; until then nothing is loaded. */
export function useReferenceOptions(source: ReferenceSource, parentId: number | null = null) {
  const needsParent = source === 'phoneModel' || source === 'vehicleModel'
  return useQuery({
    queryKey: ['reference', source, parentId],
    queryFn: () => fetchReference(source, parentId),
    enabled: !needsParent || parentId !== null,
    staleTime: 10 * 60_000,
  })
}
