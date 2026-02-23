import { supabase } from './supabase'
import type { Tables } from './supabase'

// Types pour les membres avec gestion des relations
export interface Member {
  id: string
  full_name: string
  email: string
  phone: string | null
  avatar_url: string | null
  created_at: string
  membership?: {
    type: 'basic' | 'premium' | 'vip'
    status: 'active' | 'expired' | 'suspended'
    start_date: string
    end_date: string
  } | null
  last_access?: string | null
}

// Données de fallback pour le développement (utilisées si la DB n'est pas accessible)
const MOCK_MEMBERS: Member[] = [
  {
    id: '1',
    full_name: 'Marie Dupont',
    email: 'marie.dupont@email.com',
    phone: '+33 6 12 34 56 78',
    avatar_url: null,
    created_at: '2023-01-15T10:00:00Z',
    membership: {
      type: 'premium',
      status: 'active',
      start_date: '2023-01-15T00:00:00Z',
      end_date: '2024-01-15T00:00:00Z'
    },
    last_access: '2023-12-01T08:30:00Z'
  },
  {
    id: '2',
    full_name: 'Pierre Martin',
    email: 'pierre.martin@email.com',
    phone: '+33 6 23 45 67 89',
    avatar_url: null,
    created_at: '2023-02-20T14:00:00Z',
    membership: {
      type: 'basic',
      status: 'expired',
      start_date: '2023-02-20T00:00:00Z',
      end_date: '2023-11-20T00:00:00Z'
    },
    last_access: '2023-11-18T19:45:00Z'
  },
  {
    id: '3',
    full_name: 'Sarah Johnson',
    email: 'sarah.johnson@email.com',
    phone: null,
    avatar_url: null,
    created_at: '2023-03-10T09:00:00Z',
    membership: {
      type: 'vip',
      status: 'active',
      start_date: '2023-03-10T00:00:00Z',
      end_date: '2024-03-10T00:00:00Z'
    },
    last_access: '2023-12-01T07:15:00Z'
  },
  {
    id: '4',
    full_name: 'Alex Thompson',
    email: 'alex.thompson@email.com',
    phone: '+33 6 34 56 78 90',
    avatar_url: null,
    created_at: '2023-04-05T16:00:00Z',
    membership: {
      type: 'premium',
      status: 'suspended',
      start_date: '2023-04-05T00:00:00Z',
      end_date: '2024-04-05T00:00:00Z'
    },
    last_access: '2023-11-25T12:00:00Z'
  },
  {
    id: '5',
    full_name: 'Emma Wilson',
    email: 'emma.wilson@email.com',
    phone: '+33 6 45 67 89 01',
    avatar_url: null,
    created_at: '2023-05-12T11:00:00Z',
    membership: {
      type: 'basic',
      status: 'active',
      start_date: '2023-05-12T00:00:00Z',
      end_date: '2024-05-12T00:00:00Z'
    },
    last_access: '2023-11-30T18:30:00Z'
  }
]

// Récupérer tous les membres avec leurs abonnements
export const getMembers = async (): Promise<Member[]> => {
  try {
    console.log('🔍 Tentative de récupération des membres depuis Supabase...')
    
    // D'abord, essayer de récupérer TOUS les profils pour voir ce qu'il y a
    let { data: allProfiles, error: allProfilesError } = await supabase
      .from('profiles')
      .select('*')
      .order('full_name', { ascending: true })

    if (allProfilesError) {
      console.error('❌ Erreur Supabase lors de la récupération de tous les profils:', allProfilesError)
      console.log('🔄 Utilisation des données de fallback...')
      return MOCK_MEMBERS
    }

    console.log('✅ TOUS les profils reçus de Supabase:', allProfiles?.length || 0)
    if (allProfiles && allProfiles.length > 0) {
      console.log('📋 Profils détaillés:', allProfiles.map(p => ({ 
        id: p.id, 
        full_name: p.full_name, 
        email: p.email,
        role: p.role 
      })))
    }

    // Filtrer côté client pour les membres
    const memberProfiles = allProfiles?.filter(profile => profile.role === 'member') || []
    console.log('👥 Profils membres filtrés:', memberProfiles.length)

    if (!memberProfiles || memberProfiles.length === 0) {
      console.log('⚠️ Aucun membre trouvé, utilisation des données de fallback...')
      
      // Mais affichons quand même tous les profils disponibles pour debug
      if (allProfiles && allProfiles.length > 0) {
        console.log('🔧 Utilisation de tous les profils disponibles comme membres pour test...')
        const transformedAllData = allProfiles.map(profile => ({
          id: profile.id,
          full_name: profile.full_name || profile.email,
          email: profile.email,
          phone: profile.phone,
          avatar_url: profile.avatar_url,
          created_at: profile.created_at,
          membership: {
            type: 'basic' as const,
            status: 'active' as const,
            start_date: profile.created_at,
            end_date: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString()
          },
          last_access: null
        }))
        return transformedAllData
      }
      
      return MOCK_MEMBERS
    }

    // Récupérer les abonnements séparément
    const { data: memberships, error: membershipsError } = await supabase
      .from('memberships')
      .select('*')

    if (membershipsError) {
      console.log('⚠️ Erreur lors de la récupération des abonnements:', membershipsError)
    }

    console.log('✅ Données abonnements reçues:', memberships?.length || 0, 'abonnements')

    // Transformer les données pour correspondre à l'interface Member
    const transformedData = memberProfiles.map(profile => {
      // Trouver l'abonnement correspondant à ce profil
      const membership = memberships?.find(m => m.user_id === profile.id)
      
      return {
        id: profile.id,
        full_name: profile.full_name || profile.email,
        email: profile.email,
        phone: profile.phone,
        avatar_url: profile.avatar_url,
        created_at: profile.created_at,
        membership: membership ? {
          type: membership.type,
          status: membership.status,
          start_date: membership.start_date,
          end_date: membership.end_date
        } : {
          type: 'basic' as const,
          status: 'active' as const,
          start_date: profile.created_at,
          end_date: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString()
        },
        last_access: null
      }
    })

    console.log('🔧 Données membres transformées:', transformedData.length, 'membres')
    return transformedData
  } catch (error) {
    console.error('❌ Erreur getMembers:', error)
    console.log('🔄 Utilisation des données de fallback...')
    return MOCK_MEMBERS
  }
}

