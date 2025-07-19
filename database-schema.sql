-- SocyAds Database Schema
-- PostgreSQL Database Schema for Social Media Advertising Platform
-- This is a preliminary schema for the database team to implement

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Users table for authentication and basic profile
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    username VARCHAR(100) UNIQUE NOT NULL,
    password_hash VARCHAR(255), -- Made nullable for social login users
    role VARCHAR(20) NOT NULL DEFAULT 'buyer' CHECK (role IN ('buyer', 'seller', 'admin')),
    verified BOOLEAN DEFAULT FALSE,
    avatar TEXT,
    bio TEXT,
    location VARCHAR(255),
    timezone VARCHAR(50),
    languages TEXT[], -- Array of languages spocdken
    skills TEXT[], -- Array of skills
    member_since VARCHAR(4),
    response_time VARCHAR(50),
    phone VARCHAR(20),
    country VARCHAR(100),
    last_seen TIMESTAMP,
    email_verified_at TIMESTAMP,
    phone_verified_at TIMESTAMP,
    -- Social login fields
    google_id VARCHAR(255) UNIQUE, -- Google OAuth ID
    facebook_id VARCHAR(255) UNIQUE, -- Facebook OAuth ID (for future use)
    twitter_id VARCHAR(255) UNIQUE, -- Twitter OAuth ID (for future use)
    github_id VARCHAR(255) UNIQUE, -- GitHub OAuth ID (for future use)
    auth_provider VARCHAR(50) DEFAULT 'local' CHECK (auth_provider IN ('local', 'google', 'facebook', 'twitter', 'github')), -- Primary auth method
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    deleted_at TIMESTAMP
);

-- Social media accounts linked to users
CREATE TABLE social_accounts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    platform VARCHAR(50) NOT NULL, -- youtube, instagram, tiktok, etc.
    username VARCHAR(255) NOT NULL,
    url TEXT,
    verified BOOLEAN DEFAULT FALSE,
    followers_count INTEGER DEFAULT 0,
    stats JSONB, -- Platform-specific statistics
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Categories for gigs
CREATE TABLE categories (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(100) UNIQUE NOT NULL,
    slug VARCHAR(100) UNIQUE NOT NULL,
    description TEXT,
    icon VARCHAR(255),
    parent_id UUID REFERENCES categories(id),
    sort_order INTEGER DEFAULT 0,
    active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT NOW()
);

-- Package tiers for reference
CREATE TYPE package_tier AS ENUM ('basic', 'standard', 'premium');

-- Gig packages configuration
CREATE TABLE gig_packages (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    gig_id UUID REFERENCES gigs(id) ON DELETE CASCADE,
    tier package_tier NOT NULL,
    title VARCHAR(100) NOT NULL,
    description TEXT NOT NULL,
    price DECIMAL(10,2) NOT NULL CHECK (price >= 5),
    delivery_time INTEGER NOT NULL CHECK (delivery_time >= 1 AND delivery_time <= 30),
    revisions INTEGER NOT NULL DEFAULT 1 CHECK (revisions >= 0),
    features TEXT[] NOT NULL, -- Array of included features
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    UNIQUE(gig_id, tier) -- One package per tier per gig
);

-- Gigs/Services offered by sellers
CREATE TABLE gigs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    seller_id UUID REFERENCES users(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    slug VARCHAR(255) UNIQUE,
    description TEXT NOT NULL,
    category_id UUID REFERENCES categories(id),
    platform VARCHAR(50) NOT NULL, -- youtube, instagram, etc.
    tags TEXT[], -- Array of tags
    images TEXT[], -- Array of image URLs
    video_url TEXT,
    requirements TEXT[], -- What seller needs from buyer
    faq JSONB, -- Frequently asked questions
    extras JSONB, -- Additional services
    rating DECIMAL(3,2) DEFAULT 0 CHECK (rating >= 0 AND rating <= 5),
    total_reviews INTEGER DEFAULT 0,
    completed_orders INTEGER DEFAULT 0,
    in_queue INTEGER DEFAULT 0,
    featured BOOLEAN DEFAULT FALSE,
    status VARCHAR(20) DEFAULT 'draft' CHECK (status IN ('draft', 'pending_review', 'active', 'paused', 'rejected', 'deleted')),
    rejection_reason TEXT,
    featured_until TIMESTAMP,
    last_modified_by UUID REFERENCES users(id),
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    deleted_at TIMESTAMP
);

