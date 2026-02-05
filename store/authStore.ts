import { create } from 'zustand'
import { Session, User } from '@supabase/supabase-js'
import { Profile, Membership } from '../types'
import * as authService from '../services/auth'
import { supabase } from '../services/supabase'

interface AuthState {
  session: Session | null
  user: User | null
  profile: Profile | null
  membership: Membership | null
  loading: boolean
  initialized: boolean
  
  // Actions
  initialize: () => Promise<void>
  signIn: (email: string, password: string) => Promise<void>
  signUp: (data: { email: string; password: string; fullName: string; phone?: string }) => Promise<void>
  signOut: () => Promise<void>
  updateProfile: (updates: Partial<Profile>) => Promise<void>
  refreshProfile: () => Promise<void>
  refreshMembership: () => Promise<void>
}

export const useAuthStore = create<AuthState>((set, get) => ({
  session: null,
  user: null,
  profile: null,
  membership: null,
  loading: true,
  initialized: false,

  initialize: async () => {
    try {
      set({ loading: true })

      // Récupérer la session actuelle
      const session = await authService.getCurrentSession()
      
      if (session) {
        const [profile, membership] = await Promise.all([
          authService.getCurrentProfile(),
          authService.getCurrentMembership(),
        ])

        set({
          session,
          user: session.user,
          profile,
          membership,
          loading: false,
          initialized: true,
        })
      } else {
        set({ loading: false, initialized: true })
      }

      // Écouter les changements d'authentification
      supabase.auth.onAuthStateChange(async (event, session) => {
        if (event === 'SIGNED_IN' && session) {
          const [profile, membership] = await Promise.all([
            authService.getCurrentProfile(),
            authService.getCurrentMembership(),
          ])

          set({
            session,
            user: session.user,
            profile,
            membership,
          })
        } else if (event === 'SIGNED_OUT') {
          set({
            session: null,
            user: null,
            profile: null,
            membership: null,
          })
        } else if (event === 'TOKEN_REFRESHED' && session) {
          set({ session, user: session.user })
        }
      })
    } catch (error) {
      console.error('Initialize Auth Error:', error)
      set({ loading: false, initialized: true })
    }
  },

  signIn: async (email: string, password: string) => {
    try {
      set({ loading: true })
      const { session, user } = await authService.signIn({ email, password })

      const [profile, membership] = await Promise.all([
        authService.getCurrentProfile(),
        authService.getCurrentMembership(),
      ])

      set({
        session,
        user,
        profile,
        membership,
        loading: false,
      })
    } catch (error) {
      set({ loading: false })
      throw error
    }
  },

  signUp: async (data) => {
    try {
      set({ loading: true })
      await authService.signUp(data)

      // Après l'inscription, récupérer les données
      const session = await authService.getCurrentSession()
      if (session) {
        const [profile, membership] = await Promise.all([
          authService.getCurrentProfile(),
          authService.getCurrentMembership(),
        ])

        set({
          session,
          user: session.user,
          profile,
          membership,
          loading: false,
        })
      }
    } catch (error) {
      set({ loading: false })
      throw error
    }
  },

  signOut: async () => {
    try {
      set({ loading: true })
      await authService.signOut()
      set({
        session: null,
        user: null,
        profile: null,
        membership: null,
        loading: false,
      })
    } catch (error) {
      set({ loading: false })
      throw error
    }
  },

  updateProfile: async (updates) => {
    try {
      const updatedProfile = await authService.updateProfile(updates)
      set({ profile: updatedProfile })
    } catch (error) {
      throw error
    }
  },

  refreshProfile: async () => {
    try {
      const profile = await authService.getCurrentProfile()
      set({ profile })
    } catch (error) {
      console.error('Refresh Profile Error:', error)
    }
  },

  refreshMembership: async () => {
    try {
      const membership = await authService.getCurrentMembership()
      set({ membership })
    } catch (error) {
      console.error('Refresh Membership Error:', error)
    }
  },
}))
