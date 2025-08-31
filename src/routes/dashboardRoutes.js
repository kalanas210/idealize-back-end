import express from 'express';
import { authenticateToken, requireSeller } from '../middleware/auth.js';
import { User, Gig, Order, Review } from '../models/index.js';
import { asyncHandler } from '../middleware/errorHandler.js';

const router = express.Router();

// Apply authentication to all routes
router.use(authenticateToken);

// Buyer dashboard
router.get('/buyer', asyncHandler(async (req, res) => {
  const buyerId = req.user._id;

  const [orders, reviews, stats] = await Promise.all([
    Order.findByBuyer(buyerId).limit(5),
    Review.find({ buyer: buyerId }).populate('gig', 'title').limit(5),
    Order.aggregate([
      { $match: { buyer: buyerId } },
      {
        $group: {
          _id: null,
          totalOrders: { $sum: 1 },
          totalSpent: { $sum: '$amount.total' },
          activeOrders: {
            $sum: {
              $cond: [
                { $in: ['$status', ['accepted', 'in_progress', 'delivered']] },
                1,
                0
              ]
            }
          }
        }
      }
    ])
  ]);

  const dashboardStats = stats[0] || {
    totalOrders: 0,
    totalSpent: 0,
    activeOrders: 0
  };

  res.json({
    success: true,
    data: {
      stats: dashboardStats,
      recentOrders: orders,
      recentReviews: reviews
    }
  });
}));

// Seller dashboard
router.get('/seller', requireSeller, asyncHandler(async (req, res) => {
  const sellerId = req.user._id;

  const [gigs, orders, reviews, earnings] = await Promise.all([
    Gig.find({ seller: sellerId }).limit(5),
    Order.findBySeller(sellerId).limit(5),
    Review.findForSeller(sellerId, { limit: 5 }),
    Order.aggregate([
      { $match: { seller: sellerId, status: 'completed' } },
      {
        $group: {
          _id: null,
          totalEarnings: { $sum: '$sellerEarnings' },
          totalOrders: { $sum: 1 }
        }
      }
    ])
  ]);

  const earningsStats = earnings[0] || {
    totalEarnings: 0,
    totalOrders: 0
  };

  const [activeOrders, gigStats] = await Promise.all([
    Order.countDocuments({
      seller: sellerId,
      status: { $in: ['accepted', 'in_progress', 'delivered'] }
    }),
    Gig.aggregate([
      { $match: { seller: sellerId } },
      {
        $group: {
          _id: null,
          totalGigs: { $sum: 1 },
          activeGigs: {
            $sum: { $cond: [{ $eq: ['$status', 'active'] }, 1, 0] }
          },
          totalViews: { $sum: '$stats.views' },
          totalOrders: { $sum: '$stats.orders' }
        }
      }
    ])
  ]);

  const gigStatsData = gigStats[0] || {
    totalGigs: 0,
    activeGigs: 0,
    totalViews: 0,
    totalOrders: 0
  };

  res.json({
    success: true,
    data: {
      stats: {
        ...earningsStats,
        ...gigStatsData,
        activeOrders
      },
      recentGigs: gigs,
      recentOrders: orders,
      recentReviews: reviews
    }
  });
}));

export default router;
