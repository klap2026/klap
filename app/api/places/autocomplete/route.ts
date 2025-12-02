import { NextRequest, NextResponse } from 'next/server'
import { checkRateLimit, getClientIp, getRateLimitHeaders } from '@/lib/rate-limit'

export async function POST(request: NextRequest) {
  try {
    // Rate limit by IP address (30 requests per minute)
    const clientIp = getClientIp(request)
    const rateLimitResult = checkRateLimit(`places-autocomplete:${clientIp}`, {
      windowMs: 60000, // 1 minute
      max: 30,
    })

    if (!rateLimitResult.success) {
      return NextResponse.json(
        { error: 'Too many requests. Please try again later.' },
        {
          status: 429,
          headers: getRateLimitHeaders(rateLimitResult),
        }
      )
    }

    const body = await request.json()
    const { input, sessionToken } = body

    if (!input || !sessionToken) {
      return NextResponse.json(
        { error: 'Missing required parameters' },
        { status: 400 }
      )
    }

    const apiKey = process.env.GOOGLE_PLACES_API_KEY
    if (!apiKey) {
      console.error('GOOGLE_PLACES_API_KEY not configured')
      return NextResponse.json(
        { error: 'Places API not configured' },
        { status: 500 }
      )
    }

    // Use Places API (New)
    const response = await fetch(
      `https://places.googleapis.com/v1/places:autocomplete`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Goog-Api-Key': apiKey,
        },
        body: JSON.stringify({
          input: input.trim(),
          sessionToken,
          includedRegionCodes: ['IL'], // Restrict to Israel
          languageCode: 'he', // Support Hebrew
        }),
      }
    )

    if (!response.ok) {
      const errorText = await response.text()
      console.error('Google Places API error:', errorText)
      throw new Error('Failed to fetch from Google Places API')
    }

    const data = await response.json()
    return NextResponse.json(data)
  } catch (error) {
    console.error('Error in places autocomplete:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
