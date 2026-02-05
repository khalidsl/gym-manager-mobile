-- ============================================
-- GYM MANAGER - SUPABASE SQL SCHEMA
-- ============================================

-- Activer les extensions nécessaires
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================
-- TABLE: profiles
-- ============================================
CREATE TABLE profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email TEXT NOT NULL UNIQUE,
    full_name TEXT NOT NULL,
    avatar_url TEXT,
    qr_code TEXT NOT NULL UNIQUE,
    phone TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Index pour optimiser les recherches
CREATE INDEX idx_profiles_qr_code ON profiles(qr_code);
CREATE INDEX idx_profiles_email ON profiles(email);

-- ============================================
-- TABLE: memberships
-- ============================================
CREATE TABLE memberships (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    type TEXT NOT NULL CHECK (type IN ('basic', 'premium', 'vip')),
    start_date TIMESTAMP WITH TIME ZONE NOT NULL,
    end_date TIMESTAMP WITH TIME ZONE NOT NULL,
    status TEXT NOT NULL CHECK (status IN ('active', 'expired', 'suspended')) DEFAULT 'active',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_memberships_user_id ON memberships(user_id);
CREATE INDEX idx_memberships_status ON memberships(status);

-- ============================================
-- TABLE: machines
-- ============================================
CREATE TABLE machines (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    type TEXT NOT NULL,
    description TEXT,
    image_url TEXT,
    qr_code TEXT NOT NULL UNIQUE,
    status TEXT NOT NULL CHECK (status IN ('available', 'in_use', 'maintenance')) DEFAULT 'available',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_machines_qr_code ON machines(qr_code);
CREATE INDEX idx_machines_status ON machines(status);

-- ============================================
-- TABLE: machine_sessions
-- ============================================
CREATE TABLE machine_sessions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    machine_id UUID NOT NULL REFERENCES machines(id) ON DELETE CASCADE,
    start_time TIMESTAMP WITH TIME ZONE NOT NULL,
    end_time TIMESTAMP WITH TIME ZONE,
    sets INTEGER DEFAULT 0,
    reps INTEGER DEFAULT 0,
    weight NUMERIC(5,2),
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_sessions_user_id ON machine_sessions(user_id);
CREATE INDEX idx_sessions_machine_id ON machine_sessions(machine_id);
CREATE INDEX idx_sessions_start_time ON machine_sessions(start_time);

-- ============================================
-- TABLE: machine_positions
-- ============================================
CREATE TABLE machine_positions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    machine_id UUID NOT NULL REFERENCES machines(id) ON DELETE CASCADE,
    position_data JSONB NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id, machine_id)
);

CREATE INDEX idx_positions_user_machine ON machine_positions(user_id, machine_id);

-- ============================================
-- TABLE: machine_reservations
-- ============================================
CREATE TABLE machine_reservations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    machine_id UUID NOT NULL REFERENCES machines(id) ON DELETE CASCADE,
    start_time TIMESTAMP WITH TIME ZONE NOT NULL,
    end_time TIMESTAMP WITH TIME ZONE NOT NULL,
    status TEXT NOT NULL CHECK (status IN ('pending', 'confirmed', 'cancelled', 'completed')) DEFAULT 'pending',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_reservations_user_id ON machine_reservations(user_id);
CREATE INDEX idx_reservations_machine_id ON machine_reservations(machine_id);
CREATE INDEX idx_reservations_time ON machine_reservations(start_time, end_time);

-- ============================================
-- TABLE: access_logs
-- ============================================
CREATE TABLE access_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    type TEXT NOT NULL CHECK (type IN ('entry', 'exit')),
    timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    qr_code_scanned TEXT NOT NULL,
    location TEXT
);

CREATE INDEX idx_access_logs_user_id ON access_logs(user_id);
CREATE INDEX idx_access_logs_timestamp ON access_logs(timestamp);
CREATE INDEX idx_access_logs_type ON access_logs(type);

-- ============================================
-- TABLE: access_permissions
-- ============================================
CREATE TABLE access_permissions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    membership_type TEXT NOT NULL CHECK (membership_type IN ('basic', 'premium', 'vip')),
    allowed_days TEXT[] NOT NULL,
    start_hour TIME NOT NULL,
    end_hour TIME NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(membership_type)
);

-- ============================================
-- TABLE: classes
-- ============================================
CREATE TABLE classes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    description TEXT,
    coach_id UUID NOT NULL REFERENCES profiles(id),
    max_capacity INTEGER NOT NULL,
    start_time TIME NOT NULL,
    end_time TIME NOT NULL,
    day_of_week INTEGER NOT NULL CHECK (day_of_week BETWEEN 0 AND 6),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_classes_coach_id ON classes(coach_id);
CREATE INDEX idx_classes_day_of_week ON classes(day_of_week);

