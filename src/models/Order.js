import mongoose from 'mongoose';

const deliverableSchema = new mongoose.Schema({
  type: {
    type: String,
    enum: ['text', 'file', 'link'],
    required: true
  },
  content: String, // Text content or file description
  files: [{
    url: String,
    fileId: String, // ImageKit file ID
    name: String,
    size: Number,
    type: String // MIME type
  }],
  submittedAt: {
    type: Date,
    default: Date.now
  }
});

const revisionSchema = new mongoose.Schema({
  requestedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  reason: {
    type: String,
    required: true
  },
  details: String,
  requestedAt: {
    type: Date,
    default: Date.now
  },
  status: {
    type: String,
    enum: ['pending', 'accepted', 'rejected', 'completed'],
    default: 'pending'
  },
  response: String,
  respondedAt: Date,
  deliverables: [deliverableSchema]
});

const messageSchema = new mongoose.Schema({
  sender: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  content: {
    type: String,
    required: true
  },
  attachments: [{
    url: String,
    fileId: String,
    name: String,
    type: String
  }],
  timestamp: {
    type: Date,
    default: Date.now
  },
  readBy: [{
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    readAt: {
      type: Date,
      default: Date.now
    }
  }]
});

const milestoneSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true
  },
  description: String,
  amount: {
    type: Number,
    required: true
  },
  dueDate: Date,
  status: {
    type: String,
    enum: ['pending', 'in_progress', 'completed', 'cancelled'],
    default: 'pending'
  },
  completedAt: Date,
  deliverables: [deliverableSchema]
});

