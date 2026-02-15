-- ============================================
-- SYSTÈME COMPLET DE QR CODES - Gym Manager
-- ============================================

-- 1. AJOUTER LE RÔLE DANS PROFILES
-- ============================================
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS role TEXT DEFAULT 'member' 
    CHECK (role IN ('member', 'staff', 'admin', 'coach'));

-- 2. FONCTION DE GÉNÉRATION DE QR GÉNÉRIQUE
-- ============================================
CREATE OR REPLACE FUNCTION generate_qr_code(
    qr_type TEXT,
    entity_id UUID
)
RETURNS TEXT AS $$
DECLARE
    qr_code_value TEXT;
BEGIN
    qr_code_value := 'GYM-' || UPPER(qr_type) || '-' || 
                     UPPER(SUBSTRING(entity_id::TEXT, 1, 8)) || '-' || 
                     EXTRACT(EPOCH FROM NOW())::TEXT;
    RETURN qr_code_value;
END;
$$ LANGUAGE plpgsql;

-- 3. MISE À JOUR DU TRIGGER POUR INCLURE LE RÔLE
-- ============================================
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
    qr_code_value TEXT;
    user_role TEXT;
BEGIN
    -- Déterminer le rôle (par défaut 'member')
    user_role := COALESCE(NEW.raw_user_meta_data->>'role', 'member');
    
    -- Générer le QR code selon le rôle
    IF user_role = 'staff' OR user_role = 'admin' OR user_role = 'coach' THEN
        qr_code_value := generate_qr_code('STAFF', NEW.id);
    ELSE
        qr_code_value := generate_qr_code('MEMBER', NEW.id);
    END IF;
    
    -- Insérer le profil
    INSERT INTO public.profiles (id, email, full_name, qr_code, phone, role)
    VALUES (
        NEW.id,
        NEW.email,
        COALESCE(NEW.raw_user_meta_data->>'full_name', 'Nouveau membre'),
        qr_code_value,
        NEW.raw_user_meta_data->>'phone',
        user_role
    );
    
    -- Créer un abonnement uniquement pour les membres (pas pour le staff)
    IF user_role = 'member' THEN
        INSERT INTO public.memberships (user_id, type, start_date, end_date, status)
        VALUES (
            NEW.id,
            'basic',
            NOW(),
            NOW() + INTERVAL '30 days',
            'active'
        );
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 4. AJOUTER QR CODE AUX MACHINES (si pas déjà fait)
-- ============================================
DO $$
DECLARE
    machine_record RECORD;
BEGIN
    FOR machine_record IN SELECT id FROM machines WHERE qr_code IS NULL OR qr_code = ''
    LOOP
        UPDATE machines 
        SET qr_code = generate_qr_code('MACHINE', machine_record.id)
        WHERE id = machine_record.id;
    END LOOP;
END $$;

-- 5. AJOUTER QR CODE AUX COURS
-- ============================================
ALTER TABLE classes ADD COLUMN IF NOT EXISTS qr_code TEXT UNIQUE;

DO $$
DECLARE
    class_record RECORD;
BEGIN
    FOR class_record IN SELECT id FROM classes WHERE qr_code IS NULL OR qr_code = ''
    LOOP
        UPDATE classes 
        SET qr_code = generate_qr_code('CLASS', class_record.id)
        WHERE id = class_record.id;
    END LOOP;
END $$;

-- 6. CRÉER INDEX POUR LES RECHERCHES QR
-- ============================================
CREATE INDEX IF NOT EXISTS idx_profiles_qr_code ON profiles(qr_code);
CREATE INDEX IF NOT EXISTS idx_profiles_role ON profiles(role);
CREATE INDEX IF NOT EXISTS idx_machines_qr_code ON machines(qr_code);
CREATE INDEX IF NOT EXISTS idx_classes_qr_code ON classes(qr_code);

-- 7. FONCTION POUR IDENTIFIER LE TYPE DE QR CODE
-- ============================================
CREATE OR REPLACE FUNCTION identify_qr_type(qr_code TEXT)
RETURNS TEXT AS $$
BEGIN
    IF qr_code LIKE 'GYM-MEMBER-%' THEN
        RETURN 'member';
    ELSIF qr_code LIKE 'GYM-STAFF-%' THEN
        RETURN 'staff';
    ELSIF qr_code LIKE 'GYM-MACHINE-%' OR qr_code LIKE 'MACHINE-%' THEN
        RETURN 'machine';
    ELSIF qr_code LIKE 'GYM-CLASS-%' THEN
        RETURN 'class';
    ELSE
        RETURN 'unknown';
    END IF;
END;
$$ LANGUAGE plpgsql;

-- 8. EXEMPLES D'UTILISATION
-- ============================================

-- Créer un compte staff
-- INSERT INTO auth.users avec metadata: { role: 'staff', full_name: 'John Doe' }

-- Générer QR pour une nouvelle machine
-- SELECT generate_qr_code('MACHINE', '123e4567-e89b-12d3-a456-426614174000');
-- Résultat: GYM-MACHINE-123E4567-1738800000

-- Identifier le type d'un QR code scanné
-- SELECT identify_qr_type('GYM-STAFF-B5C6D7E8-1738800001');
-- Résultat: 'staff'

-- Lister tous les QR codes par type
SELECT role, qr_code, full_name FROM profiles ORDER BY role;
SELECT qr_code, name FROM machines;
SELECT qr_code, name FROM classes;