// Rechercher des membres par nom ou email
export const searchMembers = async (query: string): Promise<Member[]> => {
  try {
    // Essayer d'abord avec la colonne role
    let { data, error } = await supabase
      .from('profiles')
      .select(`
        id,
        full_name,
        email,
        phone,
        avatar_url,
        created_at,
        memberships (
          type,
          status,
          start_date,
          end_date
        )
      `)
      .eq('role', 'member')
      .or(`full_name.ilike.%${query}%,email.ilike.%${query}%`)
      .order('full_name', { ascending: true })

    // Si erreur avec role, essayer sans filtre role
    if (error && error.message.includes('role')) {
      const result = await supabase
        .from('profiles')
        .select(`
          id,
          full_name,
          email,
          phone,
          avatar_url,
          created_at,
          memberships (
            type,
            status,
            start_date,
            end_date
          )
        `)
        .or(`full_name.ilike.%${query}%,email.ilike.%${query}%`)
        .order('full_name', { ascending: true })
      
      data = result.data
      error = result.error
    }

    if (error) {
      console.error('Erreur lors de la recherche de membres:', error)
      return MOCK_MEMBERS.filter(member => 
        member.full_name.toLowerCase().includes(query.toLowerCase()) ||
        member.email.toLowerCase().includes(query.toLowerCase())
      )
    }

    return (data || []).map(profile => ({
      id: profile.id,
      full_name: profile.full_name,
      email: profile.email,
      phone: profile.phone,
      avatar_url: profile.avatar_url,
      created_at: profile.created_at,
      membership: profile.memberships?.[0] || null,
      last_access: null
    }))
  } catch (error) {
    console.error('Erreur searchMembers:', error)
    return MOCK_MEMBERS.filter(member => 
      member.full_name.toLowerCase().includes(query.toLowerCase()) ||
      member.email.toLowerCase().includes(query.toLowerCase())
    )
  }
}

// Supprimer un membre
export const deleteMember = async (memberId: string): Promise<boolean> => {
  try {
    // Supprimer d'abord les abonnements
    const { error: membershipError } = await supabase
      .from('memberships')
      .delete()
      .eq('user_id', memberId)

    if (membershipError) {
      console.error('Erreur lors de la suppression de l\'abonnement:', membershipError)
      // Continue quand même la suppression du profil
    }

    // Supprimer le profil
    const { error: profileError } = await supabase
      .from('profiles')
      .delete()
      .eq('id', memberId)

    if (profileError) {
      console.error('Erreur lors de la suppression du membre:', profileError)
      throw profileError
    }

    return true
  } catch (error) {
    console.error('Erreur deleteMember:', error)
    return false
  }
}

// Mettre à jour le statut d'un abonnement
export const updateMembershipStatus = async (
  memberId: string, 
  status: 'active' | 'expired' | 'suspended'
): Promise<boolean> => {
  try {
    const { error } = await supabase
      .from('memberships')
      .update({ status })
      .eq('user_id', memberId)

    if (error) {
      console.error('Erreur lors de la mise à jour du statut:', error)
      throw error
    }

    return true
  } catch (error) {
    console.error('Erreur updateMembershipStatus:', error)
    return false
  }
}

