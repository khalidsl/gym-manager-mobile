import { supabase } from './supabase'
import { Machine, MachineSession, MachineReservation, MachinePosition } from '../types'

/**
 * Récupérer toutes les machines
 */
export const getAllMachines = async (): Promise<Machine[]> => {
  try {
    const { data, error } = await supabase
      .from('machines')
      .select('*')
      .order('name')

    if (error) {
      console.error('getAllMachines - Supabase Error:', {
        message: error.message,
        code: error.code,
        details: error.details,
        hint: error.hint,
        error
      })
      throw error
    }
    return data || []
  } catch (error: any) {
    console.error('Get Machines Error:', {
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
 * Récupérer une machine par son ID
 */
export const getMachineById = async (machineId: string): Promise<Machine | null> => {
  try {
    const { data, error } = await supabase
      .from('machines')
      .select('*')
      .eq('id', machineId)
      .single()

    if (error) throw error
    return data
  } catch (error) {
    console.error('Get Machine Error:', error)
    throw error
  }
}

/**
 * Récupérer une machine par son QR code
 */
export const getMachineByQRCode = async (qrCode: string): Promise<Machine | null> => {
  try {
    const { data, error } = await supabase
      .from('machines')
      .select('*')
      .eq('qr_code', qrCode)
      .single()

    if (error && error.code !== 'PGRST116') throw error
    return data
  } catch (error) {
    console.error('Get Machine by QR Error:', error)
    throw error
  }
}

/**
 * Récupérer les machines disponibles
 */
export const getAvailableMachines = async (): Promise<Machine[]> => {
  try {
    const { data, error } = await supabase
      .from('machines')
      .select('*')
      .eq('status', 'available')
      .order('name')

    if (error) throw error
    return data || []
  } catch (error) {
    console.error('Get Available Machines Error:', error)
    throw error
  }
}

/**
 * Mettre à jour le statut d'une machine
 */
export const updateMachineStatus = async (
  machineId: string,
  status: 'available' | 'in_use' | 'maintenance'
) => {
  try {
    const { data, error } = await supabase
      .from('machines')
      .update({ status })
      .eq('id', machineId)
      .select()
      .single()

    if (error) throw error
    return data
  } catch (error) {
    console.error('Update Machine Status Error:', error)
    throw error
  }
}

/**
 * Démarrer une session d'entraînement sur une machine
 */
export const startMachineSession = async (machineId: string) => {
  try {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error('No authenticated user')

    // Vérifier si la machine est disponible
    const machine = await getMachineById(machineId)
    if (!machine) throw new Error('Machine not found')
    if (machine.status !== 'available') throw new Error('Machine is not available')

    // Créer la session
    const { data: session, error: sessionError } = await supabase
      .from('machine_sessions')
      .insert([
        {
          user_id: user.id,
          machine_id: machineId,
          start_time: new Date().toISOString(),
          sets: 0,
          reps: 0,
        }
      ])
      .select()
      .single()

    if (sessionError) throw sessionError

    // Mettre à jour le statut de la machine
    await updateMachineStatus(machineId, 'in_use')

    return session
  } catch (error) {
    console.error('Start Session Error:', error)
    throw error
  }
}

/**
 * Terminer une session d'entraînement
 */
export const endMachineSession = async (
  sessionId: string,
  sets: number,
  reps: number,
  weight?: number,
  notes?: string
) => {
  try {
    const { data: session, error } = await supabase
      .from('machine_sessions')
      .update({
        end_time: new Date().toISOString(),
        sets,
        reps,
        weight: weight || null,
        notes: notes || null,
      })
      .eq('id', sessionId)
      .select()
      .single()

    if (error) throw error

    // Remettre la machine disponible
    if (session) {
      await updateMachineStatus(session.machine_id, 'available')
    }

    return session
  } catch (error) {
    console.error('End Session Error:', error)
    throw error
  }
}

/**
 * Récupérer la session active de l'utilisateur
 */
export const getActiveSession = async (): Promise<MachineSession | null> => {
  try {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return null

    const { data, error } = await supabase
      .from('machine_sessions')
      .select('*')
      .eq('user_id', user.id)
      .is('end_time', null)
      .order('start_time', { ascending: false })
      .limit(1)
      .single()

    if (error && error.code !== 'PGRST116') throw error
    return data
  } catch (error) {
    console.error('Get Active Session Error:', error)
    throw error
  }
}

/**
 * Récupérer l'historique des sessions de l'utilisateur
 */
export const getUserSessionHistory = async (limit = 20): Promise<MachineSession[]> => {
  try {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return []

    const { data, error } = await supabase
      .from('machine_sessions')
      .select('*')
      .eq('user_id', user.id)
      .not('end_time', 'is', null)
      .order('start_time', { ascending: false })
      .limit(limit)

    if (error) throw error
    return data || []
  } catch (error) {
    console.error('Get Session History Error:', error)
    throw error
  }
}

/**
 * Récupérer l'historique des sessions pour une machine spécifique
 */
export const getMachineSessionHistory = async (machineId: string, limit = 10): Promise<MachineSession[]> => {
  try {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return []

    const { data, error } = await supabase
      .from('machine_sessions')
      .select('*')
      .eq('user_id', user.id)
      .eq('machine_id', machineId)
      .not('end_time', 'is', null)
      .order('start_time', { ascending: false })
      .limit(limit)

    if (error) throw error
    return data || []
  } catch (error) {
    console.error('Get Machine Session History Error:', error)
    return []
  }
}

/**
 * Calculer les statistiques pour une machine
 */
export const getMachineStats = async (machineId: string) => {
  try {
    const sessions = await getMachineSessionHistory(machineId, 50)
    
    if (sessions.length === 0) {
      return {
        totalSessions: 0,
        totalSets: 0,
        totalReps: 0,
        maxWeight: 0,
        avgWeight: 0,
        lastSession: null,
        progression: 'neutral' as 'up' | 'down' | 'neutral'
      }
    }

    const totalSessions = sessions.length
    const totalSets = sessions.reduce((sum, s) => sum + (s.sets || 0), 0)
    const totalReps = sessions.reduce((sum, s) => sum + (s.reps || 0), 0)
    const weights = sessions.filter(s => s.weight).map(s => s.weight!)
    const maxWeight = weights.length > 0 ? Math.max(...weights) : 0
    const avgWeight = weights.length > 0 ? weights.reduce((a, b) => a + b, 0) / weights.length : 0
    const lastSession = sessions[0]

    // Calculer la progression (comparer les 3 dernières avec les 3 précédentes)
    let progression: 'up' | 'down' | 'neutral' = 'neutral'
    if (sessions.length >= 6) {
      const recent = sessions.slice(0, 3).filter(s => s.weight).map(s => s.weight!)
      const previous = sessions.slice(3, 6).filter(s => s.weight).map(s => s.weight!)
      
      if (recent.length > 0 && previous.length > 0) {
        const recentAvg = recent.reduce((a, b) => a + b, 0) / recent.length
        const previousAvg = previous.reduce((a, b) => a + b, 0) / previous.length
        
        if (recentAvg > previousAvg * 1.05) progression = 'up'
        else if (recentAvg < previousAvg * 0.95) progression = 'down'
      }
    }

    return {
      totalSessions,
      totalSets,
      totalReps,
      maxWeight,
      avgWeight,
      lastSession,
      progression
    }
  } catch (error) {
    console.error('Get Machine Stats Error:', error)
    return {
      totalSessions: 0,
      totalSets: 0,
      totalReps: 0,
      maxWeight: 0,
      avgWeight: 0,
      lastSession: null,
      progression: 'neutral' as 'up' | 'down' | 'neutral'
    }
  }
}

/**
 * Créer une réservation de machine
 */
export const createReservation = async (
  machineId: string,
  startTime: Date,
  durationMinutes: number
) => {
  try {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error('No authenticated user')

    const endTime = new Date(startTime)
    endTime.setMinutes(endTime.getMinutes() + durationMinutes)

    const { data, error } = await supabase
      .from('machine_reservations')
      .insert([
        {
          user_id: user.id,
          machine_id: machineId,
          start_time: startTime.toISOString(),
          end_time: endTime.toISOString(),
          status: 'pending',
        }
      ])
      .select()
      .single()

    if (error) throw error
    return data
  } catch (error) {
    console.error('Create Reservation Error:', error)
    throw error
  }
}

/**
 * Annuler une réservation
 */
export const cancelReservation = async (reservationId: string) => {
  try {
    const { data, error } = await supabase
      .from('machine_reservations')
      .update({ status: 'cancelled' })
      .eq('id', reservationId)
      .select()
      .single()

    if (error) throw error
    return data
  } catch (error) {
    console.error('Cancel Reservation Error:', error)
    throw error
  }
}

/**
 * Récupérer les réservations actives de l'utilisateur
 */
export const getUserReservations = async (): Promise<MachineReservation[]> => {
  try {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return []

    const { data, error } = await supabase
      .from('machine_reservations')
      .select('*')
      .eq('user_id', user.id)
      .in('status', ['pending', 'confirmed'])
      .order('start_time')

    if (error) throw error
    return data || []
  } catch (error) {
    console.error('Get User Reservations Error:', error)
    throw error
  }
}

/**
 * Sauvegarder les réglages personnalisés d'une machine
 */
export const saveMachinePosition = async (
  machineId: string,
  positionData: Record<string, any>
) => {
  try {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error('No authenticated user')

    // Vérifier si des réglages existent déjà
    const { data: existing } = await supabase
      .from('machine_positions')
      .select('id')
      .eq('user_id', user.id)
      .eq('machine_id', machineId)
      .single()

    if (existing) {
      // Mettre à jour
      const { data, error } = await supabase
        .from('machine_positions')
        .update({ position_data: positionData })
        .eq('id', existing.id)
        .select()
        .single()

      if (error) throw error
      return data
    } else {
      // Créer
      const { data, error } = await supabase
        .from('machine_positions')
        .insert([
          {
            user_id: user.id,
            machine_id: machineId,
            position_data: positionData,
          }
        ])
        .select()
        .single()

      if (error) throw error
      return data
    }
  } catch (error) {
    console.error('Save Machine Position Error:', error)
    throw error
  }
}

/**
 * Récupérer les réglages sauvegardés pour une machine
 */
export const getMachinePosition = async (machineId: string): Promise<MachinePosition | null> => {
  try {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return null

    const { data, error } = await supabase
      .from('machine_positions')
      .select('*')
      .eq('user_id', user.id)
      .eq('machine_id', machineId)
      .single()

    if (error && error.code !== 'PGRST116') throw error
    return data
  } catch (error) {
    console.error('Get Machine Position Error:', error)
    throw error
  }
}
