const OpenAI = require('openai');
const { query } = require('../config/database');

/**
 * AI Service for handling OpenAI interactions
 * Provides intelligent creator matching based on user queries
 */
class AIService {
  constructor() {
    console.log('Initializing AI Service...');
    console.log('OpenAI API Key exists:', !!process.env.OPENAI_API_KEY);
    console.log('OpenAI API Key length:', process.env.OPENAI_API_KEY?.length || 0);
    
    // Only initialize OpenAI if API key is available
    if (process.env.OPENAI_API_KEY) {
      try {
        this.openai = new OpenAI({
          apiKey: process.env.OPENAI_API_KEY,
        });
        console.log('OpenAI client initialized successfully');
      } catch (error) {
        console.error('Failed to initialize OpenAI client:', error);
        this.openai = null;
      }
    } else {
      this.openai = null;
      console.warn('OpenAI API key not configured. AI service will use mock responses.');
    }
  }

  /**
   * Get creators from database (using users with seller role and social accounts)
   */
  async getCreatorsFromDatabase() {
    try {
      // Query users who are sellers and have social accounts
      const result = await query(`
        SELECT 
          u.id,
          u.name,
          u.username,
          u.bio,
          u.location,
          u.languages,
          u.skills,
          u.avatar,
          u.verified,
          u.member_since,
          sa.platform,
          sa.username as social_username,
          sa.url as social_url,
          sa.followers_count,
          sa.stats,
          g.id as gig_id,
          g.title as gig_title,
          g.price as gig_price,
          g.rating as gig_rating,
          g.total_reviews as gig_reviews
        FROM users u
        LEFT JOIN social_accounts sa ON u.id = sa.user_id
        LEFT JOIN gigs g ON u.id = g.seller_id AND g.status = 'active'
        WHERE u.role = 'seller' 
        AND u.verified = true
        AND sa.platform IS NOT NULL
        ORDER BY sa.followers_count DESC
        LIMIT 50
      `);

      // If no database results, return mock data
      if (result.rows.length === 0) {
        return this.getMockCreators();
      }

      return result.rows;
    } catch (error) {
      console.error('Database query error:', error);
      // Fallback to mock data
      return this.getMockCreators();
    }
  }

