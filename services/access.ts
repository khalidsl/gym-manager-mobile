import { supabase } from './supabase'
import { AccessLog, Profile, Membership } from '../types'

// Types supplémentaires pour le système d'accès
export interface AccessLogEntry {
  id: string;
  member_id: string;
  member_name: string;
  member_email: string;
  member_qr_code: string;
  action: 'entry' | 'exit';
  timestamp: string;
}

export interface MemberAccess {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  qr_code: string;
  membership_status: string;
  membership_end_date: string;
  last_access?: string;
  is_inside: boolean;
}

/**
 * Scanner un code QR et gérer automatiquement l'entrée/sortie
 */
export const scanQRCode = async (qrCode: string): Promise<{
  success: boolean;
  action?: 'entry' | 'exit';
  memberName?: string;
  message: string;
}> => {
  try {
    console.log('🔍 Scan du code QR:', qrCode);

    // 1. Vérifier si le membre existe
    const { data: member, error: memberError } = await supabase
      .from('profiles')
      .select(`
        id,
        full_name,
        email,
        qr_code,
        memberships (
          status,
          end_date,
          type
        )
      `)
      .eq('qr_code', qrCode)
      .single();

    if (memberError || !member) {
      console.error('❌ Membre non trouvé:', memberError);
      return {
        success: false,
        message: 'Code QR invalide ou membre non trouvé'
      };
    }

    // 2. Vérifier le statut de l'abonnement
    const activeMembership = member.memberships?.find(m => m.status === 'active');
    if (!activeMembership) {
      return {
        success: false,
        message: `${member.full_name} - Abonnement expiré ou suspendu`
      };
    }

    // 3. Vérifier si l'abonnement n'a pas expiré
    const endDate = new Date(activeMembership.end_date);
    const today = new Date();
    if (endDate < today) {
      return {
        success: false,
        message: `${member.full_name} - Abonnement expiré depuis le ${endDate.toLocaleDateString('fr-FR')}`
      };
    }

    // 4. Déterminer l'action (entrée ou sortie)
    const { data: lastAccess } = await (supabase
      .from('access_logs')
      .select('type, timestamp') as any)
      .eq('user_id', member.id)
      .order('timestamp', { ascending: false })
      .limit(1);

    let action: 'entry' | 'exit' = 'entry'; // Par défaut : entrée
    
    if (lastAccess && lastAccess.length > 0) {
      const lastAction = lastAccess[0].type;
      // Si la dernière action était une entrée, alors cette fois c'est une sortie
      action = lastAction === 'entry' ? 'exit' : 'entry';
    }

    // 5. Enregistrer l'accès
    const { error: logError } = await supabase
      .from('access_logs')
      .insert({
        user_id: member.id,
        type: action,
        qr_code_scanned: qrCode,
        location: 'main_entrance'
      } as any);

    if (logError) {
      console.error('❌ Erreur lors de l\'enregistrement:', logError);
      return {
        success: false,
        message: 'Erreur lors de l\'enregistrement de l\'accès'
      };
    }

    const actionText = action === 'entry' ? 'Entrée' : 'Sortie';
    const memberName = member.full_name;
    
    console.log(`✅ ${actionText} enregistrée pour ${memberName}`);
    
    return {
      success: true,
      action: action,
      memberName: memberName,
      message: `${actionText} autorisée pour ${memberName}`
    };

  } catch (error) {
    console.error('❌ Erreur scanQRCode:', error);
    return {
      success: false,
      message: 'Erreur technique lors du scan'
    };
  }
};

/**
 * Générer un code QR unique pour un membre
 */
export const generateMemberQRCode = (memberId: string, email: string): string => {
  // Format: GYM_MEMBER_{MEMBER_ID}_{TIMESTAMP}
  const timestamp = Date.now();
  const qrCode = `GYM_MEMBER_${memberId.slice(0, 8)}_${timestamp}`;
  console.log(`✅ Code QR généré pour ${email}: ${qrCode}`);
  return qrCode;
};

/**
 * Vérifier si un QR code est valide et actif
 */
