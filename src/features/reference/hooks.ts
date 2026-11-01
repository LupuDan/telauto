import { useQuery } from '@tanstack/react-query'
import { supabase } from '../../lib/supabase'

export type Locality = { id: number; name_ro: string; name_ru: string; sort_order: number }

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
