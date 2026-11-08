import imageCompression, { type Options } from 'browser-image-compression'
// The library's background worker loads a copy of the library by address. By default that address is
// cdn.jsdelivr.net (code from another website, at every upload). "?url" makes Vite publish the same file
// together with our site, so the worker loads it from us.
import libraryUrl from 'browser-image-compression/dist/browser-image-compression.js?url'

/** browser-image-compression with the worker library served from our own site. */
export function compressImage(file: File, options: Options): Promise<File> {
  return imageCompression(file, { ...options, libURL: new URL(libraryUrl, window.location.href).href })
}
