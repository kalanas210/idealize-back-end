#!/usr/bin/env node

/**
 * Test Validation for Seller Registration
 * Shows what data is being sent and what validation errors occur
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
 * Test with minimal required data
 */
async function testMinimalData() {
  log.header('🧪 Testing with Minimal Required Data');
  
  const mockToken = 'dev-token-12345678';
  
  const minimalData = {
    bio: 'I am a professional content creator with over 5 years of experience in creating engaging content for various social media platforms. I specialize in tech reviews and tutorials.',
    skills: ['Video Production', 'Content Writing', 'Social Media Marketing'],
    languages: ['English', 'Spanish']
  };
  
  try {
    const response = await fetch(`${API_BASE_URL}/api/users/become-seller`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${mockToken}`
      },
      body: JSON.stringify(minimalData)
    });
    
    const data = await response.json();
    
    if (response.ok) {
      log.success('Minimal data test passed!');
      console.log('Response:', data);
      return true;
    } else {
      log.error(`Minimal data test failed: ${response.status}`);
      console.log('Error Response:', data);
      return false;
    }
  } catch (error) {
    log.error(`Test failed: ${error.message}`);
    return false;
  }
}

/**
 * Test with full data (what frontend sends)
 */
async function testFullData() {
  log.header('🧪 Testing with Full Data (Frontend Format)');
  
  const mockToken = 'dev-token-12345678';
  
  const fullData = {
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
      instagram: { username: 'johndoe', followers: '5K', verified: false }
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
        'Authorization': `Bearer ${mockToken}`
      },
      body: JSON.stringify(fullData)
    });
    
    const data = await response.json();
    
    if (response.ok) {
      log.success('Full data test passed!');
      console.log('Response:', data);
      return true;
    } else {
      log.error(`Full data test failed: ${response.status}`);
      console.log('Error Response:', data);
      
      // Show validation errors if any
      if (data.error && Array.isArray(data.error)) {
        log.warning('Validation Errors:');
        data.error.forEach((err, index) => {
          console.log(`${index + 1}. ${err.param}: ${err.msg}`);
        });
      }
      
      return false;
    }
  } catch (error) {
    log.error(`Test failed: ${error.message}`);
    return false;
  }
}

/**
 * Test with invalid data to see validation
 */
async function testInvalidData() {
  log.header('🧪 Testing with Invalid Data (Validation Testing)');
  
  const mockToken = 'dev-token-12345678';
  
  const invalidData = {
    bio: 'Too short', // Less than 20 characters
    skills: [], // Empty array
    languages: ['E'] // Too short
  };
  
  try {
    const response = await fetch(`${API_BASE_URL}/api/users/become-seller`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${mockToken}`
      },
      body: JSON.stringify(invalidData)
    });
    
    const data = await response.json();
    
    if (response.status === 400) {
      log.warning('Invalid data test completed (expected 400)');
      console.log('Validation Errors:', data.error);
      return true;
    } else {
      log.error(`Unexpected response: ${response.status}`);
      console.log('Response:', data);
      return false;
    }
  } catch (error) {
    log.error(`Test failed: ${error.message}`);
    return false;
  }
}

/**
 * Main test function
 */
async function main() {
  log.header('🧪 Seller Registration Validation Test');
  
  // Test with minimal required data
  const minimalPassed = await testMinimalData();
  
  // Test with full data
  const fullPassed = await testFullData();
  
  // Test with invalid data
  const invalidTested = await testInvalidData();
  
  // Summary
  log.header('📊 Test Summary');
  console.log(`Minimal Data: ${minimalPassed ? '✅ PASSED' : '❌ FAILED'}`);
  console.log(`Full Data: ${fullPassed ? '✅ PASSED' : '❌ FAILED'}`);
  console.log(`Invalid Data: ${invalidTested ? '✅ TESTED' : '❌ FAILED'}`);
  
  if (minimalPassed && fullPassed) {
    log.success('All validation tests passed! The backend is working correctly.');
  } else {
    log.error('Some tests failed. Check the validation errors above.');
  }
  
  log.header('📝 Next Steps');
  if (minimalPassed && fullPassed) {
    log.info('1. Test seller registration in the browser');
    log.info('2. Check backend console for mock user creation logs');
    log.info('3. Verify files are being uploaded to backend/src/uploads/');
  } else {
    log.info('1. Fix the validation issues shown above');
    log.info('2. Ensure all required fields are properly formatted');
    log.info('3. Check if bio field is being sent correctly');
  }
}

// Run tests
if (require.main === module) {
  main().catch(error => {
    log.error(`Test script failed: ${error.message}`);
    process.exit(1);
  });
}
