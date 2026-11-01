import 'i18next'
import type ro from './ro.json'

// Makes t('...') keys type-checked against ro.json, so typos fail the build.
declare module 'i18next' {
  interface CustomTypeOptions {
    defaultNS: 'translation'
    resources: { translation: typeof ro }
    returnNull: false
  }
}
