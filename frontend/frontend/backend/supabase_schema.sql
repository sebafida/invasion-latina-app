-- =============================================
-- INVASION LATINA - Supabase Database Schema
-- =============================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =============================================
-- USERS TABLE
-- =============================================
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255),
    name VARCHAR(255),
    phone VARCHAR(50),
    role VARCHAR(50) DEFAULT 'user',
    loyalty_points INTEGER DEFAULT 0,
    badges TEXT[] DEFAULT '{}',
    accept_marketing BOOLEAN DEFAULT FALSE,
    apple_id VARCHAR(255),
    google_id VARCHAR(255),
    referral_code VARCHAR(20) UNIQUE,
    push_token TEXT,
    push_token_updated TIMESTAMP WITH TIME ZONE,
    last_login TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_role ON users(role);
CREATE INDEX idx_users_referral_code ON users(referral_code);

-- =============================================
-- EVENTS TABLE
-- =============================================
CREATE TABLE events (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    description TEXT,
    event_date DATE NOT NULL,
    event_time TIME,
    end_date DATE,
    venue_name VARCHAR(255),
    venue_address TEXT,
    flyer_url TEXT,
    ticket_url TEXT,
    price_range VARCHAR(100),
    is_featured BOOLEAN DEFAULT FALSE,
    gallery_visible BOOLEAN DEFAULT FALSE,
    dj_ids UUID[] DEFAULT '{}',
    tickets_sold INTEGER DEFAULT 0,
    capacity INTEGER DEFAULT 0,
    status VARCHAR(50) DEFAULT 'upcoming',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_events_date ON events(event_date);
CREATE INDEX idx_events_status ON events(status);

-- =============================================
-- DJS TABLE
-- =============================================
CREATE TABLE djs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    bio TEXT,
    photo_url TEXT,
    instagram_url TEXT,
    soundcloud_url TEXT,
    spotify_url TEXT,
    is_resident BOOLEAN DEFAULT FALSE,
    "order" INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =============================================
-- TICKETS TABLE
-- =============================================
CREATE TABLE tickets (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    event_id UUID REFERENCES events(id) ON DELETE CASCADE,
    ticket_type VARCHAR(100),
    quantity INTEGER DEFAULT 1,
    total_price DECIMAL(10, 2),
    status VARCHAR(50) DEFAULT 'active',
    qr_code VARCHAR(255) UNIQUE,
    purchased_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_tickets_user ON tickets(user_id);
CREATE INDEX idx_tickets_event ON tickets(event_id);

-- =============================================
-- SONG REQUESTS TABLE
-- =============================================
CREATE TABLE song_requests (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    user_name VARCHAR(255),
    event_id UUID REFERENCES events(id) ON DELETE SET NULL,
    song_title VARCHAR(255) NOT NULL,
    artist VARCHAR(255),
    message TEXT,
    status VARCHAR(50) DEFAULT 'pending',
    rejection_reason TEXT,
    dj_response TEXT,
    requested_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    responded_at TIMESTAMP WITH TIME ZONE
);

CREATE INDEX idx_song_requests_user ON song_requests(user_id);
CREATE INDEX idx_song_requests_event ON song_requests(event_id);
CREATE INDEX idx_song_requests_status ON song_requests(status);

-- =============================================
-- VIP BOOKINGS TABLE
-- =============================================
CREATE TABLE vip_bookings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    event_id UUID REFERENCES events(id) ON DELETE SET NULL,
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) NOT NULL,
    phone VARCHAR(50),
    guests_count INTEGER DEFAULT 1,
    table_preference VARCHAR(100),
    special_requests TEXT,
    status VARCHAR(50) DEFAULT 'pending',
    admin_notes TEXT,
    submitted_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE
);

CREATE INDEX idx_vip_bookings_user ON vip_bookings(user_id);
CREATE INDEX idx_vip_bookings_event ON vip_bookings(event_id);
CREATE INDEX idx_vip_bookings_status ON vip_bookings(status);

