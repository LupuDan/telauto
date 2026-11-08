import { z } from 'zod'
import { normalizePhone, PHONE_PATTERN } from '../../lib/format'

// Messages are translation keys; forms show them with translateKey().

export const emailField = z.string().trim().min(1, 'validation.required').email('validation.email')

// 72 = bcrypt limit used by Supabase Auth
export const passwordField = z
  .string()
  .min(8, 'validation.passwordMin')
  .max(72, 'validation.passwordMax')
  // same rule as Supabase Auth "letters_digits" (supabase/config.toml)
  .refine((value) => /[a-zA-Z]/.test(value) && /[0-9]/.test(value), 'validation.passwordLettersDigits')

export const displayNameField = z
  .string()
  .trim()
  .min(2, 'validation.displayNameMin')
  .max(60, 'validation.displayNameMax')

/** Optional phone: "" or a valid number, stored normalized ("+37369123456"). */
export const phoneField = z
  .string()
  .transform((value) => normalizePhone(value))
  .refine((value) => value === '' || PHONE_PATTERN.test(value), 'validation.phone')

export const loginSchema = z.object({
  email: emailField,
  password: z.string().min(1, 'validation.required'),
})
export type LoginValues = z.infer<typeof loginSchema>

export const registerSchema = z
  .object({
    displayName: displayNameField,
    email: emailField,
    password: passwordField,
    passwordConfirm: z.string(),
    acceptTerms: z.boolean().refine((value) => value, 'validation.acceptTerms'),
  })
  .refine((values) => values.password === values.passwordConfirm, {
    message: 'validation.passwordMismatch',
    path: ['passwordConfirm'],
  })
export type RegisterValues = z.infer<typeof registerSchema>

export const resetRequestSchema = z.object({ email: emailField })
export type ResetRequestValues = z.infer<typeof resetRequestSchema>

export const newPasswordSchema = z
  .object({
    password: passwordField,
    passwordConfirm: z.string(),
  })
  .refine((values) => values.password === values.passwordConfirm, {
    message: 'validation.passwordMismatch',
    path: ['passwordConfirm'],
  })
export type NewPasswordValues = z.infer<typeof newPasswordSchema>

export const changePasswordSchema = z
  .object({
    currentPassword: z.string().min(1, 'validation.required'),
    password: passwordField,
    passwordConfirm: z.string(),
  })
  .refine((values) => values.password === values.passwordConfirm, {
    message: 'validation.passwordMismatch',
    path: ['passwordConfirm'],
  })
export type ChangePasswordValues = z.infer<typeof changePasswordSchema>
