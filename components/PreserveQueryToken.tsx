'use client'

import { usePreserveQueryToken } from '@/lib/hooks/use-preserve-query-token'

/**
 * Component that preserves ?token=... query parameter across navigation in development mode.
 * Include this in your root layout to enable automatic token preservation.
 */
export function PreserveQueryToken() {
  usePreserveQueryToken()
  return null
}
