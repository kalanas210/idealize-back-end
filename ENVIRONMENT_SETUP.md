# Environment Setup Guide for Seller Registration

## 🔧 Quick Setup

### 1. Backend Configuration

Create a `.env` file in the backend directory by copying the example:

```bash
cd backend
cp env.example .env
```

**Important:** Make sure your `.env` file has at least these settings:

```env
# Server Configuration
NODE_ENV=development
PORT=5000

# Database (optional - will use mock data if not configured)
DB_HOST=localhost
DB_PORT=5432
DB_NAME=socyads_db
DB_USER=postgres
DB_PASSWORD=your_password_here

# Clerk Authentication (optional - will use mock auth if not configured)
CLERK_SECRET_KEY=your_clerk_secret_key_here

# File Upload
MAX_FILE_SIZE=10485760
UPLOAD_PATH=src/uploads
```

### 2. Frontend Configuration

Create a `.env` file in the frontend directory:

```bash
cd frontend
```

Create `.env` with:

```env
# API Configuration
VITE_API_URL=http://localhost:5000

# Optional: LiveChat (can be left empty)
VITE_LIVECHAT_LICENSE=
```

## 🚀 Running the Application

### Start Backend Server

```bash
cd backend
npm install
npm run dev
```

You should see:
```
⚠️  Development mode: Using mock authentication
🚀 Server running on http://localhost:5000
📚 API Documentation: http://localhost:5000/api/docs
```

### Test Authentication

Before testing the seller registration, verify authentication is working:

```bash
cd backend
node test-auth-simple.js
```

This will test if the mock authentication is working properly.

### Start Frontend

```bash
cd frontend
npm install
npm run dev
```

The application will be available at `http://localhost:5173`

## ✅ Testing Seller Registration

1. **Navigate to Seller Registration**
   - Go to `http://localhost:5173/become-seller`

2. **Complete the Form**
   - The authentication will work even without Clerk configured (development mode)
   - Fill in all required fields
   - Upload test images for profile and verification

3. **Submit Application**
   - Click "Submit Application"
   - You should see a success message

4. **Check Results**
   - Check backend console for logs
   - Uploaded files will be in `backend/src/uploads/`
   - Verification documents will be logged in console

## 🔍 Troubleshooting

### Issue: 401 Unauthorized Errors

**Solution:** The backend is now configured to accept any token in development mode. Make sure:
- `NODE_ENV=development` is set in backend `.env`
- Backend server is running on port 5000
- **Restart the backend server** after making changes to `.env`

**Quick Fix:**
1. Stop the backend server (Ctrl+C)
2. Ensure `NODE_ENV=development` is in your `.env` file
3. Restart: `npm run dev`
4. Test with: `node test-auth-simple.js`

### Issue: "Cannot read properties of undefined (reading 'license')"

**Solution:** This is a LiveChat configuration issue that has been fixed. The component now checks if the config exists before accessing properties.

### Issue: Files not uploading

**Solution:** 
1. Ensure `backend/src/uploads/` directory exists
2. Check file size (max 10MB)
3. Check file type (images and documents only)

### Issue: Database errors

**Solution:** The application works without a database in development mode. It will use mock data automatically.

## 🔐 Authentication Modes

The backend supports three authentication modes:

1. **Development Mode (No Clerk)**
   - When `NODE_ENV=development` and no `CLERK_SECRET_KEY`
   - Accepts any token and creates mock user
   - Perfect for testing without external dependencies

2. **Development Mode (With Clerk)**
   - When `NODE_ENV=development` and `CLERK_SECRET_KEY` is set
   - Verifies Clerk tokens but falls back to mock if verification fails
   - Good for testing Clerk integration

3. **Production Mode**
   - When `NODE_ENV=production`
   - Requires valid Clerk authentication
   - No mock fallbacks

## 📝 Mock User Details

In development mode without Clerk, the mock user has:
- Email: `test@example.com`
- Username: `testuser`
- Name: `Test User`
- Role: `buyer` (changes to `seller` after registration)
- ID: Consistent based on token (e.g., `dev-user-12345678`)

## 🎯 Next Steps

1. **For Production**
   - Set up Clerk authentication
   - Configure PostgreSQL database
   - Use cloud storage for file uploads (AWS S3, Cloudinary)
   - Set `NODE_ENV=production`

2. **For Development**
   - Continue using mock authentication
   - Test all features without external dependencies
   - Focus on functionality, not authentication

## 📚 Related Documentation

- [Seller Registration Documentation](./SELLER_REGISTRATION.md)
- [API Documentation](http://localhost:5000/api/docs)
- [Test Script](./test-seller-registration.js)
