const express = require('express');
const router = express.Router();

// Sample data for How it Works - in production, this would come from a database
const howItWorksData = {
  buyerSteps: [
    {
      step: 1,
      title: 'Discover Perfect Creators',
      description: 'Find creators who match your brand, audience, and campaign goals using our advanced search and AI recommendations.',
      details: [
        'Search by platform, niche, audience demographics, and engagement rates',
        'Use AI-powered recommendations based on your brand profile',
        'Filter by location, language, and content style',
        'Browse verified creator portfolios and past work',
        'Read authentic reviews from other brands'
      ],
      tips: [
        'Use specific keywords related to your industry for better matches',
        'Check creator engagement rates, not just follower counts',
        'Look for creators whose audience aligns with your target market'
      ],
      demoVideo: '/videos/discover-creators-demo.mp4',
      icon: 'Search'
    },
    {
      step: 2,
      title: 'Connect & Collaborate',
      description: 'Chat directly with creators, share your vision, and plan the perfect collaboration with no middlemen.',
      details: [
        'Direct messaging with instant notifications',
        'Share brand guidelines, assets, and campaign briefs',
        'Schedule video calls for detailed discussions',
        'Negotiate terms and deliverables transparently',
        'Get creative input and content strategy advice'
      ],
      tips: [
        'Be clear about your expectations and deliverables',
        'Share your brand voice and style guidelines early',
        'Ask for creator input - they know their audience best'
      ],
      demoVideo: '/videos/messaging-demo.mp4',
      icon: 'MessageSquare'
    },
    {
      step: 3,
      title: 'Secure Payment & Protection',
      description: 'Pay with confidence using our escrow system. Your money is protected until you approve the final content.',
      details: [
        'Secure escrow payment system protects both parties',
        'Multiple payment options (credit card, PayPal, bank transfer)',
        'Milestone-based payments for larger projects',
        'Automatic dispute resolution system',
        'Full refund protection for unsatisfactory work'
      ],
      tips: [
        'Set clear milestones for larger campaigns',
        'Review content thoroughly before final approval',
        'Use our dispute resolution if issues arise'
      ],
      demoVideo: '/videos/payment-demo.mp4',
      icon: 'CreditCard'
    },
    {
      step: 4,
      title: 'Launch & Measure Success',
      description: 'Get your content, track performance, and build lasting relationships with top creators.',
      details: [
        'Receive high-quality content on schedule',
        'Track campaign performance with detailed analytics',
        'Download usage rights and content files',
        'Leave reviews to help the creator community',
        'Build long-term partnerships with successful creators'
      ],
      tips: [
        'Monitor performance metrics closely in the first 48 hours',
        'Engage with creator posts to boost reach',
        'Leave detailed reviews to help other brands'
      ],
      demoVideo: '/videos/success-demo.mp4',
      icon: 'Star'
    }
  ],
  sellerSteps: [
    {
      step: 1,
      title: 'Create Your Creator Profile',
      description: 'Build a compelling profile that showcases your unique style, audience, and the value you bring to brands.',
      details: [
        'Upload high-quality portfolio samples',
        'Connect and verify your social media accounts',
        'Add detailed audience demographics and insights',
        'Set your rates and service packages',
        'Complete identity verification for trust'
      ],
      tips: [
        'Use professional photos and well-written descriptions',
        'Showcase your best work and diverse content styles',
        'Keep your rates competitive but fair to your value'
      ],
      demoVideo: '/videos/profile-creation-demo.mp4',
      icon: 'Users'
    },
    {
      step: 2,
      title: 'Get Discovered by Brands',
      description: 'Optimize your profile for discoverability and start receiving collaboration requests from relevant brands.',
      details: [
        'Appear in search results based on your niche and skills',
        'Receive AI-matched collaboration opportunities',
        'Get featured in platform recommendations',
        'Apply to open brand campaigns and briefs',
        'Build your reputation through successful collaborations'
      ],
      tips: [
        'Use relevant keywords in your bio and skills',
        'Stay active and update your portfolio regularly',
        'Respond quickly to brand inquiries'
      ],
      demoVideo: '/videos/discovery-demo.mp4',
      icon: 'Target'
    },
    {
      step: 3,
      title: 'Create Amazing Content',
      description: 'Collaborate with brands to create authentic content that resonates with your audience and drives results.',
      details: [
        'Work directly with brands on content strategy',
        'Use provided brand assets and guidelines',
        'Create authentic content that fits your style',
        'Get feedback and revisions before final delivery',
        'Deliver content through our secure platform'
      ],
      tips: [
        'Stay true to your authentic voice and style',
        'Communicate proactively about progress and challenges',
        'Exceed expectations to build long-term relationships'
      ],
      demoVideo: '/videos/content-creation-demo.mp4',
      icon: 'Edit'
    },
    {
      step: 4,
      title: 'Get Paid & Grow',
      description: 'Receive secure payments, build your reputation, and scale your creator business with premium opportunities.',
      details: [
        'Automatic payments released upon content approval',
        'Fast payouts to your preferred payment method',
        'Build 5-star ratings and testimonials',
        'Access to premium brand partnerships',
        'Exclusive opportunities and higher-paying campaigns'
      ],
      tips: [
        'Deliver on time to maintain high ratings',
        'Ask satisfied clients for detailed testimonials',
        'Continuously improve your skills and content quality'
      ],
      demoVideo: '/videos/payment-growth-demo.mp4',
      icon: 'DollarSign'
    }
  ],
  platformFeatures: [
    {
      title: 'Secure & Protected',
      description: 'Advanced security measures protect your data, payments, and intellectual property.',
      features: ['SSL encryption', 'PCI compliance', 'GDPR compliant', 'Fraud protection'],
      icon: 'Shield'
    },
    {
      title: 'Lightning Fast',
      description: 'Find creators, negotiate deals, and launch campaigns faster than traditional agencies.',
      features: ['Instant messaging', 'Quick search filters', 'Rapid onboarding', 'Real-time notifications'],
      icon: 'Zap'
    },
    {
      title: 'Quality Guaranteed',
      description: 'All creators are verified and vetted to ensure you work with genuine, high-quality influencers.',
      features: ['Identity verification', 'Portfolio validation', 'Performance tracking', 'Review system'],
      icon: 'Award'
    },
    {
      title: 'Global Reach',
      description: 'Connect with creators worldwide across all major platforms and in 50+ languages.',
      features: ['200+ countries', '50+ languages', 'All platforms', 'Local expertise'],
      icon: 'Globe'
    }
  ],
  successStats: [
    { number: '50K+', label: 'Active Creators', icon: 'Users' },
    { number: '10K+', label: 'Successful Campaigns', icon: 'TrendingUp' },
    { number: '98%', label: 'Client Satisfaction', icon: 'ThumbsUp' },
    { number: '24/7', label: 'Support Available', icon: 'Clock' }
  ]
};

