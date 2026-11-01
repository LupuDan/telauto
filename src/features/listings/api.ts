import {
  attributesToForm,
  buildAttributes,
  categoryById,
  categoryBySlug,
  type CategoryConfig,
  type StoredAttributes,
} from '../../lib/categories'
import { supabase } from '../../lib/supabase'
import { normalizeImei, normalizeVin, parseNumber, parsePrice } from '../../lib/validators'
import { AppError } from '../auth/authErrors'
import { publicPhotoUrl, removePhotos, uploadPhoto, type PhotoItem } from './photos'
import { EMPTY_LISTING, type ListingFormValues } from './schema'

export type ListingStatus = 'draft' | 'active' | 'sold' | 'hidden' | 'rejected'

export type MyListing = {
  id: string
  title: string
  price: number
  currency: string
  status: ListingStatus
  category_id: number
  created_at: string
  expires_at: string
  views: number
  coverPath: string | null
}

/** Progress shown while publishing: which step and how many photos are uploaded. */
export type SaveProgress = { stage: 'saving' | 'photos' | 'publishing'; done: number; total: number }

function requireCategory(slug: string): CategoryConfig {
  const category = categoryBySlug(slug)
  if (!category) throw new AppError('validation.chooseCategory')
  return category
}

function toListingRow(category: CategoryConfig, values: ListingFormValues) {
  return {
    category_id: category.id,
    title: values.title.trim(),
    description: values.description.trim(),
    price: parsePrice(values.price),
    currency: values.currency,
    negotiable: values.negotiable,
    locality_id: Number(values.localityId),
    condition: values.condition as 'new' | 'used',
    attributes: buildAttributes(category, values.attributes),
  }
}

async function savePrivate(category: CategoryConfig, listingId: string, values: ListingFormValues) {
  if (!category.privateField) return
  const imei = category.privateField === 'imei' ? normalizeImei(values.imei) : ''
  const vin = category.privateField === 'vin' ? normalizeVin(values.vin) : ''

  if (!imei && !vin) {
    const { error } = await supabase.from('listing_private').delete().eq('listing_id', listingId)
    if (error) throw error
    return
  }
  const { error } = await supabase
    .from('listing_private')
    .upsert({ listing_id: listingId, imei: imei || null, vin: vin || null })
  if (error) throw error
}

async function saveCompatibility(category: CategoryConfig, listingId: string, values: ListingFormValues) {
  if (!category.hasCompatibility) return
  const { error } = await supabase.from('listing_compatibility').delete().eq('listing_id', listingId)
  if (error) throw error
  const rows = values.compatibility.map((row) => ({
    listing_id: listingId,
    make_id: Number(row.makeId),
    model_id: /^\d+$/.test(row.modelId) ? Number(row.modelId) : null,
    year_from: parseNumber(row.yearFrom),
    year_to: parseNumber(row.yearTo),
  }))
  if (rows.length > 0) {
    const { error: insertError } = await supabase.from('listing_compatibility').insert(rows)
    if (insertError) throw insertError
  }
}

/**
 * Uploads new photos and stores the final order (position 0 = main photo).
 * Rows are replaced in one statement so reordering never breaks the "unique position" rule.
 */
async function savePhotos(
  userId: string,
  listingId: string,
  photos: PhotoItem[],
  onProgress?: (p: SaveProgress) => void,
): Promise<string[]> {
  const total = photos.filter((photo) => photo.file).length
  let done = 0
  onProgress?.({ stage: 'photos', done, total })

  const paths: string[] = []
  for (const photo of photos) {
    if (photo.storagePath) {
      paths.push(photo.storagePath)
    } else if (photo.file) {
      paths.push(await uploadPhoto(userId, listingId, photo.file))
      done += 1
      onProgress?.({ stage: 'photos', done, total })
    }
  }

  const { data: oldRows, error: readError } = await supabase
    .from('listing_images')
    .select('storage_path')
    .eq('listing_id', listingId)
  if (readError) throw readError

  const { error: deleteError } = await supabase.from('listing_images').delete().eq('listing_id', listingId)
  if (deleteError) throw deleteError
  if (paths.length > 0) {
    const { error: insertError } = await supabase
      .from('listing_images')
      .insert(paths.map((storage_path, position) => ({ listing_id: listingId, storage_path, position })))
    if (insertError) throw insertError
  }

  // photos removed in the form are deleted from Storage too
  const removed = (oldRows ?? []).map((row) => row.storage_path).filter((path) => !paths.includes(path))
  await removePhotos(removed).catch(() => undefined)
  return paths
}

/**
 * New listing (plan, section 9 – phase 4):
 * 1. draft row (anti-spam limit is checked here), 2. IMEI/VIN, compatibility, 3. photos,
 * 4. publish_listing() checks min photos / compatibility on the server and makes it public.
 * If something fails after step 1 the draft stays and can be finished from "Anunțurile mele".
 */
export async function createListing(
  userId: string,
  values: ListingFormValues,
  photos: PhotoItem[],
  onProgress?: (p: SaveProgress) => void,
): Promise<string> {
  const category = requireCategory(values.categorySlug)
  onProgress?.({ stage: 'saving', done: 0, total: 0 })

  const { data, error } = await supabase
    .from('listings')
    .insert({ ...toListingRow(category, values), user_id: userId })
    .select('id')
    .single()
  if (error) throw error
  const listingId = data.id

  try {
    await savePrivate(category, listingId, values)
    await saveCompatibility(category, listingId, values)
    await savePhotos(userId, listingId, photos, onProgress)
    onProgress?.({ stage: 'publishing', done: 0, total: 0 })
    await publishListing(listingId)
  } catch (cause) {
    throw new DraftSavedError(listingId, cause)
  }
  return listingId
}