const orderSchema = new mongoose.Schema({
  // Order Identification
  orderId: {
    type: String,
    unique: true,
    required: true
  },
  
  // Parties
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
  
  // Gig Information
  gig: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Gig',
    required: true
  },
  gigTitle: String, // Snapshot of gig title at time of order
  gigImage: String, // Snapshot of primary gig image
  
  // Package Information
  package: {
    type: String,
    enum: ['basic', 'standard', 'premium'],
    required: true
  },
  packageDetails: {
    title: String,
    description: String,
    features: [String],
    deliveryTime: Number, // in days
    revisions: Number
  },
  
  // Pricing
  amount: {
    subtotal: {
      type: Number,
      required: true
    },
    fees: {
      platform: Number,
      payment: Number
    },
    total: {
      type: Number,
      required: true
    }
  },
  currency: {
    type: String,
    default: 'USD'
  },
  
  // Order Status and Timeline
  status: {
    type: String,
    enum: [
      'pending',          // Order placed, waiting for seller acceptance
      'accepted',         // Seller accepted, work can begin
      'in_progress',      // Work is in progress
      'delivered',        // Initial delivery submitted
      'revision_requested', // Buyer requested revisions
      'revision_delivered', // Seller delivered revisions
      'completed',        // Order completed and approved
      'cancelled',        // Order cancelled
      'disputed',         // Order is in dispute
      'refunded'          // Order refunded
    ],
    default: 'pending'
  },
  
  // Important Dates
  dates: {
    ordered: {
      type: Date,
      default: Date.now
    },
    accepted: Date,
    dueDate: Date,
    delivered: Date,
    completed: Date,
    cancelled: Date
  },
  
  // Requirements and Instructions
  requirements: {
    answers: [{
      question: String,
      answer: String
    }],
    additionalInfo: String,
    attachments: [{
      url: String,
      fileId: String,
      name: String,
      type: String
    }]
  },
  
  // Deliverables
  deliverables: [deliverableSchema],
  
  // Revisions
  revisions: [revisionSchema],
  revisionsUsed: {
    type: Number,
    default: 0
  },
  
  // Milestones (for complex orders)
  milestones: [milestoneSchema],
  
  // Communication
  messages: [messageSchema],
  lastMessageAt: Date,
  
  // Payment Information
  payment: {
    method: String,
    transactionId: String,
    status: {
      type: String,
      enum: ['pending', 'completed', 'failed', 'refunded'],
      default: 'pending'
    },
    paidAt: Date,
    refundedAt: Date,
    refundAmount: Number
  },
  
  // Cancellation/Dispute
  cancellation: {
    requestedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    reason: String,
    requestedAt: Date,
    approvedAt: Date,
    approvedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    }
  },
  
  dispute: {
    initiatedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    reason: String,
    details: String,
    initiatedAt: Date,
    resolvedAt: Date,
    resolution: String,
    resolvedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    }
  },
  
  // Admin and Platform
  platformFee: {
    type: Number,
    default: 0
  },
  sellerEarnings: Number,
  
  // Metadata
  metadata: {
    ipAddress: String,
    userAgent: String,
    source: String // web, mobile, api, etc.
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

// Indexes (orderId already has unique index)
orderSchema.index({ buyer: 1, createdAt: -1 });
orderSchema.index({ seller: 1, createdAt: -1 });
orderSchema.index({ gig: 1 });
orderSchema.index({ status: 1 });
orderSchema.index({ 'dates.dueDate': 1 });
orderSchema.index({ createdAt: -1 });

// Pre-save middleware
orderSchema.pre('save', function(next) {
  this.updatedAt = new Date();
  
  // Generate order ID if not present
  if (!this.orderId) {
    this.orderId = 'ORD-' + Date.now() + '-' + Math.random().toString(36).substr(2, 6).toUpperCase();
  }
  
  // Set due date when order is accepted
  if (this.isModified('status') && this.status === 'accepted' && !this.dates.dueDate) {
    const deliveryDays = this.packageDetails.deliveryTime || 7;
    this.dates.dueDate = new Date(Date.now() + deliveryDays * 24 * 60 * 60 * 1000);
    this.dates.accepted = new Date();
  }
  
  // Set completion date
  if (this.isModified('status') && this.status === 'completed' && !this.dates.completed) {
    this.dates.completed = new Date();
  }
  
  // Calculate seller earnings
  if (this.amount && !this.sellerEarnings) {
    const platformFeeRate = 0.1; // 10% platform fee
    this.platformFee = this.amount.subtotal * platformFeeRate;
    this.sellerEarnings = this.amount.subtotal - this.platformFee;
  }
  
  next();
});

// Virtual for time remaining
orderSchema.virtual('timeRemaining').get(function() {
  if (!this.dates.dueDate || this.status === 'completed') return null;
  
  const now = new Date();
  const timeLeft = this.dates.dueDate.getTime() - now.getTime();
  
  if (timeLeft <= 0) return 'overdue';
  
  const days = Math.floor(timeLeft / (1000 * 60 * 60 * 24));
  const hours = Math.floor((timeLeft % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
  
  if (days > 0) return `${days} day${days > 1 ? 's' : ''} left`;
  return `${hours} hour${hours > 1 ? 's' : ''} left`;
});

// Virtual for progress percentage
orderSchema.virtual('progress').get(function() {
  switch (this.status) {
    case 'pending': return 0;
    case 'accepted': return 20;
    case 'in_progress': return 50;
    case 'delivered': return 80;
    case 'revision_requested': return 60;
    case 'revision_delivered': return 85;
    case 'completed': return 100;
    default: return 0;
  }
});

// Instance methods
orderSchema.methods.canBeCancelled = function(userId) {
  const allowedStatuses = ['pending', 'accepted', 'in_progress'];
  return allowedStatuses.includes(this.status) && 
         (this.buyer.equals(userId) || this.seller.equals(userId));
};

orderSchema.methods.canRequestRevision = function(userId) {
  return this.status === 'delivered' && 
         this.buyer.equals(userId) && 
         this.revisionsUsed < this.packageDetails.revisions;
};

orderSchema.methods.canDeliver = function(userId) {
  const allowedStatuses = ['accepted', 'in_progress', 'revision_requested'];
  return allowedStatuses.includes(this.status) && this.seller.equals(userId);
};

orderSchema.methods.addMessage = function(senderId, content, attachments = []) {
  this.messages.push({
    sender: senderId,
    content,
    attachments,
    timestamp: new Date()
  });
  this.lastMessageAt = new Date();
  return this.save();
};

orderSchema.methods.markMessageAsRead = function(messageId, userId) {
  const message = this.messages.id(messageId);
  if (message && !message.readBy.some(r => r.user.equals(userId))) {
    message.readBy.push({ user: userId });
    return this.save();
  }
  return Promise.resolve(this);
};

orderSchema.methods.acceptOrder = function() {
  this.status = 'accepted';
  this.dates.accepted = new Date();
  const deliveryDays = this.packageDetails.deliveryTime || 7;
  this.dates.dueDate = new Date(Date.now() + deliveryDays * 24 * 60 * 60 * 1000);
  return this.save();
};

orderSchema.methods.deliverOrder = function(deliverables) {
  this.status = 'delivered';
  this.dates.delivered = new Date();
  this.deliverables = this.deliverables.concat(deliverables);
  return this.save();
};

orderSchema.methods.requestRevision = function(reason, details) {
  this.status = 'revision_requested';
  this.revisionsUsed += 1;
  this.revisions.push({
    requestedBy: this.buyer,
    reason,
    details,
    requestedAt: new Date()
  });
  return this.save();
};

orderSchema.methods.completeOrder = function() {
  this.status = 'completed';
  this.dates.completed = new Date();
  return this.save();
};

// Static methods
orderSchema.statics.findByBuyer = function(buyerId) {
  return this.find({ buyer: buyerId })
    .populate('seller', 'username displayName avatar')
    .populate('gig', 'title images')
    .sort({ createdAt: -1 });
};

orderSchema.statics.findBySeller = function(sellerId) {
  return this.find({ seller: sellerId })
    .populate('buyer', 'username displayName avatar')
    .populate('gig', 'title images')
    .sort({ createdAt: -1 });
};

orderSchema.statics.findActiveOrders = function() {
  return this.find({ 
    status: { $in: ['accepted', 'in_progress', 'delivered', 'revision_requested', 'revision_delivered'] }
  });
};

orderSchema.statics.findOverdueOrders = function() {
  return this.find({
    'dates.dueDate': { $lt: new Date() },
    status: { $in: ['accepted', 'in_progress', 'revision_requested'] }
  });
};

const Order = mongoose.model('Order', orderSchema);

export default Order;
