import mongoose from 'mongoose';

const reviewSchema = new mongoose.Schema({
  // Core Information
  order: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Order',
    required: true,
    unique: true // One review per order
  },
  gig: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Gig',
    required: true
  },
  buyer: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  seller: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  
  // Review Content
  rating: {
    overall: {
      type: Number,
      required: true,
      min: 1,
      max: 5
    },
    communication: {
      type: Number,
      min: 1,
      max: 5
    },
    serviceQuality: {
      type: Number,
      min: 1,
      max: 5
    },
    deliveryTime: {
      type: Number,
      min: 1,
      max: 5
    },
    wouldRecommend: {
      type: Boolean,
      default: true
    }
  },
  
  // Written Review
  title: {
    type: String,
    maxlength: 100
  },
  comment: {
    type: String,
    required: true,
    maxlength: 1000
  },
  
  // Media
  images: [{
    url: String,
    fileId: String, // ImageKit file ID
    caption: String
  }],
  
  // Review Status
  status: {
    type: String,
    enum: ['pending', 'published', 'hidden', 'flagged'],
    default: 'pending'
  },
  
  // Seller Response
  response: {
    comment: {
      type: String,
      maxlength: 500
    },
    respondedAt: Date
  },
  
  // Engagement
  helpful: {
    count: {
      type: Number,
      default: 0
    },
    users: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    }]
  },
  
  // Moderation
  flagged: {
    isFlag: {
      type: Boolean,
      default: false
    },
    reason: String,
    flaggedBy: [{
      user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
      },
      reason: String,
      flaggedAt: {
        type: Date,
        default: Date.now
      }
    }],
    reviewedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    reviewedAt: Date,
    resolution: String
  },
  
  // Additional Information
  orderValue: Number, // Value of the order this review is for
  packageType: {
    type: String,
    enum: ['basic', 'standard', 'premium']
  },
  
  // Platform Usage
  platform: {
    type: String,
    default: 'web' // web, mobile, api
  },
  
  // Timestamps
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  },
  publishedAt: Date
});

// Indexes (order already has unique index)
reviewSchema.index({ gig: 1, createdAt: -1 });
reviewSchema.index({ seller: 1, createdAt: -1 });
reviewSchema.index({ buyer: 1 });
reviewSchema.index({ 'rating.overall': -1 });
reviewSchema.index({ status: 1 });
reviewSchema.index({ createdAt: -1 });

// Virtual for average detailed rating
reviewSchema.virtual('averageDetailedRating').get(function() {
  const ratings = [
    this.rating.communication,
    this.rating.serviceQuality,
    this.rating.deliveryTime
  ].filter(r => r != null);
  
  if (ratings.length === 0) return this.rating.overall;
  
  const sum = ratings.reduce((a, b) => a + b, 0);
  return Math.round((sum / ratings.length) * 10) / 10;
});

// Virtual for review age
reviewSchema.virtual('reviewAge').get(function() {
  const now = new Date();
  const diffTime = Math.abs(now - this.createdAt);
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  
  if (diffDays === 1) return '1 day ago';
  if (diffDays < 30) return `${diffDays} days ago`;
  if (diffDays < 365) {
    const months = Math.floor(diffDays / 30);
    return months === 1 ? '1 month ago' : `${months} months ago`;
  }
  const years = Math.floor(diffDays / 365);
  return years === 1 ? '1 year ago' : `${years} years ago`;
});

// Pre-save middleware
reviewSchema.pre('save', function(next) {
  this.updatedAt = new Date();
  
  // Set published date when status changes to published
  if (this.isModified('status') && this.status === 'published' && !this.publishedAt) {
    this.publishedAt = new Date();
  }
  
  // Ensure overall rating is provided
  if (!this.rating.overall && this.averageDetailedRating) {
    this.rating.overall = Math.round(this.averageDetailedRating);
  }
  
  next();
});

// Post-save middleware to update gig and seller ratings
reviewSchema.post('save', async function() {
  if (this.status === 'published') {
    try {
      // Update gig rating
      const Gig = mongoose.model('Gig');
      const gigReviews = await mongoose.model('Review').find({ 
        gig: this.gig, 
        status: 'published' 
      });
      
      const totalRating = gigReviews.reduce((sum, review) => sum + review.rating.overall, 0);
      const averageRating = totalRating / gigReviews.length;
      
      await Gig.findByIdAndUpdate(this.gig, {
        'stats.rating': Math.round(averageRating * 10) / 10,
        'stats.totalReviews': gigReviews.length
      });
      
      // Update seller rating
      const User = mongoose.model('User');
      const sellerReviews = await mongoose.model('Review').find({ 
        seller: this.seller, 
        status: 'published' 
      });
      
      const sellerTotalRating = sellerReviews.reduce((sum, review) => sum + review.rating.overall, 0);
      const sellerAverageRating = sellerTotalRating / sellerReviews.length;
      
      await User.findByIdAndUpdate(this.seller, {
        'sellerProfile.rating': Math.round(sellerAverageRating * 10) / 10,
        'sellerProfile.totalReviews': sellerReviews.length
      });
      
    } catch (error) {
      console.error('Error updating ratings:', error);
    }
  }
});

