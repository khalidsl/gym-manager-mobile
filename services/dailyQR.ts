import { supabase } from './supabase';

// Types pour le système de codes QR quotidiens
export interface DailyQRCode {
  id: string;
  date: string;
  entry_code: string;
  exit_code: string;
  created_at: string;
  valid_until: string;
}

export interface QRScanResult {
  success: boolean;
  action: 'entry' | 'exit';
  memberName: string;
  message: string;
  timestamp: string;
}

/**
 * ADMIN : Générer les codes QR du jour
 */
export const generateDailyQRCodes = async (): Promise<DailyQRCode | null> => {
  try {
    const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD
    
    // Vérifier si les codes existent déjà pour aujourd'hui
    const { data: existingCodes } = await supabase
      .from('daily_qr_codes')
      .select('*')
      .eq('date', today)
      .single();

    if (existingCodes) {
      console.log('✅ Codes QR déjà générés pour aujourd\'hui');
      return existingCodes;
    }

    // Générer nouveaux codes QR
    const timestamp = Date.now();
    const entryCode = `GYM_ENTRY_${today.replace(/-/g, '')}_${timestamp}`;
    const exitCode = `GYM_EXIT_${today.replace(/-/g, '')}_${timestamp}`;
    
    // Valide jusqu'à minuit
    const validUntil = new Date();
    validUntil.setHours(23, 59, 59, 999);

    const { data: newCodes, error } = await supabase
      .from('daily_qr_codes')
      .insert({
        date: today,
        entry_code: entryCode,
        exit_code: exitCode,
        valid_until: validUntil.toISOString()
      })
      .select()
      .single();

    if (error) {
      console.error('❌ Erreur génération codes QR:', error);
      return null;
    }

    console.log('✅ Nouveaux codes QR générés:', newCodes);
    return newCodes;
    
  } catch (error) {
    console.error('❌ Erreur generateDailyQRCodes:', error);
    return null;
  }
};

/**
 * ADMIN : Récupérer les codes QR du jour
 */
export const getTodayQRCodes = async (): Promise<DailyQRCode | null> => {
  try {
    const today = new Date().toISOString().split('T')[0];
    
    const { data: codes, error } = await supabase
      .from('daily_qr_codes')
      .select('*')
      .eq('date', today)
      .single();

    if (error && error.code !== 'PGRST116') { // PGRST116 = no rows found
      console.error('❌ Erreur getTodayQRCodes:', error);
      return null;
    }

    return codes || null;
  } catch (error) {
    console.error('❌ Erreur getTodayQRCodes:', error);
    return null;
  }
};

/**
 * MEMBRE : Scanner un code QR (entrée ou sortie)
 */
