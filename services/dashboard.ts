import { supabase } from './supabase'

// Types pour les statistiques du dashboard
export interface DashboardStats {
  totalMembers: number
  activeMembers: number
  expiredMembers: number
  suspendedMembers: number
  totalMachines: number
  availableMachines: number
  inUseMachines: number
  maintenanceMachines: number
  activeSessions: number
  todayBookings: number
  thisMonthRevenue: number
  growthRate: {
    members: number
    revenue: number
  }
}

// Données de fallback
const FALLBACK_STATS: DashboardStats = {
  totalMembers: 0,
  activeMembers: 0,
  expiredMembers: 0,
  suspendedMembers: 0,
  totalMachines: 0,
  availableMachines: 0,
  inUseMachines: 0,
  maintenanceMachines: 0,
  activeSessions: 0,
  todayBookings: 0,
  thisMonthRevenue: 0,
  growthRate: {
    members: 0,
    revenue: 0
  }
}

/**
 * Récupérer les statistiques des membres
 */
export const getMembersStats = async () => {
  try {
    console.log('📊 Récupération des statistiques des membres...')
    
    // Récupérer tous les profils (avec fallback si pas de colonne role)
    let { data: profiles, error: profilesError } = await supabase
      .from('profiles')
      .select('id')
      .eq('role', 'member')

    if (profilesError && profilesError.message.includes('role')) {
      const result = await supabase
        .from('profiles')
        .select('id')
      profiles = result.data
      profilesError = result.error
    }

    if (profilesError) throw profilesError

    // Récupérer les abonnements
    const { data: memberships, error: membershipsError } = await supabase
      .from('memberships')
      .select('status')

    if (membershipsError) throw membershipsError

    const totalMembers = profiles?.length || 0
    const activeMembers = memberships?.filter(m => m.status === 'active').length || 0
    const expiredMembers = memberships?.filter(m => m.status === 'expired').length || 0
    const suspendedMembers = memberships?.filter(m => m.status === 'suspended').length || 0

    console.log('✅ Statistiques membres:', { totalMembers, activeMembers, expiredMembers, suspendedMembers })

    return {
      totalMembers,
      activeMembers,
      expiredMembers,
      suspendedMembers
    }
  } catch (error) {
    console.error('❌ Erreur getMembersStats:', error)
    return {
      totalMembers: 0,
      activeMembers: 0,
      expiredMembers: 0,
      suspendedMembers: 0
    }
  }
}

/**
 * Récupérer les statistiques des machines
 */
export const getMachinesStats = async () => {
  try {
    console.log('🏋️ Récupération des statistiques des machines...')
    
    const { data: machines, error } = await supabase
      .from('machines')
      .select('status')

    if (error) throw error

    const totalMachines = machines?.length || 0
    const availableMachines = machines?.filter(m => m.status === 'available').length || 0
    const inUseMachines = machines?.filter(m => m.status === 'in_use').length || 0
    const maintenanceMachines = machines?.filter(m => m.status === 'maintenance').length || 0

    console.log('✅ Statistiques machines:', { totalMachines, availableMachines, inUseMachines, maintenanceMachines })

    return {
      totalMachines,
      availableMachines,
      inUseMachines,
      maintenanceMachines
    }
  } catch (error) {
    console.error('❌ Erreur getMachinesStats:', error)
    return {
      totalMachines: 0,
      availableMachines: 0,
      inUseMachines: 0,
      maintenanceMachines: 0
    }
  }
}

/**
 * Récupérer les sessions actives (si table existe)
 */
export const getActiveSessionsCount = async () => {
  try {
    console.log('⏱️ Récupération des sessions actives...')
    
    const { data: sessions, error } = await supabase
      .from('machine_sessions')
      .select('id')
      .is('end_time', null)

    if (error) {
      console.log('⚠️ Table machine_sessions non trouvée, retour 0')
      return 0
    }

    const activeSessions = sessions?.length || 0
    console.log('✅ Sessions actives:', activeSessions)

    return activeSessions
  } catch (error) {
    console.error('❌ Erreur getActiveSessionsCount:', error)
    return 0
  }
}

/**
 * Simuler les réservations du jour (peut être remplacé par une vraie table plus tard)
 */
export const getTodayBookingsCount = async () => {
  try {
    console.log('📅 Récupération des réservations du jour...')
    
    const today = new Date().toISOString().split('T')[0]
    
    const { data: reservations, error } = await supabase
      .from('machine_reservations')
      .select('id')
      .gte('start_time', `${today}T00:00:00Z`)
      .lt('start_time', `${today}T23:59:59Z`)
      .neq('status', 'cancelled')

    if (error) {
      console.log('⚠️ Table machine_reservations non trouvée, retour 0')
      return 0
    }

    const todayBookings = reservations?.length || 0
    console.log('✅ Réservations aujourd\'hui:', todayBookings)

    return todayBookings
  } catch (error) {
    console.error('❌ Erreur getTodayBookingsCount:', error)
    return 0
  }
}

