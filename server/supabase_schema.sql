-- 1. Create Charities Table (Master List)
CREATE TABLE public.charities (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    image_url VARCHAR(500),
    upcoming_events JSONB DEFAULT '[]'::jsonb,
    total_donations_received DECIMAL(10,2) DEFAULT 0.00,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Create Users Table
CREATE TABLE public.users (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    first_name VARCHAR(100),
    last_name VARCHAR(100),
    golf_club VARCHAR(255),
    role VARCHAR(50) DEFAULT 'USER',
    stripe_customer_id VARCHAR(255) UNIQUE,
    subscription_status VARCHAR(50) DEFAULT 'INACTIVE',
    selected_charity_id UUID REFERENCES public.charities(id) ON DELETE SET NULL,
    charity_contribution_pct INTEGER DEFAULT 10 CHECK (charity_contribution_pct >= 10),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. Create Scores Table (With Duplicate Date Checker)
CREATE TABLE public.scores (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
    stableford_score INTEGER NOT NULL CHECK (stableford_score >= 1 AND stableford_score <= 45),
    played_at DATE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id, played_at) -- Core PRD Constraint: No duplicates per date
);

-- 4. Create Draws Table
CREATE TABLE public.draws (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    month_year VARCHAR(7) NOT NULL UNIQUE, -- e.g. "2024-05"
    total_prize_pool DECIMAL(10,2) NOT NULL,
    winning_numbers INTEGER[] NOT NULL,
    jackpot_rolled_over BOOLEAN DEFAULT false,
    status VARCHAR(50) DEFAULT 'COMPLETED',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 5. Create Draw Entries Table (With Winner Verification Engine)
CREATE TABLE public.draw_entries (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    draw_id UUID REFERENCES public.draws(id) ON DELETE CASCADE,
    user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
    selected_numbers INTEGER[] NOT NULL,
    matched_count INTEGER NOT NULL,
    prize_won DECIMAL(10,2) DEFAULT 0.00,
    proof_url VARCHAR(500),
    verification_status VARCHAR(50) DEFAULT 'NOT_REQUIRED', -- NOT_REQUIRED, PENDING_PROOF, PENDING_REVIEW, APPROVED, REJECTED
    payment_status VARCHAR(50) DEFAULT 'PENDING', -- PENDING, PAID
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 6. Create Donations Ledger Table (Philanthropic Engine)
CREATE TABLE public.donations (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
    charity_id UUID REFERENCES public.charities(id) ON DELETE CASCADE,
    draw_id UUID REFERENCES public.draws(id) ON DELETE SET NULL,
    amount DECIMAL(10,2) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 7. Seed Initial Charities automatically!
INSERT INTO public.charities (name, description) VALUES 
('Global Education Fund', 'Empowering education worldwide.'),
('St. Jude Hospitals', 'Advancing cures, and means of prevention.'),
('Ocean Clean-up Project', 'Developing advanced technologies to rid oceans of plastic.');