const faqsData = [
  {
    id: 1,
    question: 'How much does it cost to use Socyads?',
    answer: 'Socyads is free to join and browse. We only charge a small service fee (5-10%) when a successful collaboration is completed. This fee covers payment processing, platform maintenance, and customer support.',
    category: 'pricing',
    tags: ['pricing', 'fees', 'cost'],
    helpful_count: 245,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  },
  {
    id: 2,
    question: 'How do I know if a creator is legitimate?',
    answer: 'All creators go through our verification process which includes identity verification, social media account verification, and portfolio validation. Look for the verified badge and check their reviews from previous collaborations.',
    category: 'safety',
    tags: ['verification', 'safety', 'trust'],
    helpful_count: 189,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  },
  {
    id: 3,
    question: 'What happens if I\'m not satisfied with the content?',
    answer: 'We offer multiple rounds of revisions as agreed upon with the creator. If you\'re still not satisfied, our dispute resolution team will mediate. In extreme cases, we offer full refund protection through our escrow system.',
    category: 'quality',
    tags: ['quality', 'revisions', 'disputes', 'refunds'],
    helpful_count: 156,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  },
  {
    id: 4,
    question: 'How long does it typically take to complete a collaboration?',
    answer: 'Timeline varies by project complexity. Simple posts can be completed in 2-5 days, while comprehensive campaigns may take 1-4 weeks. You can discuss and agree on timelines directly with creators.',
    category: 'timing',
    tags: ['timeline', 'delivery', 'scheduling'],
    helpful_count: 134,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  },
  {
    id: 5,
    question: 'Can I work with the same creator multiple times?',
    answer: 'Absolutely! Many brands build long-term relationships with creators. You can bookmark favorite creators, invite them to new campaigns, and even set up retainer agreements for ongoing collaborations.',
    category: 'relationships',
    tags: ['long-term', 'relationships', 'retainers'],
    helpful_count: 98,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  },
  {
    id: 6,
    question: 'What rights do I get to the content created?',
    answer: 'Usage rights are negotiated with each creator and clearly specified in the collaboration agreement. This can range from social media usage only to full commercial rights including advertising and promotional use.',
    category: 'legal',
    tags: ['rights', 'legal', 'usage', 'content'],
    helpful_count: 167,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  },
  {
    id: 7,
    question: 'How do I track the performance of my campaigns?',
    answer: 'Our analytics dashboard provides detailed performance metrics including reach, engagement, clicks, and conversions. Creators can also share native platform insights for deeper analysis.',
    category: 'analytics',
    tags: ['analytics', 'performance', 'tracking', 'metrics'],
    helpful_count: 145,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  },
  {
    id: 8,
    question: 'Can I cancel a collaboration after it\'s started?',
    answer: 'Cancellation policies are set by individual creators and outlined before you start. Generally, you can cancel with minimal fees if work hasn\'t begun, but may incur charges for work already completed.',
    category: 'policies',
    tags: ['cancellation', 'policies', 'fees'],
    helpful_count: 89,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  },
  {
    id: 9,
    question: 'Do you offer customer support?',
    answer: 'Yes! We provide 24/7 customer support through live chat, email, and phone. Our support team can help with technical issues, disputes, payment problems, and general questions about using the platform.',
    category: 'support',
    tags: ['support', 'help', 'contact'],
    helpful_count: 234,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  },
  {
    id: 10,
    question: 'What platforms do you support?',
    answer: 'We support all major social media platforms including Instagram, YouTube, TikTok, Twitter, Facebook, LinkedIn, Twitch, Pinterest, and Snapchat. Creators can showcase work from any platform.',
    category: 'platforms',
    tags: ['platforms', 'social media', 'channels'],
    helpful_count: 178,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  }
];