  /**
   * Get mock creators data for development/testing
   */
  getMockCreators() {
    return [
      {
        id: '1',
        name: 'TechGuru Mike',
        username: 'techguruofficial',
        bio: 'Professional tech reviewer with 8+ years experience. Specializing in smartphone reviews, laptop comparisons, and gadget unboxings.',
        location: 'San Francisco, CA',
        languages: ['English', 'Spanish'],
        skills: ['Tech Reviews', 'Product Analysis', 'Video Editing'],
        avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&h=150&fit=crop&crop=face',
        verified: true,
        member_since: '2020',
        platform: 'YouTube',
        social_username: '@techguruofficial',
        social_url: 'https://youtube.com/@techguruofficial',
        followers_count: 250000,
        stats: { engagement_rate: 4.2, avg_views: 125000 },
        gig_id: 'gig-1',
        gig_title: 'I will create professional tech review videos',
        gig_price: 299,
        gig_rating: 4.9,
        gig_reviews: 127
      },
      {
        id: '2',
        name: 'FitLifeAna',
        username: 'fitlifeana',
        bio: 'Fitness and wellness content creator. Certified personal trainer helping people achieve their health goals through sustainable lifestyle changes.',
        location: 'Toronto, Canada',
        languages: ['English', 'French'],
        skills: ['Fitness Training', 'Nutrition', 'Wellness'],
        avatar: 'https://images.unsplash.com/photo-1494790108755-2616b612b786?w=150&h=150&fit=crop&crop=face',
        verified: true,
        member_since: '2021',
        platform: 'Instagram',
        social_username: '@fitlifeana',
        social_url: 'https://instagram.com/fitlifeana',
        followers_count: 180000,
        stats: { engagement_rate: 5.8, avg_likes: 8500 },
        gig_id: 'gig-2',
        gig_title: 'I will create fitness and wellness content',
        gig_price: 199,
        gig_rating: 4.8,
        gig_reviews: 89
      },
      {
        id: '3',
        name: 'CricketPro Raj',
        username: 'cricketpro_raj',
        bio: 'Cricket enthusiast and sports content creator. Covering cricket matches, player interviews, and sports equipment reviews.',
        location: 'Mumbai, India',
        languages: ['English', 'Hindi', 'Marathi'],
        skills: ['Sports Content', 'Cricket Analysis', 'Equipment Reviews'],
        avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&h=150&fit=crop&crop=face',
        verified: true,
        member_since: '2019',
        platform: 'YouTube',
        social_username: '@cricketpro_raj',
        social_url: 'https://youtube.com/@cricketpro_raj',
        followers_count: 320000,
        stats: { engagement_rate: 6.1, avg_views: 180000 },
        gig_id: 'gig-3',
        gig_title: 'I will create cricket content and equipment reviews',
        gig_price: 249,
        gig_rating: 4.9,
        gig_reviews: 156
      },
      {
        id: '4',
        name: 'SriLankaSports',
        username: 'srilankasports',
        bio: 'Dedicated to promoting sports culture in Sri Lanka. Covering cricket, football, and local sports events.',
        location: 'Colombo, Sri Lanka',
        languages: ['English', 'Sinhala', 'Tamil'],
        skills: ['Sports Coverage', 'Local Events', 'Community Building'],
        avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&h=150&fit=crop&crop=face',
        verified: true,
        member_since: '2022',
        platform: 'Instagram',
        social_username: '@srilankasports',
        social_url: 'https://instagram.com/srilankasports',
        followers_count: 95000,
        stats: { engagement_rate: 7.2, avg_likes: 6800 },
        gig_id: 'gig-4',
        gig_title: 'I will create sports content for Sri Lankan audience',
        gig_price: 179,
        gig_rating: 4.7,
        gig_reviews: 67
      },
      {
        id: '5',
        name: 'YoungAthletes SL',
        username: 'youngathletes_sl',
        bio: 'Focusing on youth sports development in Sri Lanka. Promoting cricket, athletics, and fitness for young people.',
        location: 'Kandy, Sri Lanka',
        languages: ['English', 'Sinhala'],
        skills: ['Youth Sports', 'Cricket Coaching', 'Fitness Training'],
        avatar: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=150&h=150&fit=crop&crop=face',
        verified: true,
        member_since: '2023',
        platform: 'TikTok',
        social_username: '@youngathletes_sl',
        social_url: 'https://tiktok.com/@youngathletes_sl',
        followers_count: 125000,
        stats: { engagement_rate: 8.5, avg_views: 45000 },
        gig_id: 'gig-5',
        gig_title: 'I will create youth sports and fitness content',
        gig_price: 149,
        gig_rating: 4.6,
        gig_reviews: 43
      },
      {
        id: '6',
        name: 'CricketGear Expert',
        username: 'cricketgear_expert',
        bio: 'Specialist in cricket equipment reviews and recommendations. Helping players choose the right gear for their game.',
        location: 'Delhi, India',
        languages: ['English', 'Hindi'],
        skills: ['Equipment Reviews', 'Cricket Gear', 'Product Testing'],
        avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&h=150&fit=crop&crop=face',
        verified: true,
        member_since: '2021',
        platform: 'YouTube',
        social_username: '@cricketgear_expert',
        social_url: 'https://youtube.com/@cricketgear_expert',
        followers_count: 89000,
        stats: { engagement_rate: 5.9, avg_views: 75000 },
        gig_id: 'gig-6',
        gig_title: 'I will create cricket equipment review videos',
        gig_price: 199,
        gig_rating: 4.8,
        gig_reviews: 78
      }
    ];
  }