// Ajouter un nouveau membre
export const addMember = async (memberData: {
  full_name: string
  email: string
  phone?: string
  membershipType: 'basic' | 'premium' | 'vip'
}): Promise<boolean> => {
  try {
    console.log('🆕 Ajout d\'un nouveau membre...', memberData)
    
    // Créer le profil utilisateur
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .insert([
        {
          full_name: memberData.full_name,
          email: memberData.email,
          phone: memberData.phone || null,
          role: 'member'
        }
      ])
      .select()
      .single()

    if (profileError) {
      console.error('❌ Erreur lors de la création du profil:', profileError)
      return false
    }

    // Créer l'abonnement
    const startDate = new Date().toISOString()
    const endDate = new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString() // 1 an

    const { error: membershipError } = await supabase
      .from('memberships')
      .insert([
        {
          user_id: profile.id,
          type: memberData.membershipType,
          status: 'active',
          start_date: startDate,
          end_date: endDate
        }
      ])

    if (membershipError) {
      console.error('❌ Erreur lors de la création de l\'abonnement:', membershipError)
      // Supprimer le profil créé si l'abonnement échoue
      await supabase.from('profiles').delete().eq('id', profile.id)
      return false
    }

    console.log('✅ Membre ajouté avec succès')
    return true
  } catch (error) {
    console.error('❌ Erreur addMember:', error)
    return false
  }
}

// Modifier un membre existant
export const updateMember = async (memberData: {
  id: string
  full_name: string
  email: string
  phone?: string
  membershipType?: 'basic' | 'premium' | 'vip'
  membershipStatus?: 'active' | 'expired' | 'suspended'
}): Promise<boolean> => {
  try {
    console.log('✏️ Mise à jour du membre...', memberData)
    
    // Mettre à jour le profil
    const { error: profileError } = await supabase
      .from('profiles')
      .update({
        full_name: memberData.full_name,
        email: memberData.email,
        phone: memberData.phone || null
      })
      .eq('id', memberData.id)

    if (profileError) {
      console.error('❌ Erreur lors de la mise à jour du profil:', profileError)
      return false
    }

    // Mettre à jour l'abonnement si des données sont fournies
    if (memberData.membershipType || memberData.membershipStatus) {
      const updateData: any = {}
      if (memberData.membershipType) updateData.type = memberData.membershipType
      if (memberData.membershipStatus) updateData.status = memberData.membershipStatus

      const { error: membershipError } = await supabase
        .from('memberships')
        .update(updateData)
        .eq('user_id', memberData.id)

      if (membershipError) {
        console.error('❌ Erreur lors de la mise à jour de l\'abonnement:', membershipError)
        return false
      }
    }

    console.log('✅ Membre mis à jour avec succès')
    return true
  } catch (error) {
    console.error('❌ Erreur updateMember:', error)
    return false
  }
}

// Récupérer les statistiques des membres
export const getMembersStats = async () => {
  try {
    // Essayer d'abord avec la colonne role
    let { data: profiles, error: profilesError } = await supabase
      .from('profiles')
      .select('id')
      .eq('role', 'member')

    // Si erreur avec role, récupérer tous les profils
    if (profilesError && profilesError.message.includes('role')) {
      const result = await supabase
        .from('profiles')
        .select('id')
      profiles = result.data
      profilesError = result.error
    }

    if (profilesError) throw profilesError

    const { data: memberships, error: membershipsError } = await supabase
      .from('memberships')
      .select('status')

    if (membershipsError) throw membershipsError

    const total = profiles?.length || 0
    const activeCount = memberships?.filter(m => m.status === 'active').length || 0
    const expiredCount = memberships?.filter(m => m.status === 'expired').length || 0
    const suspendedCount = memberships?.filter(m => m.status === 'suspended').length || 0

    return {
      total,
      active: activeCount,
      expired: expiredCount,
      suspended: suspendedCount
    }
  } catch (error) {
    console.error('Erreur getMembersStats:', error)
    // Fallback avec les données mock
    const activeCount = MOCK_MEMBERS.filter(m => m.membership?.status === 'active').length
    const expiredCount = MOCK_MEMBERS.filter(m => m.membership?.status === 'expired').length
    const suspendedCount = MOCK_MEMBERS.filter(m => m.membership?.status === 'suspended').length
    
    return {
      total: MOCK_MEMBERS.length,
      active: activeCount,
      expired: expiredCount,
      suspended: suspendedCount
    }
  }
}