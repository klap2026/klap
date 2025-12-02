'use client'

import { useEffect } from 'react'
import { useSearchParams, usePathname, useRouter } from 'next/navigation'

/**
 * Development-only hook to preserve ?token=... query parameter across navigation.
 * This enables multi-tab testing with different users without losing authentication.
 *
 * Usage: Call this hook in your root layout or any component that's always mounted.
 */
export function usePreserveQueryToken() {
  const searchParams = useSearchParams()
  const pathname = usePathname()
  const router = useRouter()

  useEffect(() => {
    // Only run in development
    if (process.env.NODE_ENV !== 'development') return

    // Get token from current URL
    const token = searchParams.get('token')
    if (!token) return

    // Store the original router methods
    const originalPush = router.push
    const originalReplace = router.replace

    // Helper function to add token to URL
    const addToken = (href: string): string => {
      // Skip if already has token
      if (href.includes('token=')) return href

      // Skip external URLs
      if (href.startsWith('http') || href.startsWith('//')) return href

      const separator = href.includes('?') ? '&' : '?'
      return `${href}${separator}token=${token}`
    }

    // Patch router.push
    router.push = function(href: string, options?: any) {
      const newHref = addToken(href)
      return originalPush.call(this, newHref, options)
    }

    // Patch router.replace
    router.replace = function(href: string, options?: any) {
      const newHref = addToken(href)
      return originalReplace.call(this, newHref, options)
    }

    // Intercept all link clicks (for Next.js Link components)
    const handleClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement

      // Find the closest <a> tag (in case user clicked on child element)
      const link = target.closest('a')
      if (!link) return

      // Only handle internal links
      const href = link.getAttribute('href')
      if (!href || href.startsWith('http') || href.startsWith('//')) return

      // Skip if link already has a token
      if (href.includes('token=')) return

      // Prevent default navigation
      e.preventDefault()

      // Add token to URL and navigate
      const newHref = addToken(href)
      window.location.href = newHref
    }

    // Add event listener
    document.addEventListener('click', handleClick, true)

    // Cleanup
    return () => {
      document.removeEventListener('click', handleClick, true)
      // Restore original methods
      router.push = originalPush
      router.replace = originalReplace
    }
  }, [searchParams, pathname, router])
}