export const memberScanQRCode = async (qrCode: string): Promise<QRScanResult> => {
  try {
    console.log('🔍 Membre scanne le code QR:', qrCode);

    // 1. Récupérer l'utilisateur connecté
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    
    if (userError || !user) {
      return {
        success: false,
        action: 'entry',
        memberName: '',
        message: 'Vous devez être connecté pour scanner',
        timestamp: new Date().toISOString()
      };
    }

    // 2. Récupérer le profil du membre
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select(`
        id,
        full_name,
        email,
        memberships (
          status,
          end_date,
          type
        )
      `)
      .eq('id', user.id)
      .single();

    if (profileError || !profile) {
      return {
        success: false,
        action: 'entry',
        memberName: '',
        message: 'Profil membre introuvable',
        timestamp: new Date().toISOString()
      };
    }

    // 3. Vérifier l'abonnement
    const activeMembership = profile.memberships?.find(m => m.status === 'active');
    if (!activeMembership) {
      return {
        success: false,
        action: 'entry',
        memberName: profile.full_name,
        message: 'Abonnement expiré ou suspendu',
        timestamp: new Date().toISOString()
      };
    }

    // 4. Vérifier la date d'expiration
    const endDate = new Date(activeMembership.end_date);
    const today = new Date();
    if (endDate < today) {
      return {
        success: false,
        action: 'entry',
        memberName: profile.full_name,
        message: `Abonnement expiré depuis le ${endDate.toLocaleDateString('fr-FR')}`,
        timestamp: new Date().toISOString()
      };
    }

    // 5. Vérifier si le code QR est valide pour aujourd'hui
    const todayStr = new Date().toISOString().split('T')[0];
    const { data: dailyCodes } = await supabase
      .from('daily_qr_codes')
      .select('*')
      .eq('date', todayStr)
      .single();

    if (!dailyCodes) {
      return {
        success: false,
        action: 'entry',
        memberName: profile.full_name,
        message: 'Aucun code QR généré pour aujourd\'hui',
        timestamp: new Date().toISOString()
      };
    }

    // 6. Déterminer le type d'action (entrée ou sortie)
    let action: 'entry' | 'exit';
    let actionText: string;

    if (qrCode === dailyCodes.entry_code) {
      action = 'entry';
      actionText = 'Entrée';
    } else if (qrCode === dailyCodes.exit_code) {
      action = 'exit';
      actionText = 'Sortie';
    } else {
      return {
        success: false,
        action: 'entry',
        memberName: profile.full_name,
        message: 'Code QR invalide ou expiré',
        timestamp: new Date().toISOString()
      };
    }

    // 7. Vérifier les règles métier
    const { data: lastAccess } = await supabase
      .from('access_logs')
      .select('type, timestamp')
      .eq('user_id', user.id)
      .order('timestamp', { ascending: false })
      .limit(1);

    // Si c'est une entrée mais que la personne est déjà à l'intérieur
    if (action === 'entry' && lastAccess && lastAccess.length > 0 && lastAccess[0].type === 'entry') {
      return {
        success: false,
        action: 'entry',
        memberName: profile.full_name,
        message: 'Vous êtes déjà à l\'intérieur de la salle',
        timestamp: new Date().toISOString()
      };
    }

    // Si c'est une sortie mais que la personne n'est pas à l'intérieur
    if (action === 'exit' && (!lastAccess || lastAccess.length === 0 || lastAccess[0].type === 'exit')) {
      return {
        success: false,
        action: 'exit',
        memberName: profile.full_name,
        message: 'Vous n\'êtes pas à l\'intérieur de la salle',
        timestamp: new Date().toISOString()
      };
    }

    // 8. Enregistrer l'accès
    const { error: logError } = await supabase
      .from('access_logs')
      .insert({
        user_id: user.id,
        type: action,
        qr_code_scanned: qrCode,
        location: 'self_service'
      });

    if (logError) {
      console.error('❌ Erreur enregistrement accès:', logError);
      return {
        success: false,
        action,
        memberName: profile.full_name,
        message: 'Erreur lors de l\'enregistrement',
        timestamp: new Date().toISOString()
      };
    }

    const memberName = profile.full_name;
    const now = new Date().toISOString();
    
    console.log(`✅ ${actionText} enregistrée pour ${memberName}`);
    
    return {
      success: true,
      action,
      memberName,
      message: `${actionText} enregistrée avec succès !`,
      timestamp: now
    };

  } catch (error) {
    console.error('❌ Erreur memberScanQRCode:', error);
    return {
      success: false,
      action: 'entry',
      memberName: '',
      message: 'Erreur technique lors du scan',
      timestamp: new Date().toISOString()
    };
  }
};

/**
 * Récupérer l'historique d'accès du membre connecté
 */
export const getMemberAccessHistory = async (limit: number = 20): Promise<any[]> => {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return [];

    const { data: logs, error } = await supabase
      .from('access_logs')
      .select('*')
      .eq('user_id', user.id)
      .order('timestamp', { ascending: false })
      .limit(limit);

    if (error) {
      console.error('❌ Erreur getMemberAccessHistory:', error);
      return [];
    }

    return logs || [];
  } catch (error) {
    console.error('❌ Erreur getMemberAccessHistory:', error);
    return [];
  }
};