// Instance methods
reviewSchema.methods.markHelpful = function(userId) {
  if (!this.helpful.users.includes(userId)) {
    this.helpful.users.push(userId);
    this.helpful.count += 1;
    return this.save();
  }
  return Promise.resolve(this);
};

reviewSchema.methods.unmarkHelpful = function(userId) {
  const index = this.helpful.users.indexOf(userId);
  if (index > -1) {
    this.helpful.users.splice(index, 1);
    this.helpful.count = Math.max(0, this.helpful.count - 1);
    return this.save();
  }
  return Promise.resolve(this);
};

reviewSchema.methods.addResponse = function(responseComment) {
  this.response.comment = responseComment;
  this.response.respondedAt = new Date();
  return this.save();
};

reviewSchema.methods.flagReview = function(userId, reason) {
  this.flagged.isFlag = true;
  this.flagged.flaggedBy.push({
    user: userId,
    reason,
    flaggedAt: new Date()
  });
  
  // Auto-hide if multiple flags
  if (this.flagged.flaggedBy.length >= 3) {
    this.status = 'flagged';
  }
  
  return this.save();
};

reviewSchema.methods.publish = function() {
  this.status = 'published';
  this.publishedAt = new Date();
  return this.save();
};

reviewSchema.methods.hide = function() {
  this.status = 'hidden';
  return this.save();
};

// Static methods
reviewSchema.statics.findForGig = function(gigId, options = {}) {
  const query = { gig: gigId, status: 'published' };
  
  let dbQuery = this.find(query)
    .populate('buyer', 'username displayName avatar')
    .sort({ createdAt: -1 });
  
  if (options.limit) {
    dbQuery = dbQuery.limit(options.limit);
  }
  
  if (options.rating) {
    query['rating.overall'] = { $gte: options.rating };
  }
  
  return dbQuery;
};

reviewSchema.statics.findForSeller = function(sellerId, options = {}) {
  const query = { seller: sellerId, status: 'published' };
  
  let dbQuery = this.find(query)
    .populate('buyer', 'username displayName avatar')
    .populate('gig', 'title images')
    .sort({ createdAt: -1 });
  
  if (options.limit) {
    dbQuery = dbQuery.limit(options.limit);
  }
  
  return dbQuery;
};

reviewSchema.statics.getGigRatingStats = function(gigId) {
  return this.aggregate([
    { $match: { gig: mongoose.Types.ObjectId(gigId), status: 'published' } },
    {
      $group: {
        _id: null,
        averageRating: { $avg: '$rating.overall' },
        totalReviews: { $sum: 1 },
        ratingDistribution: {
          $push: '$rating.overall'
        }
      }
    },
    {
      $addFields: {
        ratingBreakdown: {
          1: {
            $size: {
              $filter: {
                input: '$ratingDistribution',
                cond: { $eq: ['$$this', 1] }
              }
            }
          },
          2: {
            $size: {
              $filter: {
                input: '$ratingDistribution',
                cond: { $eq: ['$$this', 2] }
              }
            }
          },
          3: {
            $size: {
              $filter: {
                input: '$ratingDistribution',
                cond: { $eq: ['$$this', 3] }
              }
            }
          },
          4: {
            $size: {
              $filter: {
                input: '$ratingDistribution',
                cond: { $eq: ['$$this', 4] }
              }
            }
          },
          5: {
            $size: {
              $filter: {
                input: '$ratingDistribution',
                cond: { $eq: ['$$this', 5] }
              }
            }
          }
        }
      }
    }
  ]);
};

reviewSchema.statics.getPendingReviews = function() {
  return this.find({ status: 'pending' })
    .populate('buyer', 'username displayName')
    .populate('gig', 'title')
    .sort({ createdAt: 1 });
};

reviewSchema.statics.getFlaggedReviews = function() {
  return this.find({ 'flagged.isFlag': true, status: { $ne: 'hidden' } })
    .populate('buyer', 'username displayName')
    .populate('gig', 'title')
    .sort({ 'flagged.flaggedBy.0.flaggedAt': 1 });
};

const Review = mongoose.model('Review', reviewSchema);

export default Review;