-- =============================================
-- PHOTOS TABLE
-- =============================================
CREATE TABLE photos (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    event_id UUID REFERENCES events(id) ON DELETE CASCADE,
    url TEXT NOT NULL,
    thumbnail_url TEXT,
    caption TEXT,
    photographer VARCHAR(255),
    tags UUID[] DEFAULT '{}',
    likes_count INTEGER DEFAULT 0,
    uploaded_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_photos_event ON photos(event_id);

-- =============================================
-- AFTERMOVIES TABLE
-- =============================================
CREATE TABLE aftermovies (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    event_id UUID REFERENCES events(id) ON DELETE SET NULL,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    video_url TEXT NOT NULL,
    thumbnail_url TEXT,
    duration INTEGER,
    event_date DATE,
    views_count INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =============================================
-- APP SETTINGS TABLE
-- =============================================
CREATE TABLE app_settings (
    id VARCHAR(100) PRIMARY KEY,
    type VARCHAR(100),
    data JSONB DEFAULT '{}',
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Insert default global settings
INSERT INTO app_settings (id, type, data) VALUES 
('global', 'global', '{
    "loyalty_enabled": true,
    "loyalty_points_per_checkin": 5,
    "song_requests_enabled": true,
    "vip_booking_enabled": true,
    "geofencing_enabled": false,
    "geofencing_latitude": 50.8466,
    "geofencing_longitude": 4.3528,
    "geofencing_radius": 40,
    "event_start_hour": 23,
    "event_end_hour": 5
}');

-- =============================================
-- FREE ENTRY VOUCHERS TABLE
-- =============================================
CREATE TABLE free_entry_vouchers (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    event_id UUID REFERENCES events(id) ON DELETE SET NULL,
    qr_code VARCHAR(255) UNIQUE NOT NULL,
    status VARCHAR(50) DEFAULT 'active',
    redeemed_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_vouchers_user ON free_entry_vouchers(user_id);
CREATE INDEX idx_vouchers_qr ON free_entry_vouchers(qr_code);

-- =============================================
-- LOYALTY CHECK-INS TABLE
-- =============================================
CREATE TABLE loyalty_checkins (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    event_id UUID REFERENCES events(id) ON DELETE SET NULL,
    points_earned INTEGER DEFAULT 0,
    check_in_type VARCHAR(50) DEFAULT 'event',
    checked_in_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_checkins_user ON loyalty_checkins(user_id);
CREATE INDEX idx_checkins_event ON loyalty_checkins(event_id);

-- =============================================
-- LOYALTY TRANSACTIONS TABLE
-- =============================================
CREATE TABLE loyalty_transactions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    points INTEGER NOT NULL,
    transaction_type VARCHAR(50) NOT NULL,
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_transactions_user ON loyalty_transactions(user_id);

-- =============================================
-- LOYALTY REWARDS TABLE
-- =============================================
CREATE TABLE loyalty_rewards (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    reward_type VARCHAR(100) NOT NULL,
    points_spent INTEGER NOT NULL,
    status VARCHAR(50) DEFAULT 'active',
    redeemed_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_rewards_user ON loyalty_rewards(user_id);

-- =============================================
-- EVENT QR CODES TABLE
-- =============================================
CREATE TABLE event_qr_codes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    event_id UUID REFERENCES events(id) ON DELETE SET NULL,
    event_name VARCHAR(255),
    qr_code VARCHAR(255) UNIQUE NOT NULL,
    points_value INTEGER DEFAULT 5,
    is_active BOOLEAN DEFAULT TRUE,
    scans_count INTEGER DEFAULT 0,
    created_by UUID REFERENCES users(id) ON DELETE SET NULL,
    deactivated_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_event_qr_active ON event_qr_codes(is_active);
CREATE INDEX idx_event_qr_code ON event_qr_codes(qr_code);

-- =============================================
-- EVENT QR SCANS TABLE
-- =============================================
CREATE TABLE event_qr_scans (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    qr_id UUID REFERENCES event_qr_codes(id) ON DELETE SET NULL,
    event_id UUID REFERENCES events(id) ON DELETE SET NULL,
    points_earned INTEGER DEFAULT 0,
    scanned_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id, qr_id)
);

CREATE INDEX idx_qr_scans_user ON event_qr_scans(user_id);

-- =============================================
-- REFERRALS TABLE
-- =============================================
CREATE TABLE referrals (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    referrer_id UUID REFERENCES users(id) ON DELETE CASCADE,
    referred_id UUID REFERENCES users(id) ON DELETE CASCADE,
    referral_code VARCHAR(20),
    coins_awarded INTEGER DEFAULT 3,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(referred_id)
);

CREATE INDEX idx_referrals_referrer ON referrals(referrer_id);

-- =============================================
-- NOTIFICATIONS SENT TABLE
-- =============================================
CREATE TABLE notifications_sent (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    title VARCHAR(255) NOT NULL,
    body TEXT,
    target VARCHAR(100) DEFAULT 'all',
    tokens_count INTEGER DEFAULT 0,
    sent_by UUID REFERENCES users(id) ON DELETE SET NULL,
    sent_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =============================================
-- ROW LEVEL SECURITY (RLS)
-- =============================================

-- Enable RLS on all tables
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE events ENABLE ROW LEVEL SECURITY;
ALTER TABLE djs ENABLE ROW LEVEL SECURITY;
ALTER TABLE tickets ENABLE ROW LEVEL SECURITY;
ALTER TABLE song_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE vip_bookings ENABLE ROW LEVEL SECURITY;
ALTER TABLE photos ENABLE ROW LEVEL SECURITY;
ALTER TABLE aftermovies ENABLE ROW LEVEL SECURITY;
ALTER TABLE app_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE free_entry_vouchers ENABLE ROW LEVEL SECURITY;
ALTER TABLE loyalty_checkins ENABLE ROW LEVEL SECURITY;
ALTER TABLE loyalty_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE loyalty_rewards ENABLE ROW LEVEL SECURITY;
ALTER TABLE event_qr_codes ENABLE ROW LEVEL SECURITY;
ALTER TABLE event_qr_scans ENABLE ROW LEVEL SECURITY;
ALTER TABLE referrals ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications_sent ENABLE ROW LEVEL SECURITY;

-- Public read access for events, djs, photos, aftermovies
CREATE POLICY "Events are viewable by everyone" ON events FOR SELECT USING (true);
CREATE POLICY "DJs are viewable by everyone" ON djs FOR SELECT USING (true);
CREATE POLICY "Photos are viewable by everyone" ON photos FOR SELECT USING (true);
CREATE POLICY "Aftermovies are viewable by everyone" ON aftermovies FOR SELECT USING (true);
CREATE POLICY "App settings are viewable by everyone" ON app_settings FOR SELECT USING (true);
CREATE POLICY "Event QR codes are viewable by everyone" ON event_qr_codes FOR SELECT USING (true);

-- Service role has full access (for backend)
-- Note: Backend will use service_role key for full access

-- =============================================
-- CREATE DEFAULT ADMIN USER
-- =============================================
INSERT INTO users (email, password_hash, name, role, loyalty_points) 
VALUES ('admin@invasionlatina.be', '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/X4.qqHGGp.zRXKQXi', 'Admin', 'admin', 0)
ON CONFLICT (email) DO NOTHING;