export const validateQRCode = async (qrCode: string) => {
  try {
    // 1. Trouver le profil avec ce QR code
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('*')
      .eq('qr_code', qrCode)
      .single()

    if (profileError || !profile) {
      return { valid: false, message: 'QR code invalide', profile: null, membership: null }
    }

    // 2. Vérifier l'abonnement
    const { data: membership, error: membershipError } = await supabase
      .from('memberships')
      .select('*')
      .eq('user_id', profile.id)
      .eq('status', 'active')
      .order('created_at', { ascending: false })
      .limit(1)
      .single()

    if (membershipError || !membership) {
      return { 
        valid: false, 
        message: 'Aucun abonnement actif',
        profile,
        membership: null
      }
    }

    // 3. Vérifier la date d'expiration
    const now = new Date()
    const endDate = new Date(membership.end_date)
    
    if (now > endDate) {
      return { 
        valid: false, 
        message: 'Abonnement expiré',
        profile,
        membership 
      }
    }

    // 4. Vérifier les permissions horaires
    const hasAccess = await checkAccessPermissions(membership.type)
    
    if (!hasAccess) {
      return { 
        valid: false, 
        message: 'Accès non autorisé à cette heure',
        profile,
        membership 
      }
    }

    return { 
      valid: true, 
      message: 'Accès autorisé',
      profile,
      membership 
    }
  } catch (error) {
    console.error('Validate QR Code Error:', error)
    throw error
  }
}

/**
 * Vérifier les permissions d'accès selon le type d'abonnement
 */
export const checkAccessPermissions = async (membershipType: 'basic' | 'premium' | 'vip'): Promise<boolean> => {
  try {
    // Note: Vérification simplifiée car 'access_permissions' n'est pas dans le schéma actuel
    // En attendant la création de la table, on autorise l'accès
    return true
  } catch (error) {
    console.error('Check Access Permissions Error:', error)
    return true // En cas d'erreur, on autorise par défaut
  }
}

/**
 * Enregistrer une entrée
 */
export const logEntry = async (qrCode: string, location?: string) => {
  try {
    const validation = await validateQRCode(qrCode)
    
    if (!validation.valid || !validation.profile) {
      throw new Error(validation.message)
    }

    const { data, error } = await supabase
      .from('access_logs')
      .insert({
        user_id: validation.profile.id,
        type: 'entry',
        qr_code_scanned: qrCode,
        location: location || null,
      } as any)
      .select()
      .single()

    if (error) throw error

    return {
      success: true,
      log: data,
      profile: validation.profile,
      membership: validation.membership,
    }
  } catch (error) {
    console.error('Log Entry Error:', error)
    throw error
  }
}

/**
 * Enregistrer une sortie
 */
export const logExit = async (qrCode: string, location?: string) => {
  try {
    // Trouver le profil
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('*')
      .eq('qr_code', qrCode)
      .maybeSingle()

    if (profileError || !profile) {
      throw new Error('QR code invalide')
    }

    const { data, error } = await supabase
      .from('access_logs')
      .insert({
        user_id: profile.id,
        type: 'exit',
        qr_code_scanned: qrCode,
        location: location || null,
      } as any)
      .select()
      .single()

    if (error) throw error

    return {
      success: true,
      log: data,
      profile,
    }
  } catch (error) {
    console.error('Log Exit Error:', error)
    throw error
  }
}

/**
 * Récupérer l'historique d'accès d'un utilisateur
 */
export const getUserAccessHistory = async (limit = 20): Promise<AccessLog[]> => {
  try {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return []

    const { data, error } = await (supabase
      .from('access_logs')
      .select('*') as any)
      .eq('user_id', user.id)
      .order('timestamp', { ascending: false })
      .limit(limit)

    if (error) throw error
    return data || []
  } catch (error) {
    console.error('Get Access History Error:', error)
    throw error
  }
}

/**
 * Récupérer l'historique complet des accès (pour admin)
 */
export const getAccessLogs = async (limit: number = 50): Promise<AccessLogEntry[]> => {
  try {
    const { data: logs, error } = await (supabase
      .from('access_logs')
      .select(`
        id,
        user_id,
        type,
        timestamp
      `) as any)
      .order('timestamp', { ascending: false })
      .limit(limit);

    if (error) {
      console.error('❌ Erreur getAccessLogs:', JSON.stringify(error, null, 2));
      console.error('❌ Détails getAccessLogs:', error.message, error.code, error.details);
      return [];
    }

    // Transformer les données pour le format attendu
    const formattedLogs: AccessLogEntry[] = logs?.map((log: any) => ({
      id: log.id,
      member_id: log.user_id,
      member_name: '', // Pas de profile disponible dans cette requête simple
      member_email: '',
      member_qr_code: '',
      action: log.type as 'entry' | 'exit',
      timestamp: log.timestamp
    })) || [];

    return formattedLogs;
  } catch (error) {
    console.error('❌ Erreur getAccessLogs:', JSON.stringify(error, null, 2));
    console.error('❌ Catch getAccessLogs:', error);
    return [];
  }
};

