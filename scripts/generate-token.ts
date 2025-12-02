#!/usr/bin/env tsx
/**
 * Generate JWT tokens for development testing
 *
 * Usage:
 *   npx tsx scripts/generate-token.ts <phone-number>
 *   npx tsx scripts/generate-token.ts +972501234567
 *
 * This script:
 * 1. Looks up the user by phone number in the database
 * 2. Generates a valid JWT token
 * 3. Prints the token and a ready-to-use URL
 */

import { config } from 'dotenv'
import { resolve } from 'path'
import { createClient } from '@supabase/supabase-js'
import { signToken } from '../lib/auth/jwt'

// Load environment variables from .env.local
config({ path: resolve(process.cwd(), '.env.local') })

// Create Supabase client after loading env vars
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing Supabase environment variables in .env.local')
  console.error('   Required: NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_KEY')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
})

async function generateToken(phone: string) {
  try {
    // Find user by phone
    console.log(`🔍 Looking up user with phone: ${phone}`)
    const { data: user, error } = await supabase
      .from('User')
      .select('id, phone, role')
      .eq('phone', phone)
      .single()

    if (error || !user) {
      console.error(`❌ No user found with phone: ${phone}`)
      console.log('\n💡 Available users in database:')

      const { data: users } = await supabase
        .from('User')
        .select('phone, role')
        .limit(10)

      if (!users || users.length === 0) {
        console.log('   (No users found in database)')
      } else {
        users.forEach(u => {
          console.log(`   ${u.phone} - ${u.role || 'no role'}`)
        })
      }

      process.exit(1)
    }

    console.log(`✅ Found user: ${user.phone} (${user.role || 'no role'})`)

    // Generate token
    const token = await signToken({
      userId: user.id,
      phone: user.phone,
      role: user.role
    })

    console.log('\n🎉 Token generated successfully!')
    console.log('\n📋 Copy this token:')
    console.log('─'.repeat(80))
    console.log(token)
    console.log('─'.repeat(80))

    // Suggest URL based on role
    const path = user.role === 'technician' ? '/dashboard' : '/home'
    console.log('\n🌐 Use it like this:')
    console.log(`http://localhost:3000${path}?token=${token}`)
    console.log('')

  } catch (error) {
    console.error('❌ Error:', error)
    process.exit(1)
  }
}

// Get phone from command line
const phone = process.argv[2]

if (!phone) {
  console.log('Usage: npx tsx scripts/generate-token.ts <phone-number>')
  console.log('Example: npx tsx scripts/generate-token.ts +972501234567')
  process.exit(1)
}

generateToken(phone)
