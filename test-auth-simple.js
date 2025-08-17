#!/usr/bin/env node

/**
 * Simple Authentication Test
 * Tests if the backend is accepting requests with mock authentication
 */

const API_BASE_URL = 'http://localhost:5000';

// Colors for console output
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m'
};

const log = {
  info: (msg) => console.log(`${colors.blue}ℹ️  ${msg}${colors.reset}`),
  success: (msg) => console.log(`${colors.green}✅ ${msg}${colors.reset}`),
  warning: (msg) => console.log(`${colors.yellow}⚠️  ${msg}${colors.reset}`),
  error: (msg) => console.log(`${colors.red}❌ ${msg}${colors.reset}`),
  header: (msg) => console.log(`\n${colors.bright}${colors.cyan}${msg}${colors.reset}\n`)
};

/**
 * Test server health
 */
async function testServerHealth() {
  log.header('🏥 Testing Server Health');
  
  try {
    const response = await fetch(`${API_BASE_URL}/api/test`);
    const data = await response.json();
    
    if (response.ok) {
      log.success('Server is running!');
      console.log('Response:', data);
      return true;
    } else {
      log.error(`Server health check failed: ${response.status}`);
      return false;
    }
  } catch (error) {
    log.error(`Server health check failed: ${error.message}`);
    return false;
  }
}

/**
 * Test authentication with mock token
 */
async function testAuthentication() {
  log.header('🔐 Testing Authentication');
  
  const mockToken = 'dev-token-12345678';
  
  try {
    // Test upload endpoint
    log.info('Testing file upload endpoint...');
    const formData = new FormData();
    formData.append('file', new Blob(['test content'], { type: 'text/plain' }), 'test.txt');
    
    const response = await fetch(`${API_BASE_URL}/api/upload/single`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${mockToken}`
      },
      body: formData
    });
    
    if (response.ok) {
      const data = await response.json();
      log.success('File upload authentication successful!');
      console.log('Response:', data);
      return true;
    } else {
      const errorData = await response.json();
      log.error(`File upload failed: ${response.status} - ${errorData.error?.message || 'Unknown error'}`);
      return false;
    }
  } catch (error) {
    log.error(`Authentication test failed: ${error.message}`);
    return false;
  }
}

/**
 * Main test function
 */
async function main() {
  log.header('🧪 Simple Authentication Test');
  
  // Test server health first
  const serverHealthy = await testServerHealth();
  if (!serverHealthy) {
    log.error('Server is not running. Please start the backend server first.');
    process.exit(1);
  }
  
  // Test authentication
  const authWorking = await testAuthentication();
  
  // Summary
  log.header('📊 Test Summary');
  console.log(`Server Health: ${serverHealthy ? '✅ PASSED' : '❌ FAILED'}`);
  console.log(`Authentication: ${authWorking ? '✅ PASSED' : '❌ FAILED'}`);
  
  if (authWorking) {
    log.success('Authentication is working! You can now test the seller registration.');
  } else {
    log.error('Authentication is not working. Check the backend logs for errors.');
  }
  
  log.header('📝 Next Steps');
  if (authWorking) {
    log.info('1. Test seller registration in the browser');
    log.info('2. Check backend console for mock user creation logs');
    log.info('3. Verify files are being uploaded to backend/src/uploads/');
  } else {
    log.info('1. Check backend console for authentication errors');
    log.info('2. Ensure NODE_ENV=development is set');
    log.info('3. Restart the backend server');
  }
}

// Run tests
if (require.main === module) {
  main().catch(error => {
    log.error(`Test script failed: ${error.message}`);
    process.exit(1);
  });
}