-- Orders/Purchases
CREATE TABLE orders (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    gig_id UUID REFERENCES gigs(id),
    buyer_id UUID REFERENCES users(id),
    seller_id UUID REFERENCES users(id),
    package VARCHAR(20) NOT NULL CHECK (package IN ('basic', 'standard', 'premium')),
    price DECIMAL(10,2) NOT NULL,
    delivery_time INTEGER NOT NULL,
    requirements JSONB, -- Buyer requirements
    deliverables TEXT[], -- URLs to delivered files
    delivery_message TEXT,
    status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'in_progress', 'revision_requested', 'completed', 'cancelled', 'disputed')),
    revision_count INTEGER DEFAULT 0,
    cancellation_reason TEXT,
    dispute_reason TEXT,
    payment_status VARCHAR(20) DEFAULT 'pending' CHECK (payment_status IN ('pending', 'paid', 'refunded', 'disputed')),
    payment_method VARCHAR(50),
    payment_transaction_id VARCHAR(255),
    commission_rate DECIMAL(5,2) DEFAULT 10.00,
    commission_amount DECIMAL(10,2),
    seller_earnings DECIMAL(10,2),
    due_date TIMESTAMP,
    delivered_at TIMESTAMP,
    completed_at TIMESTAMP,
    cancelled_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Reviews for completed orders
CREATE TABLE reviews (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    gig_id UUID REFERENCES gigs(id),
    order_id UUID REFERENCES orders(id) UNIQUE, -- One review per order
    buyer_id UUID REFERENCES users(id),
    seller_id UUID REFERENCES users(id),
    rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
    title VARCHAR(255),
    comment TEXT NOT NULL,
    helpful INTEGER DEFAULT 0, -- Count of helpful votes
    verified BOOLEAN DEFAULT TRUE, -- Verified purchase
    response TEXT, -- Seller response to review
    response_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Helpful votes for reviews
CREATE TABLE review_helpful (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    review_id UUID REFERENCES reviews(id) ON DELETE CASCADE,
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    created_at TIMESTAMP DEFAULT NOW(),
    UNIQUE(review_id, user_id)
);

-- Messages between users
CREATE TABLE conversations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    participant_1 UUID REFERENCES users(id),
    participant_2 UUID REFERENCES users(id),
    last_message_at TIMESTAMP DEFAULT NOW(),
    created_at TIMESTAMP DEFAULT NOW(),
    UNIQUE(participant_1, participant_2)
);

CREATE TABLE messages (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    conversation_id UUID REFERENCES conversations(id) ON DELETE CASCADE,
    sender_id UUID REFERENCES users(id),
    content TEXT NOT NULL,
    message_type VARCHAR(20) DEFAULT 'text' CHECK (message_type IN ('text', 'image', 'file', 'order_update')),
    attachment_url TEXT,
    read_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT NOW()
);

-- File uploads
CREATE TABLE uploads (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id),
    original_name VARCHAR(255) NOT NULL,
    filename VARCHAR(255) NOT NULL,
    file_path TEXT NOT NULL,
    file_size INTEGER NOT NULL,
    mime_type VARCHAR(100) NOT NULL,
    upload_type VARCHAR(50), -- avatar, gig_image, deliverable, etc.
    entity_id UUID, -- ID of related entity (gig, order, etc.)
    created_at TIMESTAMP DEFAULT NOW()
);

-- Notifications
CREATE TABLE notifications (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    type VARCHAR(50) NOT NULL, -- order_placed, message_received, etc.
    title VARCHAR(255) NOT NULL,
    message TEXT NOT NULL,
    data JSONB, -- Additional notification data
    read_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT NOW()
);

