import { NextResponse } from 'next/server'

const COOKIE_NAME = 'auth-token'
const COOKIE_MAX_AGE = 30 * 24 * 60 * 60 // 30 days in seconds

export function setAuthCookie(response: NextResponse, token: string) {
  response.cookies.set({
    name: COOKIE_NAME,
    value: token,
    httpOnly: true, // Prevents JavaScript access (XSS protection)
    secure: process.env.NODE_ENV === 'production', // HTTPS only in production
    sameSite: 'lax', // CSRF protection
    maxAge: COOKIE_MAX_AGE,
    path: '/',
  })
  return response
}

export function clearAuthCookie(response: NextResponse) {
  response.cookies.delete(COOKIE_NAME)
  return response
}

export const AUTH_COOKIE_NAME = COOKIE_NAME
