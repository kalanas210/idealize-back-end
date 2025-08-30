const { query } = require('./src/config/database');
const fs = require('fs');
const path = require('path');

async function checkSellerData() {
  console.log('🔍 Checking Seller Registration Data...\n');

  try {
    // 1. Check all users with seller role
    console.log('👥 SELLERS IN DATABASE:');
    console.log('=====================');
    const sellers = await query(`
      SELECT id, email, username, name, role, bio, location, country, phone, avatar, verified, created_at,
             professional_title, experience, skills, languages, social_accounts, verification_docs
      FROM users 
      WHERE role = 'seller' 
      ORDER BY created_at DESC
    `);

    if (sellers.rows.length === 0) {
      console.log('❌ No sellers found in database');
    } else {
      sellers.rows.forEach((seller, index) => {
        console.log(`\n📊 Seller ${index + 1}:`);
        console.log(`   ID: ${seller.id}`);
        console.log(`   Email: ${seller.email}`);
        console.log(`   Name: ${seller.name}`);
        console.log(`   Username: ${seller.username || 'Not set'}`);
        console.log(`   Bio: ${seller.bio ? seller.bio.substring(0, 100) + '...' : 'Not set'}`);
        console.log(`   Location: ${seller.location || 'Not set'}`);
        console.log(`   Country: ${seller.country || 'Not set'}`);
        console.log(`   Phone: ${seller.phone || 'Not set'}`);
        console.log(`   Avatar: ${seller.avatar || 'Not set'}`);
        console.log(`   Professional Title: ${seller.professional_title || 'Not set'}`);
        console.log(`   Experience: ${seller.experience || 'Not set'}`);
        console.log(`   Skills: ${seller.skills ? seller.skills.join(', ') : 'Not set'}`);
        console.log(`   Languages: ${seller.languages ? seller.languages.join(', ') : 'Not set'}`);
        console.log(`   Verified: ${seller.verified ? '✅' : '❌'}`);
        console.log(`   Verification Docs: ${seller.verification_docs ? 'Yes' : 'No'}`);
        if (seller.verification_docs) {
          console.log(`   Doc Details: ${JSON.stringify(seller.verification_docs, null, 6)}`);
        }
        console.log(`   Joined: ${new Date(seller.created_at).toLocaleDateString()}`);
      });
    }

    // 2. Check uploads table
    console.log('\n\n📁 UPLOADED FILES (Database):');
    console.log('==============================');
    try {
      const uploads = await query(`
        SELECT * FROM uploads 
        ORDER BY created_at DESC 
        LIMIT 10
      `);

      if (uploads.rows.length === 0) {
        console.log('❌ No uploads found in database');
      } else {
        uploads.rows.forEach((upload, index) => {
          console.log(`\n📄 Upload ${index + 1}:`);
          console.log(`   Filename: ${upload.filename || 'Unknown'}`);
          console.log(`   Original Name: ${upload.original_name || 'Unknown'}`);
          console.log(`   Size: ${upload.file_size ? (upload.file_size / 1024).toFixed(1) + ' KB' : 'Unknown'}`);
          console.log(`   Type: ${upload.mime_type || 'Unknown'}`);
          console.log(`   Uploaded By: ${upload.user_id || 'Unknown'}`);
          console.log(`   URL: ${upload.file_path || 'Unknown'}`);
          console.log(`   Created: ${upload.created_at ? new Date(upload.created_at).toLocaleDateString() : 'Unknown'}`);
        });
      }
    } catch (uploadError) {
      console.log('ℹ️  Uploads table not found or no uploads yet');
    }

    // 3. Check uploads directory
    console.log('\n\n📁 UPLOADED FILES:');
    console.log('==================');
    const uploadsDir = path.join(__dirname, 'src', 'uploads');
    
    if (fs.existsSync(uploadsDir)) {
      const files = fs.readdirSync(uploadsDir);
      console.log(`📂 Uploads directory: ${uploadsDir}`);
      console.log(`📊 Total files: ${files.length}`);
      
      if (files.length > 0) {
        console.log('\n📄 Recent files:');
        files
          .map(file => {
            const filePath = path.join(uploadsDir, file);
            const stats = fs.statSync(filePath);
            return {
              name: file,
              size: stats.size,
              created: stats.birthtime
            };
          })
          .sort((a, b) => b.created - a.created)
          .slice(0, 10)
          .forEach((file, index) => {
            console.log(`   ${index + 1}. ${file.name} (${(file.size / 1024).toFixed(1)} KB) - ${file.created.toLocaleDateString()}`);
          });
      }
    } else {
      console.log('❌ Uploads directory not found');
      console.log(`   Expected path: ${uploadsDir}`);
    }

    // 4. Check notifications for seller verifications
    console.log('\n\n🔔 SELLER NOTIFICATIONS:');
    console.log('========================');
    try {
      const notifications = await query(`
        SELECT n.*, u.name as admin_name
        FROM notifications n
        LEFT JOIN users u ON n.user_id = u.id
        WHERE n.type = 'seller_verification'
        ORDER BY n.created_at DESC
        LIMIT 10
      `);

      if (notifications.rows.length === 0) {
        console.log('❌ No seller verification notifications found');
      } else {
        notifications.rows.forEach((notif, index) => {
          console.log(`\n🔔 Notification ${index + 1}:`);
          console.log(`   Title: ${notif.title}`);
          console.log(`   Message: ${notif.message}`);
          console.log(`   For Admin: ${notif.admin_name || 'Unknown'}`);
          console.log(`   Created: ${new Date(notif.created_at).toLocaleDateString()}`);
          console.log(`   Read: ${notif.read_at ? '✅' : '❌'}`);
          if (notif.data) {
            console.log(`   Data: ${JSON.stringify(notif.data, null, 6)}`);
          }
        });
      }
    } catch (notifError) {
      console.log('ℹ️  No seller verification notifications found');
    }

    // 5. Database summary
    console.log('\n\n📊 DATABASE SUMMARY:');
    console.log('====================');
    
    const userCount = await query('SELECT COUNT(*) as count FROM users');
    const sellerCount = await query("SELECT COUNT(*) as count FROM users WHERE role = 'seller'");
    const buyerCount = await query("SELECT COUNT(*) as count FROM users WHERE role = 'buyer'");
    const adminCount = await query("SELECT COUNT(*) as count FROM users WHERE role = 'admin'");
    
    console.log(`👥 Total Users: ${userCount.rows[0].count}`);
    console.log(`🛒 Buyers: ${buyerCount.rows[0].count}`);
    console.log(`🏪 Sellers: ${sellerCount.rows[0].count}`);
    console.log(`👑 Admins: ${adminCount.rows[0].count}`);

  } catch (error) {
    console.error('❌ Error checking seller data:', error);
  }
}

// Run the check
checkSellerData()
  .then(() => {
    console.log('\n✅ Seller data check completed!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Failed to check seller data:', error);
    process.exit(1);
  });
