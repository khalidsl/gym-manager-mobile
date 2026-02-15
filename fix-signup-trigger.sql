-- ============================================
-- FIX SIGNUP - Créer automatiquement le profil
-- ============================================

-- 1. Supprimer l'ancien trigger s'il existe
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP FUNCTION IF EXISTS handle_new_user();

-- 2. Créer la fonction de trigger
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
    qr_code_value TEXT;
BEGIN
    -- Générer un QR code unique
    qr_code_value := 'GYM-' || UPPER(SUBSTRING(NEW.id::TEXT, 1, 8)) || '-' || EXTRACT(EPOCH FROM NOW())::TEXT;
    
    -- Insérer le profil
    INSERT INTO public.profiles (id, email, full_name, qr_code, phone)
    VALUES (
        NEW.id,
        NEW.email,
        COALESCE(NEW.raw_user_meta_data->>'full_name', 'Nouveau membre'),
        qr_code_value,
        NEW.raw_user_meta_data->>'phone'
    );
    
    -- Créer un abonnement basic par défaut (30 jours)
    INSERT INTO public.memberships (user_id, type, start_date, end_date, status)
    VALUES (
        NEW.id,
        'basic',
        NOW(),
        NOW() + INTERVAL '30 days',
        'active'
    );
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 3. Créer le trigger
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW
    EXECUTE FUNCTION handle_new_user();

-- 4. Activer RLS et vérifier les policies
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Policy pour permettre l'insertion via trigger
DROP POLICY IF EXISTS "Users can insert their own profile" ON profiles;
CREATE POLICY "Users can insert their own profile"
    ON profiles FOR INSERT
    WITH CHECK (auth.uid() = id);

-- Policy pour la lecture
DROP POLICY IF EXISTS "Users can view their own profile" ON profiles;
CREATE POLICY "Users can view their own profile"
    ON profiles FOR SELECT
    USING (auth.uid() = id);

-- Policy pour la mise à jour
DROP POLICY IF EXISTS "Users can update their own profile" ON profiles;
CREATE POLICY "Users can update their own profile"
    ON profiles FOR UPDATE
    USING (auth.uid() = id);
