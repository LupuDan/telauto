import { LISTING_IMAGES_BUCKET, supabase } from '../../lib/supabase'
import type { Language } from '../../i18n'

export type PublicProfile = {
  id: string
  display_name: string
  locality_id: number | null
  language: string
  role: string
  is_blocked: boolean
  created_at: string
}

const PROFILE_COLUMNS = 'id, display_name, locality_id, language, role, is_blocked, created_at'

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

/** Plan, section 8: photos first (Storage API), then the account and everything linked to it. */
export async function deleteMyAccount(userId: string) {
  await deleteAllMyImages(userId)
  const { error } = await supabase.rpc('delete_my_account')
  if (error) throw error
  await supabase.auth.signOut({ scope: 'local' })
}
