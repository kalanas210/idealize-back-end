#!/usr/bin/env node

/**
 * Database Test Script
 * Tests basic database connectivity and operations
 */

const { query } = require('./src/config/database');

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
 * Test database connection
 */
async function testConnection() {
  try {
    log.info('Testing database connection...');
    const result = await query('SELECT NOW() as current_time, version() as db_version');
    log.success(`Database connected successfully!`);
    log.info(`Current time: ${result.rows[0].current_time}`);
    log.info(`Database version: ${result.rows[0].db_version.split(' ')[0]}`);
    return true;
  } catch (error) {
    log.error(`Database connection failed: ${error.message}`);
    return false;
  }
}

/**
 * Test table existence
 */
async function testTables() {
  const requiredTables = [
    'users',
    'seller_applications', 
    'gigs',
    'gig_packages',
    'gig_faqs',
    'orders',
    'reviews',
    'notifications'
  ];

  log.info('Testing table existence...');
  
  for (const tableName of requiredTables) {
    try {
      const result = await query(`SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = $1
      )`, [tableName]);
      
      if (result.rows[0].exists) {
        log.success(`Table '${tableName}' exists`);
      } else {
        log.error(`Table '${tableName}' does not exist`);
        return false;
      }
    } catch (error) {
      log.error(`Error checking table '${tableName}': ${error.message}`);
      return false;
    }
  }
  
  return true;
}

/**
 * Test basic CRUD operations
 */
async function testCRUD() {
  log.info('Testing basic CRUD operations...');
  
  try {
    // Test INSERT
    const testUserId = 'test-user-123';
    const insertResult = await query(
      `INSERT INTO users (id, email, username, name, role, verified) 
       VALUES ($1, $2, $3, $4, $5, $6) 
       ON CONFLICT (id) DO UPDATE SET 
         email = EXCLUDED.email,
         updated_at = NOW()
       RETURNING *`,
      [testUserId, 'test@example.com', 'testuser', 'Test User', 'buyer', true]
    );
    
    log.success(`User inserted/updated: ${insertResult.rows[0].id}`);
    
    // Test SELECT
    const selectResult = await query('SELECT * FROM users WHERE id = $1', [testUserId]);
    if (selectResult.rows.length > 0) {
      log.success(`User retrieved: ${selectResult.rows[0].email}`);
    } else {
      log.error('User not found after insert');
      return false;
    }
    
    // Test UPDATE
    const updateResult = await query(
      'UPDATE users SET role = $1 WHERE id = $2 RETURNING *',
      ['seller', testUserId]
    );
    
    if (updateResult.rows[0].role === 'seller') {
      log.success('User role updated successfully');
    } else {
      log.error('User role update failed');
      return false;
    }
    
    // Test DELETE
    await query('DELETE FROM users WHERE id = $1', [testUserId]);
    log.success('Test user deleted successfully');
    
    return true;
    
  } catch (error) {
    log.error(`CRUD test failed: ${error.message}`);
    return false;
  }
}

/**
 * Test seller application creation
 */
async function testSellerApplication() {
  log.info('Testing seller application creation...');
  
  try {
    const testUserId = 'test-seller-456';
    
    // Create test user
    await query(
      `INSERT INTO users (id, email, username, name, role, verified) 
       VALUES ($1, $2, $3, $4, $5, $6)`,
      [testUserId, 'seller@test.com', 'testseller', 'Test Seller', 'buyer', false]
    );
    
    // Create seller application
    const appResult = await query(
      `INSERT INTO seller_applications 
       (user_id, professional_title, experience, bio, skills, languages, status)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       RETURNING *`,
      [
        testUserId,
        'Content Creator',
        '3-5 years',
        'Experienced content creator with expertise in social media marketing',
        ['Social Media Marketing', 'Content Creation', 'Video Editing'],
        ['English', 'Spanish'],
        'pending'
      ]
    );
    
    log.success(`Seller application created: ${appResult.rows[0].id}`);
    
    // Update user role
    await query(
      'UPDATE users SET role = $1 WHERE id = $2',
      ['seller', testUserId]
    );
    
    log.success('User role updated to seller');
    
    // Cleanup
    await query('DELETE FROM seller_applications WHERE user_id = $1', [testUserId]);
    await query('DELETE FROM users WHERE id = $1', [testUserId]);
    
    log.success('Test seller application cleaned up');
    return true;
    
  } catch (error) {
    log.error(`Seller application test failed: ${error.message}`);
    return false;
  }
}