// GET /api/how-it-works - Get all how it works data
router.get('/', (req, res) => {
  try {
    res.json({
      success: true,
      data: howItWorksData,
      message: 'How it works data retrieved successfully'
    });
  } catch (error) {
    console.error('Error fetching how it works data:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch how it works data',
      error: error.message
    });
  }
});

// GET /api/how-it-works/steps/:type - Get steps for specific user type (buyers/sellers)
router.get('/steps/:type', (req, res) => {
  try {
    const { type } = req.params;
    
    if (!['buyers', 'sellers'].includes(type)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid user type. Must be "buyers" or "sellers"'
      });
    }

    const steps = type === 'buyers' ? howItWorksData.buyerSteps : howItWorksData.sellerSteps;
    
    res.json({
      success: true,
      data: steps,
      message: `Steps for ${type} retrieved successfully`
    });
  } catch (error) {
    console.error('Error fetching steps:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch steps',
      error: error.message
    });
  }
});

// GET /api/how-it-works/features - Get platform features
router.get('/features', (req, res) => {
  try {
    res.json({
      success: true,
      data: howItWorksData.platformFeatures,
      message: 'Platform features retrieved successfully'
    });
  } catch (error) {
    console.error('Error fetching features:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch features',
      error: error.message
    });
  }
});