/**
 * Récupérer les accès d'aujourd'hui
 */
export const getTodayAccessLogs = async (): Promise<AccessLogEntry[]> => {
  try {
    const today = new Date();
    const startOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate()).toISOString();
    const endOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate() + 1).toISOString();

    const { data: logs, error } = await (supabase
      .from('access_logs')
      .select(`
        id,
        user_id,
        type,
        timestamp,
        profiles (
          full_name,
          email,
          qr_code
        )
      `) as any)
      .gte('timestamp', startOfDay)
      .lt('timestamp', endOfDay)
      .order('timestamp', { ascending: false });

    if (error) {
      console.error('❌ Erreur getTodayAccessLogs:', JSON.stringify(error, null, 2));
      console.error('❌ Détails erreur:', error.message, error.code, error.details);
      return [];
    }

    const formattedLogs: AccessLogEntry[] = logs?.map((log: any) => ({
      id: log.id,
      member_id: log.user_id,
      member_name: log.profiles?.full_name || '',
      member_email: log.profiles?.email || '',
      member_qr_code: log.profiles?.qr_code || '',
      action: log.type as 'entry' | 'exit',
      timestamp: log.timestamp
    })) || [];

    return formattedLogs;
  } catch (error) {
    console.error('❌ Erreur getTodayAccessLogs:', JSON.stringify(error, null, 2));
    console.error('❌ Catch getTodayAccessLogs:', error);
    return [];
  }
};

/**
 * Obtenir les membres actuellement présents dans la salle
 */
export const getMembersInside = async (): Promise<MemberAccess[]> => {
  try {
    // Étape 1 : Récupérer tous les derniers accès
    const { data: lastAccesses, error } = await (supabase
      .from('access_logs')
      .select('user_id, type, timestamp') as any)
      .order('timestamp', { ascending: false });

    if (error) {
      console.error('❌ Erreur getMembersInside:', error.message);
      return [];
    }

    console.log('📊 getMembersInside - total access_logs:', lastAccesses?.length);

    // Étape 2 : Garder uniquement le dernier accès par membre
    const memberLastAccess = new Map<string, any>();
    lastAccesses?.forEach((access: any) => {
      if (!memberLastAccess.has(access.user_id)) {
        memberLastAccess.set(access.user_id, access);
      }
    });

    console.log('👥 getMembersInside - membres uniques:', memberLastAccess.size);
    memberLastAccess.forEach((access, uid) => {
      console.log(`  user: ${uid?.slice(0,8)} | type: ${access.type} | ts: ${access.timestamp}`);
    });

    // Étape 3 : Filtrer ceux dont le dernier accès est une entrée
    const insideUserIds: string[] = [];
    const insideTimestamps = new Map<string, string>();
    memberLastAccess.forEach((access) => {
      if (access.type === 'entry') {
        insideUserIds.push(access.user_id);
        insideTimestamps.set(access.user_id, access.timestamp);
      }
    });

    console.log('🏋️ getMembersInside - membres à l\'intérieur:', insideUserIds.length);

    if (insideUserIds.length === 0) {
      return [];
    }

    // Étape 4 : Récupérer les profils de ces membres
    const { data: profiles, error: profilesError } = await supabase
      .from('profiles')
      .select(`
        id,
        full_name,
        email,
        qr_code,
        memberships (
          status,
          end_date
        )
      `)
      .in('id', insideUserIds);

    if (profilesError) {
      console.error('❌ Erreur profils getMembersInside:', profilesError.message);
      return [];
    }

    // Étape 5 : Construire la liste finale
    const membersInside: MemberAccess[] = (profiles || []).map((profile: any) => {
      const activeMembership = profile.memberships?.find((m: any) => m.status === 'active');
      const nameParts = (profile.full_name || '').split(' ');
      const first_name = nameParts[0] || '';
      const last_name = nameParts.slice(1).join(' ') || '';

      return {
        id: profile.id,
        first_name,
        last_name,
        email: profile.email || '',
        qr_code: profile.qr_code || '',
        membership_status: activeMembership?.status || 'inactive',
        membership_end_date: activeMembership?.end_date || '',
        last_access: insideTimestamps.get(profile.id),
        is_inside: true,
      };
    });

    return membersInside;

  } catch (error) {
    console.error('❌ Erreur getMembersInside:', error);
    return [];
  }
};

