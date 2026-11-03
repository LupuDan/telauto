import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import type { Language } from '../../i18n'
import {
  fetchMyPhone,
  fetchProfile,
  removeMyAvatar,
  updateMyLanguage,
  updateMyProfile,
  uploadMyAvatar,
  type ProfileUpdate,
} from './api'

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

/** "Schimbă poza" / "Șterge poza": file = new photo, null = remove the current one. */
export function useUpdateMyAvatar(userId: string) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ file, oldPath }: { file: File | null; oldPath: string | null }) =>
      file ? uploadMyAvatar(userId, file, oldPath) : oldPath ? removeMyAvatar(userId, oldPath) : Promise.resolve(),
    onSettled: () => queryClient.invalidateQueries({ queryKey: profileKeys.profile(userId) }),
  })
}

export function useUpdateMyLanguage(userId: string | undefined) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (language: Language) => (userId ? updateMyLanguage(userId, language) : Promise.resolve()),
    onSettled: () => queryClient.invalidateQueries({ queryKey: profileKeys.profile(userId ?? '') }),
  })
}