// GET /api/how-it-works/stats - Get success statistics
router.get('/stats', (req, res) => {
  try {
    res.json({
      success: true,
      data: howItWorksData.successStats,
      message: 'Success stats retrieved successfully'
    });
  } catch (error) {
    console.error('Error fetching stats:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch stats',
      error: error.message
    });
  }
});

// GET /api/how-it-works/faqs - Get frequently asked questions
router.get('/faqs', (req, res) => {
  try {
    const { category, search, limit = 10, page = 1 } = req.query;
    
    let filteredFAQs = [...faqsData];
    
    // Filter by category if provided
    if (category && category !== 'all') {
      filteredFAQs = filteredFAQs.filter(faq => faq.category === category);
    }
    
    // Search in questions and answers if search query provided
    if (search) {
      const searchLower = search.toLowerCase();
      filteredFAQs = filteredFAQs.filter(faq => 
        faq.question.toLowerCase().includes(searchLower) ||
        faq.answer.toLowerCase().includes(searchLower) ||
        faq.tags.some(tag => tag.toLowerCase().includes(searchLower))
      );
    }
    
    // Sort by helpful count (most helpful first)
    filteredFAQs.sort((a, b) => b.helpful_count - a.helpful_count);
    
    // Pagination
    const startIndex = (page - 1) * limit;
    const endIndex = startIndex + parseInt(limit);
    const paginatedFAQs = filteredFAQs.slice(startIndex, endIndex);
    
    // Get available categories
    const categories = [...new Set(faqsData.map(faq => faq.category))];
    
    res.json({
      success: true,
      data: {
        faqs: paginatedFAQs,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total: filteredFAQs.length,
          totalPages: Math.ceil(filteredFAQs.length / limit)
        },
        categories,
        filters: {
          category: category || 'all',
          search: search || ''
        }
      },
      message: 'FAQs retrieved successfully'
    });
  } catch (error) {
    console.error('Error fetching FAQs:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch FAQs',
      error: error.message
    });
  }
});

// GET /api/how-it-works/faqs/:id - Get specific FAQ
router.get('/faqs/:id', (req, res) => {
  try {
    const { id } = req.params;
    const faq = faqsData.find(f => f.id === parseInt(id));
    
    if (!faq) {
      return res.status(404).json({
        success: false,
        message: 'FAQ not found'
      });
    }
    
    res.json({
      success: true,
      data: faq,
      message: 'FAQ retrieved successfully'
    });
  } catch (error) {
    console.error('Error fetching FAQ:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch FAQ',
      error: error.message
    });
  }
});

// POST /api/how-it-works/faqs/:id/helpful - Mark FAQ as helpful
router.post('/faqs/:id/helpful', (req, res) => {
  try {
    const { id } = req.params;
    const faq = faqsData.find(f => f.id === parseInt(id));
    
    if (!faq) {
      return res.status(404).json({
        success: false,
        message: 'FAQ not found'
      });
    }
    
    // In a real app, you'd check if user already marked as helpful
    faq.helpful_count += 1;
    
    res.json({
      success: true,
      data: { helpful_count: faq.helpful_count },
      message: 'FAQ marked as helpful'
    });
  } catch (error) {
    console.error('Error marking FAQ as helpful:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to mark FAQ as helpful',
      error: error.message
    });
  }
});

