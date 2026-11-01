import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { supabase } from '../../lib/supabase'
import { useAuth } from '../auth/authContext'

// "Garajul meu": table public.user_vehicles (0005). Each user sees only their own cars; max 10 (database rule).

export const MAX_VEHICLES = 10

export type Vehicle = {
  id: string
  makeId: number
  makeName: string
  modelId: number | null
  modelName: string | null
  year: number
  label: string
}

export type VehicleInput = { makeId: number; modelId: number | null; year: number; label: string }

const garageKey = (userId: string) => ['garage', userId] as const

async function fetchVehicles(): Promise<Vehicle[]> {
  const { data, error } = await supabase
    .from('user_vehicles')
    .select('id, make_id, model_id, year, label, created_at, vehicle_makes (name)')
    .order('created_at')
  if (error) throw error

  const modelIds = data.map((row) => row.model_id).filter((id): id is number => id !== null)
  const models = modelIds.length
    ? await supabase.from('vehicle_models').select('id, name').in('id', modelIds)
    : { data: [] as { id: number; name: string }[], error: null }
  if (models.error) throw models.error
  const modelName = new Map((models.data ?? []).map((model) => [model.id, model.name]))

  return data.map((row) => ({
    id: row.id,
    makeId: row.make_id,
    makeName: row.vehicle_makes?.name ?? '',
    modelId: row.model_id,
    modelName: row.model_id === null ? null : (modelName.get(row.model_id) ?? null),
    year: row.year,
    label: row.label,
  }))
}

export function useVehicles() {
  const { user } = useAuth()
  return useQuery({
    queryKey: garageKey(user?.id ?? ''),
    queryFn: fetchVehicles,
    enabled: Boolean(user),
  })
}

function toRow(input: VehicleInput) {
  return { make_id: input.makeId, model_id: input.modelId, year: input.year, label: input.label.trim() }
}

export function useSaveVehicle() {
  const { user } = useAuth()
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async ({ id, input }: { id?: string; input: VehicleInput }) => {
      const { error } = id
        ? await supabase.from('user_vehicles').update(toRow(input)).eq('id', id)
        : await supabase.from('user_vehicles').insert({ ...toRow(input), user_id: user?.id ?? '' })
      if (error) throw error
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: garageKey(user?.id ?? '') }),
  })
}

export function useDeleteVehicle() {
  const { user } = useAuth()
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('user_vehicles').delete().eq('id', id)
      if (error) throw error
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: garageKey(user?.id ?? '') }),
  })
}

/** "Audi A4 2015" (or the user's own name for the car first). */
export function vehicleTitle(vehicle: Vehicle, allModels: string): string {
  return `${vehicle.makeName} ${vehicle.modelName ?? `(${allModels})`} ${vehicle.year}`
}

/** Address of the auto parts that fit this car (filters of #/c/piese-auto, see src/features/search/filters.ts). */
export function compatiblePartsHref(vehicle: Vehicle): string {
  const params = new URLSearchParams({ cmake: String(vehicle.makeId), cyear: String(vehicle.year) })
  if (vehicle.modelId !== null) params.set('cmodel', String(vehicle.modelId))
  return `/c/piese-auto?${params}`
}
