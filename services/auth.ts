import { supabase } from './supabase'
import { Profile } from '../types'

export interface SignUpData {
  email: string
  password: string
  fullName: string
  phone?: string
}

export interface SignInData {
  email: string
  password: string
}

/**
 * Génère un QR code unique pour un utilisateur
 */
const generateQRCode = (userId: string): string => {
  return `GYM-${userId.toUpperCase().substring(0, 8)}-${Date.now()}`
}

/**
 * Inscription d'un nouvel utilisateur
 */
export const signUp = async (data: SignUpData) => {
  try {
    // 1. Créer le compte utilisateur avec métadonnées
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email: data.email,
      password: data.password,
      options: {
        data: {
          full_name: data.fullName,
          phone: data.phone || null,
        }
      }
    })

    if (authError) throw authError
    if (!authData.user) throw new Error('User creation failed')

    // Le profil est créé automatiquement par le trigger Postgres

    return { user: authData.user }
  } catch (error) {
    console.error('SignUp Error:', error)
    throw error
  }
}

/**
 * Connexion d'un utilisateur
 */
export const signIn = async (data: SignInData) => {
  try {
    const { data: authData, error } = await supabase.auth.signInWithPassword({
      email: data.email,
      password: data.password,
    })

    if (error) throw error
    return authData
  } catch (error) {
    console.error('SignIn Error:', error)
    throw error
  }
}

/**
 * Déconnexion de l'utilisateur
 */
export const signOut = async () => {
  try {
    const { error } = await supabase.auth.signOut()
    if (error) throw error
  } catch (error) {
    console.error('SignOut Error:', error)
    throw error
  }
}

/**
 * Récupérer la session courante
 */
export const getCurrentSession = async () => {
  try {
    const { data, error } = await supabase.auth.getSession()
    if (error) throw error
    return data.session
  } catch (error) {
    console.error('Get Session Error:', error)
    throw error
  }
}

/**
 * Récupérer le profil de l'utilisateur connecté
 */
export const getCurrentProfile = async (): Promise<Profile | null> => {
  try {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return null

    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .maybeSingle()

    if (error) throw error
    return data
  } catch (error) {
    console.error('Get Profile Error:', error)
    throw error
  }
}

/**
 * Récupérer l'abonnement actif de l'utilisateur
 */
export const getCurrentMembership = async () => {
  try {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return null

    const { data, error } = await supabase
      .from('memberships')
      .select('*')
      .eq('user_id', user.id)
      .eq('status', 'active')
      .order('created_at', { ascending: false })
      .limit(1)
      .single()

    if (error && error.code !== 'PGRST116') throw error
    return data
  } catch (error) {
    console.error('Get Membership Error:', error)
    throw error
  }
}

/**
 * Mettre à jour le profil utilisateur
 */
export const updateProfile = async (updates: Partial<Profile>) => {
  try {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error('No authenticated user')

    const { data, error } = await supabase
      .from('profiles')
      .update(updates)
      .eq('id', user.id)
      .select()
      .single()

    if (error) throw error
    return data
  } catch (error) {
    console.error('Update Profile Error:', error)
    throw error
  }
}

/**
 * Réinitialisation du mot de passe
 */
export const resetPassword = async (email: string) => {
  try {
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: 'gymmanager://reset-password',
    })
    if (error) throw error
  } catch (error) {
    console.error('Reset Password Error:', error)
    throw error
  }
}
