# Seller Registration Feature - Documentation

## 🎯 Overview

The Seller Registration feature allows buyers to apply to become sellers on the SocyAds platform. It includes a comprehensive multi-step form, file uploads for verification documents, and an admin review process.

## ✅ Completed Features

### 1. **Frontend Components**
- ✅ Multi-step registration form in `BecomeSeller.tsx`
- ✅ Clerk authentication integration
- ✅ File upload for profile images
- ✅ Portfolio uploads
- ✅ Verification document uploads (ID and address proof)
- ✅ Social media account linking
- ✅ Skills and language selection
- ✅ Professional information collection

### 2. **API Configuration**
- ✅ Created `frontend/src/config/api.ts` for centralized API endpoints
- ✅ Fixed API URL issues (was calling frontend URL instead of backend)
- ✅ Proper headers for file uploads

### 3. **Backend Endpoints**

#### User Routes (`/api/users`)
- ✅ `POST /api/users/become-seller` - Submit seller application
  - Validates all required fields
  - Handles file uploads
  - Stores verification documents
  - Creates admin notifications

#### Admin Routes (`/api/admin`)
- ✅ `GET /api/admin/seller-applications` - Get pending applications
- ✅ `POST /api/admin/seller-applications/:userId/approve` - Approve application
- ✅ `POST /api/admin/seller-applications/:userId/reject` - Reject application with reason

#### Upload Routes (`/api/upload`)
- ✅ `POST /api/upload/single` - Upload single file
- ✅ `POST /api/upload/multiple` - Upload multiple files
- ✅ Static file serving at `/uploads`

### 4. **File Storage**
- ✅ Created `backend/src/uploads/` directory for file storage
- ✅ Configured multer for file handling
- ✅ File type validation (images, documents)
- ✅ Size limits (10MB per file)

### 5. **Database Schema Updates**
The following fields are added to the users table:
- `professional_title` - Professional title/role
- `experience` - Years of experience
- `social_accounts` - JSON field for social media accounts
- `portfolio` - JSON array of portfolio URLs
- `verification_docs` - JSON array of verification documents
- `country` - User's country
- `rejection_reason` - Reason if application is rejected

## 🔄 Registration Flow

1. **User Journey**
   ```
   Landing Page → Sign In/Up (Clerk) → Personal Info → 
   Professional Info → Social Accounts → Verification → Submit
   ```

2. **Backend Processing**
   - Validate all inputs
   - Upload files to server
   - Store application data
   - Set user role to 'seller' (unverified)
   - Create admin notification

3. **Admin Review**
   - View pending applications
   - Review verification documents
   - Approve or reject with reason
   - User gets notified of decision

## 📁 File Structure

```
frontend/
├── src/
│   ├── config/
│   │   └── api.ts                 # API endpoints configuration
│   └── pages/
│       └── BecomeSeller.tsx        # Seller registration form

backend/
├── src/
│   ├── routes/
│   │   ├── userRoutes.js          # Become-seller endpoint
│   │   ├── adminRoutes.js         # Admin review endpoints
│   │   └── uploadRoutes.js        # File upload endpoints
│   └── uploads/                   # Uploaded files directory
└── test-seller-registration.js    # Test script
```

## 🧪 Testing

### Run Test Script
```bash
cd backend
node test-seller-registration.js
```

### Manual Testing Steps

1. **Start Backend Server**
   ```bash
   cd backend
   npm run dev
   ```

2. **Start Frontend**
   ```bash
   cd frontend
   npm run dev
   ```

3. **Test Registration Flow**
   - Navigate to `/become-seller`
   - Complete all form steps
   - Upload test images for profile and verification
   - Submit application

4. **Check Results**
   - Check console for verification document logs
   - Check `backend/src/uploads/` for uploaded files
   - Test admin endpoints with Swagger UI at `http://localhost:5000/api/docs`

## 🔐 Security Features

- ✅ JWT authentication required
- ✅ File type validation
- ✅ File size limits
- ✅ Input validation on all fields
- ✅ Verification documents sent to admin only
- ✅ Secure file storage

## 🐛 Known Issues Fixed

1. **API URL Issue**: Frontend was calling `localhost:5173` instead of `localhost:5000`
   - **Solution**: Created API configuration file with correct URLs

2. **File Upload 404**: Upload endpoints were not accessible
   - **Solution**: Fixed API URLs and ensured uploads directory exists

3. **Validation Too Strict**: Bio required 50 characters minimum
   - **Solution**: Reduced to 20 characters minimum

## 🚀 Production Considerations

1. **File Storage**
   - Consider using cloud storage (AWS S3, Cloudinary)
   - Implement file cleanup for rejected applications
   - Add virus scanning for uploaded files

2. **Database**
   - Ensure all columns exist in production database
   - Add indexes for performance
   - Implement proper transaction handling

3. **Security**
   - Implement rate limiting on registration endpoint
   - Add CAPTCHA to prevent spam
   - Encrypt sensitive documents

4. **Admin Panel**
   - Build dedicated UI for reviewing applications
   - Add bulk approval/rejection
   - Implement email notifications

## 📝 Environment Variables

### Frontend (.env)
```env
VITE_API_URL=http://localhost:5000
```

### Backend (.env)
```env
# Already configured in env.example
MAX_FILE_SIZE=10485760
UPLOAD_PATH=src/uploads
```

## 🎉 Summary

The Seller Registration feature is now fully functional with:
- ✅ Complete registration form with file uploads
- ✅ Backend API endpoints for processing applications
- ✅ Admin review endpoints
- ✅ File storage and serving
- ✅ Proper error handling and validation
- ✅ Mock data fallback for development

The feature is ready for testing and can be deployed with the considerations mentioned above for production use.