-- Platform analytics
CREATE TABLE analytics_events (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id),
    event_type VARCHAR(100) NOT NULL,
    event_data JSONB,
    ip_address INET,
    user_agent TEXT,
    created_at TIMESTAMP DEFAULT NOW()
);

-- Coupons and promotions
CREATE TABLE coupons (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    code VARCHAR(50) UNIQUE NOT NULL,
    description TEXT,
    discount_type VARCHAR(20) CHECK (discount_type IN ('percentage', 'fixed')),
    discount_value DECIMAL(10,2),
    minimum_order_amount DECIMAL(10,2),
    max_uses INTEGER,
    current_uses INTEGER DEFAULT 0,
    valid_from TIMESTAMP,
    valid_until TIMESTAMP,
    active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT NOW()
);

-- User sessions for JWT token management
CREATE TABLE user_sessions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    refresh_token TEXT NOT NULL,
    expires_at TIMESTAMP NOT NULL,
    device_info TEXT,
    ip_address INET,
    created_at TIMESTAMP DEFAULT NOW()
);

-- Saved influencers for buyers
CREATE TABLE saved_influencers (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    buyer_id UUID REFERENCES users(id) ON DELETE CASCADE,
    influencer_id UUID REFERENCES users(id) ON DELETE CASCADE,
    created_at TIMESTAMP DEFAULT NOW(),
    UNIQUE(buyer_id, influencer_id)
);

-- Saved gigs for buyers
CREATE TABLE saved_gigs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    buyer_id UUID REFERENCES users(id) ON DELETE CASCADE,
    gig_id UUID REFERENCES gigs(id) ON DELETE CASCADE,
    created_at TIMESTAMP DEFAULT NOW(),
    UNIQUE(buyer_id, gig_id)
);

-- Admin activity logs
CREATE TABLE admin_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    admin_id UUID REFERENCES users(id),
    action VARCHAR(100) NOT NULL,
    entity_type VARCHAR(50), -- user, gig, order, etc.
    entity_id UUID,
    old_values JSONB,
    new_values JSONB,
    ip_address INET,
    created_at TIMESTAMP DEFAULT NOW()
);

-- Zoom meetings
CREATE TABLE zoom_meetings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    meeting_id VARCHAR(100) UNIQUE NOT NULL, -- Zoom meeting ID
    topic VARCHAR(255) NOT NULL,
    start_time TIMESTAMP NOT NULL,
    duration INTEGER NOT NULL CHECK (duration >= 15 AND duration <= 480),
    join_url TEXT NOT NULL,
    start_url TEXT NOT NULL,
    password VARCHAR(20) NOT NULL,
    buyer_id UUID REFERENCES users(id) ON DELETE CASCADE,
    seller_id UUID REFERENCES users(id) ON DELETE CASCADE,
    gig_id UUID REFERENCES gigs(id) ON DELETE CASCADE,
    status VARCHAR(20) DEFAULT 'scheduled' CHECK (status IN ('scheduled', 'started', 'completed', 'cancelled', 'joined')),
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_username ON users(username);
CREATE INDEX idx_users_role ON users(role);
CREATE INDEX idx_users_created_at ON users(created_at);
CREATE INDEX idx_users_google_id ON users(google_id);
CREATE INDEX idx_users_auth_provider ON users(auth_provider);

CREATE INDEX idx_gigs_seller_id ON gigs(seller_id);
CREATE INDEX idx_gigs_category_id ON gigs(category_id);
CREATE INDEX idx_gigs_platform ON gigs(platform);
CREATE INDEX idx_gigs_status ON gigs(status);
CREATE INDEX idx_gigs_featured ON gigs(featured);
CREATE INDEX idx_gigs_rating ON gigs(rating);
CREATE INDEX idx_gigs_created_at ON gigs(created_at);

