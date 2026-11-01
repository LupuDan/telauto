import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { fetchMyPhone, fetchProfile, updateMyProfile, type ProfileUpdate } from './api'

export const profileKeys = {
  profile: (userId: string) => ['profile', userId] as const,
  myPhone: (userId: string) => ['my-phone', userId] as const,
}

export function useProfile(userId: string | undefined) {
  return useQuery({
    queryKey: profileKeys.profile(userId ?? ''),
    queryFn: () => fetchProfile(userId!),
    enabled: Boolean(userId),
  })
}

export function useMyPhone(userId: string | undefined) {
  return useQuery({
    queryKey: profileKeys.myPhone(userId ?? ''),
    queryFn: () => fetchMyPhone(userId!),
    enabled: Boolean(userId),
  })
}

export function useUpdateMyProfile(userId: string) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (values: ProfileUpdate) => updateMyProfile(userId, values),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: profileKeys.profile(userId) })
      void queryClient.invalidateQueries({ queryKey: profileKeys.myPhone(userId) })
    },
  })
}
