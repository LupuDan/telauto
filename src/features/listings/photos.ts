import imageCompression from 'browser-image-compression'
import { LISTING_IMAGES_BUCKET, supabase } from '../../lib/supabase'

export const MAX_PHOTOS = 10

/** A photo in the form: either already uploaded (existing) or chosen now (new). */
export type PhotoItem = {
  id: string
  previewUrl: string
  /** set for photos already in Storage */
  storagePath?: string
  /** set for newly chosen (already compressed) photos */
  file?: File
}

const BASE_OPTIONS = {
  maxWidthOrHeight: 1600,
  maxSizeMB: 0.5,
  useWebWorker: true,
  initialQuality: 0.82,
}

/**
 * Shrinks a photo in the browser before upload (plan, section 5.4):
 * max 1600 px on the long side, WebP (or JPEG if the browser cannot make WebP), about 500 KB.
 */
export async function compressPhoto(file: File): Promise<File> {
  let result = await imageCompression(file, { ...BASE_OPTIONS, fileType: 'image/webp' })
  if (result.type !== 'image/webp') {
    result = await imageCompression(file, { ...BASE_OPTIONS, fileType: 'image/jpeg' })
  }
  const extension = result.type === 'image/webp' ? 'webp' : 'jpg'
  return new File([result], `photo.${extension}`, { type: result.type })
}

export function publicPhotoUrl(storagePath: string): string {
  return supabase.storage.from(LISTING_IMAGES_BUCKET).getPublicUrl(storagePath).data.publicUrl
}

export async function uploadPhoto(userId: string, listingId: string, file: File): Promise<string> {
  const extension = file.type === 'image/webp' ? 'webp' : 'jpg'
  const path = `${userId}/${listingId}/${crypto.randomUUID()}.${extension}`
  const { error } = await supabase.storage
    .from(LISTING_IMAGES_BUCKET)
    .upload(path, file, { contentType: file.type, upsert: false, cacheControl: '31536000' })
  if (error) throw error
  return path
}

export async function removePhotos(paths: string[]) {
  if (paths.length === 0) return
  const { error } = await supabase.storage.from(LISTING_IMAGES_BUCKET).remove(paths)
  if (error) throw error
}
