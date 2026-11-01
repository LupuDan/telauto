import { AuthError } from '@supabase/supabase-js'
import { describe, expect, it } from 'vitest'
import { AppError, errorToKey } from './authErrors'

describe('Mesajele de eroare pentru utilizator', () => {
  it('erorile bazei de date au mesaje clare', () => {
    expect(errorToKey({ message: 'LISTING_LIMIT_REACHED' })).toBe('errors.listingLimit')
    expect(errorToKey({ message: 'MESSAGE_LIMIT_REACHED' })).toBe('errors.messageLimit')
    expect(errorToKey({ message: 'REFERENCE_IN_USE' })).toBe('errors.referenceInUse')
    expect(errorToKey({ message: 'duplicate key', code: '23505' })).toBe('errors.duplicate')
  })
  it('erorile de cont (Supabase Auth)', () => {
    expect(errorToKey(new AuthError('Invalid login credentials', 400, 'invalid_credentials'))).toBe('errors.invalidCredentials')
    expect(errorToKey(new AuthError('too many', 429))).toBe('errors.rateLimit')
  })
  it('emailul care nu poate fi trimis (SMTP) are mesaj propriu, nu „Ceva nu a mers”', () => {
    expect(errorToKey(new AuthError('Error sending confirmation email', 500, 'unexpected_failure'))).toBe('errors.emailSendFailed')
    expect(errorToKey(new AuthError('Error sending recovery email', 500))).toBe('errors.emailSendFailed')
  })
  it('lipsa internetului și restul', () => {
    expect(errorToKey(new TypeError('Failed to fetch'))).toBe('errors.network')
    expect(errorToKey(new AppError('reports.already'))).toBe('reports.already')
    expect(errorToKey('ceva ciudat')).toBe('errors.generic')
  })
})