CREATE INDEX idx_orders_buyer_id ON orders(buyer_id);
CREATE INDEX idx_orders_seller_id ON orders(seller_id);
CREATE INDEX idx_orders_gig_id ON orders(gig_id);
CREATE INDEX idx_orders_status ON orders(status);
CREATE INDEX idx_orders_created_at ON orders(created_at);

CREATE INDEX idx_reviews_gig_id ON reviews(gig_id);
CREATE INDEX idx_reviews_buyer_id ON reviews(buyer_id);
CREATE INDEX idx_reviews_seller_id ON reviews(seller_id);
CREATE INDEX idx_reviews_rating ON reviews(rating);

CREATE INDEX idx_messages_conversation_id ON messages(conversation_id);
CREATE INDEX idx_messages_sender_id ON messages(sender_id);
CREATE INDEX idx_messages_created_at ON messages(created_at);

CREATE INDEX idx_notifications_user_id ON notifications(user_id);
CREATE INDEX idx_notifications_read_at ON notifications(read_at);

CREATE INDEX idx_saved_influencers_buyer_id ON saved_influencers(buyer_id);
CREATE INDEX idx_saved_influencers_influencer_id ON saved_influencers(influencer_id);

CREATE INDEX idx_saved_gigs_buyer_id ON saved_gigs(buyer_id);
CREATE INDEX idx_saved_gigs_gig_id ON saved_gigs(gig_id);

CREATE INDEX idx_zoom_meetings_buyer_id ON zoom_meetings(buyer_id);
CREATE INDEX idx_zoom_meetings_seller_id ON zoom_meetings(seller_id);
CREATE INDEX idx_zoom_meetings_gig_id ON zoom_meetings(gig_id);
CREATE INDEX idx_zoom_meetings_status ON zoom_meetings(status);
CREATE INDEX idx_zoom_meetings_start_time ON zoom_meetings(start_time);

-- Insert default categories
INSERT INTO categories (name, slug, description) VALUES
('Technology', 'technology', 'Tech product reviews and content'),
('Fitness & Health', 'fitness', 'Fitness and health content creation'),
('Beauty & Fashion', 'beauty', 'Beauty and fashion content'),
('Gaming', 'gaming', 'Gaming content and reviews'),
('Business', 'business', 'Business and entrepreneurship content'),
('Entertainment', 'entertainment', 'Entertainment and lifestyle content'),
('Education', 'education', 'Educational content creation'),
('Food & Cooking', 'food', 'Food and cooking content'),
('Travel', 'travel', 'Travel content and reviews'),
('Lifestyle', 'lifestyle', 'General lifestyle content');

-- Create database functions for common operations
CREATE OR REPLACE FUNCTION update_gig_rating(gig_uuid UUID)
RETURNS VOID AS $$
BEGIN
    UPDATE gigs 
    SET rating = (
        SELECT COALESCE(AVG(rating::numeric), 0)::decimal(3,2)
        FROM reviews 
        WHERE gig_id = gig_uuid
    ),
    total_reviews = (
        SELECT COUNT(*)
        FROM reviews 
        WHERE gig_id = gig_uuid
    ),
    updated_at = NOW()
    WHERE id = gig_uuid;
END;
$$ LANGUAGE plpgsql;

-- Trigger to update gig rating when review is added/updated
CREATE OR REPLACE FUNCTION trigger_update_gig_rating()
RETURNS TRIGGER AS $$
BEGIN
    PERFORM update_gig_rating(NEW.gig_id);
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER after_review_insert_update
    AFTER INSERT OR UPDATE ON reviews
    FOR EACH ROW
    EXECUTE FUNCTION trigger_update_gig_rating();

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Add updated_at triggers to relevant tables
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_gigs_updated_at BEFORE UPDATE ON gigs
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_orders_updated_at BEFORE UPDATE ON orders
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_zoom_meetings_updated_at BEFORE UPDATE ON zoom_meetings
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Note: This schema provides a solid foundation for the SocyAds platform.
-- The database team should review and adjust based on specific requirements.
-- Consider adding additional constraints, indexes, and optimizations as needed. 