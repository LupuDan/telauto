// Static pages #/p/<page>; texts in src/i18n/*.json under "pages.<page>".
export const STATIC_PAGES = ['terms', 'privacy', 'safety', 'help', 'contact'] as const
export type StaticPageName = (typeof STATIC_PAGES)[number]

/** Shown on the contact page and inside the texts. */
export const CONTACT_EMAIL = 'lupu.daniel@elev.cihcahul.md'
