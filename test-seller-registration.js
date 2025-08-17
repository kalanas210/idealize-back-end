#!/usr/bin/env node

/**
 * Test Seller Registration Feature
 * Tests the complete seller registration flow including file uploads
 */

const fs = require('fs');
const path = require('path');
const FormData = require('form-data');

// Base API URL
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

// Mock JWT token for testing (in production, this would come from Clerk auth)
const TEST_TOKEN = 'test-jwt-token';

/**
 * Test file upload endpoint
 */
async function testFileUpload() {
  log.header('📁 Testing File Upload');
  
  try {
    // Create a test file
    const testFilePath = path.join(__dirname, 'test-image.jpg');
    fs.writeFileSync(testFilePath, 'Test image content');
    
    const form = new FormData();
    form.append('file', fs.createReadStream(testFilePath));
    
    const response = await fetch(`${API_BASE_URL}/api/upload/single`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${TEST_TOKEN}`,
        ...form.getHeaders()
      },
      body: form
    });
    
    // Clean up test file
    fs.unlinkSync(testFilePath);
    
    if (response.ok) {
      const data = await response.json();
      log.success('File upload successful');
      console.log('Response:', data);
      return data.data?.url;
    } else {
      log.error(`File upload failed: ${response.status}`);
      return null;
    }
  } catch (error) {
    log.error(`File upload test failed: ${error.message}`);
    return null;
  }
}

/**
 * Test seller registration endpoint
 */
async function testSellerRegistration() {
  log.header('👤 Testing Seller Registration');
  
  const registrationData = {
    firstName: 'John',
    lastName: 'Doe',
    email: 'john.doe@example.com',
    phone: '+1234567890',
    country: 'United States',
    city: 'New York',
    professionalTitle: 'Content Creator',
    experience: '3-5 years',
    bio: 'I am a professional content creator with over 5 years of experience in creating engaging content for various social media platforms. I specialize in tech reviews and tutorials.',
    skills: ['Video Production', 'Content Writing', 'Social Media Marketing', 'SEO'],
    languages: ['English', 'Spanish'],
    location: 'New York, United States',
    socialAccounts: {
      youtube: { username: 'johndoe', followers: '10K', verified: false },
      instagram: { username: 'johndoe', followers: '5K', verified: false },
      tiktok: { username: 'johndoe', followers: '2K', verified: false }
    },
    portfolio: ['/uploads/portfolio-1.jpg', '/uploads/portfolio-2.jpg'],
    verificationDocs: [
      { type: 'id_document', url: '/uploads/test-id.jpg' },
      { type: 'address_proof', url: '/uploads/test-address.pdf' }
    ]
  };
  
  try {
    const response = await fetch(`${API_BASE_URL}/api/users/become-seller`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${TEST_TOKEN}`
      },
      body: JSON.stringify(registrationData)
    });
    
    const data = await response.json();
    
    if (response.ok && data.success) {
      log.success('Seller registration successful');
      console.log('Response:', data);
      return true;
    } else {
      log.error(`Seller registration failed: ${data.message || data.error}`);
      if (data.error && Array.isArray(data.error)) {
        console.log('Validation errors:', data.error);
      }
      return false;
    }
  } catch (error) {
    log.error(`Seller registration test failed: ${error.message}`);
    return false;
  }
}

/**
 * Test admin endpoints for seller applications
 */
async function testAdminEndpoints() {
  log.header('👨‍💼 Testing Admin Endpoints');
  
  try {
    // Test get seller applications
    log.info('Testing GET /api/admin/seller-applications');
    const response = await fetch(`${API_BASE_URL}/api/admin/seller-applications`, {
      headers: {
        'Authorization': `Bearer ${TEST_TOKEN}`
      }
    });
    
    if (response.ok) {
      const data = await response.json();
      log.success('Retrieved seller applications');
      console.log('Applications:', data.data?.length || 0);
      
      // Test approve endpoint if there are applications
      if (data.data && data.data.length > 0) {
        const userId = data.data[0].id;
        
        log.info(`Testing POST /api/admin/seller-applications/${userId}/approve`);
        const approveResponse = await fetch(
          `${API_BASE_URL}/api/admin/seller-applications/${userId}/approve`,
          {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${TEST_TOKEN}`
            }
          }
        );
        
        if (approveResponse.ok) {
          log.success('Seller application approved successfully');
        } else {
          log.warning('Could not approve seller application');
        }
      }
      
      return true;
    } else {
      log.error(`Failed to get seller applications: ${response.status}`);
      return false;
    }
  } catch (error) {
    log.error(`Admin endpoints test failed: ${error.message}`);
    return false;
  }
}

/**
 * Main test function
 */
async function main() {
  log.header('🧪 Seller Registration Feature Test');
  
  const results = {
    fileUpload: false,
    sellerRegistration: false,
    adminEndpoints: false
  };
  
  // Test file upload
  const uploadUrl = await testFileUpload();
  results.fileUpload = !!uploadUrl;
  
  // Test seller registration
  results.sellerRegistration = await testSellerRegistration();
  
  // Test admin endpoints
  results.adminEndpoints = await testAdminEndpoints();
  
  // Summary
  log.header('📊 Test Summary');
  console.log(`File Upload: ${results.fileUpload ? '✅ PASSED' : '❌ FAILED'}`);
  console.log(`Seller Registration: ${results.sellerRegistration ? '✅ PASSED' : '❌ FAILED'}`);
  console.log(`Admin Endpoints: ${results.adminEndpoints ? '✅ PASSED' : '❌ FAILED'}`);
  
  const allPassed = Object.values(results).every(r => r);
  if (allPassed) {
    log.success('All tests passed! ✨');
  } else {
    log.error('Some tests failed. Please check the implementation.');
  }
  
  log.header('📝 Next Steps');
  log.info('1. Ensure backend server is running: npm run dev');
  log.info('2. Ensure frontend is running: npm run dev (in frontend directory)');
  log.info('3. Test the complete flow in the browser');
  log.info('4. Check uploads directory for uploaded files');
  log.info('5. Review admin panel for seller applications');
}

// Run tests
if (require.main === module) {
  main().catch(error => {
    log.error(`Test script failed: ${error.message}`);
    process.exit(1);
  });
}
