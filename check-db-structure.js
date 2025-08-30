const { query } = require('./src/config/database');

async function checkDatabaseStructure() {
  console.log('🔍 Checking Database Structure...\n');

  try {
    // Check users table structure
    console.log('📊 USERS TABLE COLUMNS:');
    console.log('========================');
    const usersColumns = await query(`
      SELECT column_name, data_type, is_nullable, column_default
      FROM information_schema.columns 
      WHERE table_name = 'users' 
      ORDER BY ordinal_position
    `);
    
    if (usersColumns.rows.length === 0) {
      console.log('❌ Users table not found');
    } else {
      usersColumns.rows.forEach(col => {
        console.log(`  - ${col.column_name} (${col.data_type})`);
      });
    }

    // Check if seller_applications table exists
    console.log('\n📋 SELLER_APPLICATIONS TABLE:');
    console.log('==============================');
    try {
      const sellerAppsColumns = await query(`
        SELECT column_name, data_type, is_nullable
        FROM information_schema.columns 
        WHERE table_name = 'seller_applications' 
        ORDER BY ordinal_position
      `);
      
      if (sellerAppsColumns.rows.length === 0) {
        console.log('❌ Seller_applications table not found');
      } else {
        sellerAppsColumns.rows.forEach(col => {
          console.log(`  - ${col.column_name} (${col.data_type})`);
        });
      }
    } catch (err) {
      console.log('❌ Seller_applications table does not exist');
    }

    // Check actual users data
    console.log('\n👥 CURRENT USERS:');
    console.log('=================');
    const users = await query('SELECT * FROM users ORDER BY created_at DESC LIMIT 5');
    
    if (users.rows.length === 0) {
      console.log('❌ No users found');
    } else {
      users.rows.forEach((user, index) => {
        console.log(`\n${index + 1}. User: ${user.name || user.email}`);
        console.log(`   ID: ${user.id}`);
        console.log(`   Email: ${user.email}`);
        console.log(`   Role: ${user.role || 'Not set'}`);
        console.log(`   Verified: ${user.verified ? '✅' : '❌'}`);
        console.log(`   Created: ${user.created_at ? new Date(user.created_at).toLocaleDateString() : 'Unknown'}`);
      });
    }

    // Check tables in database
    console.log('\n📋 ALL TABLES:');
    console.log('==============');
    const tables = await query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      ORDER BY table_name
    `);
    
    tables.rows.forEach(table => {
      console.log(`  - ${table.table_name}`);
    });

  } catch (error) {
    console.error('❌ Error checking database structure:', error.message);
  }
}

checkDatabaseStructure()
  .then(() => {
    console.log('\n✅ Database structure check completed!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Failed to check database structure:', error);
    process.exit(1);
  });
