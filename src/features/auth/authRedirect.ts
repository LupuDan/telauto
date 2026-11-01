/**
 * Email links (confirm account, reset password) come back to the site root as
 *   https://.../telauto/?flow=signup&code=XYZ           (success, PKCE flow)
 *   https://.../telauto/?flow=signup#error=...&error_code=otp_expired   (failure)
 * HashRouter only looks at the part after "#", so before the app starts we move these
 * values into the route "#/auth/confirm?..." and remove them from the address bar.
 */
export function captureAuthRedirect(): void {
  const url = new URL(window.location.href)
  const query = url.searchParams
  const hashParams = /^#(error|error_code|access_token)=/.test(url.hash)
    ? new URLSearchParams(url.hash.slice(1))
    : null

  const code = query.get('code')
  const errorCode =
    query.get('error_code') ?? hashParams?.get('error_code') ?? query.get('error') ?? hashParams?.get('error')

  if (!code && !errorCode) {
    return
  }

  const route = new URLSearchParams()
  if (code) route.set('code', code)
  if (errorCode) route.set('error_code', errorCode)
  const flow = query.get('flow')
  if (flow === 'signup' || flow === 'recovery') route.set('flow', flow)

  window.history.replaceState(null, '', `${url.origin}${url.pathname}#/auth/confirm?${route.toString()}`)
}
