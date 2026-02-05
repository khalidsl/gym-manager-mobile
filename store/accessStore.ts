import { create } from 'zustand'
import { AccessLog } from '../types'
import * as accessService from '../services/access'

interface AccessState {
  accessHistory: AccessLog[]
  currentVisitors: any[]
  isInGym: boolean
  loading: boolean
  
  // Actions
  validateAndLogEntry: (qrCode: string, location?: string) => Promise<{ success: boolean; message: string }>
  validateAndLogExit: (qrCode: string, location?: string) => Promise<{ success: boolean; message: string }>
  fetchAccessHistory: () => Promise<void>
  fetchCurrentVisitors: () => Promise<void>
  checkIfInGym: () => Promise<void>
}

export const useAccessStore = create<AccessState>((set, get) => ({
  accessHistory: [],
  currentVisitors: [],
  isInGym: false,
  loading: false,

  validateAndLogEntry: async (qrCode: string, location?: string) => {
    try {
      set({ loading: true })
      
      // Valider et enregistrer l'entrée
      const result = await accessService.logEntry(qrCode, location)
      
      set({ loading: false })
      
      // Rafraîchir l'historique et les visiteurs
      await Promise.all([
        get().fetchAccessHistory(),
        get().fetchCurrentVisitors(),
        get().checkIfInGym(),
      ])

      return {
        success: true,
        message: `Bienvenue ${result.profile?.full_name || 'utilisateur'}!`,
      }
    } catch (error: any) {
      set({ loading: false })
      return {
        success: false,
        message: error.message || 'Erreur lors de l\'enregistrement',
      }
    }
  },

  validateAndLogExit: async (qrCode: string, location?: string) => {
    try {
      set({ loading: true })
      
      // Enregistrer la sortie
      const result = await accessService.logExit(qrCode, location)
      
      set({ loading: false })
      
      // Rafraîchir l'historique et les visiteurs
      await Promise.all([
        get().fetchAccessHistory(),
        get().fetchCurrentVisitors(),
        get().checkIfInGym(),
      ])

      return {
        success: true,
        message: `Au revoir ${result.profile?.full_name || 'utilisateur'}!`,
      }
    } catch (error: any) {
      set({ loading: false })
      return {
        success: false,
        message: error.message || 'Erreur lors de l\'enregistrement',
      }
    }
  },

  fetchAccessHistory: async () => {
    try {
      const history = await accessService.getUserAccessHistory()
      set({ accessHistory: history })
    } catch (error) {
      console.error('Fetch Access History Error:', error)
      throw error
    }
  },

  fetchCurrentVisitors: async () => {
    try {
      const visitors = await accessService.getCurrentVisitors()
      set({ currentVisitors: visitors })
    } catch (error) {
      console.error('Fetch Current Visitors Error:', error)
      throw error
    }
  },

  checkIfInGym: async () => {
    try {
      const isInGym = await accessService.isUserInGym()
      set({ isInGym })
    } catch (error) {
      console.error('Check If In Gym Error:', error)
    }
  },
}))
