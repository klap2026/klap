/**
 * API client utilities for making authenticated requests
 * Cookies are sent automatically - no need to manually handle tokens
 */

export async function apiRequest<T = any>(
  url: string,
  options: RequestInit = {}
): Promise<T> {
  const response = await fetch(url, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
    // Credentials 'include' ensures cookies are sent
    credentials: 'include',
  })

  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: 'Request failed' }))
    throw new Error(error.error || `HTTP ${response.status}`)
  }

  return response.json()
}

export async function logout() {
  await apiRequest('/api/auth/logout', { method: 'POST' })
  // Redirect to login
  window.location.href = '/login'
}
