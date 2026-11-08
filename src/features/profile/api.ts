import { compressImage } from '../../lib/imageCompression'
import { AVATARS_BUCKET, LISTING_IMAGES_BUCKET, supabase } from '../../lib/supabase'
import type { Language } from '../../i18n'

export type PublicProfile = {
  id: string
  display_name: string
  locality_id: number | null
  language: string
  role: string
  is_blocked: boolean
  created_at: string
  avatar_path: string | null
}

const PROFILE_COLUMNS = 'id, display_name, locality_id, language, role, is_blocked, created_at, avatar_path'

export async function fetchProfile(userId: string): Promise<PublicProfile | null> {
  const { data, error } = await supabase.from('profiles').select(PROFILE_COLUMNS).eq('id', userId).maybeSingle()
  if (error) throw error
  return data
}

/** Own phone number (only the owner can read it, see RLS on profile_private). */
export async function fetchMyPhone(userId: string): Promise<string> {
  const { data, error } = await supabase.from('profile_private').select('phone').eq('user_id', userId).maybeSingle()
  if (error) throw error
  return data?.phone ?? ''
}

export type ProfileUpdate = {
  displayName: string
  localityId: number | null
  language: Language
  phone: string
}

export async function updateMyProfile(userId: string, values: ProfileUpdate) {
  const { error } = await supabase
    .from('profiles')
    .update({ display_name: values.displayName, locality_id: values.localityId, language: values.language })
    .eq('id', userId)
  if (error) throw error

  const { error: phoneError } = await supabase
    .from('profile_private')
    .update({ phone: values.phone === '' ? null : values.phone })
    .eq('user_id', userId)
  if (phoneError) throw phoneError
}

/** Saves only the preferred language (the RO | RU switch in "Contul meu"). */
export async function updateMyLanguage(userId: string, language: Language) {
  const { error } = await supabase.from('profiles').update({ language }).eq('id', userId)
  if (error) throw error
}

export function avatarUrl(path: string | null | undefined): string | null {
  return path ? supabase.storage.from(AVATARS_BUCKET).getPublicUrl(path).data.publicUrl : null
}

/** Profile photo: square, 400 × 400 px, WebP (or JPEG), about 60 KB. */
async function compressAvatar(file: File): Promise<File> {
  const options = { maxWidthOrHeight: 400, maxSizeMB: 0.1, useWebWorker: true, initialQuality: 0.85 }
  let result = await compressImage(file, { ...options, fileType: 'image/webp' })
  if (result.type !== 'image/webp') result = await compressImage(file, { ...options, fileType: 'image/jpeg' })
  return new File([result], result.type === 'image/webp' ? 'avatar.webp' : 'avatar.jpg', { type: result.type })
}

/** Uploads the new photo, saves it in the profile, then deletes the old one. */
export async function uploadMyAvatar(userId: string, file: File, oldPath: string | null) {
  const photo = await compressAvatar(file)
  const path = `${userId}/${crypto.randomUUID()}.${photo.type === 'image/webp' ? 'webp' : 'jpg'}`
  const bucket = supabase.storage.from(AVATARS_BUCKET)
  const { error: uploadError } = await bucket.upload(path, photo, {
    contentType: photo.type,
    upsert: false,
    cacheControl: '31536000',
  })
  if (uploadError) throw uploadError

  const { error } = await supabase.from('profiles').update({ avatar_path: path }).eq('id', userId)
  if (error) {
    await bucket.remove([path])
    throw error
  }
  if (oldPath) await bucket.remove([oldPath])
}

export async function removeMyAvatar(userId: string, oldPath: string) {
  const { error } = await supabase.from('profiles').update({ avatar_path: null }).eq('id', userId)
  if (error) throw error
  await supabase.storage.from(AVATARS_BUCKET).remove([oldPath])
}

export async function updateMyPhone(userId: string, phone: string) {
  const { error } = await supabase
    .from('profile_private')
    .update({ phone: phone === '' ? null : phone })
    .eq('user_id', userId)
  if (error) throw error
}

/** Deletes every photo the user uploaded: <user_id>/<listing_id>/<file>. */
async function deleteAllMyImages(userId: string) {
  const bucket = supabase.storage.from(LISTING_IMAGES_BUCKET)
  const { data: folders, error } = await bucket.list(userId, { limit: 1000 })
  if (error) throw error

  for (const folder of folders ?? []) {
    const prefix = `${userId}/${folder.name}`
    const { data: files, error: listError } = await bucket.list(prefix, { limit: 100 })
    if (listError) throw listError
    const paths = (files ?? []).map((file) => `${prefix}/${file.name}`)
    if (paths.length > 0) {
      const { error: removeError } = await bucket.remove(paths)
      if (removeError) throw removeError
    }
  }
}

/** Deletes the profile photo(s): avatars/<user_id>/<file>. */
async function deleteMyAvatars(userId: string) {
  const bucket = supabase.storage.from(AVATARS_BUCKET)
  const { data: files, error } = await bucket.list(userId, { limit: 100 })
  if (error) throw error
  const paths = (files ?? []).map((file) => `${userId}/${file.name}`)
  if (paths.length > 0) {
    const { error: removeError } = await bucket.remove(paths)
    if (removeError) throw removeError
  }
}

/** Plan, section 8: photos first (Storage API), then the account and everything linked to it. */
export async function deleteMyAccount(userId: string) {
  await deleteAllMyImages(userId)
  await deleteMyAvatars(userId)
  const { error } = await supabase.rpc('delete_my_account')
  if (error) throw error
  await supabase.auth.signOut({ scope: 'local' })
}
