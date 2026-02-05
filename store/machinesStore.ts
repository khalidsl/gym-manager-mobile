import { create } from 'zustand'
import { Machine, MachineSession, MachineReservation } from '../types'
import * as machinesService from '../services/machines'

interface MachinesState {
  machines: Machine[]
  selectedMachine: Machine | null
  activeSession: MachineSession | null
  reservations: MachineReservation[]
  sessionHistory: MachineSession[]
  loading: boolean
  
  // Actions
  fetchMachines: () => Promise<void>
  fetchAvailableMachines: () => Promise<void>
  selectMachine: (machine: Machine | null) => void
  fetchMachineByQRCode: (qrCode: string) => Promise<Machine | null>
  startSession: (machineId: string) => Promise<void>
  endSession: (sessionId: string, sets: number, reps: number, weight?: number, notes?: string) => Promise<void>
  fetchActiveSession: () => Promise<void>
  fetchSessionHistory: () => Promise<void>
  createReservation: (machineId: string, startTime: Date, durationMinutes: number) => Promise<void>
  cancelReservation: (reservationId: string) => Promise<void>
  fetchReservations: () => Promise<void>
  saveMachinePosition: (machineId: string, positionData: Record<string, any>) => Promise<void>
}

export const useMachinesStore = create<MachinesState>((set, get) => ({
  machines: [],
  selectedMachine: null,
  activeSession: null,
  reservations: [],
  sessionHistory: [],
  loading: false,

  fetchMachines: async () => {
    try {
      set({ loading: true })
      const machines = await machinesService.getAllMachines()
      set({ machines, loading: false })
    } catch (error) {
      console.error('Fetch Machines Error:', error)
      set({ loading: false })
      throw error
    }
  },

  fetchAvailableMachines: async () => {
    try {
      set({ loading: true })
      const machines = await machinesService.getAvailableMachines()
      set({ machines, loading: false })
    } catch (error) {
      console.error('Fetch Available Machines Error:', error)
      set({ loading: false })
      throw error
    }
  },

  selectMachine: (machine) => {
    set({ selectedMachine: machine })
  },

  fetchMachineByQRCode: async (qrCode: string) => {
    try {
      const machine = await machinesService.getMachineByQRCode(qrCode)
      if (machine) {
        set({ selectedMachine: machine })
      }
      return machine
    } catch (error) {
      console.error('Fetch Machine by QR Error:', error)
      throw error
    }
  },

  startSession: async (machineId: string) => {
    try {
      set({ loading: true })
      const session = await machinesService.startMachineSession(machineId)
      set({ activeSession: session, loading: false })
      
      // Rafraîchir la liste des machines pour mettre à jour le statut
      await get().fetchMachines()
    } catch (error) {
      console.error('Start Session Error:', error)
      set({ loading: false })
      throw error
    }
  },

  endSession: async (sessionId: string, sets: number, reps: number, weight?: number, notes?: string) => {
    try {
      set({ loading: true })
      await machinesService.endMachineSession(sessionId, sets, reps, weight, notes)
      set({ activeSession: null, loading: false })
      
      // Rafraîchir la liste des machines et l'historique
      await Promise.all([
        get().fetchMachines(),
        get().fetchSessionHistory(),
      ])
    } catch (error) {
      console.error('End Session Error:', error)
      set({ loading: false })
      throw error
    }
  },

  fetchActiveSession: async () => {
    try {
      const session = await machinesService.getActiveSession()
      set({ activeSession: session })
    } catch (error) {
      console.error('Fetch Active Session Error:', error)
      throw error
    }
  },

  fetchSessionHistory: async () => {
    try {
      const history = await machinesService.getUserSessionHistory()
      set({ sessionHistory: history })
    } catch (error) {
      console.error('Fetch Session History Error:', error)
      throw error
    }
  },

  createReservation: async (machineId: string, startTime: Date, durationMinutes: number) => {
    try {
      set({ loading: true })
      await machinesService.createReservation(machineId, startTime, durationMinutes)
      set({ loading: false })
      
      // Rafraîchir les réservations
      await get().fetchReservations()
    } catch (error) {
      console.error('Create Reservation Error:', error)
      set({ loading: false })
      throw error
    }
  },

  cancelReservation: async (reservationId: string) => {
    try {
      await machinesService.cancelReservation(reservationId)
      
      // Rafraîchir les réservations
      await get().fetchReservations()
    } catch (error) {
      console.error('Cancel Reservation Error:', error)
      throw error
    }
  },

  fetchReservations: async () => {
    try {
      const reservations = await machinesService.getUserReservations()
      set({ reservations })
    } catch (error) {
      console.error('Fetch Reservations Error:', error)
      throw error
    }
  },

  saveMachinePosition: async (machineId: string, positionData: Record<string, any>) => {
    try {
      await machinesService.saveMachinePosition(machineId, positionData)
    } catch (error) {
      console.error('Save Machine Position Error:', error)
      throw error
    }
  },
}))
