#!/usr/bin/env node

/**
 * Test script to verify API protection middleware
 * Usage: node scripts/test-api-protection.js [base-url]
 * 
 * Example:
 * - Local: node scripts/test-api-protection.js http://localhost:3000
 * - Preview: node scripts/test-api-protection.js https://your-app-preview.vercel.app
 * - Production: node scripts/test-api-protection.js https://your-app.vercel.app
 */

const baseUrl = process.argv[2] || 'http://localhost:3000'
const testEndpoint = '/api/test-protection'

console.log(`\n🧪 Testing API Protection at: ${baseUrl}`)
console.log('=' .repeat(60))

async function makeRequest(options = {}) {
  const url = `${baseUrl}${testEndpoint}`
  
  try {
    const response = await fetch(url, {
      method: 'GET',
      ...options
    })
    
    const contentType = response.headers.get('content-type')
    let data
    
    if (contentType && contentType.includes('application/json')) {
      data = await response.json()
    } else {
      data = await response.text()
    }
    
    return {
      status: response.status,
      statusText: response.statusText,
      data,
      headers: Object.fromEntries(response.headers.entries())
    }
  } catch (error) {
    return {
      error: error.message
    }
  }
}

async function runTests() {
  // Test 1: Browser-like request (should be blocked in production)
  console.log('\n📱 Test 1: Browser-like request')
  console.log('(Should be BLOCKED in production, ALLOWED in dev/preview)')
  const browserRequest = await makeRequest({
    headers: {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/91.0.4472.124',
      'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
      'Sec-Fetch-Mode': 'navigate',
      'Sec-Fetch-Site': 'same-origin',
    }
  })
  
  console.log(`Status: ${browserRequest.status} ${browserRequest.statusText || ''}`)
  if (browserRequest.status === 403) {
    console.log('✅ Correctly BLOCKED (403 Forbidden)')
  } else if (browserRequest.status === 200) {
    console.log('✅ ALLOWED (as expected in dev/preview)')
  }
  console.log('Response:', JSON.stringify(browserRequest.data, null, 2))
  
  // Test 2: API request with JSON accept header (should be allowed)
  console.log('\n🔌 Test 2: API request with JSON headers')
  console.log('(Should be ALLOWED in all environments)')
  const apiRequest = await makeRequest({
    headers: {
      'Accept': 'application/json',
      'Content-Type': 'application/json',
    }
  })
  
  console.log(`Status: ${apiRequest.status} ${apiRequest.statusText || ''}`)
  if (apiRequest.status === 200) {
    console.log('✅ Correctly ALLOWED')
  } else {
    console.log('❌ Unexpectedly BLOCKED')
  }
  console.log('Response:', JSON.stringify(apiRequest.data, null, 2))
  
  // Test 3: AJAX request (should be allowed)
  console.log('\n🌐 Test 3: AJAX request (XMLHttpRequest)')
  console.log('(Should be ALLOWED in all environments)')
  const ajaxRequest = await makeRequest({
    headers: {
      'X-Requested-With': 'XMLHttpRequest',
      'Accept': 'application/json',
    }
  })
  
  console.log(`Status: ${ajaxRequest.status} ${ajaxRequest.statusText || ''}`)
  if (ajaxRequest.status === 200) {
    console.log('✅ Correctly ALLOWED')
  } else {
    console.log('❌ Unexpectedly BLOCKED')
  }
  
  // Test 4: Request with API key (should be allowed)
  console.log('\n🔑 Test 4: Request with API key')
  console.log('(Should be ALLOWED in all environments)')
  const apiKeyRequest = await makeRequest({
    headers: {
      'X-API-Key': 'test-api-key-123',
      'Accept': 'application/json',
    }
  })
  
  console.log(`Status: ${apiKeyRequest.status} ${apiKeyRequest.statusText || ''}`)
  if (apiKeyRequest.status === 200) {
    console.log('✅ Correctly ALLOWED')
  } else {
    console.log('❌ Unexpectedly BLOCKED')
  }
  
  // Test 5: Request with Authorization header (should be allowed)
  console.log('\n🔐 Test 5: Request with Authorization header')
  console.log('(Should be ALLOWED in all environments)')
  const authRequest = await makeRequest({
    headers: {
      'Authorization': 'Bearer test-token-xyz',
      'Accept': 'application/json',
    }
  })
  
  console.log(`Status: ${authRequest.status} ${authRequest.statusText || ''}`)
  if (authRequest.status === 200) {
    console.log('✅ Correctly ALLOWED')
  } else {
    console.log('❌ Unexpectedly BLOCKED')
  }
  
  console.log('\n' + '=' .repeat(60))
  console.log('✨ API Protection tests completed!')
  console.log('\nNote: In production (non-preview) Vercel environments:')
  console.log('  - Browser requests should be BLOCKED (403)')
  console.log('  - API requests with proper headers should be ALLOWED (200)')
  console.log('In development and preview environments:')
  console.log('  - All requests should be ALLOWED (200)')
}

// Run the tests
runTests().catch(console.error)