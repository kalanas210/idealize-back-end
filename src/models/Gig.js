import mongoose from 'mongoose';

const packageSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    enum: ['basic', 'standard', 'premium']
  },
  title: {
    type: String,
    required: true
  },
  description: {
    type: String,
    required: true
  },
  price: {
    type: Number,
    required: true,
    min: 5
  },
  deliveryTime: {
    type: Number,
    required: true,
    min: 1 // in days
  },
  revisions: {
    type: Number,
    default: 1,
    min: 0
  },
  features: [String],
  isActive: {
    type: Boolean,
    default: true
  }
});

const faqSchema = new mongoose.Schema({
  question: {
    type: String,
    required: true
  },
  answer: {
    type: String,
    required: true
  }
});

const gigSchema = new mongoose.Schema({
  // Basic Information
  title: {
    type: String,
    required: true,
    maxlength: 100
  },
  description: {
    type: String,
    required: true,
    maxlength: 2000
  },
  category: {
    type: String,
    required: true,
    enum: [
      'youtube',
      'instagram', 
      'tiktok',
      'facebook',
      'twitter',
      'linkedin',
      'other'
    ]
  },
  subcategory: String,
  tags: [{
    type: String,
    maxlength: 30
  }],
  
  // Seller Information
  seller: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  
  // Media
  images: [{
    url: String,
    fileId: String, // ImageKit file ID
    alt: String,
    isPrimary: {
      type: Boolean,
      default: false
    }
  }],
  video: {
    url: String,
    fileId: String, // ImageKit file ID
    thumbnail: String
  },
  
  // Packages
  packages: {
    basic: packageSchema,
    standard: packageSchema,
    premium: packageSchema
  },
  
  // Requirements and Extras
  requirements: [{
    type: String,
    required: true
  }],
  faqs: [faqSchema],
  
  // Gig Status and Metrics
  status: {
    type: String,
    enum: ['draft', 'pending', 'active', 'paused', 'rejected'],
    default: 'draft'
  },
  featured: {
    type: Boolean,
    default: false
  },
  
  // Statistics
  stats: {
    views: {
      type: Number,
      default: 0
    },
    clicks: {
      type: Number,
      default: 0
    },
    orders: {
      type: Number,
      default: 0
    },
    completedOrders: {
      type: Number,
      default: 0
    },
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
    conversionRate: {
      type: Number,
      default: 0
    },
    totalEarnings: {
      type: Number,
      default: 0
    }
  },
  
  // SEO and Search
  seo: {
    metaTitle: String,
    metaDescription: String,
    keywords: [String]
  },
  
  // Admin and Moderation
  moderationNotes: String,
  rejectionReason: String,
  approvedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  approvedAt: Date,
  
  // Timestamps
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  },
  publishedAt: Date,
  lastOrderAt: Date
});

// Indexes
gigSchema.index({ seller: 1 });
gigSchema.index({ status: 1 });
gigSchema.index({ category: 1 });
gigSchema.index({ featured: -1, createdAt: -1 });
gigSchema.index({ 'stats.rating': -1 });
gigSchema.index({ 'stats.orders': -1 });
gigSchema.index({ tags: 1 });
gigSchema.index({ title: 'text', description: 'text', tags: 'text' });
gigSchema.index({ createdAt: -1 });
gigSchema.index({ publishedAt: -1 });

// Virtual for starting price
gigSchema.virtual('startingPrice').get(function() {
  const prices = [];
  if (this.packages.basic?.price) prices.push(this.packages.basic.price);
  if (this.packages.standard?.price) prices.push(this.packages.standard.price);
  if (this.packages.premium?.price) prices.push(this.packages.premium.price);
  return Math.min(...prices) || 0;
});

// Virtual for primary image
gigSchema.virtual('primaryImage').get(function() {
  const primary = this.images.find(img => img.isPrimary);
  return primary || this.images[0] || null;
});

// Virtual for package count
gigSchema.virtual('packageCount').get(function() {
  let count = 0;
  if (this.packages.basic?.isActive) count++;
  if (this.packages.standard?.isActive) count++;
  if (this.packages.premium?.isActive) count++;
  return count;
});

// Pre-save middleware
gigSchema.pre('save', function(next) {
  this.updatedAt = new Date();
  
  // Set published date when first published
  if (this.isModified('status') && this.status === 'active' && !this.publishedAt) {
    this.publishedAt = new Date();
  }
  
  // Generate SEO fields if not provided
  if (!this.seo.metaTitle) {
    this.seo.metaTitle = this.title;
  }
  if (!this.seo.metaDescription) {
    this.seo.metaDescription = this.description.substring(0, 160);
  }
  
  // Ensure at least one package is active
  const activePackages = [
    this.packages.basic?.isActive,
    this.packages.standard?.isActive,
    this.packages.premium?.isActive
  ].filter(Boolean);
  
  if (activePackages.length === 0 && this.packages.basic) {
    this.packages.basic.isActive = true;
  }
  
  next();
});

// Instance methods
gigSchema.methods.incrementViews = function() {
  this.stats.views += 1;
  return this.save();
};

gigSchema.methods.incrementClicks = function() {
  this.stats.clicks += 1;
  this.stats.conversionRate = (this.stats.orders / this.stats.clicks) * 100;
  return this.save();
};

gigSchema.methods.addOrder = function() {
  this.stats.orders += 1;
  this.lastOrderAt = new Date();
  this.stats.conversionRate = (this.stats.orders / this.stats.clicks) * 100;
  return this.save();
};

gigSchema.methods.completeOrder = function(orderValue) {
  this.stats.completedOrders += 1;
  this.stats.totalEarnings += orderValue;
  return this.save();
};

gigSchema.methods.updateRating = function(newRating, isNewReview = false) {
  if (isNewReview) {
    const totalRating = (this.stats.rating * this.stats.totalReviews) + newRating;
    this.stats.totalReviews += 1;
    this.stats.rating = totalRating / this.stats.totalReviews;
  } else {
    // If updating existing review, recalculate based on all reviews
    this.stats.rating = newRating;
  }
  return this.save();
};

gigSchema.methods.isPurchasableBy = function(userId) {
  return this.status === 'active' && !this.seller.equals(userId);
};

gigSchema.methods.getActivePackages = function() {
  const packages = {};
  if (this.packages.basic?.isActive) packages.basic = this.packages.basic;
  if (this.packages.standard?.isActive) packages.standard = this.packages.standard;
  if (this.packages.premium?.isActive) packages.premium = this.packages.premium;
  return packages;
};

// Static methods
gigSchema.statics.findPublished = function() {
  return this.find({ status: 'active' });
};

gigSchema.statics.findByCategory = function(category) {
  return this.find({ category, status: 'active' });
};

gigSchema.statics.findFeatured = function() {
  return this.find({ featured: true, status: 'active' }).sort({ createdAt: -1 });
};

gigSchema.statics.searchGigs = function(query, filters = {}) {
  const searchQuery = { status: 'active' };
  
  if (query) {
    searchQuery.$text = { $search: query };
  }
  
  if (filters.category) {
    searchQuery.category = filters.category;
  }
  
  if (filters.minPrice || filters.maxPrice) {
    // This would need to be implemented based on package prices
  }
  
  if (filters.rating) {
    searchQuery['stats.rating'] = { $gte: filters.rating };
  }
  
  return this.find(searchQuery)
    .populate('seller', 'username displayName avatar sellerProfile.rating')
    .sort({ featured: -1, 'stats.rating': -1, createdAt: -1 });
};

const Gig = mongoose.model('Gig', gigSchema);

export default Gig;
