# 🗄️ SocyAds Database Setup Guide

This guide will help you set up the complete database for the SocyAds platform, including seller registration and gig creation functionality.

## 📋 Prerequisites

- PostgreSQL database server running
- Node.js backend with database connection configured
- Access to run SQL scripts

## 🚀 Quick Setup

### 1. Initialize Database Schema

Run the database initialization script:

```bash
cd backend
node init-database.js
```

This script will:
- ✅ Create all necessary tables
- ✅ Set up indexes for performance
- ✅ Create triggers for automatic timestamp updates
- ✅ Insert default admin user
- ✅ Create database views for common queries

### 2. Verify Database Connection

Ensure your `.env` file has the correct database configuration:

```env
DB_HOST=localhost
DB_PORT=5432
DB_NAME=socyads
DB_USER=your_username
DB_PASSWORD=your_password
```

## 🏗️ Database Schema Overview

### Core Tables

| Table | Purpose | Key Fields |
|-------|---------|------------|
| `users` | User profiles and authentication | `id`, `email`, `role`, `verified` |
| `seller_applications` | Seller registration data | `user_id`, `status`, `verification_docs` |
| `gigs` | Services offered by sellers | `seller_id`, `title`, `category`, `status` |
| `gig_packages` | Pricing tiers for gigs | `gig_id`, `tier`, `price`, `features` |
| `gig_faqs` | FAQ for gigs | `gig_id`, `question`, `answer` |
| `orders` | Purchase transactions | `gig_id`, `buyer_id`, `seller_id`, `status` |
| `reviews` | Customer feedback | `order_id`, `gig_id`, `rating`, `comment` |
| `notifications` | System notifications | `user_id`, `type`, `message`, `data` |

### Key Relationships

- **Users** → **Seller Applications** (1:1)
- **Users** → **Gigs** (1:many)
- **Gigs** → **Gig Packages** (1:many)
- **Gigs** → **Gig FAQs** (1:many)
- **Gigs** → **Orders** (1:many)
- **Orders** → **Reviews** (1:1)

## 🔧 Database Operations

### Seller Registration Flow

1. **User submits application** → `POST /api/users/become-seller`
2. **Backend creates/updates user** → `users` table
3. **Backend creates application record** → `seller_applications` table
4. **Backend creates admin notification** → `notifications` table
5. **User role updated** → `users.role = 'seller'`

### Gig Creation Flow

1. **Seller creates gig** → `POST /api/gigs`
2. **Backend starts transaction**
3. **Backend inserts gig** → `gigs` table
4. **Backend inserts packages** → `gig_packages` table
5. **Backend inserts FAQ** → `gig_faqs` table
6. **Backend commits transaction**
7. **Backend returns complete gig data**

## 📊 Database Views

### `seller_dashboard`
Provides aggregated data for seller dashboard:
- Total gigs (published/draft)
- Total orders (completed/pending)
- Average rating
- Total reviews

### `gig_details`
Provides complete gig information with packages and FAQ:
- Gig details
- Pricing packages
- FAQ items
- Seller information

## 🔍 Sample Queries

### Get User Profile with Role
```sql
SELECT * FROM users WHERE id = $1;
```

### Get Seller Applications
```sql
SELECT sa.*, u.name, u.email 
FROM seller_applications sa 
JOIN users u ON sa.user_id = u.id 
WHERE sa.status = 'pending';
```

### Get User's Gigs
```sql
SELECT g.*, 
       json_agg(DISTINCT gp.*) as packages,
       json_agg(DISTINCT gf.*) as faq
FROM gigs g
LEFT JOIN gig_packages gp ON g.id = gp.gig_id
LEFT JOIN gig_faqs gf ON g.id = gf.gig_id
WHERE g.seller_id = $1
GROUP BY g.id;
```

### Get Gig with Complete Details
```sql
SELECT * FROM gig_details WHERE id = $1;
```

## 🚨 Important Notes

### Development Mode
- The `clerkProtect` middleware creates mock users in development
- Mock user IDs follow pattern: `dev-user-{token-prefix}`
- Database queries will fail for mock users until they register

### UUID Handling
- Mock user IDs are not valid UUIDs
- Database will fall back gracefully in development
- Production should use proper Clerk user IDs

### Transaction Safety
- Gig creation uses database transactions
- Rollback on any error ensures data consistency
- All related data (gig, packages, FAQ) created atomically

## 🧪 Testing the Database

### 1. Test Seller Registration
```bash
# Complete seller registration flow
# Check database for new user and application records
```

### 2. Test Gig Creation
```bash
# Create gig as registered seller
# Verify all tables populated correctly
# Check transaction rollback on errors
```

### 3. Test Data Retrieval
```bash
# Test profile endpoint returns correct role
# Test gig listing and details
# Verify relationships work correctly
```

## 🔧 Troubleshooting

### Common Issues

1. **Connection Errors**
   - Verify database credentials
   - Check if PostgreSQL is running
   - Ensure database exists

2. **Permission Errors**
   - Verify user has CREATE, INSERT, UPDATE permissions
   - Check if tables exist

3. **Mock User Issues**
   - Mock users won't work until they register
   - Check middleware logs for user creation

4. **Transaction Errors**
   - Verify all required fields are provided
   - Check validation rules
   - Review error logs for specific issues

### Debug Commands

```sql
-- Check if tables exist
\dt

-- Check table structure
\d users
\d gigs

-- Check sample data
SELECT * FROM users LIMIT 5;
SELECT * FROM gigs LIMIT 5;

-- Check recent applications
SELECT * FROM seller_applications ORDER BY created_at DESC LIMIT 5;
```

## 📈 Performance Considerations

### Indexes
- Primary keys automatically indexed
- Foreign keys should have indexes
- Frequently queried fields indexed
- Composite indexes for complex queries

### Query Optimization
- Use database views for complex joins
- Limit result sets with pagination
- Use transactions for related operations
- Monitor slow query logs

## 🔄 Migration Strategy

### Development to Production
1. **Schema Migration**
   - Export schema from development
   - Apply to production database
   - Verify all tables and constraints

2. **Data Migration**
   - Export sample data if needed
   - Update environment variables
   - Test all endpoints

3. **User Migration**
   - Clerk handles user authentication
   - Database stores user profiles
   - No password migration needed

## 📚 Additional Resources

- [PostgreSQL Documentation](https://www.postgresql.org/docs/)
- [Node.js pg Module](https://node-postgres.com/)
- [Database Design Best Practices](https://www.postgresql.org/docs/current/ddl.html)

---

**Need Help?** Check the backend console logs for detailed error messages and database operation status.
