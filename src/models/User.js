import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

const socialAccountSchema = new mongoose.Schema({
  platform: {
    type: String,
    required: true,
    enum: ['youtube', 'instagram', 'tiktok', 'facebook', 'twitter', 'linkedin']
  },
  username: {
    type: String,
    required: true
  },
  url: {
    type: String,
    required: true
  },
  followers: {
    type: Number,
    default: 0
  },
  verified: {
    type: Boolean,
    default: false
  }
});

const portfolioItemSchema = new mongoose.Schema({
  title: String,
  description: String,
  imageUrl: String,
  fileId: String, // ImageKit file ID
  url: String, // External URL if applicable
  type: {
    type: String,
    enum: ['image', 'video', 'link'],
    default: 'image'
  }
});

const userSchema = new mongoose.Schema({
  // Basic Information
  clerkId: {
    type: String,
    unique: true,
    sparse: true // Allows null values but ensures uniqueness when present
  },
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true
  },
  username: {
    type: String,
    required: true,
    unique: true,
    lowercase: true
  },
  password: {
    type: String,
    required: false // Optional since we use Clerk for auth
  },
  
  // Profile Information
  firstName: String,
  lastName: String,
  displayName: String,
  avatar: {
    url: String,
    fileId: String // ImageKit file ID
  },
  bio: String,
  location: {
    country: String,
    city: String,
    timezone: String
  },
  
  // User Role and Status
  role: {
    type: String,
    enum: ['buyer', 'seller', 'admin'],
    default: 'buyer'
  },
  status: {
    type: String,
    enum: ['active', 'inactive', 'suspended', 'pending'],
    default: 'active'
  },
  verified: {
    email: {
      type: Boolean,
      default: false
    },
    identity: {
      type: Boolean,
      default: false
    },
    phone: {
      type: Boolean,
      default: false
    }
  },
  
  // Contact Information
  phone: String,
  
  // Seller-specific Information
  sellerProfile: {
    professionalTitle: String,
    experience: String,
    skills: [String],
    languages: [String],
    socialAccounts: [socialAccountSchema],
    portfolio: [portfolioItemSchema],
    rating: {
      type: Number,
      default: 0,
      min: 0,
      max: 5
    },
    totalReviews: {
      type: Number,
      default: 0
    },
    totalEarnings: {
      type: Number,
      default: 0
    },
    completedOrders: {
      type: Number,
      default: 0
    },
    responseTime: {
      type: Number, // in hours
      default: 24
    },
    availability: {
      type: String,
      enum: ['available', 'busy', 'away'],
      default: 'available'
    },
    verificationDocs: [{
      type: {
        type: String,
        enum: ['id', 'address', 'business'],
        required: true
      },
      url: String,
      fileId: String,
      status: {
        type: String,
        enum: ['pending', 'approved', 'rejected'],
        default: 'pending'
      },
      submittedAt: {
        type: Date,
        default: Date.now
      },
      reviewedAt: Date,
      reviewedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
      },
      notes: String
    }]
  },
  
  // Buyer-specific Information
  buyerProfile: {
    company: String,
    industry: String,
    totalSpent: {
      type: Number,
      default: 0
    },
    totalOrders: {
      type: Number,
      default: 0
    }
  },
  
  // Preferences
  preferences: {
    notifications: {
      email: {
        type: Boolean,
        default: true
      },
      push: {
        type: Boolean,
        default: true
      },
      marketing: {
        type: Boolean,
        default: false
      }
    },
    privacy: {
      showProfile: {
        type: Boolean,
        default: true
      },
      showOnlineStatus: {
        type: Boolean,
        default: true
      }
    }
  },
  
  // Authentication
  lastLogin: Date,
  loginCount: {
    type: Number,
    default: 0
  },
  
  // Timestamps
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

// Indexes (email, username, clerkId already have unique indexes)
userSchema.index({ role: 1 });
userSchema.index({ status: 1 });
userSchema.index({ 'sellerProfile.rating': -1 });
userSchema.index({ createdAt: -1 });

// Virtual for full name
userSchema.virtual('fullName').get(function() {
  if (this.firstName && this.lastName) {
    return `${this.firstName} ${this.lastName}`;
  }
  return this.displayName || this.username;
});

// Virtual for profile completion percentage
userSchema.virtual('profileCompletion').get(function() {
  const fields = [
    this.firstName,
    this.lastName,
    this.bio,
    this.avatar?.url,
    this.location?.country
  ];
  
  if (this.role === 'seller') {
    fields.push(
      this.sellerProfile?.professionalTitle,
      this.sellerProfile?.experience,
      this.sellerProfile?.skills?.length > 0,
      this.sellerProfile?.languages?.length > 0
    );
  }
  
  const completedFields = fields.filter(field => field).length;
  return Math.round((completedFields / fields.length) * 100);
});

// Pre-save middleware
userSchema.pre('save', async function(next) {
  this.updatedAt = new Date();
  
  // Hash password if modified
  if (this.password && this.isModified('password')) {
    const rounds = parseInt(process.env.BCRYPT_ROUNDS) || 12;
    this.password = await bcrypt.hash(this.password, rounds);
  }
  
  // Update username if displayName changed
  if (this.isModified('displayName') && this.displayName && !this.username) {
    this.username = this.displayName.toLowerCase().replace(/[^a-z0-9]/g, '');
  }
  
  next();
});

// Instance methods
userSchema.methods.comparePassword = async function(candidatePassword) {
  if (!this.password) return false;
  return bcrypt.compare(candidatePassword, this.password);
};

userSchema.methods.generateUsername = function() {
  const base = (this.firstName || this.email.split('@')[0]).toLowerCase();
  return base.replace(/[^a-z0-9]/g, '') + Math.random().toString(36).substr(2, 4);
};

userSchema.methods.toJSON = function() {
  const obj = this.toObject();
  delete obj.password;
  return obj;
};

// Static methods
userSchema.statics.findByEmail = function(email) {
  return this.findOne({ email: email.toLowerCase() });
};

userSchema.statics.findByUsername = function(username) {
  return this.findOne({ username: username.toLowerCase() });
};

userSchema.statics.findByClerkId = function(clerkId) {
  return this.findOne({ clerkId });
};

const User = mongoose.model('User', userSchema);

export default User;