  /**
   * Generate AI response for creator matching
   */
  async generateCreatorRecommendations(userQuery, creators) {
    try {
      // If OpenAI is not configured, return mock response
      if (!this.openai) {
        return this.generateMockRecommendations(userQuery, creators);
      }

      const prompt = this.buildPrompt(userQuery, creators);
      
      const completion = await this.openai.chat.completions.create({
        model: "gpt-4o",
        messages: [
          {
            role: "system",
            content: "You are an expert marketing consultant specializing in influencer marketing and creator partnerships. Your job is to analyze user requests and recommend the most suitable content creators based on their specific needs, target audience, and campaign goals."
          },
          {
            role: "user",
            content: prompt
          }
        ],
        max_tokens: 1000,
        temperature: 0.7,
      });

      return completion.choices[0].message.content;
    } catch (error) {
      console.error('OpenAI API error:', error);
      // Fallback to mock response if OpenAI fails
      return this.generateMockRecommendations(userQuery, creators);
    }
  }

  /**
   * Generate mock recommendations when OpenAI is not available
   */
  generateMockRecommendations(userQuery, creators) {
    const query = userQuery.toLowerCase();
    
    // Simple keyword matching for mock responses
    let relevantCreators = creators;
    
    if (query.includes('cricket') || query.includes('sports')) {
      relevantCreators = creators.filter(c => 
        c.skills?.some(skill => skill.toLowerCase().includes('cricket') || skill.toLowerCase().includes('sports')) ||
        c.bio?.toLowerCase().includes('cricket') ||
        c.bio?.toLowerCase().includes('sports')
      );
    } else if (query.includes('tech') || query.includes('technology')) {
      relevantCreators = creators.filter(c => 
        c.skills?.some(skill => skill.toLowerCase().includes('tech')) ||
        c.bio?.toLowerCase().includes('tech')
      );
    } else if (query.includes('fitness') || query.includes('health')) {
      relevantCreators = creators.filter(c => 
        c.skills?.some(skill => skill.toLowerCase().includes('fitness') || skill.toLowerCase().includes('health')) ||
        c.bio?.toLowerCase().includes('fitness')
      );
    }

    // Take top 3 creators
    const topCreators = relevantCreators.slice(0, 3);
    
    let recommendations = "## Campaign Analysis\n\n";
    recommendations += `Based on your query "${userQuery}", I've analyzed our creator database and found the perfect matches for your campaign. Here's what makes these creators ideal for your needs:\n\n`;
    
    recommendations += "**Key Selection Criteria:**\n";
    if (query.includes('cricket') || query.includes('sports')) {
      recommendations += "- Cricket and sports content expertise\n";
      recommendations += "- Strong engagement with sports audience\n";
      recommendations += "- Experience with equipment and product reviews\n";
    } else if (query.includes('tech') || query.includes('technology')) {
      recommendations += "- Technology review and analysis expertise\n";
      recommendations += "- High-quality video production skills\n";
      recommendations += "- Engaged tech-savvy audience\n";
    } else if (query.includes('fitness') || query.includes('health')) {
      recommendations += "- Fitness and wellness content focus\n";
      recommendations += "- Certified training credentials\n";
      recommendations += "- Health-conscious audience engagement\n";
    } else {
      recommendations += "- Relevant content niche alignment\n";
      recommendations += "- Strong audience engagement metrics\n";
      recommendations += "- Professional content quality\n";
    }
    
    recommendations += "\n**Why These Creators Are Perfect:**\n";
    topCreators.forEach((creator, index) => {
      recommendations += `- **${creator.name}**: ${creator.bio.substring(0, 100)}...\n`;
    });

    return recommendations;
  }