// GET /api/how-it-works/demo-videos - Get available demo videos
router.get('/demo-videos', (req, res) => {
  try {
    const demoVideos = [
      {
        id: 'discover-creators',
        title: 'How to Discover Perfect Creators',
        description: 'Learn how to use our advanced search and AI recommendations to find creators that match your brand.',
        duration: '2:30',
        thumbnail: '/images/demo-thumbnails/discover-creators.jpg',
        videoUrl: '/videos/discover-creators-demo.mp4',
        category: 'buyers'
      },
      {
        id: 'messaging',
        title: 'Communicating with Creators',
        description: 'See how our messaging system helps you collaborate effectively with creators.',
        duration: '1:45',
        thumbnail: '/images/demo-thumbnails/messaging.jpg',
        videoUrl: '/videos/messaging-demo.mp4',
        category: 'buyers'
      },
      {
        id: 'payment',
        title: 'Secure Payment Process',
        description: 'Understand how our escrow system protects your payments and ensures quality.',
        duration: '2:15',
        thumbnail: '/images/demo-thumbnails/payment.jpg',
        videoUrl: '/videos/payment-demo.mp4',
        category: 'buyers'
      },
      {
        id: 'success-tracking',
        title: 'Tracking Campaign Success',
        description: 'Learn how to measure and optimize your influencer marketing campaigns.',
        duration: '3:00',
        thumbnail: '/images/demo-thumbnails/success.jpg',
        videoUrl: '/videos/success-demo.mp4',
        category: 'buyers'
      },
      {
        id: 'profile-creation',
        title: 'Creating Your Creator Profile',
        description: 'Step-by-step guide to building a compelling creator profile that attracts brands.',
        duration: '2:45',
        thumbnail: '/images/demo-thumbnails/profile-creation.jpg',
        videoUrl: '/videos/profile-creation-demo.mp4',
        category: 'sellers'
      },
      {
        id: 'discovery',
        title: 'Getting Discovered by Brands',
        description: 'Tips and strategies to optimize your profile for maximum visibility.',
        duration: '2:20',
        thumbnail: '/images/demo-thumbnails/discovery.jpg',
        videoUrl: '/videos/discovery-demo.mp4',
        category: 'sellers'
      },
      {
        id: 'content-creation',
        title: 'Creating Amazing Content',
        description: 'Best practices for collaborating with brands and creating authentic content.',
        duration: '3:30',
        thumbnail: '/images/demo-thumbnails/content-creation.jpg',
        videoUrl: '/videos/content-creation-demo.mp4',
        category: 'sellers'
      },
      {
        id: 'payment-growth',
        title: 'Getting Paid and Growing',
        description: 'How to build your reputation and scale your creator business.',
        duration: '2:10',
        thumbnail: '/images/demo-thumbnails/payment-growth.jpg',
        videoUrl: '/videos/payment-growth-demo.mp4',
        category: 'sellers'
      }
    ];
    
    const { category } = req.query;
    
    let filteredVideos = demoVideos;
    if (category && ['buyers', 'sellers'].includes(category)) {
      filteredVideos = demoVideos.filter(video => video.category === category);
    }
    
    res.json({
      success: true,
      data: filteredVideos,
      message: 'Demo videos retrieved successfully'
    });
  } catch (error) {
    console.error('Error fetching demo videos:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch demo videos',
      error: error.message
    });
  }
});

// POST /api/how-it-works/feedback - Submit feedback about How it Works page
router.post('/feedback', (req, res) => {
  try {
    const { 
      rating, 
      feedback, 
      section, 
      userType, 
      suggestions,
      email 
    } = req.body;
    
    // Validate required fields
    if (!rating || !feedback) {
      return res.status(400).json({
        success: false,
        message: 'Rating and feedback are required'
      });
    }
    
    if (rating < 1 || rating > 5) {
      return res.status(400).json({
        success: false,
        message: 'Rating must be between 1 and 5'
      });
    }
    
    // In a real app, you'd save this to a database
    const feedbackEntry = {
      id: Date.now(),
      rating,
      feedback,
      section: section || 'general',
      userType: userType || 'unknown',
      suggestions: suggestions || '',
      email: email || '',
      timestamp: new Date().toISOString(),
      helpful: 0,
      status: 'new'
    };
    
    console.log('New How it Works feedback:', feedbackEntry);
    
    res.json({
      success: true,
      data: { id: feedbackEntry.id },
      message: 'Feedback submitted successfully. Thank you for helping us improve!'
    });
  } catch (error) {
    console.error('Error submitting feedback:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to submit feedback',
      error: error.message
    });
  }
});

module.exports = router;
