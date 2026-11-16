/** Default landing after login/register by role (admin sections → /admin). */
export function postAuthHomePath(user) {
  const sections = user?.sections
  return Array.isArray(sections) && sections.length > 0 ? '/admin' : '/dashboard'
}

/** Prefer a safe same-origin redirect query; otherwise role home. */
export function resolvePostAuthPath(user, redirect) {
  if (typeof redirect === 'string' && redirect.startsWith('/') && !redirect.startsWith('//')) {
    return redirect
  }
  return postAuthHomePath(user)
}