-- ============================================
-- TABLE: bookings
-- ============================================
CREATE TABLE bookings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    class_id UUID NOT NULL REFERENCES classes(id) ON DELETE CASCADE,
    booking_date DATE NOT NULL,
    status TEXT NOT NULL CHECK (status IN ('confirmed', 'cancelled', 'attended')) DEFAULT 'confirmed',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_bookings_user_id ON bookings(user_id);
CREATE INDEX idx_bookings_class_id ON bookings(class_id);
CREATE INDEX idx_bookings_date ON bookings(booking_date);

-- ============================================
-- TRIGGERS
-- ============================================

-- Trigger pour mettre à jour updated_at sur profiles
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_profiles_updated_at
    BEFORE UPDATE ON profiles
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_machine_positions_updated_at
    BEFORE UPDATE ON machine_positions
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Trigger pour vérifier l'expiration des abonnements
CREATE OR REPLACE FUNCTION check_membership_expiration()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.end_date < NOW() THEN
        NEW.status = 'expired';
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER check_membership_status
    BEFORE INSERT OR UPDATE ON memberships
    FOR EACH ROW
    EXECUTE FUNCTION check_membership_expiration();

-- ============================================
-- ROW LEVEL SECURITY (RLS)
-- ============================================

-- Activer RLS sur toutes les tables
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE memberships ENABLE ROW LEVEL SECURITY;
ALTER TABLE machines ENABLE ROW LEVEL SECURITY;
ALTER TABLE machine_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE machine_positions ENABLE ROW LEVEL SECURITY;
ALTER TABLE machine_reservations ENABLE ROW LEVEL SECURITY;
ALTER TABLE access_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE access_permissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE classes ENABLE ROW LEVEL SECURITY;
ALTER TABLE bookings ENABLE ROW LEVEL SECURITY;

-- Policies pour profiles
CREATE POLICY "Users can view their own profile"
    ON profiles FOR SELECT
    USING (auth.uid() = id);

CREATE POLICY "Users can update their own profile"
    ON profiles FOR UPDATE
    USING (auth.uid() = id);

-- Policies pour memberships
CREATE POLICY "Users can view their own membership"
    ON memberships FOR SELECT
    USING (auth.uid() = user_id);

-- Policies pour machines (tout le monde peut voir)
CREATE POLICY "Everyone can view machines"
    ON machines FOR SELECT
    TO authenticated
    USING (true);

-- Policies pour machine_sessions
CREATE POLICY "Users can view their own sessions"
    ON machine_sessions FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own sessions"
    ON machine_sessions FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own sessions"
    ON machine_sessions FOR UPDATE
    USING (auth.uid() = user_id);

-- Policies pour machine_positions
CREATE POLICY "Users can manage their own positions"
    ON machine_positions FOR ALL
    USING (auth.uid() = user_id);

-- Policies pour machine_reservations
CREATE POLICY "Users can manage their own reservations"
    ON machine_reservations FOR ALL
    USING (auth.uid() = user_id);

-- Policies pour access_logs
CREATE POLICY "Users can view their own access logs"
    ON access_logs FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can create access logs"
    ON access_logs FOR INSERT
    WITH CHECK (auth.uid() = user_id);

-- Policies pour access_permissions (lecture seule)
CREATE POLICY "Everyone can view access permissions"
    ON access_permissions FOR SELECT
    TO authenticated
    USING (true);

-- Policies pour classes (lecture seule)
CREATE POLICY "Everyone can view classes"
    ON classes FOR SELECT
    TO authenticated
    USING (true);

-- Policies pour bookings
CREATE POLICY "Users can manage their own bookings"
    ON bookings FOR ALL
    USING (auth.uid() = user_id);

-- ============================================
-- DONNÉES INITIALES
-- ============================================

-- Permissions d'accès par défaut
INSERT INTO access_permissions (membership_type, allowed_days, start_hour, end_hour) VALUES
('basic', ARRAY['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'], '09:00', '18:00'),
('premium', ARRAY['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'], '06:00', '22:00'),
('vip', ARRAY['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'], '00:00', '23:59');

-- Machines d'exemple
INSERT INTO machines (name, type, description, qr_code, status) VALUES
('Tapis de course 1', 'Cardio', 'Tapis de course professionnel avec inclinaison', 'MACHINE-TAPIS-001', 'available'),
('Vélo elliptique 1', 'Cardio', 'Vélo elliptique avec programmes variés', 'MACHINE-VELO-001', 'available'),
('Banc de musculation 1', 'Force', 'Banc de musculation multifonction', 'MACHINE-BANC-001', 'available'),
('Rameur 1', 'Cardio', 'Rameur concept2', 'MACHINE-RAMEUR-001', 'available'),
('Smith Machine', 'Force', 'Machine guidée pour squats et développé', 'MACHINE-SMITH-001', 'available');
