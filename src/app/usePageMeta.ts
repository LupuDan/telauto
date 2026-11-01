import { useEffect } from 'react'

// The description written in index.html is used for pages that do not give their own.
const DEFAULT_DESCRIPTION =
  document.querySelector<HTMLMetaElement>('meta[name="description"]')?.content ?? ''

/** Sets the browser tab title and meta description for the current page. */
export function usePageMeta(title: string, description?: string) {
  useEffect(() => {
    document.title = title
    let meta = document.querySelector<HTMLMetaElement>('meta[name="description"]')
    if (!meta) {
      meta = document.createElement('meta')
      meta.name = 'description'
      document.head.appendChild(meta)
    }
    meta.content = description || DEFAULT_DESCRIPTION
  }, [title, description])
}
