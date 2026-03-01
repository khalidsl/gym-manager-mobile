import React, { useState, useEffect } from 'react'
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Modal,
  Alert,
  RefreshControl,
  Image,
  FlatList,
} from 'react-native'
import { LinearGradient } from 'expo-linear-gradient'
import { MaterialIcons } from '@expo/vector-icons'
import { BlurView } from 'expo-blur'
import { getMembers, deleteMember, updateMembershipStatus, getMembersStats, searchMembers, addMember, updateMember, type Member } from '../../services/members'

const COLORS = {
  primary: '#FF6B35',
  secondary: '#004E89',
  accent: '#F77F00',
  success: '#06D6A0',
  warning: '#FFD23F',
  danger: '#EF476F',
  background: '#0A0E27',
  surface: '#1A1F3A',
  surfaceLight: '#252B4A',
  textPrimary: '#FFFFFF',
  textSecondary: '#B8C1EC',
  textMuted: '#6C7A9B',
}

export default function AdminMembers() {
  const [members, setMembers] = useState<Member[]>([])
  const [filteredMembers, setFilteredMembers] = useState<Member[]>([])
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedFilter, setSelectedFilter] = useState('all')
  const [refreshing, setRefreshing] = useState(false)
  const [loading, setLoading] = useState(true)
  const [showAddModal, setShowAddModal] = useState(false)
  const [showEditModal, setShowEditModal] = useState(false)
  const [selectedMember, setSelectedMember] = useState<Member | null>(null)
  const [stats, setStats] = useState({
    total: 0,
    active: 0,
    expired: 0,
    suspended: 0
  })

  // États pour les formulaires
  const [formData, setFormData] = useState({
    full_name: '',
    email: '',
    phone: '',
    password: '',
    membershipType: 'basic' as 'basic' | 'premium' | 'vip',
    membershipStatus: 'active' as 'active' | 'expired' | 'suspended'
  })
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Charger les membres au démarrage
  useEffect(() => {
    loadMembers()
    loadStats()
  }, [])

  useEffect(() => {
    filterMembers()
  }, [searchQuery, selectedFilter, members])

  const loadMembers = async () => {
    try {
      setLoading(true)
      console.log('🔄 Chargement des membres...')
      const membersData = await getMembers()
      console.log('✅ Données membres reçues:', membersData.length, 'membres')
      setMembers(membersData)
    } catch (error) {
      console.error('❌ Erreur lors du chargement des membres:', error)
      Alert.alert('Erreur', 'Impossible de charger les membres')
    } finally {
      setLoading(false)
    }
  }

  const loadStats = async () => {
    try {
      const statsData = await getMembersStats()
      setStats(statsData)
    } catch (error) {
      console.error('Erreur lors du chargement des statistiques:', error)
    }
  }

  const filterMembers = () => {
    let filtered = members

    // Filtrage par recherche
    if (searchQuery) {
      filtered = filtered.filter(member =>
        member.full_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        member.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (member.phone && member.phone.includes(searchQuery))
      )
    }

    // Filtrage par statut
    if (selectedFilter !== 'all') {
      filtered = filtered.filter(member => member.membership?.status === selectedFilter)
    }

    setFilteredMembers(filtered)
  }

  const onRefresh = async () => {
    setRefreshing(true)
    await Promise.all([
      loadMembers(),
      loadStats()
    ])
    setRefreshing(false)
  }

  const getStatusColor = (status: string | undefined) => {
    switch (status) {
      case 'active': return COLORS.success
      case 'expired': return COLORS.warning
      case 'suspended': return COLORS.danger
      default: return COLORS.textMuted
    }
  }

  const getStatusText = (status: string | undefined) => {
    switch (status) {
      case 'active': return 'Actif'
      case 'expired': return 'Expiré'
      case 'suspended': return 'Suspendu'
      default: return 'Aucun abonnement'
    }
  }

  const getMembershipTypeText = (type: string | undefined) => {
    switch (type) {
      case 'basic': return 'Basic'
      case 'premium': return 'Premium'
      case 'vip': return 'VIP'
      default: return 'Aucun'
    }
  }

  const handleDeleteMember = (memberId: string) => {
    Alert.alert(
      'Supprimer le membre',
      'Êtes-vous sûr de vouloir supprimer ce membre ? Cette action est irréversible.',
      [
        { text: 'Annuler', style: 'cancel' },
        {
          text: 'Supprimer',
          style: 'destructive',
          onPress: async () => {
            const success = await deleteMember(memberId)
            if (success) {
              setMembers(members.filter(m => m.id !== memberId))
              await loadStats() // Recharger les statistiques
              Alert.alert('Succès', 'Membre supprimé avec succès')
            } else {
              Alert.alert('Erreur', 'Impossible de supprimer le membre')
            }
          }
        }
      ]
    )
  }

  const handleUpdateMembershipStatus = async (memberId: string, newStatus: 'active' | 'expired' | 'suspended') => {
    const success = await updateMembershipStatus(memberId, newStatus)
    if (success) {
      // Mettre à jour localement
      setMembers(members.map(m =>
        m.id === memberId && m.membership
          ? { ...m, membership: { ...m.membership, status: newStatus } }
          : m
      ))
      await loadStats() // Recharger les statistiques
      Alert.alert('Succès', 'Statut mis à jour avec succès')
    } else {
      Alert.alert('Erreur', 'Impossible de mettre à jour le statut')
    }
  }

  // ============================================
  // GESTION DES FORMULAIRES
  // ============================================

  const resetForm = () => {
    setFormData({
      full_name: '',
      email: '',
      phone: '',
      password: '',
      membershipType: 'basic',
      membershipStatus: 'active'
    })
  }

  const openAddModal = () => {
    resetForm()
    setShowAddModal(true)
  }

  const openEditModal = (member: Member) => {
    setFormData({
      full_name: member.full_name,
      email: member.email,
      phone: member.phone || '',
      password: '', // On n'édite pas le mot de passe ici
      membershipType: member.membership?.type || 'basic',
      membershipStatus: member.membership?.status || 'active'
    })
    setSelectedMember(member)
    setShowEditModal(true)
  }

  const closeModals = () => {
    setShowAddModal(false)
    setShowEditModal(false)
    setSelectedMember(null)
    setIsSubmitting(false)
    resetForm()
  }

  const handleAddMember = async () => {
    if (!formData.full_name.trim() || !formData.email.trim()) {
      Alert.alert('Erreur', 'Veuillez remplir tous les champs requis')
      return
    }

    setIsSubmitting(true)
    try {
      const success = await addMember({
        full_name: formData.full_name.trim(),
        email: formData.email.trim(),
        phone: formData.phone.trim() || undefined,
        password: formData.password.trim() || undefined,
        membershipType: formData.membershipType
      })

      if (success) {
        Alert.alert('Succès', 'Membre ajouté avec succès')
        closeModals()
        await Promise.all([loadMembers(), loadStats()])
      } else {
        Alert.alert('Erreur', 'Impossible d\'ajouter le membre')
      }
    } catch (error) {
      Alert.alert('Erreur', 'Une erreur est survenue')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleEditMember = async () => {
    if (!selectedMember || !formData.full_name.trim() || !formData.email.trim()) {
      Alert.alert('Erreur', 'Veuillez remplir tous les champs requis')
      return
    }

    setIsSubmitting(true)
    try {
      const success = await updateMember({
        id: selectedMember.id,
        full_name: formData.full_name.trim(),
        email: formData.email.trim(),
        phone: formData.phone.trim() || undefined,
        membershipType: formData.membershipType,
        membershipStatus: formData.membershipStatus
      })

      if (success) {
        Alert.alert('Succès', 'Membre modifié avec succès')
        closeModals()
        await Promise.all([loadMembers(), loadStats()])
      } else {
        Alert.alert('Erreur', 'Impossible de modifier le membre')
      }
    } catch (error) {
      Alert.alert('Erreur', 'Une erreur est survenue')
    } finally {
      setIsSubmitting(false)
    }
  }

  const MemberCard = ({ member }: { member: Member }) => (
    <TouchableOpacity
      style={styles.memberCard}
      onPress={() => setSelectedMember(member)}
      activeOpacity={0.8}
    >
      <LinearGradient
        colors={[COLORS.surface, COLORS.surfaceLight]}
        style={styles.memberCardGradient}
      >
        {/* Avatar */}
        <View style={styles.avatarContainer}>
          {member.avatar_url ? (
            <Image source={{ uri: member.avatar_url }} style={styles.avatar} />
          ) : (
            <LinearGradient
              colors={[COLORS.primary, COLORS.accent]}
              style={styles.avatarPlaceholder}
            >
              <Text style={styles.avatarText}>
                {String(member.full_name.split(' ').map(name => name[0]).slice(0, 2).join(''))}
              </Text>
            </LinearGradient>
          )}
          <View style={[styles.statusDot, { backgroundColor: getStatusColor(member.membership?.status) }]} />
        </View>

        {/* Informations */}
        <View style={styles.memberInfo}>
          <Text style={styles.memberName}>
            {String(member.full_name || member.email || 'Nom inconnu')}
          </Text>
          <Text style={styles.memberEmail}>{String(member.email || 'Pas d\'email')}</Text>
          <View style={styles.memberDetails}>
            <View style={styles.detailRow}>
              <MaterialIcons name="card-membership" size={14} color={COLORS.accent} />
              <Text style={styles.detailText}>{getMembershipTypeText(member.membership?.type)}</Text>
            </View>
            <View style={styles.detailRow}>
              <MaterialIcons name="access-time" size={14} color={COLORS.textSecondary} />
              <Text style={styles.detailText}>
                {String(member.last_access ? `Dernière visite: ${new Date(member.last_access).toLocaleDateString()}` : 'Aucune visite')}
              </Text>
            </View>
            {member.phone && (
              <View style={styles.detailRow}>
                <MaterialIcons name="phone" size={14} color={COLORS.textSecondary} />
                <Text style={styles.detailText}>{member.phone}</Text>
              </View>
            )}
          </View>
        </View>

        {/* Status et Actions */}
        <View style={styles.memberActions}>
          <View style={[styles.statusBadge, { backgroundColor: getStatusColor(member.membership?.status) + '20' }]}>
            <Text style={[styles.statusText, { color: getStatusColor(member.membership?.status) }]}>
              {String(getStatusText(member.membership?.status))}
            </Text>
          </View>
          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => openEditModal(member)}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <MaterialIcons name="edit" size={18} color={COLORS.accent} />
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => Alert.alert(
              'Changer le statut',
              'Sélectionnez le nouveau statut de l\'abonnement',
              [
                { text: 'Annuler', style: 'cancel' },
                { text: 'Actif', onPress: () => handleUpdateMembershipStatus(member.id, 'active') },
                { text: 'Expiré', onPress: () => handleUpdateMembershipStatus(member.id, 'expired') },
                { text: 'Suspendu', onPress: () => handleUpdateMembershipStatus(member.id, 'suspended') },
              ]
            )}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <MaterialIcons name="swap-horiz" size={18} color={COLORS.primary} />
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.deleteButton}
            onPress={() => handleDeleteMember(member.id)}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <MaterialIcons name="delete" size={20} color={COLORS.danger} />
          </TouchableOpacity>
        </View>
      </LinearGradient>
    </TouchableOpacity>
  )

  return (
    <LinearGradient colors={[COLORS.background, COLORS.surface]} style={styles.container}>
      {/* Header avec recherche et filtres */}
      <View style={styles.header}>
        <View style={styles.searchContainer}>
          <MaterialIcons name="search" size={20} color={COLORS.textSecondary} />
          <TextInput
            style={styles.searchInput}
            placeholder="Rechercher un membre..."
            placeholderTextColor={COLORS.textMuted}
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
        </View>

        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filtersContainer}>
          {[
            { key: 'all', label: 'Tous', count: members.length },
            { key: 'active', label: 'Actif', count: members.filter(m => m.membership?.status === 'active').length },
            { key: 'expired', label: 'Expiré', count: members.filter(m => m.membership?.status === 'expired').length },
            { key: 'suspended', label: 'Suspendu', count: members.filter(m => m.membership?.status === 'suspended').length },
          ].map((filter) => (
            <TouchableOpacity
              key={filter.key}
              style={[
                styles.filterChip,
                selectedFilter === filter.key && styles.filterChipActive
              ]}
              onPress={() => setSelectedFilter(filter.key)}
            >
              <Text style={[
                styles.filterText,
                selectedFilter === filter.key && styles.filterTextActive
              ]}>
                {String(filter.label)} ({String(filter.count)})
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {/* Indicateur de chargement */}
      {loading ? (
        <View style={styles.loadingContainer}>
          <MaterialIcons name="hourglass-empty" size={48} color={COLORS.primary} />
          <Text style={styles.loadingText}>Chargement des membres...</Text>
        </View>
      ) : filteredMembers.length === 0 ? (
        <View style={styles.emptyContainer}>
          <MaterialIcons name="people-outline" size={64} color={COLORS.textMuted} />
          <Text style={styles.emptyTitle}>Aucun membre trouvé</Text>
          <Text style={styles.emptySubtitle}>
            {members.length === 0
              ? 'Aucun membre enregistré dans la base de données'
              : 'Aucun membre ne correspond à vos critères de recherche'
            }
          </Text>
        </View>
      ) : (
        /* Liste des membres */
        <FlatList
          data={filteredMembers}
          renderItem={({ item }) => <MemberCard member={item} />}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContainer}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }
          showsVerticalScrollIndicator={false}
        />
      )}

      {/* Bouton flottant d'ajout */}
      <TouchableOpacity
        style={styles.fab}
        onPress={openAddModal}
        activeOpacity={0.8}
      >
        <LinearGradient
          colors={[COLORS.primary, COLORS.accent]}
          style={styles.fabGradient}
        >
          <MaterialIcons name="person-add" size={24} color="#fff" />
        </LinearGradient>
      </TouchableOpacity>

      {/* Modales */}
      {/* Modale Ajout de membre */}
      <Modal
        visible={showAddModal}
        animationType="slide"
        transparent={true}
        onRequestClose={closeModals}
      >
        <BlurView intensity={20} style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <LinearGradient
              colors={[COLORS.surface, COLORS.surfaceLight]}
              style={styles.modalContent}
            >
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>Ajouter un membre</Text>
                <TouchableOpacity onPress={closeModals} style={styles.closeButton}>
                  <MaterialIcons name="close" size={24} color={COLORS.textSecondary} />
                </TouchableOpacity>
              </View>

              <ScrollView style={styles.modalBody} showsVerticalScrollIndicator={false}>
                <View style={styles.inputGroup}>
                  <Text style={styles.inputLabel}>Nom complet *</Text>
                  <View style={styles.inputContainer}>
                    <MaterialIcons name="person" size={20} color={COLORS.textSecondary} />
                    <TextInput
                      style={styles.textInput}
                      placeholder="Nom et prénom"
                      placeholderTextColor={COLORS.textMuted}
                      value={formData.full_name}
                      onChangeText={(text) => setFormData({ ...formData, full_name: text })}
                    />
                  </View>
                </View>

                <View style={styles.inputGroup}>
                  <Text style={styles.inputLabel}>Email *</Text>
                  <View style={styles.inputContainer}>
                    <MaterialIcons name="email" size={20} color={COLORS.textSecondary} />
                    <TextInput
                      style={styles.textInput}
                      placeholder="exemple@email.com"
                      placeholderTextColor={COLORS.textMuted}
                      value={formData.email}
                      onChangeText={(text) => setFormData({ ...formData, email: text })}
                      keyboardType="email-address"
                      autoCapitalize="none"
                    />
                  </View>
                </View>

                <View style={styles.inputGroup}>
                  <Text style={styles.inputLabel}>Téléphone</Text>
                  <View style={styles.inputContainer}>
                    <MaterialIcons name="phone" size={20} color={COLORS.textSecondary} />
                    <TextInput
                      style={styles.textInput}
                      placeholder="+33 6 12 34 56 78"
                      placeholderTextColor={COLORS.textMuted}
                      value={formData.phone}
                      onChangeText={(text) => setFormData({ ...formData, phone: text })}
                      keyboardType="phone-pad"
                    />
                  </View>
                </View>

                <View style={styles.inputGroup}>
                  <Text style={styles.inputLabel}>Mot de passe (Optionnel)</Text>
                  <View style={styles.inputContainer}>
                    <MaterialIcons name="lock" size={20} color={COLORS.textSecondary} />
                    <TextInput
                      style={styles.textInput}
                      placeholder="Laisser vide pour générer"
                      placeholderTextColor={COLORS.textMuted}
                      secureTextEntry
                      value={formData.password}
                      onChangeText={(text) => setFormData({ ...formData, password: text })}
                    />
                  </View>
                </View>

                <View style={styles.inputGroup}>
                  <Text style={styles.inputLabel}>Type d'abonnement</Text>
                  <View style={styles.pickerContainer}>
                    {['basic', 'premium', 'vip'].map((type) => (
                      <TouchableOpacity
                        key={type}
                        style={[
                          styles.pickerOption,
                          formData.membershipType === type && styles.pickerOptionSelected
                        ]}
                        onPress={() => setFormData({ ...formData, membershipType: type as any })}
                      >
                        <Text style={[
                          styles.pickerText,
                          formData.membershipType === type && styles.pickerTextSelected
                        ]}>
                          {getMembershipTypeText(type)}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </View>
              </ScrollView>

              <View style={styles.modalFooter}>
                <TouchableOpacity
                  style={styles.cancelButton}
                  onPress={closeModals}
                >
                  <Text style={styles.cancelButtonText}>Annuler</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.confirmButton, isSubmitting && styles.disabledButton]}
                  onPress={handleAddMember}
                  disabled={isSubmitting}
                >
                  <Text style={styles.confirmButtonText}>
                    {isSubmitting ? 'Ajout...' : 'Ajouter'}
                  </Text>
                </TouchableOpacity>
              </View>
            </LinearGradient>
          </View>
        </BlurView>
      </Modal>

      {/* Modale Édition de membre */}
      <Modal
        visible={showEditModal}
        animationType="slide"
        transparent={true}
        onRequestClose={closeModals}
      >
        <BlurView intensity={20} style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <LinearGradient
              colors={[COLORS.surface, COLORS.surfaceLight]}
              style={styles.modalContent}
            >
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>Modifier le membre</Text>
                <TouchableOpacity onPress={closeModals} style={styles.closeButton}>
                  <MaterialIcons name="close" size={24} color={COLORS.textSecondary} />
                </TouchableOpacity>
              </View>

              <ScrollView style={styles.modalBody} showsVerticalScrollIndicator={false}>
                <View style={styles.inputGroup}>
                  <Text style={styles.inputLabel}>Nom complet *</Text>
                  <View style={styles.inputContainer}>
                    <MaterialIcons name="person" size={20} color={COLORS.textSecondary} />
                    <TextInput
                      style={styles.textInput}
                      placeholder="Nom et prénom"
                      placeholderTextColor={COLORS.textMuted}
                      value={formData.full_name}
                      onChangeText={(text) => setFormData({ ...formData, full_name: text })}
                    />
                  </View>
                </View>

                <View style={styles.inputGroup}>
                  <Text style={styles.inputLabel}>Email *</Text>
                  <View style={styles.inputContainer}>
                    <MaterialIcons name="email" size={20} color={COLORS.textSecondary} />
                    <TextInput
                      style={styles.textInput}
                      placeholder="exemple@email.com"
                      placeholderTextColor={COLORS.textMuted}
                      value={formData.email}
                      onChangeText={(text) => setFormData({ ...formData, email: text })}
                      keyboardType="email-address"
                      autoCapitalize="none"
                    />
                  </View>
                </View>

                <View style={styles.inputGroup}>
                  <Text style={styles.inputLabel}>Téléphone</Text>
                  <View style={styles.inputContainer}>
                    <MaterialIcons name="phone" size={20} color={COLORS.textSecondary} />
                    <TextInput
                      style={styles.textInput}
                      placeholder="+33 6 12 34 56 78"
                      placeholderTextColor={COLORS.textMuted}
                      value={formData.phone}
                      onChangeText={(text) => setFormData({ ...formData, phone: text })}
                      keyboardType="phone-pad"
                    />
                  </View>
                </View>

                <View style={styles.inputGroup}>
                  <Text style={styles.inputLabel}>Type d'abonnement</Text>
                  <View style={styles.pickerContainer}>
                    {['basic', 'premium', 'vip'].map((type) => (
                      <TouchableOpacity
                        key={type}
                        style={[
                          styles.pickerOption,
                          formData.membershipType === type && styles.pickerOptionSelected
                        ]}
                        onPress={() => setFormData({ ...formData, membershipType: type as any })}
                      >
                        <Text style={[
                          styles.pickerText,
                          formData.membershipType === type && styles.pickerTextSelected
                        ]}>
                          {getMembershipTypeText(type)}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </View>

                <View style={styles.inputGroup}>
                  <Text style={styles.inputLabel}>Statut de l'abonnement</Text>
                  <View style={styles.pickerContainer}>
                    {['active', 'expired', 'suspended'].map((status) => (
                      <TouchableOpacity
                        key={status}
                        style={[
                          styles.pickerOption,
                          formData.membershipStatus === status && styles.pickerOptionSelected
                        ]}
                        onPress={() => setFormData({ ...formData, membershipStatus: status as any })}
                      >
                        <Text style={[
                          styles.pickerText,
                          formData.membershipStatus === status && styles.pickerTextSelected
                        ]}>
                          {getStatusText(status)}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </View>
              </ScrollView>

              <View style={styles.modalFooter}>
                <TouchableOpacity
                  style={styles.cancelButton}
                  onPress={closeModals}
                >
                  <Text style={styles.cancelButtonText}>Annuler</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.confirmButton, isSubmitting && styles.disabledButton]}
                  onPress={handleEditMember}
                  disabled={isSubmitting}
                >
                  <Text style={styles.confirmButtonText}>
                    {isSubmitting ? 'Modification...' : 'Modifier'}
                  </Text>
                </TouchableOpacity>
              </View>
            </LinearGradient>
          </View>
        </BlurView>
      </Modal>
    </LinearGradient>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },

  // Header
  header: {
    padding: 20,
    paddingBottom: 10,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.surface,
    borderRadius: 12,
    paddingHorizontal: 15,
    paddingVertical: 12,
    marginBottom: 15,
    borderWidth: 1,
    borderColor: COLORS.surfaceLight,
  },
  searchInput: {
    flex: 1,
    marginLeft: 10,
    fontSize: 16,
    color: COLORS.textPrimary,
  },
  filtersContainer: {
    paddingVertical: 5,
  },
  filterChip: {
    backgroundColor: COLORS.surface,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    marginRight: 10,
    borderWidth: 1,
    borderColor: COLORS.surfaceLight,
  },
  filterChipActive: {
    backgroundColor: COLORS.primary + '20',
    borderColor: COLORS.primary,
  },
  filterText: {
    fontSize: 14,
    color: COLORS.textSecondary,
    fontWeight: '500',
  },
  filterTextActive: {
    color: COLORS.primary,
    fontWeight: '700',
  },

  // Liste
  listContainer: {
    padding: 20,
    paddingTop: 10,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 60,
  },
  loadingText: {
    fontSize: 16,
    color: COLORS.textSecondary,
    marginTop: 15,
    fontWeight: '500',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
    paddingVertical: 60,
  },
  emptyTitle: {
    fontSize: 18,
    color: COLORS.textPrimary,
    fontWeight: 'bold',
    marginTop: 20,
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 14,
    color: COLORS.textMuted,
    textAlign: 'center',
    lineHeight: 20,
  },
  memberCard: {
    marginBottom: 15,
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
  },
  memberCardGradient: {
    flexDirection: 'row',
    padding: 16,
    alignItems: 'center',
  },

  // Avatar
  avatarContainer: {
    position: 'relative',
    marginRight: 15,
  },
  avatar: {
    width: 60,
    height: 60,
    borderRadius: 30,
  },
  avatarPlaceholder: {
    width: 60,
    height: 60,
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#fff',
  },
  statusDot: {
    position: 'absolute',
    top: -2,
    right: -2,
    width: 16,
    height: 16,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: COLORS.surface,
  },

  // Informations membre
  memberInfo: {
    flex: 1,
  },
  memberName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: COLORS.textPrimary,
    marginBottom: 4,
  },
  memberEmail: {
    fontSize: 14,
    color: COLORS.textSecondary,
    marginBottom: 8,
  },
  memberDetails: {
    gap: 4,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  detailText: {
    fontSize: 12,
    color: COLORS.textMuted,
  },

  // Actions
  memberActions: {
    alignItems: 'center',
    gap: 10,
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
  },
  actionButton: {
    padding: 5,
  },
  deleteButton: {
    padding: 5,
  },

  // FAB
  fab: {
    position: 'absolute',
    bottom: 30,
    right: 30,
    borderRadius: 30,
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  fabGradient: {
    width: 60,
    height: 60,
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
  },

  // Modales
  modalOverlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  modalContainer: {
    width: '90%',
    maxHeight: '80%',
    borderRadius: 20,
  },
  modalContent: {
    borderRadius: 20,
    padding: 0,
    overflow: 'hidden',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.surfaceLight,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: COLORS.textPrimary,
  },
  closeButton: {
    padding: 5,
  },
  modalBody: {
    padding: 20,
    maxHeight: 400,
  },
  inputGroup: {
    marginBottom: 20,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.textSecondary,
    marginBottom: 8,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.background,
    borderRadius: 12,
    paddingHorizontal: 15,
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: COLORS.surfaceLight,
  },
  textInput: {
    flex: 1,
    marginLeft: 10,
    fontSize: 16,
    color: COLORS.textPrimary,
  },
  pickerContainer: {
    flexDirection: 'row',
    backgroundColor: COLORS.background,
    borderRadius: 12,
    padding: 4,
    gap: 4,
  },
  pickerOption: {
    flex: 1,
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  pickerOptionSelected: {
    backgroundColor: COLORS.primary,
  },
  pickerText: {
    fontSize: 14,
    fontWeight: '500',
    color: COLORS.textSecondary,
  },
  pickerTextSelected: {
    color: '#fff',
    fontWeight: '700',
  },
  modalFooter: {
    flexDirection: 'row',
    padding: 20,
    gap: 12,
    borderTopWidth: 1,
    borderTopColor: COLORS.surfaceLight,
  },
  cancelButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 12,
    backgroundColor: COLORS.surface,
    alignItems: 'center',
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.textSecondary,
  },
  confirmButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 12,
    backgroundColor: COLORS.primary,
    alignItems: 'center',
  },
  confirmButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#fff',
  },
  disabledButton: {
    opacity: 0.5,
  },
})