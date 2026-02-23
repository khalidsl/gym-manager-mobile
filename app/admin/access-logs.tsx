import React, { useState, useEffect } from 'react'
import { 
  View, 
  Text, 
  StyleSheet, 
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
  RefreshControl,
  FlatList,
  Platform,
} from 'react-native'
import { LinearGradient } from 'expo-linear-gradient'
import { MaterialIcons } from '@expo/vector-icons'
import { BlurView } from 'expo-blur'
import { getAccessLogs, getTodayAccessLogs, getMembersInside, getAccessStats, type AccessLogEntry, type MemberAccess } from '../../services/access'

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

export default function AccessLogsScreen() {
  const [accessLogs, setAccessLogs] = useState<AccessLogEntry[]>([])
  const [membersInside, setMembersInside] = useState<MemberAccess[]>([])
  const [activeTab, setActiveTab] = useState<'today' | 'all' | 'inside' | 'entries'>('today')
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [stats, setStats] = useState({
    todayEntries: 0,
    todayExits: 0,
    currentlyInside: 0,
    peakHour: '08:00'
  })

  useEffect(() => {
    loadAccessData()
  }, [activeTab])

  const loadAccessData = async () => {
    try {
      setLoading(true)
      const [statsData, membersData] = await Promise.all([
        getAccessStats(),
        getMembersInside()
      ])

      setStats(statsData)
      setMembersInside(membersData)
      console.log('🖥️ membersData reçus dans screen:', membersData.length, membersData)

      if (activeTab === 'today') {
        const todayLogs = await getTodayAccessLogs()
        setAccessLogs(todayLogs)
      } else if (activeTab === 'all') {
        const allLogs = await getAccessLogs(100)
        setAccessLogs(allLogs)
      } else if (activeTab === 'entries') {
        // Récupérer toutes les entrées d'aujourd'hui
        const todayLogs = await getTodayAccessLogs()
        const entriesOnly = todayLogs.filter(log => log.action === 'entry')
        setAccessLogs(entriesOnly)
      }
    } catch (error) {
      console.error('Erreur chargement données:', error)
      Alert.alert('Erreur', 'Impossible de charger les données d\'accès')
    } finally {
      setLoading(false)
    }
  }

  const onRefresh = async () => {
    setRefreshing(true)
    await loadAccessData()
    setRefreshing(false)
  }

  const formatTime = (timestamp: string) => {
    return new Date(timestamp).toLocaleTimeString('fr-FR', {
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const formatDate = (timestamp: string) => {
    return new Date(timestamp).toLocaleDateString('fr-FR')
  }

  const renderAccessLogItem = ({ item }: { item: AccessLogEntry }) => {
    // Utiliser 'action' selon la structure DB
    const isEntry = item.action === 'entry'
    const qrCode = item.member_qr_code || 'QR Code'
    
    return (
      <View style={styles.logCard}>
        <View style={styles.logHeader}>
          <View style={styles.memberInfo}>
            <MaterialIcons
              name={isEntry ? 'login' : 'logout'}
              size={20}
              color={isEntry ? COLORS.success : COLORS.warning}
            />
            <Text style={styles.logMember}>
              {String(item.member_name || 'Membre inconnu')}
            </Text>
          </View>
          <Text style={styles.logTime}>
            {String(formatTime(item.timestamp))}
          </Text>
        </View>
        
        <View style={styles.entryDetails}>
          <View style={styles.entryInfo}>
            <Text style={[styles.actionText, { color: isEntry ? COLORS.success : COLORS.warning }]}>
              {String(isEntry ? '🚪 ENTRÉE' : '🚶 SORTIE')}
            </Text>
            <Text style={styles.methodBadge}>
              {String(qrCode.includes('GYM_') ? 'QR Gym' : 'QR Code')}
            </Text>
          </View>
          
          <View style={styles.timestampContainer}>
            <Text style={styles.dateText}>{String(formatDate(item.timestamp))}</Text>
            <Text style={styles.fullTimeText}>
              {String(new Date(item.timestamp).toLocaleTimeString('fr-FR'))}
            </Text>
          </View>
        </View>
        
        <View style={styles.qrInfoContainer}>
          <Text style={styles.qrCodeText} numberOfLines={1}>
            {String(`QR: ${qrCode}`)}
          </Text>
        </View>
        
        {isEntry && (
          <View style={styles.entrySuccessBadge}>
            <MaterialIcons name="check-circle" size={16} color={COLORS.success} />
            <Text style={styles.successText}>{String('Accès autorisé')}</Text>
          </View>
        )}
      </View>
    )
  }

  const renderMemberInsideItem = ({ item }: { item: MemberAccess }) => {
    const lastAccessTime = item.last_access || new Date().toISOString();
    const duration = Math.round((Date.now() - new Date(lastAccessTime).getTime()) / (1000 * 60));
    const memberName = `${item.first_name || ''} ${item.last_name || ''}`.trim() || item.email || 'Membre inconnu';
    
    // Calculer la durée formatée
    const formatDuration = (minutes: number) => {
      if (minutes < 60) {
        return `${minutes}min`;
      } else {
        const hours = Math.floor(minutes / 60);
        const remainingMinutes = minutes % 60;
        return `${hours}h${remainingMinutes > 0 ? ` ${remainingMinutes}min` : ''}`;
      }
    };
    
    // Déterminer la couleur selon la durée
    const getDurationColor = (minutes: number) => {
      if (minutes < 30) return COLORS.success;
      if (minutes < 120) return COLORS.primary;
      if (minutes < 240) return COLORS.warning;
      return COLORS.danger;
    };
    
    return (
      <View style={styles.enhancedMemberCard}>
        <BlurView intensity={80} tint="dark" style={styles.memberBlur}>
          <View style={styles.memberCardContent}>
            {/* Header avec nom et statut */}
            <View style={styles.memberCardHeader}>
              <View style={styles.memberIdentity}>
                <View style={[styles.statusDot, { backgroundColor: COLORS.success }]} />
                <View style={styles.memberNameSection}>
                  <Text style={styles.enhancedMemberName}>
                    {String(memberName)}
                  </Text>
                  <Text style={styles.memberEmail}>
                    {String(item.email || 'Email non disponible')}
                  </Text>
                </View>
              </View>
              <TouchableOpacity style={styles.memberOptionsButton}>
                <MaterialIcons name="more-vert" size={20} color={COLORS.textSecondary} />
              </TouchableOpacity>
            </View>
            
            {/* Informations d'accès */}
            <View style={styles.accessInfoSection}>
              <View style={styles.accessInfoRow}>
                <MaterialIcons name="schedule" size={16} color={COLORS.textSecondary} />
                <Text style={styles.accessInfoLabel}>Entrée:</Text>
                <Text style={styles.accessInfoValue}>
                  {String(formatTime(lastAccessTime))}
                </Text>
              </View>
              <View style={styles.accessInfoRow}>
                <MaterialIcons name="timer" size={16} color={getDurationColor(duration)} />
                <Text style={styles.accessInfoLabel}>Durée:</Text>
                <Text style={[styles.durationValue, { color: getDurationColor(duration) }]}>
                  {String(duration >= 0 ? formatDuration(duration) : 'Récent')}
                </Text>
              </View>
            </View>
            
            {/* Barre de progression pour la durée */}
            <View style={styles.durationProgressContainer}>
              <View style={styles.durationProgressBar}>
                <View 
                  style={[
                    styles.durationProgressFill,
                    { 
                      width: `${Math.min((duration / 300) * 100, 100)}%`,
                      backgroundColor: getDurationColor(duration)
                    }
                  ]}
                />
              </View>
              <Text style={styles.durationProgressText}>
                {String(duration < 300 ? 'Séance normale' : duration < 480 ? 'Séance longue' : 'Très longue séance')}
              </Text>
            </View>
            
            {/* Actions rapides */}
            <View style={styles.memberActions}>
              <TouchableOpacity style={styles.actionButton}>
                <MaterialIcons name="person" size={16} color={COLORS.primary} />
                <Text style={styles.actionButtonText}>Profil</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.actionButton}>
                <MaterialIcons name="history" size={16} color={COLORS.secondary} />
                <Text style={styles.actionButtonText}>Historique</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.actionButton, styles.emergencyButton]}>
                <MaterialIcons name="exit-to-app" size={16} color={COLORS.warning} />
                <Text style={[styles.actionButtonText, { color: COLORS.warning }]}>Sortie forcée</Text>
              </TouchableOpacity>
            </View>
          </View>
        </BlurView>
      </View>
    )
  }

  const renderTabButton = (tab: 'today' | 'all' | 'inside' | 'entries', label: string, icon: string) => (
    <TouchableOpacity
      style={[styles.tabButton, activeTab === tab && styles.tabButtonActive]}
      onPress={() => setActiveTab(tab)}
    >
      <MaterialIcons
        name={icon as any}
        size={20}
        color={activeTab === tab ? '#fff' : COLORS.textSecondary}
      />
      <Text style={[
        styles.tabText,
        activeTab === tab && styles.tabTextActive
      ]}>
        {String(label)}
      </Text>
    </TouchableOpacity>
  )

  const renderContent = () => {
    if (loading) {
      return (
        <View style={styles.emptyState}>
          <MaterialIcons name="hourglass-empty" size={48} color={COLORS.textSecondary} />
          <Text style={styles.emptyText}>Chargement...</Text>
        </View>
      )
    }

    if (activeTab === 'inside') {
      // Calculer les statistiques des membres présents
      const avgDuration = membersInside.length > 0 
        ? Math.round(membersInside.reduce((sum, member) => {
            const lastAccessTime = member.last_access || new Date().toISOString();
            const duration = Math.round((Date.now() - new Date(lastAccessTime).getTime()) / (1000 * 60));
            return sum + duration;
          }, 0) / membersInside.length)
        : 0;
      
      const longestSession = membersInside.length > 0
        ? Math.max(...membersInside.map(member => {
            const lastAccessTime = member.last_access || new Date().toISOString();
            return Math.round((Date.now() - new Date(lastAccessTime).getTime()) / (1000 * 60));
          }))
        : 0;
      
      return (
        <View style={styles.membersContainer}>
          {/* En-tête avec statistiques */}
          <View style={styles.membersHeader}>
            <Text style={styles.sectionTitle}>
              Membres Actifs ({String(membersInside.length)})
            </Text>
            <View style={styles.membersStatsRow}>
              <View style={styles.memberStatCard}>
                <Text style={styles.memberStatNumber}>{String(avgDuration)}min</Text>
                <Text style={styles.memberStatLabel}>Durée moy.</Text>
              </View>
              <View style={styles.memberStatCard}>
                <Text style={styles.memberStatNumber}>{String(longestSession)}min</Text>
                <Text style={styles.memberStatLabel}>Plus longue</Text>
              </View>
              <TouchableOpacity style={styles.refreshButton} onPress={onRefresh}>
                <MaterialIcons name="refresh" size={20} color={COLORS.primary} />
              </TouchableOpacity>
            </View>
          </View>
          
          {membersInside.length === 0 ? (
            <View style={styles.enhancedEmptyState}>
              <BlurView intensity={60} tint="dark" style={styles.emptyStateBlur}>
                <MaterialIcons name="fitness-center" size={64} color={COLORS.textSecondary} />
                <Text style={styles.emptyStateTitle}>Salle vide</Text>
                <Text style={styles.emptyStateSubtitle}>
                  Aucun membre n'est actuellement présent dans la salle
                </Text>
                <TouchableOpacity style={styles.emptyStateButton} onPress={onRefresh}>
                  <Text style={styles.emptyStateButtonText}>Actualiser</Text>
                </TouchableOpacity>
              </BlurView>
            </View>
          ) : (
            <View style={styles.membersListContent}>
              {membersInside.map((item) => (
                <View key={item.id}>
                  {renderMemberInsideItem({ item })}
                </View>
              ))}
            </View>
          )}
        </View>
      )
    }

    return (
      <View style={styles.logsContainer}>
        <Text style={styles.sectionTitle}>
          {activeTab === 'today' 
            ? 'Accès du jour' 
            : activeTab === 'entries' 
            ? 'Entrées à la salle'
            : 'Tous les accès'
          } ({String(accessLogs.length)})
        </Text>
        {accessLogs.length === 0 ? (
          <View style={styles.emptyState}>
            <MaterialIcons name="assignment" size={48} color={COLORS.textSecondary} />
            <Text style={styles.emptyText}>
              {activeTab === 'today' 
                ? "Aucun accès aujourd'hui" 
                : activeTab === 'entries'
                ? "Aucune entrée aujourd'hui"
                : 'Aucun accès enregistré'
              }
            </Text>
          </View>
        ) : (
          <ScrollView 
            style={styles.scrollableList}
            showsVerticalScrollIndicator={false}
          >
            {accessLogs.map((item) => (
              <View key={item.id}>
                {renderAccessLogItem({ item })}
              </View>
            ))}
          </ScrollView>
        )}
      </View>
    )
  }

  return (
    <LinearGradient
      colors={[COLORS.background, '#1A1A2E']}
      style={styles.container}
    >
      <ScrollView
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={COLORS.primary}
          />
        }
        showsVerticalScrollIndicator={false}
      >
        {/* Stats Header */}
        <View style={styles.statsHeader}>
          <View style={styles.statsGrid}>
            <View style={styles.statCard}>
              <Text style={styles.statNumber}>{String(stats.todayEntries || 0)}</Text>
              <Text style={styles.statLabel}>Entrées</Text>
            </View>
            <View style={styles.statCard}>
              <Text style={styles.statNumber}>{String(stats.todayExits || 0)}</Text>
              <Text style={styles.statLabel}>Sorties</Text>
            </View>
            <View style={styles.statCard}>
              <Text style={styles.statNumber}>{String(stats.currentlyInside || 0)}</Text>
              <Text style={styles.statLabel}>Présents</Text>
            </View>
          </View>
        </View>

        {/* Tabs */}
        <View style={styles.tabsContainer}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            <View style={styles.tabsRow}>
              {renderTabButton('today', "Aujourd'hui", 'today')}
              {renderTabButton('entries', 'Entrées', 'login')}
              {renderTabButton('all', 'Tout', 'list')}
              {renderTabButton('inside', 'Présents', 'people')}
            </View>
          </ScrollView>
        </View>

        {/* Content */}
        <View style={styles.contentContainer}>
          {renderContent()}
        </View>
      </ScrollView>
    </LinearGradient>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  statsHeader: {
    paddingHorizontal: 24,
    paddingTop: 20,
    paddingBottom: 10,
  },
  statsGrid: {
    flexDirection: 'row',
    gap: 12,
  },
  statCard: {
    flex: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
  },
  statNumber: {
    fontSize: 24,
    fontWeight: 'bold',
    color: COLORS.textPrimary,
  },
  statLabel: {
    fontSize: 12,
    color: COLORS.textSecondary,
    marginTop: 4,
  },
  tabsContainer: {
    flexDirection: 'row',
    paddingHorizontal: 24,
    marginBottom: 20,
  },
  tabsRow: {
    flexDirection: 'row',
    gap: 8,
  },
  tabButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    gap: 8,
    minWidth: 100,
  },
  tabButtonActive: {
    backgroundColor: COLORS.primary,
  },
  tabText: {
    fontSize: 14,
    fontWeight: '500',
    color: COLORS.textSecondary,
  },
  tabTextActive: {
    color: '#fff',
  },
  contentContainer: {
    flex: 1,
    paddingHorizontal: 24,
    paddingBottom: 40,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: COLORS.textPrimary,
    marginBottom: 16,
  },
  logsContainer: {
    flex: 1,
  },
  membersContainer: {
    flex: 1,
  },
  scrollableList: {
    flex: 1,
    maxHeight: 400, // Limite la hauteur pour permettre le défilement
  },
  listContainer: {
    gap: 12,
  },
  logCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 12,
    padding: 16,
  },
  logHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  logMember: {
    fontSize: 16,
    fontWeight: 'bold',
    color: COLORS.textPrimary,
  },
  logTime: {
    fontSize: 14,
    color: COLORS.textSecondary,
  },
  logDetails: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  logInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  logType: {
    fontSize: 14,
    color: COLORS.textSecondary,
  },
  logMethod: {
    fontSize: 12,
    color: COLORS.textSecondary,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  statusSuccess: {
    backgroundColor: COLORS.success + '20',
  },
  statusText: {
    fontSize: 12,
    fontWeight: '500',
  },
  statusTextSuccess: {
    color: COLORS.success,
  },
  memberCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 12,
    padding: 16,
  },
  memberHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  memberName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: COLORS.textPrimary,
  },
  memberDuration: {
    fontSize: 14,
    color: COLORS.primary,
    fontWeight: '600',
  },
  memberEntry: {
    fontSize: 14,
    color: COLORS.textSecondary,
  },
  // Styles améliorés pour l'affichage des membres
  enhancedMemberCard: {
    marginBottom: 16,
    borderRadius: 20,
    overflow: 'hidden',
    elevation: 8,
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
  },
  memberBlur: {
    padding: 20,
  },
  memberCardContent: {
    flex: 1,
  },
  memberCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  memberIdentity: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    flex: 1,
  },
  statusDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginTop: 3,
    marginRight: 12,
  },
  memberNameSection: {
    flex: 1,
  },
  enhancedMemberName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: COLORS.textPrimary,
    marginBottom: 2,
  },
  memberEmail: {
    fontSize: 14,
    color: COLORS.textSecondary,
  },
  memberOptionsButton: {
    padding: 8,
    borderRadius: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
  },
  accessInfoSection: {
    marginBottom: 16,
  },
  accessInfoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
    gap: 8,
  },
  accessInfoLabel: {
    fontSize: 14,
    color: COLORS.textSecondary,
    width: 60,
  },
  accessInfoValue: {
    fontSize: 14,
    color: COLORS.textPrimary,
    fontWeight: '500',
  },
  durationValue: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  durationProgressContainer: {
    marginBottom: 16,
  },
  durationProgressBar: {
    height: 6,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 3,
    overflow: 'hidden',
    marginBottom: 6,
  },
  durationProgressFill: {
    height: '100%',
    borderRadius: 3,
  },
  durationProgressText: {
    fontSize: 12,
    color: COLORS.textSecondary,
    fontStyle: 'italic',
  },
  memberActions: {
    flexDirection: 'row',
    gap: 8,
    flexWrap: 'wrap',
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 8,
    gap: 4,
  },
  emergencyButton: {
    backgroundColor: 'rgba(255, 212, 63, 0.2)',
  },
  actionButtonText: {
    fontSize: 12,
    color: COLORS.textSecondary,
    fontWeight: '500',
  },
  membersHeader: {
    marginBottom: 20,
  },
  membersStatsRow: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 12,
    alignItems: 'center',
  },
  memberStatCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    borderRadius: 12,
    paddingVertical: 8,
    paddingHorizontal: 12,
    alignItems: 'center',
    flex: 1,
  },
  memberStatNumber: {
    fontSize: 16,
    fontWeight: 'bold',
    color: COLORS.primary,
  },
  memberStatLabel: {
    fontSize: 11,
    color: COLORS.textSecondary,
    marginTop: 2,
  },
  refreshButton: {
    backgroundColor: 'rgba(255, 107, 53, 0.2)',
    borderRadius: 12,
    padding: 12,
  },
  enhancedEmptyState: {
    flex: 1,
    marginTop: 40,
    borderRadius: 20,
    overflow: 'hidden',
  },
  emptyStateBlur: {
    padding: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyStateTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: COLORS.textPrimary,
    marginTop: 16,
  },
  emptyStateSubtitle: {
    fontSize: 14,
    color: COLORS.textSecondary,
    textAlign: 'center',
    marginTop: 8,
    lineHeight: 20,
  },
  emptyStateButton: {
    backgroundColor: COLORS.primary,
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 12,
    marginTop: 20,
  },
  emptyStateButtonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 14,
  },
  enhancedScrollableList: {
    flex: 1,
    maxHeight: 500,
  },
  membersListContent: {
    paddingBottom: 20,
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 60,
  },
  emptyText: {
    fontSize: 16,
    color: COLORS.textSecondary,
    marginTop: 16,
    textAlign: 'center',
  },
  // Nouveaux styles pour l'affichage amélioré
  memberInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  entryDetails: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 8,
  },
  entryInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  actionText: {
    fontSize: 14,
    fontWeight: 'bold',
  },
  methodBadge: {
    fontSize: 11,
    color: COLORS.textSecondary,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  timestampContainer: {
    alignItems: 'flex-end',
  },
  dateText: {
    fontSize: 12,
    color: COLORS.textSecondary,
  },
  fullTimeText: {
    fontSize: 11,
    color: COLORS.textMuted,
  },
  entrySuccessBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 8,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.1)',
  },
  successText: {
    fontSize: 12,
    color: COLORS.success,
    fontWeight: '500',
  },
  qrInfoContainer: {
    marginTop: 8,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.05)',
  },
  qrCodeText: {
    fontSize: 11,
    color: COLORS.textMuted,
    fontFamily: 'monospace',
  },
  locationText: {
    fontSize: 11,
    color: COLORS.textSecondary,
    marginTop: 2,
  },
});