/**
 * Test gig creation
 */
async function testGigCreation() {
  log.info('Testing gig creation...');
  
  try {
    const testUserId = 'test-gig-user-789';
    
    // Create test user
    await query(
      `INSERT INTO users (id, email, username, name, role, verified) 
       VALUES ($1, $2, $3, $4, $5, $6)`,
      [testUserId, 'gig@test.com', 'testgig', 'Test Gig User', 'seller', true]
    );
    
    // Start transaction
    await query('BEGIN');
    
    try {
      // Create gig
      const gigResult = await query(
        `INSERT INTO gigs (seller_id, title, category, platform, tags, description, requirements, status)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
         RETURNING *`,
        [
          testUserId,
          'Test Social Media Content',
          'Social Media Marketing',
          'Instagram',
          ['social media', 'content creation'],
          'Professional social media content creation service',
          ['Brand guidelines', 'Content preferences'],
          'draft'
        ]
      );
      
      const gigId = gigResult.rows[0].id;
      log.success(`Gig created: ${gigId}`);
      
      // Create gig package
      await query(
        `INSERT INTO gig_packages (gig_id, tier, package_name, description, price, delivery_time, revisions, features)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
        [
          gigId,
          'basic',
          'Basic Package',
          'Basic social media content',
          50.00,
          2,
          1,
          ['1 Post', 'Basic Design']
        ]
      );
      
      log.success('Gig package created');
      
      // Create gig FAQ
      await query(
        `INSERT INTO gig_faqs (gig_id, question, answer)
         VALUES ($1, $2, $3)`,
        [
          gigId,
          'What do you need from me?',
          'Brand guidelines and content preferences'
        ]
      );
      
      log.success('Gig FAQ created');
      
      // Commit transaction
      await query('COMMIT');
      log.success('Gig creation transaction committed');
      
      // Cleanup
      await query('DELETE FROM gig_faqs WHERE gig_id = $1', [gigId]);
      await query('DELETE FROM gig_packages WHERE gig_id = $1', [gigId]);
      await query('DELETE FROM gigs WHERE id = $1', [gigId]);
      await query('DELETE FROM users WHERE id = $1', [testUserId]);
      
      log.success('Test gig cleaned up');
      return true;
      
    } catch (error) {
      await query('ROLLBACK');
      throw error;
    }
    
  } catch (error) {
    log.error(`Gig creation test failed: ${error.message}`);
    return false;
  }
}

/**
 * Main test function
 */
async function runTests() {
  log.header('🧪 SocyAds Database Tests');
  
  try {
    // Test 1: Connection
    const connectionOk = await testConnection();
    if (!connectionOk) {
      log.error('Cannot proceed without database connection');
      process.exit(1);
    }
    
    // Test 2: Tables
    const tablesOk = await testTables();
    if (!tablesOk) {
      log.error('Required tables are missing');
      process.exit(1);
    }
    
    // Test 3: CRUD operations
    const crudOk = await testCRUD();
    if (!crudOk) {
      log.error('Basic CRUD operations failed');
      process.exit(1);
    }
    
    // Test 4: Seller application
    const sellerAppOk = await testSellerApplication();
    if (!sellerAppOk) {
      log.error('Seller application test failed');
      process.exit(1);
    }
    
    // Test 5: Gig creation
    const gigOk = await testGigCreation();
    if (!gigOk) {
      log.error('Gig creation test failed');
      process.exit(1);
    }
    
    log.header('🎉 All Database Tests Passed!');
    log.success('Database is fully functional and ready for use');
    log.success('Seller registration and gig creation will work correctly');
    
  } catch (error) {
    log.error(`Test suite failed: ${error.message}`);
    process.exit(1);
  }
}

// Run tests if called directly
if (require.main === module) {
  runTests().catch(error => {
    log.error(`Test script failed: ${error.message}`);
    process.exit(1);
  });
}

module.exports = { runTests };
