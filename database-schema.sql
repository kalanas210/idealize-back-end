-- SocyAds Database Schema
-- This file contains all the necessary tables for the platform

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Users table (extends Clerk user data)
CREATE TABLE IF NOT EXISTS users (
    id VARCHAR(255) PRIMARY KEY, -- Clerk user ID
    email VARCHAR(255) UNIQUE NOT NULL,
    username VARCHAR(100) UNIQUE,
    name VARCHAR(255),
    role VARCHAR(50) DEFAULT 'buyer' CHECK (role IN ('buyer', 'seller', 'admin')),
    verified BOOLEAN DEFAULT false,
    avatar TEXT,
    bio TEXT,
    location VARCHAR(255),
    timezone VARCHAR(100),
    phone VARCHAR(50),
    country VARCHAR(100),
    city VARCHAR(100),
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Seller applications table
CREATE TABLE IF NOT EXISTS seller_applications (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id VARCHAR(255) REFERENCES users(id) ON DELETE CASCADE,
    professional_title VARCHAR(255),
    experience VARCHAR(100),
    bio TEXT NOT NULL,
    skills TEXT[] NOT NULL,
    languages TEXT[] NOT NULL,
    social_accounts JSONB,
    portfolio TEXT[],
    verification_docs JSONB,
    status VARCHAR(50) DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
    admin_notes TEXT,
    reviewed_by VARCHAR(255) REFERENCES users(id),
    reviewed_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Gigs table
CREATE TABLE IF NOT EXISTS gigs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    seller_id VARCHAR(255) REFERENCES users(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    category VARCHAR(100) NOT NULL,
    platform VARCHAR(100) NOT NULL,
    tags TEXT[],
    description TEXT NOT NULL,
    requirements TEXT[],
    images TEXT[],
    video_url TEXT,
    status VARCHAR(50) DEFAULT 'draft' CHECK (status IN ('draft', 'published', 'paused', 'deleted')),
    featured BOOLEAN DEFAULT false,
    rating DECIMAL(3,2) DEFAULT 0,
    total_reviews INTEGER DEFAULT 0,
    completed_orders INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Gig packages table
CREATE TABLE IF NOT EXISTS gig_packages (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    gig_id UUID REFERENCES gigs(id) ON DELETE CASCADE,
    tier VARCHAR(50) NOT NULL CHECK (tier IN ('basic', 'standard', 'premium')),
    package_name VARCHAR(255) NOT NULL,
    description TEXT,
    price DECIMAL(10,2) NOT NULL,
    delivery_time INTEGER NOT NULL, -- in days
    revisions INTEGER DEFAULT 0,
    features TEXT[],
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    UNIQUE(gig_id, tier)
);

-- Gig FAQ table
CREATE TABLE IF NOT EXISTS gig_faqs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    gig_id UUID REFERENCES gigs(id) ON DELETE CASCADE,
    question TEXT NOT NULL,
    answer TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Orders table
CREATE TABLE IF NOT EXISTS orders (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    gig_id UUID REFERENCES gigs(id) ON DELETE CASCADE,
    buyer_id VARCHAR(255) REFERENCES users(id) ON DELETE CASCADE,
    seller_id VARCHAR(255) REFERENCES users(id) ON DELETE CASCADE,
    package_tier VARCHAR(50) NOT NULL,
    amount DECIMAL(10,2) NOT NULL,
    status VARCHAR(50) DEFAULT 'pending' CHECK (status IN ('pending', 'in_progress', 'completed', 'cancelled', 'disputed')),
    requirements TEXT,
    delivery_date TIMESTAMP,
    completed_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Reviews table
CREATE TABLE IF NOT EXISTS reviews (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    order_id UUID REFERENCES orders(id) ON DELETE CASCADE,
    gig_id UUID REFERENCES gigs(id) ON DELETE CASCADE,
    reviewer_id VARCHAR(255) REFERENCES users(id) ON DELETE CASCADE,
    rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
    comment TEXT,
    created_at TIMESTAMP DEFAULT NOW()
);

-- Notifications table
CREATE TABLE IF NOT EXISTS notifications (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id VARCHAR(255) REFERENCES users(id) ON DELETE CASCADE,
    type VARCHAR(100) NOT NULL,
    title VARCHAR(255) NOT NULL,
    message TEXT NOT NULL,
    data JSONB,
    read_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_seller_applications_user_id ON seller_applications(user_id);
CREATE INDEX IF NOT EXISTS idx_seller_applications_status ON seller_applications(status);
CREATE INDEX IF NOT EXISTS idx_gigs_seller_id ON gigs(seller_id);
CREATE INDEX IF NOT EXISTS idx_gigs_category ON gigs(category);
CREATE INDEX IF NOT EXISTS idx_gigs_platform ON gigs(platform);
CREATE INDEX IF NOT EXISTS idx_gigs_status ON gigs(status);
CREATE INDEX IF NOT EXISTS idx_gig_packages_gig_id ON gig_packages(gig_id);
CREATE INDEX IF NOT EXISTS idx_orders_buyer_id ON orders(buyer_id);
CREATE INDEX IF NOT EXISTS idx_orders_seller_id ON orders(seller_id);
CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(status);
CREATE INDEX IF NOT EXISTS idx_reviews_gig_id ON reviews(gig_id);
CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON notifications(user_id);

-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Apply updated_at trigger to relevant tables
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_seller_applications_updated_at BEFORE UPDATE ON seller_applications
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_gigs_updated_at BEFORE UPDATE ON gigs
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_gig_packages_updated_at BEFORE UPDATE ON gig_packages
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_gig_faqs_updated_at BEFORE UPDATE ON gig_faqs
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_orders_updated_at BEFORE UPDATE ON orders
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Insert default admin user
INSERT INTO users (id, email, username, name, role, verified) 
VALUES ('admin-user-001', 'admin@socyads.com', 'admin', 'System Administrator', 'admin', true)
ON CONFLICT (id) DO NOTHING;

-- Create view for seller dashboard data
CREATE OR REPLACE VIEW seller_dashboard AS
SELECT 
    u.id,
    u.name,
    u.email,
    u.role,
    u.avatar,
    u.bio,
    u.location,
    COUNT(DISTINCT g.id) as total_gigs,
    COUNT(DISTINCT CASE WHEN g.status = 'published' THEN g.id END) as published_gigs,
    COUNT(DISTINCT o.id) as total_orders,
    COUNT(DISTINCT CASE WHEN o.status = 'completed' THEN o.id END) as completed_orders,
    COALESCE(AVG(r.rating), 0) as average_rating,
    COUNT(DISTINCT r.id) as total_reviews
FROM users u
LEFT JOIN gigs g ON u.id = g.seller_id
LEFT JOIN orders o ON u.id = o.seller_id
LEFT JOIN reviews r ON g.id = r.gig_id
WHERE u.role = 'seller'
GROUP BY u.id, u.name, u.email, u.role, u.avatar, u.bio, u.location;

-- Create view for gig details with packages and FAQ
CREATE OR REPLACE VIEW gig_details AS
SELECT 
    g.*,
    u.name as seller_name,
    u.avatar as seller_avatar,
    u.verified as seller_verified,
    json_agg(
        DISTINCT jsonb_build_object(
            'tier', gp.tier,
            'packageName', gp.package_name,
            'description', gp.description,
            'price', gp.price,
            'delivery', gp.delivery_time,
            'revision', gp.revisions,
            'features', gp.features
        )
    ) FILTER (WHERE gp.id IS NOT NULL) as pricing,
    json_agg(
        DISTINCT jsonb_build_object(
            'question', gf.question,
            'answer', gf.answer
        )
    ) FILTER (WHERE gf.id IS NOT NULL) as faq
FROM gigs g
LEFT JOIN users u ON g.seller_id = u.id
LEFT JOIN gig_packages gp ON g.id = gp.gig_id
LEFT JOIN gig_faqs gf ON g.id = gf.gig_id
GROUP BY g.id, u.name, u.avatar, u.verified; 