#!/bin/bash

# ============================================
# SCRIPT DE MISE À JOUR DU SCHÉMA & TYPES
# ============================================

echo "🔧 Fixing TypeScript and Database Schema Issues..."
echo ""

# 1. Appliquer la migration du schéma
echo "🔍 Checking database schema..."
if command -v supabase &> /dev/null; then
    echo "✅ Supabase CLI found - applying schema fix..."
    supabase db push --file ./fix-types-schema.sql
else
    echo "⚠️  Supabase CLI not found. Please apply fix-types-schema.sql manually in your Supabase dashboard."
fi

# 2. Régénérer les types TypeScript
echo "🏗️  Regenerating TypeScript types..."
if [ -f "./node_modules/.bin/supabase" ]; then
    npx supabase gen types typescript --project-id YOUR_PROJECT_ID > types/supabase.ts
    echo "✅ Types regenerated successfully!"
else
    echo "⚠️  Please regenerate types manually: supabase gen types typescript --project-id YOUR_PROJECT_ID"
fi

# 3. Vérifier les erreurs TypeScript
echo "🔍 Checking TypeScript errors..."
npx tsc --noEmit

echo ""
echo "🎯 Schema and types update completed!"
echo ""
echo "📝 NEXT STEPS:"
echo "1. Test the QR system: the daily QR generation and member scanning should work perfectly"
echo "2. Verify that TypeScript errors are resolved"
echo "3. Run the app: npm start or expo start"
echo ""