import { AuthError } from '@supabase/supabase-js'

/** Error codes raised by our database functions/triggers (see supabase/migrations). */
const DATABASE_ERROR_KEYS: Record<string, string> = {
  LISTING_LIMIT_REACHED: 'errors.listingLimit',
  LISTING_IMAGE_LIMIT_REACHED: 'errors.imageLimit',
  MESSAGE_LIMIT_REACHED: 'errors.messageLimit',
  GARAGE_LIMIT_REACHED: 'errors.garageLimit',
  OWN_LISTING: 'errors.ownListing',
  LOGIN_REQUIRED: 'errors.loginRequired',
  NOT_ALLOWED: 'errors.notAllowed',
  LISTING_NOT_FOUND: 'errors.listingNotFound',
  LISTING_NOT_DRAFT: 'errors.listingNotDraft',
  LISTING_PHOTOS_MISSING: 'errors.photosMissing',
  LISTING_COMPATIBILITY_MISSING: 'errors.compatibilityMissing',
  LISTING_STATUS_ADMIN_ONLY: 'errors.notAllowed',
  PROFILE_FIELD_ADMIN_ONLY: 'errors.notAllowed',
  REFERENCE_IN_USE: 'errors.referenceInUse',
  CANNOT_BLOCK_SELF: 'errors.cannotBlockSelf',
  CANNOT_BLOCK_ADMIN: 'errors.cannotBlockAdmin',
  USER_NOT_FOUND: 'errors.userNotFound',
  INVALID_ACTION: 'errors.generic',
}

/** Supabase Auth error codes -> translation keys. */
const AUTH_ERROR_KEYS: Record<string, string> = {
  invalid_credentials: 'errors.invalidCredentials',
  email_not_confirmed: 'errors.emailNotConfirmed',
  over_email_send_rate_limit: 'errors.emailRateLimit',
  over_request_rate_limit: 'errors.rateLimit',
  weak_password: 'errors.weakPassword',
  same_password: 'errors.samePassword',
  user_already_exists: 'errors.userExists',
  email_exists: 'errors.userExists',
  otp_expired: 'errors.linkExpired',
  flow_state_expired: 'errors.linkExpired',
  flow_state_not_found: 'errors.linkExpired',
  bad_code_verifier: 'errors.linkExpired',
  user_banned: 'errors.notAllowed',
  signup_disabled: 'errors.notAllowed',
}

export class AppError extends Error {
  /** translation key, e.g. "errors.wrongPassword" */
  readonly key: string
  constructor(key: string) {
    super(key)
    this.key = key
  }
}

/** Turns any error (Supabase Auth, database, network) into a translation key for the user. */
export function errorToKey(error: unknown): string {
  if (error instanceof AppError) {
    return error.key
  }
  if (error instanceof AuthError) {
    if (error.code && AUTH_ERROR_KEYS[error.code]) {
      return AUTH_ERROR_KEYS[error.code]
    }
    if (error.status === 429) {
      return 'errors.rateLimit'
    }
    // the email service (SMTP) refused to send: confirmation / reset email could not leave
    if (/error sending .*email/i.test(error.message)) {
      return 'errors.emailSendFailed'
    }
  }
  if (error && typeof error === 'object' && 'message' in error) {
    const message = String((error as { message: unknown }).message)
    if (DATABASE_ERROR_KEYS[message]) {
      return DATABASE_ERROR_KEYS[message]
    }
    // unique_violation: the same thing already exists (name of a brand, a second report...)
    if ('code' in error && (error as { code: unknown }).code === '23505') {
      return 'errors.duplicate'
    }
    if (/failed to fetch|networkerror|load failed/i.test(message)) {
      return 'errors.network'
    }
  }
  return 'errors.generic'
}