/** Thrown when the listing was created as draft but could not be finished. */
export class DraftSavedError extends Error {
  readonly listingId: string
  readonly reason: unknown
  constructor(listingId: string, reason: unknown) {
    super("DRAFT_SAVED")
    this.listingId = listingId
    this.reason = reason
  }
}

export async function updateListing(
  userId: string,
  listingId: string,
  values: ListingFormValues,
  photos: PhotoItem[],
  options: { publish: boolean },
  onProgress?: (p: SaveProgress) => void,
) {
  const category = requireCategory(values.categorySlug)
  onProgress?.({ stage: 'saving', done: 0, total: 0 })

  const { category_id: _categoryCannotChange, ...row } = toListingRow(category, values)
  void _categoryCannotChange
  const { error } = await supabase.from('listings').update(row).eq('id', listingId)
  if (error) throw error

  await savePrivate(category, listingId, values)
  await saveCompatibility(category, listingId, values)
  await savePhotos(userId, listingId, photos, onProgress)

  if (options.publish) {
    onProgress?.({ stage: 'publishing', done: 0, total: 0 })
    await publishListing(listingId)
  }
}

export async function publishListing(listingId: string) {
  const { error } = await supabase.rpc('publish_listing', { p_listing_id: listingId })
  if (error) throw error
}

export type ListingForEdit = {
  id: string
  userId: string
  status: ListingStatus
  category: CategoryConfig
  values: ListingFormValues
  photos: PhotoItem[]
}

export async function fetchListingForEdit(listingId: string): Promise<ListingForEdit | null> {
  const { data: listing, error } = await supabase
    .from('listings')
    .select(
      'id, user_id, category_id, title, description, price, currency, negotiable, locality_id, condition, attributes, status',
    )
    .eq('id', listingId)
    .maybeSingle()
  if (error) throw error
  if (!listing) return null

  const category = categoryById(listing.category_id)
  if (!category) return null

  const [privateRes, imagesRes, compatRes] = await Promise.all([
    supabase.from('listing_private').select('imei, vin').eq('listing_id', listingId).maybeSingle(),
    supabase.from('listing_images').select('storage_path, position').eq('listing_id', listingId).order('position'),
    supabase
      .from('listing_compatibility')
      .select('make_id, model_id, year_from, year_to')
      .eq('listing_id', listingId)
      .order('id'),
  ])
  if (privateRes.error) throw privateRes.error
  if (imagesRes.error) throw imagesRes.error
  if (compatRes.error) throw compatRes.error

  return {
    id: listing.id,
    userId: listing.user_id,
    status: listing.status as ListingStatus,
    category,
    values: {
      ...EMPTY_LISTING,
      categorySlug: category.slug,
      title: listing.title,
      description: listing.description,
      price: String(listing.price),
      currency: listing.currency === 'EUR' ? 'EUR' : 'MDL',
      negotiable: listing.negotiable,
      condition: listing.condition,
      localityId: String(listing.locality_id),
      attributes: attributesToForm(category, (listing.attributes ?? {}) as StoredAttributes),
      imei: privateRes.data?.imei ?? '',
      vin: privateRes.data?.vin ?? '',
      compatibility: (compatRes.data ?? []).map((row) => ({
        makeId: String(row.make_id),
        modelId: row.model_id ? String(row.model_id) : '',
        yearFrom: String(row.year_from),
        yearTo: String(row.year_to),
      })),
    },
    photos: (imagesRes.data ?? []).map((image) => ({
      id: image.storage_path,
      storagePath: image.storage_path,
      previewUrl: publicPhotoUrl(image.storage_path),
    })),
  }
}

export async function fetchMyListings(userId: string): Promise<MyListing[]> {
  const { data, error } = await supabase
    .from('listings')
    .select(
      'id, title, price, currency, status, category_id, created_at, expires_at, views, listing_images(storage_path, position)',
    )
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
  if (error) throw error

  return data.map(({ listing_images, ...listing }) => {
    const cover = [...(listing_images ?? [])].sort((a, b) => a.position - b.position)[0]
    return { ...listing, status: listing.status as ListingStatus, coverPath: cover?.storage_path ?? null }
  })
}

export async function setListingStatus(listingId: string, status: 'active' | 'sold') {
  const { error } = await supabase.from('listings').update({ status }).eq('id', listingId)
  if (error) throw error
}

/** "Reactivează": +30 days from now and back to active (database function, see 0004). */
export async function reactivateListing(listingId: string) {
  const { error } = await supabase.rpc('reactivate_listing', { p_listing_id: listingId })
  if (error) throw error
}

/** Deletes the photos from Storage first (SQL cannot), then the listing row (cascades to the rest). */
export async function deleteListing(listingId: string) {
  const { data: images, error: readError } = await supabase
    .from('listing_images')
    .select('storage_path')
    .eq('listing_id', listingId)
  if (readError) throw readError
  await removePhotos((images ?? []).map((image) => image.storage_path))

  const { error } = await supabase.from('listings').delete().eq('id', listingId)
  if (error) throw error
}
