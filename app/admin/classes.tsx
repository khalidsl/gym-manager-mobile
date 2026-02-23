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
} from 'react-native'
import { LinearGradient } from 'expo-linear-gradient'
import { MaterialIcons } from '@expo/vector-icons'
import { BlurView } from 'expo-blur'

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

// Types
interface Class {
  id: string
  name: string
  type: string
  instructor: string
  duration: number
  capacity: number
  enrolled: number
  startTime: string
  endTime: string
  date: string
  location: string
  level: 'Débutant' | 'Intermédiaire' | 'Avancé'
  status: 'scheduled' | 'ongoing' | 'completed' | 'cancelled'
  description: string
  equipment?: string[]
}

// Données factices
const MOCK_CLASSES: Class[] = [
  {
    id: '1',
    name: 'Yoga Matinal',
    type: 'Yoga',
    instructor: 'Sophie Martin',
    duration: 60,
    capacity: 20,
    enrolled: 15,
    startTime: '08:00',
    endTime: '09:00',
    date: '2024-02-18',
    location: 'Studio A',
    level: 'Débutant',
    status: 'scheduled',
    description: 'Séance de yoga relaxante pour bien commencer la journée.',
    equipment: ['Tapis de yoga', 'Blocs'], 
  },
  {
    id: '2',
    name: 'HIIT Intense',
    type: 'HIIT',
    instructor: 'Marc Dubois',
    duration: 45,
    capacity: 15,
    enrolled: 12,
    startTime: '18:30',
    endTime: '19:15',
    date: '2024-02-17',
    location: 'Salle Fonctionnelle',
    level: 'Avancé',
    status: 'ongoing',
    description: 'Entraînement haute intensité pour brûler un maximum de calories.',
    equipment: ['Kettlebells', 'Battle rope'],
  },
  {
    id: '3',
    name: 'Pilates Core',
    type: 'Pilates',
    instructor: 'Emma Laurent',
    duration: 50,
    capacity: 16,
    enrolled: 16,
    startTime: '12:00',
    endTime: '12:50',
    date: '2024-02-17',
    location: 'Studio B',
    level: 'Intermédiaire',
    status: 'completed',
    description: 'Renforcement du tronc et amélioration de la posture.',
    equipment: ['Tapis', 'Swiss ball'],
  },
  {
    id: '4',
    name: 'Aqua Fitness',
    type: 'Aquatique',
    instructor: 'Julie Moreau',
    duration: 40,
    capacity: 12,
    enrolled: 8,
    startTime: '16:00',
    endTime: '16:40',
    date: '2024-02-18',
    location: 'Piscine',
    level: 'Débutant',
    status: 'cancelled',
    description: 'Exercices cardio en douceur dans l\'eau.',
    equipment: ['Frites', 'Planches'],
  },
]

const CLASS_TYPES = ['Tous', 'Yoga', 'HIIT', 'Pilates', 'Aquatique', 'Spinning', 'Zumba']
const CLASS_LEVELS = ['Tous', 'Débutant', 'Intermédiaire', 'Avancé']

