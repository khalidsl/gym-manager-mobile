import { supabase } from './supabase'
import { AccessLog, AccessPermission, Profile, Membership } from '../types'

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
    const now = new Date()
    const dayOfWeek = now.toLocaleDateString('en-US', { weekday: 'long' })
    const currentTime = now.toTimeString().substring(0, 5) // Format HH:MM

    const { data: permissions, error } = await supabase
      .from('access_permissions')
      .select('*')
      .eq('membership_type', membershipType)
      .maybeSingle()

    if (error || !permissions) {
      // Si pas de permissions définies, on autorise par défaut
      return true
    }

    // Vérifier le jour
    if (!permissions.allowed_days.includes(dayOfWeek)) {
      return false
    }

    // Vérifier l'heure
    if (currentTime < permissions.start_hour || currentTime > permissions.end_hour) {
      return false
    }

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
      })
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
      })
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

    const { data, error } = await supabase
      .from('access_logs')
      .select('*')
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
 * Récupérer les visiteurs actuellement dans la salle
 */
export const getCurrentVisitors = async () => {
  try {
    // Récupérer toutes les entrées récentes
    const { data: entries, error: entriesError } = await supabase
      .from('access_logs')
      .select('user_id, timestamp, profiles(full_name, avatar_url)')
      .eq('type', 'entry')
      .gte('timestamp', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString())
      .order('timestamp', { ascending: false })

    if (entriesError) throw entriesError

    // Récupérer toutes les sorties récentes
    const { data: exits, error: exitsError } = await supabase
      .from('access_logs')
      .select('user_id, timestamp')
      .eq('type', 'exit')
      .gte('timestamp', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString())
      .order('timestamp', { ascending: false })

    if (exitsError) throw exitsError

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
  } catch (error) {
    console.error('Get Current Visitors Error:', error)
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
    const { data: lastEntry } = await supabase
      .from('access_logs')
      .select('timestamp')
      .eq('user_id', user.id)
      .eq('type', 'entry')
      .order('timestamp', { ascending: false })
      .limit(1)
      .maybeSingle()

    if (!lastEntry) return false

    // Récupérer la dernière sortie
    const { data: lastExit } = await supabase
      .from('access_logs')
      .select('timestamp')
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