/**
 * Statistiques d'accès pour le dashboard
 */
export const getAccessStats = async (): Promise<{
  todayEntries: number;
  todayExits: number;
  currentlyInside: number;
  peakHour: string;
}> => {
  try {
    const todayLogs = await getTodayAccessLogs();
    
    const entries = todayLogs.filter(log => log.action === 'entry').length;
    const exits = todayLogs.filter(log => log.action === 'exit').length;
    const currentlyInside = (await getMembersInside()).length;
    
    // Calculer l'heure de pointe (heure approximative)
    const hourCounts = new Map();
    todayLogs.forEach(log => {
      const hour = new Date(log.timestamp).getHours();
      hourCounts.set(hour, (hourCounts.get(hour) || 0) + 1);
    });
    
    let peakHour = '08:00';
    let maxCount = 0;
    hourCounts.forEach((count, hour) => {
      if (count > maxCount) {
        maxCount = count;
        peakHour = `${hour.toString().padStart(2, '0')}:00`;
      }
    });

    return {
      todayEntries: entries,
      todayExits: exits,
      currentlyInside,
      peakHour
    };
  } catch (error) {
    console.error('❌ Erreur getAccessStats:', error);
    return {
      todayEntries: 0,
      todayExits: 0,
      currentlyInside: 0,
      peakHour: '08:00'
    };
  }
};

/**
 * Récupérer les visiteurs actuellement dans la salle
 */
export const getCurrentVisitors = async () => {
  try {
    // Récupérer toutes les entrées récentes
    const { data: entries, error: entriesError } = await (supabase
      .from('access_logs')
      .select('user_id, timestamp, profiles(full_name, avatar_url)') as any)
      .eq('type', 'entry')
      .gte('timestamp', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString())
      .order('timestamp', { ascending: false })

    if (entriesError) {
      console.error('getCurrentVisitors - Entries Error:', entriesError.message, entriesError)
      throw entriesError
    }

    // Récupérer toutes les sorties récentes
    const { data: exits, error: exitsError } = await (supabase
      .from('access_logs')
      .select('user_id, timestamp') as any)
      .eq('type', 'exit')
      .gte('timestamp', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString())
      .order('timestamp', { ascending: false })

    if (exitsError) {
      console.error('getCurrentVisitors - Exits Error:', exitsError.message, exitsError)
      throw exitsError
    }

    // Filtrer pour ne garder que ceux qui sont entrés sans être sortis
    const visitors = new Map()
    
    entries?.forEach((entry: any) => {
      const hasExited = exits?.some(
        (exit: any) => exit.user_id === entry.user_id && exit.timestamp > entry.timestamp
      )
      
      if (!hasExited && !visitors.has(entry.user_id)) {
        visitors.set(entry.user_id, {
          userId: entry.user_id,
          entryTime: entry.timestamp,
          profile: entry.profiles,
        })
      }
    })

    return Array.from(visitors.values())
  } catch (error: any) {
    console.error('Get Current Visitors Error:', {
      message: error?.message,
      code: error?.code,
      details: error?.details,
      hint: error?.hint,
      error
    })
    throw error
  }
}

/**
 * Vérifier si l'utilisateur est actuellement dans la salle
 */
export const isUserInGym = async (): Promise<boolean> => {
  try {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return false

    // Récupérer la dernière entrée
    const { data: lastEntry } = await (supabase
      .from('access_logs')
      .select('timestamp') as any)
      .eq('user_id', user.id)
      .eq('type', 'entry')
      .order('timestamp', { ascending: false })
      .limit(1)
      .maybeSingle()

    if (!lastEntry) return false

    // Récupérer la dernière sortie
    const { data: lastExit } = await (supabase
      .from('access_logs')
      .select('timestamp') as any)
      .eq('user_id', user.id)
      .eq('type', 'exit')
      .order('timestamp', { ascending: false })
      .limit(1)
      .maybeSingle()

    // Si pas de sortie, ou si l'entrée est plus récente que la sortie
    if (!lastExit || new Date(lastEntry.timestamp) > new Date(lastExit.timestamp)) {
      return true
    }

    return false
  } catch (error) {
    console.error('Is User In Gym Error:', error)
    return false
  }
}
