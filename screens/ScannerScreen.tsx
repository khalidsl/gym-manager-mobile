import React, { useState, useEffect } from 'react'
import { 
  View, 
  Text, 
  StyleSheet, 
  Alert, 
  TouchableOpacity,
  ScrollView,
  RefreshControl,
} from 'react-native'
import { LinearGradient } from 'expo-linear-gradient'
import { MaterialIcons } from '@expo/vector-icons'
import { BlurView } from 'expo-blur'
import QRScanner from '../components/QRScanner.native'
import { getAccessStats, getMembersInside, getTodayAccessLogs, type AccessLogEntry, type MemberAccess } from '../services/access'

const COLORS = {
  primary: '#FF6B35',
  secondary: '#004E89',
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

export default function ScannerScreen() {
  const [scannerVisible, setScannerVisible] = useState(false)
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [stats, setStats] = useState({
    todayEntries: 0,
    todayExits: 0,
    currentlyInside: 0,
    peakHour: '08:00'
  })
  const [recentLogs, setRecentLogs] = useState<AccessLogEntry[]>([])
  const [membersInside, setMembersInside] = useState<MemberAccess[]>([])

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    try {
      setLoading(true)
      const [statsData, logsData, insideData] = await Promise.all([
        getAccessStats(),
        getTodayAccessLogs(),
        getMembersInside()
      ])
      
      setStats(statsData)
      setRecentLogs(logsData.slice(0, 5)) // 5 derniers logs
      setMembersInside(insideData)
    } catch (error) {
      console.error('❌ Erreur lors du chargement:', error)
    } finally {
      setLoading(false)
    }
  }

  const onRefresh = async () => {
    setRefreshing(true)
    await loadData()
    setRefreshing(false)
  }

  const handleScanSuccess = async (result: {
    action: 'entry' | 'exit';
    memberName: string;
    message: string;
  }) => {
    console.log('✅ Scan réussi:', result)
    
    // Recharger les données après un scan réussi
    await loadData()
    
    // Fermer le scanner
    setScannerVisible(false)
  }

  const formatTimeAgo = (timestamp: string) => {
    const now = new Date()
    const logTime = new Date(timestamp)
    const diffInMinutes = Math.floor((now.getTime() - logTime.getTime()) / (1000 * 60))
    
    if (diffInMinutes < 1) return 'À l\'instant'
    if (diffInMinutes < 60) return `Il y a ${diffInMinutes}min`
    
    const diffInHours = Math.floor(diffInMinutes / 60)
    if (diffInHours < 24) return `Il y a ${diffInHours}h`
    
    return logTime.toLocaleDateString('fr-FR', { 
      day: 'numeric', 
      month: 'short',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const StatCard = ({ 
    title, 
    value, 
    icon, 
    color 
  }: { 
    title: string
    value: string | number
    icon: string
    color: string
  }) => (
    <View style={styles.statCard}>
      <BlurView intensity={80} tint="dark" style={styles.statBlur}>
        <LinearGradient
          colors={['rgba(255, 255, 255, 0.1)', 'rgba(255, 255, 255, 0.05)']}
          style={styles.statGradient}
        >
          <View style={styles.statHeader}>
            <LinearGradient
              colors={[`${color}30`, `${color}10`]}
              style={styles.statIconContainer}
            >
              <MaterialIcons name={icon as any} size={20} color={color} />
            </LinearGradient>
          </View>
          <Text style={styles.statValue}>{value}</Text>
          <Text style={styles.statTitle}>{title}</Text>
        </LinearGradient>
      </BlurView>
    </View>
  )

  return (
    <LinearGradient colors={[COLORS.background, COLORS.surface]} style={styles.container}>
      <ScrollView 
        style={styles.scrollView}
        contentContainerStyle={styles.content}
        refreshControl={
          <RefreshControl 
            refreshing={refreshing} 
            onRefresh={onRefresh}
            tintColor={COLORS.primary}
          />
        }
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>Scanner d'Accès</Text>
          <Text style={styles.subtitle}>Gestion des entrées et sorties QR</Text>
        </View>

        {/* Main Scanner Button */}
        <View style={styles.scannerButtonContainer}>
          <TouchableOpacity 
            style={styles.scannerButton}
            onPress={() => setScannerVisible(true)}
            activeOpacity={0.8}
          >
            <LinearGradient
              colors={[COLORS.primary, '#F77F00']}
              style={styles.scannerGradient}
            >
              <MaterialIcons name="qr-code-scanner" size={48} color="#fff" />
              <Text style={styles.scannerButtonText}>Scanner Code QR</Text>
              <Text style={styles.scannerButtonSubtext}>
                Entrée/Sortie automatique
              </Text>
            </LinearGradient>
          </TouchableOpacity>
        </View>

        {/* Stats */}
        <View style={styles.statsSection}>
          <Text style={styles.sectionTitle}>Statistiques Aujourd'hui</Text>
          <View style={styles.statsGrid}>
            <StatCard
              title="Entrées"
              value={stats.todayEntries || 0}
              icon="login"
              color={COLORS.success}
            />
            <StatCard
              title="Sorties"
              value={stats.todayExits || 0}
              icon="logout"
              color={COLORS.warning}
            />
            <StatCard
              title="Présents"
              value={stats.currentlyInside}
              icon="people"
              color={COLORS.primary}
            />
            <StatCard
              title="Pointe"
              value={stats.peakHour}
              icon="schedule"
              color={COLORS.secondary}
            />
          </View>
        </View>

        {/* Membres Présents */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>
              Membres Présents ({String(membersInside.length)})
            </Text>
          </View>
          
          {loading ? (
            <View style={styles.loadingCard}>
              <Text style={styles.loadingText}>Chargement...</Text>
            </View>
          ) : membersInside.length > 0 ? (
            <View style={styles.membersList}>
              {membersInside.slice(0, 3).map((member) => (
                <View key={member.id} style={styles.memberCard}>
                  <BlurView intensity={80} tint="dark" style={styles.memberBlur}>
                    <View style={styles.memberItem}>
                      <View style={[styles.presenceIcon, { backgroundColor: COLORS.success + '30' }]}>
                        <MaterialIcons 
                          name="person" 
                          size={16} 
                          color={COLORS.success} 
                        />
                      </View>
                      <View style={styles.memberInfo}>
                        <Text style={styles.memberName}>
                          {String(`${member.first_name} ${member.last_name}` || member.email || 'Membre inconnu')}
                        </Text>
                        <Text style={styles.memberTime}>
                          {String(member.last_access ? formatTimeAgo(member.last_access) : 'Jamais')}
                        </Text>
                      </View>
                      <View style={styles.statusBadge} />
                    </View>
                  </BlurView>
                </View>
              ))}
              {membersInside.length > 3 && (
                <Text style={styles.moreText}>
                  +{membersInside.length - 3} autres membres présents
                </Text>
              )}
            </View>
          ) : (
            <View style={styles.emptyCard}>
              <BlurView intensity={80} tint="dark" style={styles.emptyBlur}>
                <MaterialIcons name="person-outline" size={32} color={COLORS.textSecondary} />
                <Text style={styles.emptyText}>Aucun membre présent</Text>
              </BlurView>
            </View>
          )}
        </View>

        {/* Activité Récente */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Activité Récente</Text>
          
          {loading ? (
            <View style={styles.loadingCard}>
              <Text style={styles.loadingText}>Chargement...</Text>
            </View>
          ) : recentLogs.length > 0 ? (
            <View style={styles.activityList}>
              {recentLogs.map((log) => {
                const isEntry = log.action === 'entry'
                const actionColor = isEntry ? COLORS.success : COLORS.warning
                
                return (
                  <View key={log.id} style={styles.activityCard}>
                    <BlurView intensity={80} tint="dark" style={styles.activityBlur}>
                      <View style={styles.activityItem}>
                        <View style={[styles.activityIcon, { backgroundColor: actionColor + '30' }]}>
                          <MaterialIcons 
                            name={isEntry ? 'login' : 'logout'} 
                            size={16} 
                            color={actionColor} 
                          />
                        </View>
                        <View style={styles.activityContent}>
                          <Text style={styles.activityName}>{log.member_name}</Text>
                          <Text style={styles.activityAction}>
                            {String(isEntry ? '🟢 Entrée' : '🔴 Sortie')} • {formatTimeAgo(log.timestamp)}
                          </Text>
                        </View>
                      </View>
                    </BlurView>
                  </View>
                )
              })}
            </View>
          ) : (
            <View style={styles.emptyCard}>
              <BlurView intensity={80} tint="dark" style={styles.emptyBlur}>
                <MaterialIcons name="assignment" size={32} color={COLORS.textSecondary} />
                <Text style={styles.emptyText}>Aucune activité récente</Text>
              </BlurView>
            </View>
          )}
        </View>
      </ScrollView>

      {/* QR Scanner Modal */}
      <QRScanner
        visible={scannerVisible}
        onClose={() => setScannerVisible(false)}
        onScanSuccess={handleScanSuccess}
      />
    </LinearGradient>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  content: {
    paddingBottom: 100,
  },
  header: {
    paddingHorizontal: 24,
    paddingTop: 60,
    paddingBottom: 20,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: COLORS.textPrimary,
  },
  subtitle: {
    fontSize: 16,
    color: COLORS.textSecondary,
    marginTop: 8,
  },
  scannerButtonContainer: {
    paddingHorizontal: 24,
    marginBottom: 32,
  },
  scannerButton: {
    borderRadius: 20,
    overflow: 'hidden',
    elevation: 8,
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  scannerGradient: {
    paddingVertical: 32,
    paddingHorizontal: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  scannerButtonText: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#ffffff',
    marginTop: 12,
  },
  scannerButtonSubtext: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.8)',
    marginTop: 4,
  },
  statsSection: {
    marginBottom: 32,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: 24,
    gap: 12,
  },
  statCard: {
    flex: 1,
    minWidth: '45%',
    borderRadius: 16,
    overflow: 'hidden',
  },
  statBlur: {
    padding: 16,
    alignItems: 'center',
  },
  statGradient: {
    paddingVertical: 20,
    paddingHorizontal: 16,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 16,
  },
  statHeader: {
    marginBottom: 12,
  },
  statIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  statValue: {
    fontSize: 28,
    fontWeight: 'bold',
    color: COLORS.textPrimary,
    marginBottom: 4,
  },
  statTitle: {
    fontSize: 14,
    color: COLORS.textSecondary,
    textAlign: 'center',
  },
  section: {
    paddingHorizontal: 24,
    marginBottom: 32,
  },
  sectionHeader: {
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: COLORS.textPrimary,
  },
  membersList: {
    gap: 12,
  },
  memberCard: {
    borderRadius: 16,
    overflow: 'hidden',
  },
  memberBlur: {
    borderRadius: 16,
  },
  memberItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
  },
  presenceIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  memberInfo: {
    flex: 1,
  },
  memberName: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.textPrimary,
  },
  memberTime: {
    fontSize: 14,
    color: COLORS.textSecondary,
    marginTop: 2,
  },
  statusBadge: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: COLORS.success,
  },
  statusText: {
    fontSize: 16,
    color: COLORS.success,
  },
  moreText: {
    fontSize: 14,
    color: COLORS.textSecondary,
    textAlign: 'center',
    fontStyle: 'italic',
    marginTop: 12,
  },
  activityList: {
    gap: 12,
  },
  activityCard: {
    borderRadius: 16,
    overflow: 'hidden',
  },
  activityBlur: {
    borderRadius: 16,
  },
  activityItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
  },
  activityIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  activityContent: {
    flex: 1,
  },
  activityName: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.textPrimary,
  },
  activityAction: {
    fontSize: 14,
    color: COLORS.textSecondary,
    marginTop: 2,
  },
  loadingCard: {
    borderRadius: 16,
    backgroundColor: COLORS.surfaceLight,
    padding: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingText: {
    fontSize: 16,
    color: COLORS.textSecondary,
  },
  emptyCard: {
    borderRadius: 16,
    overflow: 'hidden',
  },
  emptyBlur: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 40,
  },
  emptyText: {
    fontSize: 16,
    color: COLORS.textSecondary,
    marginTop: 12,
    textAlign: 'center',
  },
});