  /**
   * Build the prompt for OpenAI
   */
  buildPrompt(userQuery, creators) {
    const creatorsInfo = creators.map(creator => {
      const stats = creator.stats || {};
      return `
Creator: ${creator.name} (@${creator.social_username})
Platform: ${creator.platform}
Followers: ${creator.followers_count?.toLocaleString() || 'N/A'}
Location: ${creator.location}
Languages: ${creator.languages?.join(', ') || 'English'}
Skills: ${creator.skills?.join(', ') || 'Content Creation'}
Bio: ${creator.bio}
Engagement Rate: ${stats.engagement_rate || 'N/A'}%
      `.trim();
    }).join('\n\n');

    return `
User Request: "${userQuery}"

Available Creators:
${creatorsInfo}

Please analyze the user's request and provide a comprehensive campaign analysis. Focus on:

1. Campaign strategy insights
2. Target audience analysis
3. Content approach recommendations
4. Why the selected creators are perfect matches

Format your response as:
## Campaign Analysis

**Campaign Overview:**
[Brief analysis of the campaign requirements and target audience]

**Key Selection Criteria:**
- [Criterion 1 based on user query]
- [Criterion 2 based on user query]
- [Criterion 3 based on user query]

**Why These Creators Are Perfect:**
- **Creator Name**: [Brief explanation of why they match the campaign needs]
- **Creator Name**: [Brief explanation of why they match the campaign needs]
- **Creator Name**: [Brief explanation of why they match the campaign needs]

**Campaign Strategy Recommendations:**
- [Strategy recommendation 1]
- [Strategy recommendation 2]
- [Strategy recommendation 3]

Focus on providing strategic insights rather than just listing creators, since the creators are already selected and displayed separately.
    `;
  }

  /**
   * Process user query and return AI recommendations
   */
  async processUserQuery(userQuery) {
    try {
      // Get creators from database
      const creators = await this.getCreatorsFromDatabase();
      
      // Generate AI recommendations
      const recommendations = await this.generateCreatorRecommendations(userQuery, creators);
      
      // Get top 3 recommended creators with their details
      const topCreators = this.getTopCreatorsForQuery(userQuery, creators);
      
      return {
        success: true,
        query: userQuery,
        recommendations,
        creatorsAnalyzed: creators.length,
        recommendedCreators: topCreators
      };
    } catch (error) {
      console.error('AI processing error:', error);
      throw error;
    }
  }

  /**
   * Get top creators for a specific query
   */
  getTopCreatorsForQuery(userQuery, creators) {
    const query = userQuery.toLowerCase();
    
    // Simple keyword matching for mock responses
    let relevantCreators = creators;
    
    if (query.includes('cricket') || query.includes('sports')) {
      relevantCreators = creators.filter(c => 
        c.skills?.some(skill => skill.toLowerCase().includes('cricket') || skill.toLowerCase().includes('sports')) ||
        c.bio?.toLowerCase().includes('cricket') ||
        c.bio?.toLowerCase().includes('sports')
      );
    } else if (query.includes('tech') || query.includes('technology')) {
      relevantCreators = creators.filter(c => 
        c.skills?.some(skill => skill.toLowerCase().includes('tech')) ||
        c.bio?.toLowerCase().includes('tech')
      );
    } else if (query.includes('fitness') || query.includes('health')) {
      relevantCreators = creators.filter(c => 
        c.skills?.some(skill => skill.toLowerCase().includes('fitness') || skill.toLowerCase().includes('health')) ||
        c.bio?.toLowerCase().includes('fitness')
      );
    }

    // Take top 3 creators and format their data
    return relevantCreators.slice(0, 3).map(creator => ({
      id: creator.id,
      name: creator.name,
      username: creator.username,
      avatar: creator.avatar,
      verified: creator.verified,
      platform: creator.platform,
      social_username: creator.social_username,
      social_url: creator.social_url,
      followers_count: creator.followers_count,
      location: creator.location,
      bio: creator.bio,
      skills: creator.skills,
      member_since: creator.member_since,
      gig: {
        id: creator.gig_id,
        title: creator.gig_title,
        price: creator.gig_price,
        rating: creator.gig_rating,
        reviews: creator.gig_reviews
      },
      stats: creator.stats
    }));
  }
}

module.exports = new AIService(); 