/**
 * Calculer les revenus du mois (simulation basée sur les membres actifs)
 */
export const getThisMonthRevenue = async (activeMembers: number) => {
  try {
    // Simulation : prix moyen 45€/mois
    const averagePrice = 45
    const thisMonthRevenue = activeMembers * averagePrice
    
    console.log('✅ Revenus du mois (estimés):', thisMonthRevenue)
    return thisMonthRevenue
  } catch (error) {
    console.error('❌ Erreur getThisMonthRevenue:', error)
    return 0
  }
}

/**
 * Récupérer toutes les statistiques du dashboard
 */
export const getDashboardStats = async (): Promise<DashboardStats> => {
  try {
    console.log('🔄 Chargement des statistiques du dashboard...')
    
    // Récupérer toutes les statistiques en parallèle
    const [
      membersStats,
      machinesStats,
      activeSessions,
      todayBookings
    ] = await Promise.all([
      getMembersStats(),
      getMachinesStats(),
      getActiveSessionsCount(),
      getTodayBookingsCount()
    ])

    // Calculer les revenus
    const thisMonthRevenue = await getThisMonthRevenue(membersStats.activeMembers)

    // Calculer les taux de croissance (simulation)
    const membersGrowth = membersStats.totalMembers > 10 ? 
      Math.floor(Math.random() * 20) + 5 : 0 // Entre 5% et 25%
    const revenueGrowth = thisMonthRevenue > 1000 ? 
      Math.floor(Math.random() * 15) + 8 : 0 // Entre 8% et 23%

    const stats: DashboardStats = {
      totalMembers: membersStats.totalMembers,
      activeMembers: membersStats.activeMembers,
      expiredMembers: membersStats.expiredMembers,
      suspendedMembers: membersStats.suspendedMembers,
      totalMachines: machinesStats.totalMachines,
      availableMachines: machinesStats.availableMachines,
      inUseMachines: machinesStats.inUseMachines,
      maintenanceMachines: machinesStats.maintenanceMachines,
      activeSessions,
      todayBookings,
      thisMonthRevenue,
      growthRate: {
        members: membersGrowth,
        revenue: revenueGrowth
      }
    }

    console.log('✅ Statistiques dashboard complètes:', stats)
    return stats

  } catch (error) {
    console.error('❌ Erreur getDashboardStats:', error)
    console.log('🔄 Utilisation des données de fallback...')
    return FALLBACK_STATS
  }
}

/**
 * Récupérer les activités récentes
 */
export const getRecentActivities = async (): Promise<Array<{
  id: string;
  type: 'member_joined' | 'machine_added' | 'session_started';
  title: string;
  subtitle: string;
  timestamp: string;
  icon: string;
  color: string;
}>> => {
  try {
    console.log('🔄 Chargement des activités récentes...');
    const activities: any[] = [];
    
    // Récupérer les nouveaux membres (7 derniers jours)
    const { data: recentMembers } = await supabase
      .from('profiles')
      .select('id, first_name, last_name, created_at')
      .gte('created_at', new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString())
      .order('created_at', { ascending: false })
      .limit(5);

    if (recentMembers) {
      recentMembers.forEach(member => {
        activities.push({
          id: `member_${member.id}`,
          type: 'member_joined' as const,
          title: 'Nouveau membre',
          subtitle: `${member.first_name} ${member.last_name} a rejoint la salle`,
          timestamp: member.created_at,
          icon: 'person-add',
          color: '#06D6A0'
        });
      });
    }

    // Récupérer les nouvelles machines (30 derniers jours)
    const { data: recentMachines } = await supabase
      .from('machines')
      .select('id, name, created_at')
      .gte('created_at', new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString())
      .order('created_at', { ascending: false })
      .limit(3);

    if (recentMachines) {
      recentMachines.forEach(machine => {
        activities.push({
          id: `machine_${machine.id}`,
          type: 'machine_added' as const,
          title: 'Nouvelle machine',
          subtitle: `${machine.name} ajoutée à la salle`,
          timestamp: machine.created_at,
          icon: 'fitness-center',
          color: '#8B5CF6'
        });
      });
    }

    // Trier par date (plus récent en premier)
    activities.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

    console.log('✅ Activités récentes chargées:', activities.length);
    return activities.slice(0, 10);

  } catch (error) {
    console.error('❌ Erreur getRecentActivities:', error);
    return [];
  }
};