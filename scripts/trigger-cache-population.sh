#!/bin/bash

# This script can be called by Vercel deployment hooks or manually after deployment
# Usage: ./scripts/trigger-cache-population.sh <deployment-url> <cache-populate-secret>

DEPLOYMENT_URL=${1:-$VERCEL_URL}
CACHE_SECRET=${2:-$CACHE_POPULATE_SECRET}

if [ -z "$DEPLOYMENT_URL" ]; then
  echo "Error: Deployment URL not provided"
  echo "Usage: $0 <deployment-url> <cache-populate-secret>"
  exit 1
fi

if [ -z "$CACHE_SECRET" ]; then
  echo "Warning: Cache populate secret not provided, using default"
  CACHE_SECRET="default-secret"
fi

# Ensure URL has protocol
if [[ ! "$DEPLOYMENT_URL" =~ ^https?:// ]]; then
  DEPLOYMENT_URL="https://$DEPLOYMENT_URL"
fi

API_URL="$DEPLOYMENT_URL/api/news/populate-cache"

echo "Triggering cache population..."
echo "URL: $API_URL"

# Make the API call
RESPONSE=$(curl -s -w "\n%{http_code}" -X POST "$API_URL" \
  -H "Authorization: Bearer $CACHE_SECRET" \
  -H "Content-Type: application/json")

# Extract body and status code
HTTP_BODY=$(echo "$RESPONSE" | head -n -1)
HTTP_STATUS=$(echo "$RESPONSE" | tail -n 1)

echo "Status Code: $HTTP_STATUS"
echo "Response: $HTTP_BODY"

if [ "$HTTP_STATUS" -eq 200 ]; then
  echo "✅ Cache population triggered successfully!"
  exit 0
else
  echo "❌ Cache population failed!"
  exit 1
fi