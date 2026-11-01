import { z } from 'zod'
import { displayNameField, phoneField } from '../auth/schemas'

export const profileSettingsSchema = z.object({
  displayName: displayNameField,
  /** "" = not chosen; otherwise the id as text (value of the <select>) */
  localityId: z.string(),
  phone: phoneField,
  language: z.enum(['ro', 'ru']),
})

export type ProfileSettingsInput = z.input<typeof profileSettingsSchema>
export type ProfileSettingsOutput = z.output<typeof profileSettingsSchema>
