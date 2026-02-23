import React, { useEffect, useState } from 'react'
import { 
  View, 
  Text, 
  StyleSheet, 
  ScrollView, 
  RefreshControl,
  TouchableOpacity,
} from 'react-native'
import { LinearGradient } from 'expo-linear-gradient'
import { MaterialIcons } from '@expo/vector-icons'
import { BlurView } from 'expo-blur'
import { getDashboardStats, getRecentActivities, type DashboardStats } from '../../services/dashboard'
import { useNavigation } from '@react-navigation/native'

const COLORS = {
  primary: '#FF6B35',
  background: '#0A0E27',
  surface: '#1A1F3A',
  surfaceLight: '#252B4A',
  textPrimary: '#FFFFFF',
  textSecondary: '#B8C1EC',
  success: '#06D6A0',
  warning: '#FFD23F',
  danger: '#EF476F',
}

export default function AdminDashboard() {
  const navigation = useNavigation()
  const [refreshing, setRefreshing] = useState(false)
  const [loading, setLoading] = useState(true)
  const [stats, setStats] = useState<DashboardStats>({
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
  })
  const [recentActivities, setRecentActivities] = useState<Array<{
    id: string;
    type: 'member_joined' | 'machine_added' | 'session_started';
    title: string;
    subtitle: string;
    timestamp: string;
    icon: string;
    color: string;
  }>>([]);

  // Charger les statistiques au démarrage
  useEffect(() => {
    loadDashboardStats()
  }, [])

  const loadDashboardStats = async () => {
    try {
      console.log('🔄 Chargement des statistiques du dashboard...')
      const [dashboardStats, activities] = await Promise.all([
        getDashboardStats(),
        getRecentActivities()
      ])
      setStats(dashboardStats)
      setRecentActivities(activities)
    } catch (error) {
      console.error('❌ Erreur lors du chargement des statistiques:', error)
    } finally {
      setLoading(false)
    }
  }

  const onRefresh = async () => {
    setRefreshing(true)
    await loadDashboardStats()
    setRefreshing(false)
  }

  const StatCard = ({ 
    title, 
    value, 
    icon, 
    color, 
    trend 
  }: { 
    title: string
    value: string | number
    icon: string
    color: string
    trend?: number
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
              <MaterialIcons name={icon as any} size={24} color={color} />
            </LinearGradient>
            {trend && (
              <View style={[
                styles.trendContainer,
                { backgroundColor: trend > 0 ? '#06D6A030' : '#EF476F30' }
              ]}>
                <MaterialIcons 
                  name={trend > 0 ? 'trending-up' : 'trending-down'} 
                  size={16} 
                  color={trend > 0 ? COLORS.success : COLORS.danger}
                />
                <Text style={[
                  styles.trendText,
                  { color: trend > 0 ? COLORS.success : COLORS.danger }
                ]}>
                  {Math.abs(trend)}%
                </Text>
              </View>
            )}
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
        {/* Welcome Header */}
        <View style={styles.header}>
          <Text style={styles.welcomeText}>Bonjour Admin 👋</Text>
          <Text style={styles.subtitle}>Voici un aperçu de votre salle</Text>
        </View>

        {/* Stats Grid */}
        <View style={styles.statsGrid}>
          <StatCard
            title="Total Membres"
            value={loading ? '...' : (stats.totalMembers || 0)}
            icon="group"
            color={COLORS.primary}
            trend={(stats.growthRate && stats.growthRate.members) || 0}
          />
          <StatCard
            title="Membres Actifs"
            value={loading ? '...' : (stats.activeMembers || 0)}
            icon="person"
            color={COLORS.success}
            trend={stats.activeMembers > 0 ? Math.round(((stats.activeMembers || 0) / Math.max((stats.totalMembers || 0), 1)) * 100) : 0}
          />
          <StatCard
            title="Total Machines"
            value={loading ? '...' : (stats.totalMachines || 0)}
            icon="fitness-center"
            color={COLORS.warning}
          />
          <StatCard
            title="Machines En Usage"
            value={loading ? '...' : (stats.inUseMachines || 0)}
            icon="schedule"
            color="#8B5CF6"
          />
          <StatCard
            title="Sessions Actives"
            value={loading ? '...' : (stats.activeSessions || 0)}
            icon="play-circle-filled"
            color="#06B6D4"
          />
          <StatCard
            title="Revenus du Mois"
            value={loading ? '...' : `${(stats.thisMonthRevenue || 0).toLocaleString('fr-FR')}€`}
            icon="monetization-on"
            color={COLORS.success}
            trend={(stats.growthRate && stats.growthRate.revenue) || 0}
          />
        </View>

        {/* Quick Actions */}
        <View style={styles.actionsSection}>
          <Text style={styles.sectionTitle}>Actions Rapides</Text>
          <View style={styles.actionsGrid}>
            <TouchableOpacity 
              style={styles.actionCard} 
              activeOpacity={0.8}
              onPress={() => navigation.navigate('ScannerScreen' as never)}
            >
              <LinearGradient
                colors={['#8B5CF6', '#7C3AED']}
                style={styles.actionGradient}
              >
                <MaterialIcons name="qr-code-scanner" size={32} color="#fff" />
                <Text style={styles.actionTitle}>Scanner QR</Text>
              </LinearGradient>
            </TouchableOpacity>

            <TouchableOpacity 
              style={styles.actionCard} 
              activeOpacity={0.8}
              onPress={() => navigation.navigate('AdminMembers' as never)}
            >
              <LinearGradient
                colors={['#FF6B35', '#F77F00']}
                style={styles.actionGradient}
              >
                <MaterialIcons name="person-add" size={32} color="#fff" />
                <Text style={styles.actionTitle}>Nouveau Membre</Text>
              </LinearGradient>
            </TouchableOpacity>

            <TouchableOpacity 
              style={styles.actionCard} 
              activeOpacity={0.8}
              onPress={() => navigation.navigate('AdminMachines' as never)}
            >
              <LinearGradient
                colors={['#06D6A0', '#059669']}
                style={styles.actionGradient}
              >
                <MaterialIcons name="fitness-center" size={32} color="#fff" />
                <Text style={styles.actionTitle}>Machines</Text>
              </LinearGradient>
            </TouchableOpacity>

            <TouchableOpacity 
              style={styles.actionCard} 
              activeOpacity={0.8}
              onPress={() => navigation.navigate('AdminAccessLogs' as never)}
            >
              <LinearGradient
                colors={['#F59E0B', '#D97706']}
                style={styles.actionGradient}
              >
                <MaterialIcons name="assignment" size={32} color="#fff" />
                <Text style={styles.actionTitle}>Logs d'Accès</Text>
              </LinearGradient>
            </TouchableOpacity>
          </View>
        </View>

        {/* Recent Activity */}
        <View style={styles.activitySection}>
          <Text style={styles.sectionTitle}>Activité Récente</Text>
          {loading ? (
            <View style={styles.activityCard}>
              <BlurView intensity={80} tint="dark" style={styles.activityBlur}>
                <Text style={styles.activityText}>🔄 Chargement...</Text>
              </BlurView>
            </View>
          ) : recentActivities.length > 0 ? (
            recentActivities.map((activity) => (
              <View key={activity.id} style={styles.activityCard}>
                <BlurView intensity={80} tint="dark" style={styles.activityBlur}>
                  <View style={styles.activityItem}>
                    <View style={[styles.activityIcon, { backgroundColor: activity.color + '30' }]}>
                      <MaterialIcons 
                        name={activity.icon as any} 
                        size={20} 
                        color={activity.color} 
                      />
                    </View>
                    <View style={styles.activityContent}>
                      <Text style={styles.activityTitle}>{activity.title}</Text>
                      <Text style={styles.activitySubtitle}>{activity.subtitle}</Text>
                      <Text style={styles.activityTime}>
                        {new Date(activity.timestamp).toLocaleDateString('fr-FR', {
                          day: 'numeric',
                          month: 'short',
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </Text>
                    </View>
                  </View>
                </BlurView>
              </View>
            ))
          ) : (
            <View style={styles.activityCard}>
              <BlurView intensity={80} tint="dark" style={styles.activityBlur}>
                <Text style={styles.activityText}>📭 Aucune activité récente</Text>
                <Text style={styles.activitySubtext}>
                  Les nouvelles activités apparaîtront ici
                </Text>
              </BlurView>
            </View>
          )}
        </View>
      </ScrollView>
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
    padding: 20,
    paddingBottom: 40,
  },

  // Header
  header: {
    marginBottom: 30,
  },
  welcomeText: {
    fontSize: 28,
    fontWeight: 'bold',
    color: COLORS.textPrimary,
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: COLORS.textSecondary,
  },

  // Stats
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 15,
    marginBottom: 30,
  },
  statCard: {
    width: '47%',
    borderRadius: 16,
    overflow: 'hidden',
  },
  statBlur: {
    borderRadius: 16,
  },
  statGradient: {
    padding: 20,
    borderRadius: 16,
  },
  statHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 15,
  },
  statIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  trendContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    gap: 4,
  },
  trendText: {
    fontSize: 12,
    fontWeight: '600',
  },
  statValue: {
    fontSize: 32,
    fontWeight: 'bold',
    color: COLORS.textPrimary,
    marginBottom: 5,
  },
  statTitle: {
    fontSize: 14,
    color: COLORS.textSecondary,
    fontWeight: '500',
  },

  // Actions
  actionsSection: {
    marginBottom: 30,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: COLORS.textPrimary,
    marginBottom: 20,
  },
  actionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 15,
  },
  actionCard: {
    width: '47%',
    borderRadius: 16,
    overflow: 'hidden',
  },
  actionGradient: {
    padding: 20,
    alignItems: 'center',
    gap: 12,
  },
  actionTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#fff',
    textAlign: 'center',
  },

  // Activity
  activitySection: {
    marginBottom: 20,
  },
  activityCard: {
    borderRadius: 16,
    overflow: 'hidden',
    marginBottom: 12,
  },
  activityBlur: {
    padding: 20,
    alignItems: 'center',
  },
  activityItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    width: '100%',
    gap: 15,
  },
  activityIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 2,
  },
  activityContent: {
    flex: 1,
    gap: 4,
  },
  activityTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.textPrimary,
  },
  activitySubtitle: {
    fontSize: 14,
    color: COLORS.textSecondary,
    lineHeight: 18,
  },
  activityTime: {
    fontSize: 12,
    color: COLORS.textSecondary,
    opacity: 0.7,
    marginTop: 2,
  },
  activityText: {
    fontSize: 18,
    fontWeight: '600',
    color: COLORS.textPrimary,
    marginBottom: 8,
    textAlign: 'center',
  },
  activitySubtext: {
    fontSize: 14,
    color: COLORS.textSecondary,
    textAlign: 'center',
    lineHeight: 20,
  },
})