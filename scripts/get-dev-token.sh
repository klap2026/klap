#!/bin/bash
# Quick script to get a development token for a phone number

if [ -z "$1" ]; then
  echo "Usage: ./scripts/get-dev-token.sh <phone-number>"
  echo "Example: ./scripts/get-dev-token.sh +972501234567"
  exit 1
fi

PHONE=$1

echo "📞 Sending OTP to $PHONE..."
RESPONSE=$(curl -s -X POST http://localhost:3000/api/auth/send-otp \
  -H "Content-Type: application/json" \
  -d "{\"phone\":\"$PHONE\"}")

echo "$RESPONSE" | jq .

# Extract mock code if in dev mode
MOCK_CODE=$(echo "$RESPONSE" | jq -r '.mockCode // empty')

if [ -z "$MOCK_CODE" ]; then
  echo ""
  echo "⚠️  No mock code returned. Make sure:"
  echo "   1. Server is running in development mode"
  echo "   2. OTP_MODE is set to 'mock' (or not set)"
  echo ""
  echo "Enter the OTP code you received:"
  read OTP_CODE
else
  echo ""
  echo "✅ Mock OTP code: $MOCK_CODE"
  OTP_CODE=$MOCK_CODE
fi

echo ""
echo "🔐 Verifying OTP..."
TOKEN_RESPONSE=$(curl -s -X POST http://localhost:3000/api/auth/verify-otp \
  -H "Content-Type: application/json" \
  -d "{\"phone\":\"$PHONE\",\"code\":\"$OTP_CODE\"}")

echo "$TOKEN_RESPONSE" | jq .

# Extract token
TOKEN=$(echo "$TOKEN_RESPONSE" | jq -r '.token // empty')

if [ -n "$TOKEN" ]; then
  echo ""
  echo "🎉 SUCCESS! Your token:"
  echo ""
  echo "$TOKEN"
  echo ""
  echo "📋 Use it like this:"
  echo "http://localhost:3000/dashboard?token=$TOKEN"
  echo ""
else
  echo ""
  echo "❌ Failed to get token. Check the error above."
fi
