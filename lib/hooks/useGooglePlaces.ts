'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { v4 as uuidv4 } from 'uuid'

export interface ParsedAddress {
  formattedAddress: string
  lat: number
  lng: number
  city?: string
  street?: string
  streetNumber?: string
}

interface PlacePrediction {
  placeId: string
  text: {
    text: string
  }
  structuredFormat: {
    mainText: {
      text: string
    }
    secondaryText: {
      text: string
    }
  }
}

interface UseGooglePlacesOptions {
  onSelect?: (address: ParsedAddress) => void
}

export function useGooglePlaces({ onSelect }: UseGooglePlacesOptions) {
  const [sessionToken, setSessionToken] = useState<string>('')
  const [predictions, setPredictions] = useState<PlacePrediction[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const abortControllerRef = useRef<AbortController | null>(null)

  // Generate a new session token on mount and after selection
  const generateSessionToken = useCallback(() => {
    const token = uuidv4()
    setSessionToken(token)
    return token
  }, [])

  useEffect(() => {
    generateSessionToken()
  }, [generateSessionToken])

  // Fetch autocomplete predictions
  const fetchPredictions = useCallback(
    async (input: string) => {
      if (!input || input.trim().length < 2) {
        setPredictions([])
        return
      }

      // Wait for session token to be ready
      if (!sessionToken) {
        console.log('[useGooglePlaces] Session token not ready yet, skipping fetch')
        return
      }

      // Cancel previous request
      if (abortControllerRef.current) {
        abortControllerRef.current.abort()
      }

      abortControllerRef.current = new AbortController()
      setLoading(true)
      setError(null)

      try {
        const response = await fetch('/api/places/autocomplete', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            input: input.trim(),
            sessionToken,
          }),
          signal: abortControllerRef.current.signal,
        })

        if (!response.ok) {
          throw new Error('Failed to fetch predictions')
        }

        const data = await response.json()

        if (data.suggestions && Array.isArray(data.suggestions)) {
          const predictions = data.suggestions
            .filter((s: any) => s.placePrediction)
            .map((s: any) => s.placePrediction)
          setPredictions(predictions)
        } else {
          setPredictions([])
        }
      } catch (err: any) {
        if (err.name !== 'AbortError') {
          console.error('Error fetching predictions:', err)
          setError(err.message)
          setPredictions([])
        }
      } finally {
        setLoading(false)
      }
    },
    [sessionToken]
  )

  // Get place details and parse address
  const selectPlace = useCallback(
    async (placeId: string) => {
      setLoading(true)
      setError(null)

      try {
        const response = await fetch('/api/places/details', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            placeId,
            sessionToken,
          }),
        })

        if (!response.ok) {
          throw new Error('Failed to fetch place details')
        }

        const data = await response.json()

        if (!data.formattedAddress || !data.location) {
          throw new Error('Invalid place details response')
        }

        // Parse address components
        let city: string | undefined
        let street: string | undefined
        let streetNumber: string | undefined

        if (data.addressComponents && Array.isArray(data.addressComponents)) {
          for (const component of data.addressComponents) {
            // Google Places API (New) returns types as an array
            const types = component.types || []
            if (types.includes('locality')) {
              city = component.longText || component.shortText
            } else if (types.includes('route')) {
              street = component.longText || component.shortText
            } else if (types.includes('street_number')) {
              streetNumber = component.longText || component.shortText
            }
          }
        }

        const parsedAddress: ParsedAddress = {
          formattedAddress: data.formattedAddress,
          lat: data.location.latitude,
          lng: data.location.longitude,
          city,
          street,
          streetNumber,
        }

        // Generate new session token for next search
        generateSessionToken()
        setPredictions([])

        if (onSelect) {
          onSelect(parsedAddress)
        }

        return parsedAddress
      } catch (err: any) {
        console.error('Error selecting place:', err)
        setError(err.message)
        throw err
      } finally {
        setLoading(false)
      }
    },
    [sessionToken, generateSessionToken, onSelect]
  )

  return {
    predictions,
    loading,
    error,
    fetchPredictions,
    selectPlace,
    clearPredictions: () => setPredictions([]),
  }
}
