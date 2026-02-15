-- ============================================
-- FIX RLS POLICIES - Gym Manager
-- ============================================

-- Policy pour permettre l'insertion de profils (via trigger)
CREATE POLICY "Users can insert their own profile"
    ON profiles FOR INSERT
    WITH CHECK (auth.uid() = id);

-- Policy pour permettre aux utilisateurs de mettre à jour les machines
CREATE POLICY "Users can update machine status"
    ON machines FOR UPDATE
    TO authenticated
    USING (true)
    WITH CHECK (true);

-- Vérifier que les policies pour machine_sessions sont bonnes
DROP POLICY IF EXISTS "Users can view their own sessions" ON machine_sessions;
DROP POLICY IF EXISTS "Users can create their own sessions" ON machine_sessions;
DROP POLICY IF EXISTS "Users can update their own sessions" ON machine_sessions;

CREATE POLICY "Users can view their own sessions"
    ON machine_sessions FOR SELECT
    TO authenticated
    USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own sessions"
    ON machine_sessions FOR INSERT
    TO authenticated
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own sessions"
    ON machine_sessions FOR UPDATE
    TO authenticated
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);
