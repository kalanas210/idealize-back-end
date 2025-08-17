#!/usr/bin/env node

/**
 * Test File Upload
 * Debug the 500 error in file uploads
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
 * Test uploads directory
 */
async function testUploadsDirectory() {
  log.header('📁 Testing Uploads Directory');
  
  try {
    const response = await fetch(`${API_BASE_URL}/api/upload/test`);
    const data = await response.json();
    
    if (response.ok) {
      log.success('Uploads directory test successful!');
      console.log('Response:', JSON.stringify(data, null, 2));
      return data.success;
    } else {
      log.error(`Uploads directory test failed: ${response.status}`);
      console.log('Error Response:', data);
      return false;
    }
  } catch (error) {
    log.error(`Uploads directory test failed: ${error.message}`);
    return false;
  }
}

/**
 * Test file upload with mock token
 */
async function testFileUpload() {
  log.header('📤 Testing File Upload');
  
  const mockToken = 'dev-token-12345678';
  
  try {
    // Create a simple text file for testing
    const fileContent = 'This is a test file for upload debugging';
    const file = new Blob([fileContent], { type: 'text/plain' });
    
    const formData = new FormData();
    formData.append('file', file, 'test.txt');
    
    log.info('Attempting file upload...');
    
    const response = await fetch(`${API_BASE_URL}/api/upload/single`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${mockToken}`
      },
      body: formData
    });
    
    const data = await response.json();
    
    if (response.ok) {
      log.success('File upload successful!');
      console.log('Response:', JSON.stringify(data, null, 2));
      return true;
    } else {
      log.error(`File upload failed: ${response.status}`);
      console.log('Error Response:', data);
      return false;
    }
  } catch (error) {
    log.error(`File upload test failed: ${error.message}`);
    return false;
  }
}

/**
 * Test image upload
 */
async function testImageUpload() {
  log.header('🖼️  Testing Image Upload');
  
  const mockToken = 'dev-token-12345678';
  
  try {
    // Create a simple SVG image for testing
    const svgContent = `<svg xmlns="http://www.w3.org/2000/svg" width="100" height="100">
      <rect width="100" height="100" fill="blue"/>
      <text x="50" y="50" text-anchor="middle" fill="white">Test</text>
    </svg>`;
    
    const file = new Blob([svgContent], { type: 'image/svg+xml' });
    
    const formData = new FormData();
    formData.append('file', file, 'test.svg');
    
    log.info('Attempting image upload...');
    
    const response = await fetch(`${API_BASE_URL}/api/upload/single`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${mockToken}`
      },
      body: formData
    });
    
    const data = await response.json();
    
    if (response.ok) {
      log.success('Image upload successful!');
      console.log('Response:', JSON.stringify(data, null, 2));
      return true;
    } else {
      log.error(`Image upload failed: ${response.status}`);
      console.log('Error Response:', data);
      return false;
    }
  } catch (error) {
    log.error(`Image upload test failed: ${error.message}`);
    return false;
  }
}

/**
 * Main test function
 */
async function main() {
  log.header('🧪 File Upload Debug Test');
  
  // Test uploads directory first
  const directoryOk = await testUploadsDirectory();
  if (!directoryOk) {
    log.error('Uploads directory has issues. Check the backend logs.');
    process.exit(1);
  }
  
  // Test file upload
  const fileUploadOk = await testFileUpload();
  
  // Test image upload
  const imageUploadOk = await testImageUpload();
  
  // Summary
  log.header('📊 Test Summary');
  console.log(`Uploads Directory: ${directoryOk ? '✅ PASSED' : '❌ FAILED'}`);
  console.log(`File Upload: ${fileUploadOk ? '✅ PASSED' : '❌ FAILED'}`);
  console.log(`Image Upload: ${imageUploadOk ? '✅ PASSED' : '❌ FAILED'}`);
  
  if (fileUploadOk && imageUploadOk) {
    log.success('All upload tests passed! The issue might be in the frontend.');
  } else {
    log.error('Upload tests failed. Check the backend logs for detailed errors.');
  }
  
  log.header('📝 Next Steps');
  if (fileUploadOk && imageUploadOk) {
    log.info('1. Check frontend file handling');
    log.info('2. Verify file types being sent');
    log.info('3. Check browser console for errors');
  } else {
    log.info('1. Check backend console for detailed error logs');
    log.info('2. Verify uploads directory permissions');
    log.info('3. Check if multer is configured correctly');
  }
}

// Run tests
if (require.main === module) {
  main().catch(error => {
    log.error(`Test script failed: ${error.message}`);
    process.exit(1);
  });
}