export default function AdminClasses() {
  const [classes, setClasses] = useState<Class[]>(MOCK_CLASSES)
  const [filteredClasses, setFilteredClasses] = useState<Class[]>(MOCK_CLASSES)
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedType, setSelectedType] = useState('Tous')
  const [selectedLevel, setSelectedLevel] = useState('Tous')
  const [selectedStatus, setSelectedStatus] = useState('all')
  const [refreshing, setRefreshing] = useState(false)
  const [showAddModal, setShowAddModal] = useState(false)
  const [selectedClass, setSelectedClass] = useState<Class | null>(null)

  useEffect(() => {
    filterClasses()
  }, [searchQuery, selectedType, selectedLevel, selectedStatus, classes])

  const filterClasses = () => {
    let filtered = classes

    // Filtrage par recherche
    if (searchQuery) {
      filtered = filtered.filter(cls => 
        cls.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        cls.instructor.toLowerCase().includes(searchQuery.toLowerCase()) ||
        cls.location.toLowerCase().includes(searchQuery.toLowerCase())
      )
    }

    // Filtrage par type
    if (selectedType !== 'Tous') {
      filtered = filtered.filter(cls => cls.type === selectedType)
    }

    // Filtrage par niveau
    if (selectedLevel !== 'Tous') {
      filtered = filtered.filter(cls => cls.level === selectedLevel)
    }

    // Filtrage par statut
    if (selectedStatus !== 'all') {
      filtered = filtered.filter(cls => cls.status === selectedStatus)
    }

    setFilteredClasses(filtered)
  }

  const onRefresh = async () => {
    setRefreshing(true)
    // Simulation d'une requête API
    setTimeout(() => {
      setRefreshing(false)
    }, 1000)
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'scheduled': return COLORS.secondary
      case 'ongoing': return COLORS.success  
      case 'completed': return COLORS.textMuted
      case 'cancelled': return COLORS.danger
      default: return COLORS.textMuted
    }
  }

  const getStatusText = (status: string) => {
    switch (status) {
      case 'scheduled': return 'Programmé'
      case 'ongoing': return 'En cours'
      case 'completed': return 'Terminé'
      case 'cancelled': return 'Annulé'
      default: return status
    }
  }

  const getLevelColor = (level: string) => {
    switch (level) {
      case 'Débutant': return COLORS.success
      case 'Intermédiaire': return COLORS.warning
      case 'Avancé': return COLORS.danger
      default: return COLORS.textMuted
    }
  }

  const getOccupancyRate = (enrolled: number, capacity: number) => {
    return Math.round((enrolled / capacity) * 100)
  }

  const getOccupancyColor = (rate: number) => {
    if (rate >= 90) return COLORS.danger
    if (rate >= 70) return COLORS.warning
    return COLORS.success
  }

  const handleCancelClass = (classId: string) => {
    Alert.alert(
      'Annuler le cours',
      'Êtes-vous sûr de vouloir annuler ce cours ?',
      [
        { text: 'Non', style: 'cancel' },
        {
          text: 'Oui, annuler',
          style: 'destructive',
          onPress: () => {
            setClasses(classes.map(c => c.id === classId ? { ...c, status: 'cancelled' } : c))
          }
        }
      ]
    )
  }

  const handleDeleteClass = (classId: string) => {
    Alert.alert(
      'Supprimer le cours',
      'Êtes-vous sûr de vouloir supprimer ce cours définitivement ?',
      [
        { text: 'Annuler', style: 'cancel' },
        {
          text: 'Supprimer',
          style: 'destructive',
          onPress: () => {
            setClasses(classes.filter(c => c.id !== classId))
          }
        }
      ]
    )
  }

  const ClassCard = ({ classItem }: { classItem: Class }) => {
    const occupancyRate = getOccupancyRate(classItem.enrolled, classItem.capacity)
    
    return (
      <TouchableOpacity 
        style={styles.classCard}
        onPress={() => setSelectedClass(classItem)}
        activeOpacity={0.8}
      >
        <LinearGradient
          colors={[COLORS.surface, COLORS.surfaceLight]}
          style={styles.classCardGradient}
        >
          {/* Header */}
          <View style={styles.cardHeader}>
            <View style={styles.classInfo}>
              <Text style={styles.className}>{classItem.name}</Text>
              <View style={styles.timeLocation}>
                <MaterialIcons name="access-time" size={12} color={COLORS.textSecondary} />
                <Text style={styles.timeText}>{classItem.startTime} - {classItem.endTime}</Text>
                <MaterialIcons name="location-on" size={12} color={COLORS.textSecondary} />
                <Text style={styles.locationText}>{classItem.location}</Text>
              </View>
            </View>
            <View style={[styles.statusBadge, { backgroundColor: getStatusColor(classItem.status) + '20' }]}>
              <Text style={[styles.statusText, { color: getStatusColor(classItem.status) }]}>
                {String(getStatusText(classItem.status))}
              </Text>
            </View>
          </View>

          {/* Détails */}
          <View style={styles.classDetails}>
            <View style={styles.detailRow}>
              <MaterialIcons name="person" size={16} color={COLORS.accent} />
              <Text style={styles.detailText}>Coach: {classItem.instructor}</Text>
            </View>
            <View style={styles.detailRow}>
              <MaterialIcons name="schedule" size={16} color={COLORS.textSecondary} />
              <Text style={styles.detailText}>Durée: {classItem.duration} min</Text>
            </View>
            <View style={styles.detailRow}>
              <View style={[styles.levelBadge, { backgroundColor: getLevelColor(classItem.level) + '20' }]}>
                <Text style={[styles.levelText, { color: getLevelColor(classItem.level) }]}>
                  {classItem.level}
                </Text>
              </View>
            </View>
          </View>

          {/* Occupation */}
          <View style={styles.occupancySection}>
            <View style={styles.occupancyHeader}>
              <Text style={styles.occupancyLabel}>
                Participants: {classItem.enrolled}/{classItem.capacity}
              </Text>
              <Text style={[styles.occupancyRate, { color: getOccupancyColor(occupancyRate) }]}>
                {occupancyRate}%
              </Text>
            </View>
            <View style={styles.occupancyBar}>
              <View 
                style={[
                  styles.occupancyFill,
                  { 
                    width: `${occupancyRate}%`,
                    backgroundColor: getOccupancyColor(occupancyRate)
                  }
                ]} 
              />
            </View>
          </View>

          {/* Actions */}
          {classItem.status === 'scheduled' && (
            <View style={styles.classActions}>
              <TouchableOpacity
                style={[styles.actionButton, { backgroundColor: COLORS.warning + '20' }]}
                onPress={() => handleCancelClass(classItem.id)}
              >
                <MaterialIcons name="cancel" size={16} color={COLORS.warning} />
                <Text style={[styles.actionButtonText, { color: COLORS.warning }]}>Annuler</Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                style={styles.deleteButton}
                onPress={() => handleDeleteClass(classItem.id)}
                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              >
                <MaterialIcons name="delete" size={18} color={COLORS.danger} />
              </TouchableOpacity>
            </View>
          )}
        </LinearGradient>
      </TouchableOpacity>
    )
  }

  const getStatistics = () => {
    const total = classes.length
    const scheduled = classes.filter(c => c.status === 'scheduled').length
    const ongoing = classes.filter(c => c.status === 'ongoing').length
    const completed = classes.filter(c => c.status === 'completed').length
    
    return { total, scheduled, ongoing, completed }
  }

  const stats = getStatistics()

  return (
    <LinearGradient colors={[COLORS.background, COLORS.surface]} style={styles.container}>
      {/* Statistiques rapides */}
      <View style={styles.statsContainer}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          {[
            { label: 'Total', value: stats.total, color: COLORS.primary },
            { label: 'Programmés', value: stats.scheduled, color: COLORS.secondary },
            { label: 'En cours', value: stats.ongoing, color: COLORS.success },
            { label: 'Terminés', value: stats.completed, color: COLORS.textMuted },
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
            placeholder="Rechercher un cours..."
            placeholderTextColor={COLORS.textMuted}
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
        </View>

        {/* Filtres par type */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filtersContainer}>
          {CLASS_TYPES.map((type) => (
            <TouchableOpacity
              key={type}
              style={[
                styles.filterChip,
                selectedType === type && styles.filterChipActive
              ]}
              onPress={() => setSelectedType(type)}
            >
              <Text style={[
                styles.filterText,
                selectedType === type && styles.filterTextActive
              ]}>
                {type}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {/* Filtres par niveau */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filtersContainer}>
          {CLASS_LEVELS.map((level) => (
            <TouchableOpacity
              key={level}
              style={[
                styles.filterChip,
                selectedLevel === level && styles.filterChipActive
              ]}
              onPress={() => setSelectedLevel(level)}
            >
              <Text style={[
                styles.filterText,
                selectedLevel === level && styles.filterTextActive
              ]}>
                {level}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {/* Liste des cours */}
      <FlatList
        data={filteredClasses}
        renderItem={({ item }) => <ClassCard classItem={item} />}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContainer}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        showsVerticalScrollIndicator={false}
      />

      {/* Bouton flottant d'ajout */}
      <TouchableOpacity
        style={styles.fab}
        onPress={() => setShowAddModal(true)}
        activeOpacity={0.8}
      >
        <LinearGradient
          colors={[COLORS.primary, COLORS.accent]}
          style={styles.fabGradient}
        >
          <MaterialIcons name="event" size={24} color="#fff" />
        </LinearGradient>
      </TouchableOpacity>
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
  classCard: {
    marginBottom: 16,
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
  },
  classCardGradient: {
    padding: 16,
  },

  // Header de carte
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 15,
  },
  classInfo: {
    flex: 1,
  },
  className: {
    fontSize: 18,
    fontWeight: 'bold',
    color: COLORS.textPrimary,
    marginBottom: 6,
  },
  timeLocation: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  timeText: {
    fontSize: 12,
    color: COLORS.textSecondary,
  },
  locationText: {
    fontSize: 12,
    color: COLORS.textSecondary,
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

  // Détails
  classDetails: {
    marginBottom: 15,
    gap: 8,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  detailText: {
    fontSize: 14,
    color: COLORS.textSecondary,
  },
  levelBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  levelText: {
    fontSize: 12,
    fontWeight: '600',
  },

  // Occupation
  occupancySection: {
    marginBottom: 15,
  },
  occupancyHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,  
  },
  occupancyLabel: {
    fontSize: 14,
    color: COLORS.textSecondary,
    fontWeight: '500',
  },
  occupancyRate: {
    fontSize: 14,
    fontWeight: 'bold',
  },
  occupancyBar: {
    height: 6,
    backgroundColor: COLORS.surfaceLight,
    borderRadius: 3,
    overflow: 'hidden',
  },
  occupancyFill: {
    height: '100%',
    borderRadius: 3,
  },

  // Actions
  classActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    gap: 6,
  },
  actionButtonText: {
    fontSize: 12,
    fontWeight: '600',
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
})
//   placeholderText: {
//     fontSize: 16,
//     color: COLORS.textSecondary,
//     textAlign: 'center',
//     lineHeight: 24,
//   },
// })