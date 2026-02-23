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
  FlatList,
  Switch,
} from 'react-native'
import { LinearGradient } from 'expo-linear-gradient'
import { MaterialIcons } from '@expo/vector-icons'
import { BlurView } from 'expo-blur'
import { getAdminMachines, deleteAdminMachine, getAdminMachinesStats, addAdminMachine, updateAdminMachine } from '../../services/machines'

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

// Types adaptés pour Supabase
interface Machine {
  id: string
  name: string
  type: string
  description?: string
  image_url?: string | null
  qr_code: string
  status: 'available' | 'in_use' | 'maintenance' | 'out_of_order'
  created_at: string
}

const MACHINE_TYPES = ['Tous', 'Cardio', 'Force', 'Fonctionnel', 'Étirement']

export default function AdminMachines() {
  const [machines, setMachines] = useState<Machine[]>([])
  const [filteredMachines, setFilteredMachines] = useState<Machine[]>([])
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedFilter, setSelectedFilter] = useState('Tous')
  const [selectedStatus, setSelectedStatus] = useState('all')
  const [refreshing, setRefreshing] = useState(false)
  const [showAddModal, setShowAddModal] = useState(false)
  const [showEditModal, setShowEditModal] = useState(false)
  const [selectedMachine, setSelectedMachine] = useState<Machine | null>(null)
  const [loading, setLoading] = useState(true)
  const [stats, setStats] = useState({ total: 0, available: 0, in_use: 0, maintenance: 0 })

  // États pour les formulaires
  const [formData, setFormData] = useState({
    name: '',
    type: 'Cardio',
    description: '',
    qr_code: '',
    status: 'available' as 'available' | 'in_use' | 'maintenance' | 'out_of_order'
  })
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Charger les machines au démarrage
  useEffect(() => {
    loadMachines()
    loadStats()
  }, [])

  // Filtrer les machines quand les critères changent
  useEffect(() => {
    filterMachines()
  }, [searchQuery, selectedFilter, selectedStatus, machines])

  const loadMachines = async () => {
    try {
      console.log('🔄 Chargement des machines depuis Supabase...')
      const fetchedMachines = await getAdminMachines()
      setMachines(fetchedMachines as any)  // Temporary type fix
      console.log('✅ Machines chargées:', fetchedMachines.length, 'machines')
    } catch (error) {
      console.error('❌ Erreur lors du chargement des machines:', error)
      Alert.alert('Erreur', 'Impossible de charger les machines')
    } finally {
      setLoading(false)
    }
  }

  const loadStats = async () => {
    try {
      const fetchedStats = await getAdminMachinesStats()
      setStats(fetchedStats)
    } catch (error) {
      console.error('❌ Erreur lors du chargement des statistiques:', error)
    }
  }

  const filterMachines = () => {
    let filtered = machines

    // Filtrage par recherche
    if (searchQuery) {
      filtered = filtered.filter(machine => 
        machine.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        machine.type.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (machine.description && machine.description.toLowerCase().includes(searchQuery.toLowerCase()))
      )
    }

    // Filtrage par type
    if (selectedFilter !== 'Tous') {
      filtered = filtered.filter(machine => machine.type === selectedFilter)
    }

    // Filtrage par statut
    if (selectedStatus !== 'all') {
      filtered = filtered.filter(machine => machine.status === selectedStatus)
    }

    setFilteredMachines(filtered)
  }

  const onRefresh = async () => {
    setRefreshing(true)
    await loadMachines()
    await loadStats()
    setRefreshing(false)
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'available': return COLORS.success
      case 'in_use': return COLORS.primary
      case 'maintenance': return COLORS.warning
      case 'out_of_order': return COLORS.danger
      default: return COLORS.textMuted
    }
  }

  const getStatusText = (status: string) => {
    switch (status) {
      case 'available': return 'Disponible'
      case 'in_use': return 'En Cours'
      case 'maintenance': return 'Maintenance'
      case 'out_of_order': return 'Hors Service'
      default: return status
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'available': return 'check-circle'
      case 'in_use': return 'play-circle-filled'
      case 'maintenance': return 'build'
      case 'out_of_order': return 'error'
      default: return 'help'
    }
  }

  const handleDeleteMachine = (machineId: string) => {
    Alert.alert(
      'Supprimer la machine',
      'Êtes-vous sûr de vouloir supprimer cette machine de l\'inventaire ?',
      [
        { text: 'Annuler', style: 'cancel' },
        {
          text: 'Supprimer',
          style: 'destructive',
          onPress: async () => {
            const success = await deleteAdminMachine(machineId)
            if (success) {
              setMachines(machines.filter(m => m.id !== machineId))
              await loadStats() // Recharger les statistiques
              Alert.alert('Succès', 'Machine supprimée avec succès')
            } else {
              Alert.alert('Erreur', 'Impossible de supprimer la machine')
            }
          }
        }
      ]
    )
  }

  // ============================================
  // GESTION DES FORMULAIRES
  // ============================================
  
  const resetForm = () => {
    setFormData({
      name: '',
      type: 'Cardio',
      description: '',
      qr_code: '',
      status: 'available'
    })
  }

  const generateQRCode = () => {
    const timestamp = Date.now().toString().slice(-6)
    const randomNum = Math.floor(Math.random() * 1000).toString().padStart(3, '0')
    return `MACHINE-${timestamp}-${randomNum}`
  }

  const openAddModal = () => {
    resetForm()
    setFormData(prev => ({ ...prev, qr_code: generateQRCode() }))
    setShowAddModal(true)
  }

  const openEditModal = (machine: Machine) => {
    setFormData({
      name: machine.name,
      type: machine.type,
      description: machine.description || '',
      qr_code: machine.qr_code,
      status: machine.status
    })
    setSelectedMachine(machine)
    setShowEditModal(true)
  }

  const closeModals = () => {
    setShowAddModal(false)
    setShowEditModal(false)
    setSelectedMachine(null)
    setIsSubmitting(false)
    resetForm()
  }

  const handleAddMachine = async () => {
    if (!formData.name.trim() || !formData.type.trim() || !formData.qr_code.trim()) {
      Alert.alert('Erreur', 'Veuillez remplir tous les champs requis')
      return
    }

    setIsSubmitting(true)
    try {
      const success = await addAdminMachine({
        name: formData.name.trim(),
        type: formData.type.trim(),
        description: formData.description.trim() || undefined,
        qr_code: formData.qr_code.trim()
      })

      if (success) {
        Alert.alert('Succès', 'Machine ajoutée avec succès')
        closeModals()
        await Promise.all([loadMachines(), loadStats()])
      } else {
        Alert.alert('Erreur', 'Impossible d\'ajouter la machine')
      }
    } catch (error) {
      Alert.alert('Erreur', 'Une erreur est survenue')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleEditMachine = async () => {
    if (!selectedMachine || !formData.name.trim() || !formData.type.trim() || !formData.qr_code.trim()) {
      Alert.alert('Erreur', 'Veuillez remplir tous les champs requis')
      return
    }

    setIsSubmitting(true)
    try {
      const success = await updateAdminMachine({
        id: selectedMachine.id,
        name: formData.name.trim(),
        type: formData.type.trim(),
        description: formData.description.trim() || undefined,
        qr_code: formData.qr_code.trim(),
        status: formData.status
      })

      if (success) {
        Alert.alert('Succès', 'Machine modifiée avec succès')
        closeModals()
        await Promise.all([loadMachines(), loadStats()])
      } else {
        Alert.alert('Erreur', 'Impossible de modifier la machine')
      }
    } catch (error) {
      Alert.alert('Erreur', 'Une erreur est survenue')
    } finally {
      setIsSubmitting(false)
    }
  }

  const MachineCard = ({ machine }: { machine: Machine }) => (
    <TouchableOpacity 
      style={styles.machineCard}
      onPress={() => setSelectedMachine(machine)}
      activeOpacity={0.8}
    >
      <LinearGradient
        colors={[COLORS.surface, COLORS.surfaceLight]}
        style={styles.machineCardGradient}
      >
        {/* Header de la carte */}
        <View style={styles.cardHeader}>
          <View style={styles.machineIcon}>
            <MaterialIcons 
              name={machine.type === 'Cardio' ? 'directions-run' : 'fitness-center'} 
              size={24} 
              color={COLORS.primary} 
            />
          </View>
          <View style={styles.headerInfo}>
            <Text style={styles.machineName}>{machine.name}</Text>
            <Text style={styles.machineLocation}>{machine.type}</Text>
          </View>
          <View style={[styles.statusIndicator, { backgroundColor: getStatusColor(machine.status) }]}>
            <MaterialIcons name={getStatusIcon(machine.status) as any} size={16} color="#fff" />
          </View>
        </View>

        {/* Détails de la machine */}
        <View style={styles.machineDetails}>
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>QR Code:</Text>
            <Text style={styles.detailValue}>{machine.qr_code}</Text>
          </View>
          {machine.description && (
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Description:</Text>
              <Text style={styles.detailValue}>{machine.description}</Text>
            </View>
          )}
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Statut:</Text>
            <Text style={[styles.detailValue, { color: getStatusColor(machine.status) }]}>
              {String(getStatusText(machine.status))}
            </Text>
          </View>
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Créée le:</Text>
            <Text style={styles.detailValue}>
              {String(new Date(machine.created_at).toLocaleDateString('fr-FR'))}
            </Text>
          </View>
        </View>

        {/* Actions */}
        <View style={styles.machineActions}>
          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => openEditModal(machine)}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <MaterialIcons name="edit" size={18} color={COLORS.accent} />
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.statusButton, { backgroundColor: COLORS.warning + '20' }]}
            onPress={() => {
              Alert.alert('Info', 'Changement de statut disponible via l\'édition')
            }}
          >
            <MaterialIcons name="build" size={16} color={COLORS.warning} />
            <Text style={[styles.statusButtonText, { color: COLORS.warning }]}>Maintenance</Text>
          </TouchableOpacity>
          
          <TouchableOpacity
            style={styles.deleteButton}
            onPress={() => handleDeleteMachine(machine.id)}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <MaterialIcons name="delete" size={18} color={COLORS.danger} />
          </TouchableOpacity>
        </View>
      </LinearGradient>
    </TouchableOpacity>
  )

  return (
    <LinearGradient colors={[COLORS.background, COLORS.surface]} style={styles.container}>
      {/* Statistiques rapides */}
      <View style={styles.statsContainer}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          {[
            { label: 'Total', value: stats.total, color: COLORS.primary },
            { label: 'Disponibles', value: stats.available, color: COLORS.success },
            { label: 'En Usage', value: stats.in_use, color: COLORS.accent },
            { label: 'Maintenance', value: stats.maintenance, color: COLORS.warning },
          ].map((stat, index) => (
            <View key={index} style={styles.statCard}>
              <Text style={[styles.statValue, { color: stat.color }]}>{stat.value}</Text>
              <Text style={styles.statLabel}>{stat.label}</Text>
            </View>
          ))}
        </ScrollView>
      </View>

      {/* Header avec recherche et filtres */}
      <View style={styles.header}>
        <View style={styles.searchContainer}>
          <MaterialIcons name="search" size={20} color={COLORS.textSecondary} />
          <TextInput
            style={styles.searchInput}
            placeholder="Rechercher une machine..."
            placeholderTextColor={COLORS.textMuted}
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
        </View>

        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filtersContainer}>
          {MACHINE_TYPES.map((type) => (
            <TouchableOpacity
              key={type}
              style={[
                styles.filterChip,
                selectedFilter === type && styles.filterChipActive
              ]}
              onPress={() => setSelectedFilter(type)}
            >
              <Text style={[
                styles.filterText,
                selectedFilter === type && styles.filterTextActive
              ]}>
                {type}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filtersContainer}>
          {[
            { key: 'all', label: 'Tous les statuts' },
            { key: 'available', label: 'Disponible' },
            { key: 'in_use', label: 'En Usage' },
            { key: 'maintenance', label: 'Maintenance' },
            { key: 'out_of_order', label: 'Hors Service' },
          ].map((status) => (
            <TouchableOpacity
              key={status.key}
              style={[
                styles.filterChip,
                selectedStatus === status.key && styles.filterChipActive
              ]}
              onPress={() => setSelectedStatus(status.key)}
            >
              <Text style={[
                styles.filterText,
                selectedStatus === status.key && styles.filterTextActive
              ]}>
                {status.label}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {/* Liste des machines */}
      {loading ? (
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
          <Text style={{ color: COLORS.textSecondary, fontSize: 16 }}>Chargement des machines...</Text>
        </View>
      ) : (
        <FlatList
          data={filteredMachines}
          renderItem={({ item }) => <MachineCard machine={item} />}
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
          <MaterialIcons name="add" size={24} color="#fff" />
        </LinearGradient>
      </TouchableOpacity>

      {/* Modales */}
      {/* Modale Ajout de machine */}
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
                <Text style={styles.modalTitle}>Ajouter une machine</Text>
                <TouchableOpacity onPress={closeModals} style={styles.closeButton}>
                  <MaterialIcons name="close" size={24} color={COLORS.textSecondary} />
                </TouchableOpacity>
              </View>

              <ScrollView style={styles.modalBody} showsVerticalScrollIndicator={false}>
                <View style={styles.inputGroup}>
                  <Text style={styles.inputLabel}>Nom de la machine *</Text>
                  <View style={styles.inputContainer}>
                    <MaterialIcons name="fitness-center" size={20} color={COLORS.textSecondary} />
                    <TextInput
                      style={styles.textInput}
                      placeholder="Tapis de Course Pro"
                      placeholderTextColor={COLORS.textMuted}
                      value={formData.name}
                      onChangeText={(text) => setFormData({ ...formData, name: text })}
                    />
                  </View>
                </View>

                <View style={styles.inputGroup}>
                  <Text style={styles.inputLabel}>Type de machine *</Text>
                  <View style={styles.pickerContainer}>
                    {['Cardio', 'Force', 'Fonctionnel', 'Étirement'].map((type) => (
                      <TouchableOpacity
                        key={type}
                        style={[
                          styles.pickerOption,
                          formData.type === type && styles.pickerOptionSelected
                        ]}
                        onPress={() => setFormData({ ...formData, type })}
                      >
                        <Text style={[
                          styles.pickerText,
                          formData.type === type && styles.pickerTextSelected
                        ]}>
                          {type}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </View>

                <View style={styles.inputGroup}>
                  <Text style={styles.inputLabel}>QR Code *</Text>
                  <View style={styles.inputContainer}>
                    <MaterialIcons name="qr-code" size={20} color={COLORS.textSecondary} />
                    <TextInput
                      style={styles.textInput}
                      placeholder="MACHINE-XXXX-XXX"
                      placeholderTextColor={COLORS.textMuted}
                      value={formData.qr_code}
                      onChangeText={(text) => setFormData({ ...formData, qr_code: text })}
                    />
                    <TouchableOpacity
                      onPress={() => setFormData({ ...formData, qr_code: generateQRCode() })}
                      style={styles.generateButton}
                    >
                      <MaterialIcons name="refresh" size={20} color={COLORS.primary} />
                    </TouchableOpacity>
                  </View>
                </View>

                <View style={styles.inputGroup}>
                  <Text style={styles.inputLabel}>Description</Text>
                  <View style={styles.inputContainer}>
                    <MaterialIcons name="description" size={20} color={COLORS.textSecondary} />
                    <TextInput
                      style={styles.textInput}
                      placeholder="Description de la machine..."
                      placeholderTextColor={COLORS.textMuted}
                      value={formData.description}
                      onChangeText={(text) => setFormData({ ...formData, description: text })}
                      multiline
                      numberOfLines={3}
                    />
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
                  onPress={handleAddMachine}
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

      {/* Modale Édition de machine */}
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
                <Text style={styles.modalTitle}>Modifier la machine</Text>
                <TouchableOpacity onPress={closeModals} style={styles.closeButton}>
                  <MaterialIcons name="close" size={24} color={COLORS.textSecondary} />
                </TouchableOpacity>
              </View>

              <ScrollView style={styles.modalBody} showsVerticalScrollIndicator={false}>
                <View style={styles.inputGroup}>
                  <Text style={styles.inputLabel}>Nom de la machine *</Text>
                  <View style={styles.inputContainer}>
                    <MaterialIcons name="fitness-center" size={20} color={COLORS.textSecondary} />
                    <TextInput
                      style={styles.textInput}
                      placeholder="Tapis de Course Pro"
                      placeholderTextColor={COLORS.textMuted}
                      value={formData.name}
                      onChangeText={(text) => setFormData({ ...formData, name: text })}
                    />
                  </View>
                </View>

                <View style={styles.inputGroup}>
                  <Text style={styles.inputLabel}>Type de machine *</Text>
                  <View style={styles.pickerContainer}>
                    {['Cardio', 'Force', 'Fonctionnel', 'Étirement'].map((type) => (
                      <TouchableOpacity
                        key={type}
                        style={[
                          styles.pickerOption,
                          formData.type === type && styles.pickerOptionSelected
                        ]}
                        onPress={() => setFormData({ ...formData, type })}
                      >
                        <Text style={[
                          styles.pickerText,
                          formData.type === type && styles.pickerTextSelected
                        ]}>
                          {type}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </View>

                <View style={styles.inputGroup}>
                  <Text style={styles.inputLabel}>QR Code *</Text>
                  <View style={styles.inputContainer}>
                    <MaterialIcons name="qr-code" size={20} color={COLORS.textSecondary} />
                    <TextInput
                      style={styles.textInput}
                      placeholder="MACHINE-XXXX-XXX"
                      placeholderTextColor={COLORS.textMuted}
                      value={formData.qr_code}
                      onChangeText={(text) => setFormData({ ...formData, qr_code: text })}
                    />
                  </View>
                </View>

                <View style={styles.inputGroup}>
                  <Text style={styles.inputLabel}>Statut</Text>
                  <View style={styles.pickerContainer}>
                    {['available', 'in_use', 'maintenance', 'out_of_order'].map((status) => (
                      <TouchableOpacity
                        key={status}
                        style={[
                          styles.pickerOption,
                          formData.status === status && styles.pickerOptionSelected
                        ]}
                        onPress={() => setFormData({ ...formData, status: status as any })}
                      >
                        <Text style={[
                          styles.pickerText,
                          formData.status === status && styles.pickerTextSelected
                        ]}>
                          {getStatusText(status)}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </View>

                <View style={styles.inputGroup}>
                  <Text style={styles.inputLabel}>Description</Text>
                  <View style={styles.inputContainer}>
                    <MaterialIcons name="description" size={20} color={COLORS.textSecondary} />
                    <TextInput
                      style={styles.textInput}
                      placeholder="Description de la machine..."
                      placeholderTextColor={COLORS.textMuted}
                      value={formData.description}
                      onChangeText={(text) => setFormData({ ...formData, description: text })}
                      multiline
                      numberOfLines={3}
                    />
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
                  onPress={handleEditMachine}
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
  
  // Statistiques
  statsContainer: {
    paddingVertical: 15,
    paddingHorizontal: 20,
  },
  statCard: {
    backgroundColor: COLORS.surface,
    paddingVertical: 15,
    paddingHorizontal: 20,
    borderRadius: 12,
    marginRight: 15,
    alignItems: 'center',
    minWidth: 80,
    borderWidth: 1,
    borderColor: COLORS.surfaceLight,
  },
  statValue: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 5,
  },
  statLabel: {
    fontSize: 12,
    color: COLORS.textSecondary,
    textAlign: 'center',
  },

  // Header
  header: {
    paddingHorizontal: 20,
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
    marginBottom: 10,
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
  machineCard: {
    marginBottom: 16,
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
  },
  machineCardGradient: {
    padding: 16,
  },

  // Header de carte
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 15,
  },
  machineIcon: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: COLORS.primary + '20',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 15,
  },
  headerInfo: {
    flex: 1,
  },
  machineName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: COLORS.textPrimary,
    marginBottom: 4,
  },
  machineLocation: {
    fontSize: 14,
    color: COLORS.textSecondary,
  },
  statusIndicator: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },

  // Détails
  machineDetails: {
    marginBottom: 15,
    gap: 8,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  detailLabel: {
    fontSize: 14,
    color: COLORS.textMuted,
    fontWeight: '500',
  },
  detailValue: {
    fontSize: 14,
    color: COLORS.textPrimary,
    fontWeight: '600',
  },

  // Utilisation
  utilizationSection: {
    marginBottom: 15,
  },
  utilizationHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  utilizationLabel: {
    fontSize: 14,
    color: COLORS.textSecondary,
    fontWeight: '500',
  },
  utilizationRate: {
    fontSize: 14,
    fontWeight: 'bold',
  },
  utilizationBar: {
    height: 6,
    backgroundColor: COLORS.surfaceLight,
    borderRadius: 3,
    overflow: 'hidden',
  },
  utilizationFill: {
    height: '100%',
    borderRadius: 3,
  },

  // Actions
  machineActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  statusButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    gap: 6,
  },
  statusButtonText: {
    fontSize: 12,
    fontWeight: '600',
  },
  actionButton: {
    padding: 8,
    borderRadius: 20,
  },
  deleteButton: {
    padding: 8,
    borderRadius: 20,
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
    alignItems: 'flex-start',
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
    textAlignVertical: 'top',
  },
  generateButton: {
    padding: 5,
    borderRadius: 8,
  },
  pickerContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    backgroundColor: COLORS.background,
    borderRadius: 12,
    padding: 4,
    gap: 4,
  },
  pickerOption: {
    flex: 1,
    minWidth: '45%',
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