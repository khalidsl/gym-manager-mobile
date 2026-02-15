import React, { useEffect, useState, useMemo } from 'react'
import { 
  View, 
  Text, 
  StyleSheet, 
  ScrollView, 
  RefreshControl, 
  ImageBackground, 
  TouchableOpacity, 
  ActivityIndicator 
} from 'react-native'
import { LinearGradient } from 'expo-linear-gradient'
import { MaterialIcons } from '@expo/vector-icons'

// Components
import { DashboardHeader } from '../components/DashboardHeader'
import { WeeklyActivityCard } from '../components/WeeklyActivityCard'
import { ActivityTypeCard } from '../components/ActivityTypeCard'
import { StatusCard } from '../components/StatusCard'
import { ActiveSessionBanner } from '../components/ActiveSessionBanner'
import { MembershipCard } from '../components/MembershipCard'

// Constants & Stores
import { Colors, Spacing, FontSize, BorderRadius } from '../constants/Colors'
import { useAuthStore } from '../store/authStore'
import { useAccessStore } from '../store/accessStore'
import { useMachinesStore } from '../store/machinesStore'
import * as machinesService from '../services/machines'

export default function DashboardScreen() {
  const { profile, membership } = useAuthStore()
  const { currentVisitors, isInGym, fetchCurrentVisitors, checkIfInGym } = useAccessStore()
  const { activeSession, fetchActiveSession, machines, fetchMachines, sessionHistory, fetchSessionHistory } = useMachinesStore()
  
  const [refreshing, setRefreshing] = useState(false)
  const [weeklyStats, setWeeklyStats] = useState<any>(null)
  const [activityData, setActivityData] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    try {
      setLoading(true)
      setError(null)
      
      // Chargement parallèle des données essentielles
      await Promise.allSettled([
        fetchCurrentVisitors(),
        checkIfInGym(),
        fetchActiveSession(),
        fetchMachines(),
        fetchSessionHistory(),
      ])
      
      await calculateStats()
    } catch (err: any) {
      console.error('Dashboard Load Error:', err)
      setError('Erreur de connexion aux services.')
    } finally {
      setLoading(false)
    }
  }

  const calculateStats = async () => {
    try {
      const sessions = await machinesService.getUserSessionHistory(30)
      const now = new Date()
      const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
      
      // Filtrage des sessions de la semaine
      const sessionsThisWeek = sessions.filter(s => new Date(s.start_time) > weekAgo)

      // Calcul des totaux
      let totalMinutes = 0
      let totalSets = 0
      let totalWeight = 0
      let sessionsWithWeight = 0

      sessionsThisWeek.forEach(s => {
        const start = new Date(s.start_time).getTime()
        const end = s.end_time ? new Date(s.end_time).getTime() : new Date().getTime()
        totalMinutes += (end - start) / 60000
        totalSets += (s.sets || 0)
        if (s.weight) {
          totalWeight += s.weight
          sessionsWithWeight++
        }
      })

      // Préparation des données du graphique (7 derniers jours)
      const dailyActivity = []
      for (let i = 6; i >= 0; i--) {
        const targetDate = new Date()
        targetDate.setDate(now.getDate() - i)
        const dateString = targetDate.toDateString()
        
        const daySessions = sessions.filter(s => new Date(s.start_time).toDateString() === dateString)
        const dayMinutes = daySessions.reduce((sum, s) => {
          const start = new Date(s.start_time).getTime()
          const end = s.end_time ? new Date(s.end_time).getTime() : new Date().getTime()
          return sum + (end - start) / 60000
        }, 0)

        dailyActivity.push({
          day: targetDate.toLocaleDateString('fr-FR', { weekday: 'short' })[0].toUpperCase(),
          value: Math.round(dayMinutes),
          sessions: daySessions.length
        })
      }

      setWeeklyStats({
        sessions: sessionsThisWeek.length,
        calories: Math.round(totalMinutes * 5), // Estim: 5kcal/min
        minutes: Math.round(totalMinutes),
        sets: totalSets,
        avgWeight: sessionsWithWeight > 0 ? Math.round(totalWeight / sessionsWithWeight) : 0
      })
      setActivityData(dailyActivity)

    } catch (err) {
      console.error('Stats Calculation Error:', err)
    }
  }

  const onRefresh = async () => {
    setRefreshing(true)
    await loadData()
    setRefreshing(false)
  }

  // Valeurs calculées mémoïsées pour la performance
  const machineStats = useMemo(() => ({
    available: machines.filter(m => m.status === 'available').length,
    inUse: machines.filter(m => m.status === 'in_use').length,
    total: machines.length
  }), [machines])

  const avgSessionLength = useMemo(() => 
    weeklyStats?.sessions ? Math.max(1, Math.round(weeklyStats.minutes / weeklyStats.sessions)) : 0
  , [weeklyStats])

  const peakDay = useMemo(() => 
    activityData.reduce((prev, current) => (prev.value > current.value) ? prev : current, activityData[0])
  , [activityData])

  const quickStats = useMemo(() => [
    { key: 'session', icon: 'monitor-heart', label: 'Session', value: activeSession ? 'En cours' : 'Repos', accent: '#6C63FF', chip: activeSession ? 'Live' : 'Libre' },
    { key: 'visitors', icon: 'group', label: 'Visiteurs', value: String(currentVisitors.length), accent: '#0EA5E9', chip: 'Dans le club' },
    { key: 'machines', icon: 'fitness-center', label: 'Machines', value: `${machineStats.available}/${machineStats.total}`, accent: '#10B981', chip: 'Dispos' },
    { key: 'duration', icon: 'schedule', label: 'Durée moy.', value: `${avgSessionLength} min`, accent: '#F97316', chip: '/ séance' },
  ], [activeSession, currentVisitors.length, machineStats, avgSessionLength])

  if (loading && !refreshing) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#6C63FF" />
      </View>
    )
  }

  if (error) {
    return (
      <View style={styles.centerContainer}>
        <MaterialIcons name="cloud-off" size={64} color="#94A3B8" />
        <Text style={styles.errorTitle}>Oups !</Text>
        <Text style={styles.errorText}>{error}</Text>
        <TouchableOpacity style={styles.retryButton} onPress={loadData}>
          <Text style={styles.retryButtonText}>Réessayer</Text>
        </TouchableOpacity>
      </View>
    )
  }

  return (
    <ImageBackground
      source={require('../assets/gym-bg.jpg')}
      style={styles.backgroundImage}
      imageStyle={{ opacity: 0.1 }} // Opacité réduite pour lisibilité
    >
      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.content}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#6C63FF" />
        }
      >
        <DashboardHeader 
          userName={profile?.full_name || 'Membre'}
          membershipType={membership?.type || 'basic'}
        />

        {/* Hero Card */}
        <LinearGradient colors={['#6C63FF', '#4C51BF']} style={styles.heroCard}>
          <View style={styles.heroRow}>
            <View>
              <Text style={styles.heroGreeting}>Bonjour, {profile?.full_name?.split(' ')[0] || 'athlète'}</Text>
              <Text style={styles.heroSub}>Continuez sur votre lancée ✨</Text>
            </View>
            <View style={styles.heroBadge}>
              <MaterialIcons name="bolt" size={18} color="#fff" />
              <Text style={styles.heroBadgeText}>{weeklyStats?.sessions || 0} séances</Text>
            </View>
          </View>
          <View style={styles.heroStats}>
            <View style={styles.heroStatPill}>
              <Text style={styles.heroStatValue}>{weeklyStats?.minutes || 0} min</Text>
              <Text style={styles.heroStatLabel}>Cette semaine</Text>
            </View>
            <View style={styles.heroStatPill}>
              <Text style={styles.heroStatValue}>{weeklyStats?.calories || 0} kcal</Text>
              <Text style={styles.heroStatLabel}>Estimées</Text>
            </View>
          </View>
        </LinearGradient>

        {/* Grid de stats rapides */}
        <View style={styles.quickStatsGrid}>
          {quickStats.map(stat => (
            <View key={stat.key} style={styles.quickStatCard}>
              <View style={[styles.quickStatIcon, { backgroundColor: `${stat.accent}15` }]}>
                <MaterialIcons name={stat.icon as any} size={20} color={stat.accent} />
              </View>
              <Text style={styles.quickStatValue}>{stat.value}</Text>
              <Text style={styles.quickStatLabel}>{stat.label}</Text>
              <Text style={[styles.quickStatChip, { color: stat.accent }]}>{stat.chip}</Text>
            </View>
          ))}
        </View>

        {/* Section Analyse */}
        <View style={styles.splitCardsRow}>
          <LinearGradient colors={['#0EA5E9', '#6366F1']} style={styles.splitCardPrimary}>
            <Text style={styles.splitCardLabel}>Jour de pic</Text>
            <Text style={styles.splitCardValue}>{peakDay?.day || '—'}</Text>
            <Text style={styles.splitCardHint}>
              {peakDay?.value ? `${peakDay.value} min d'effort` : 'En attente de données'}
            </Text>
          </LinearGradient>

          <View style={styles.splitCardSecondary}>
            <Text style={styles.splitCardLabelLight}>Moyenne</Text>
            <Text style={styles.splitCardValueDark}>{avgSessionLength} min</Text>
            <View style={styles.actionsRow}>
              <TouchableOpacity style={styles.actionChip}>
                <MaterialIcons name="timeline" size={14} color="#6C63FF" />
                <Text style={styles.actionChipText}>Stats</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>

        {/* Graphique hebdomadaire */}
        <View style={styles.sectionCard}>
          <Text style={styles.sectionTitle}>Activité récente</Text>
          <WeeklyActivityCard
            sessions={weeklyStats?.sessions || 0}
            calories={weeklyStats?.calories || 0}
            minutes={weeklyStats?.minutes || 0}
            sets={weeklyStats?.sets || 0}
            activityData={activityData}
          />
        </View>

        {/* Types d'activités (basé sur des ratios fictifs ou réels) */}
        <View style={styles.sectionCard}>
          <Text style={styles.sectionTitle}>Focus de la semaine</Text>
          <View style={styles.activitiesGrid}>
            <ActivityTypeCard
              icon="directions-run"
              label="Cardio"
              value={Math.round((weeklyStats?.sessions || 0) * 0.4)}
              color="#FF6B6B"
              backgroundColor="#FFE5E5"
            />
            <ActivityTypeCard
              icon="fitness-center"
              label="Force"
              value={Math.round((weeklyStats?.sessions || 0) * 0.6)}
              color="#10B981"
              backgroundColor="#E8F5E9"
            />
          </View>
        </View>

        {/* Statut du Club */}
        <View style={styles.sectionCard}>
          <Text style={styles.sectionTitle}>Club en direct</Text>
          <View style={styles.statusGrid}>
            <StatusCard
              icon={isInGym ? 'check-circle' : 'location-off'}
              value={isInGym ? 'Présent' : 'À distance'}
              label="Votre statut"
              color={isInGym ? '#10B981' : '#F59E0B'}
              backgroundColor={isInGym ? '#D1FAE5' : '#FEF3C7'}
            />
            <StatusCard
              icon="group"
              value={currentVisitors.length}
              label="Affluence"
              color="#6366F1"
              backgroundColor="#EEF2FF"
            />
          </View>
        </View>

        {activeSession && (
          <ActiveSessionBanner startTime={activeSession.start_time} />
        )}

        {membership && (
          <MembershipCard
            type={membership.type}
            status={membership.status}
            endDate={membership.end_date}
          />
        )}
      </ScrollView>
    </ImageBackground>
  )
}

const styles = StyleSheet.create({
  backgroundImage: {
    flex: 1,
    backgroundColor: '#000000',
  },
  container: {
    flex: 1,
    backgroundColor: 'transparent',
  },
  
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20
  },
  content: {
    padding: Spacing.lg,
    paddingBottom: Spacing.xxl,
    gap: Spacing.lg,
  },
  // Hero
  heroCard: {
    borderRadius: BorderRadius.xl,
    padding: Spacing.lg,
    elevation: 8,
    shadowColor: '#6C63FF',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.3,
    shadowRadius: 15,
  },
  heroRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.lg,
  },
  heroGreeting: {
    fontSize: FontSize.xl,
    color: '#fff',
    fontWeight: '700',
  },
  heroSub: {
    color: '#E0E7FF',
    opacity: 0.9,
  },
  heroBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.2)',
    paddingHorizontal: Spacing.md,
    paddingVertical: 6,
    borderRadius: BorderRadius.full,
    gap: 6,
  },
  heroBadgeText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: FontSize.sm,
  },
  heroStats: {
    flexDirection: 'row',
    gap: Spacing.md,
  },
  heroStatPill: {
    flex: 1,
    backgroundColor: 'rgba(255,255,255,0.12)',
    borderRadius: BorderRadius.lg,
    padding: Spacing.md,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  heroStatValue: {
    color: '#fff',
    fontSize: FontSize.lg,
    fontWeight: '700',
  },
  heroStatLabel: {
    color: '#E0E7FF',
    fontSize: FontSize.xs,
  },
  // Quick Stats
  quickStatsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.md,
  },
  quickStatCard: {
    flex: 1,
    minWidth: '45%',
    borderRadius: BorderRadius.lg,
    backgroundColor: '#fff',
    padding: Spacing.md,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
  },
  quickStatIcon: {
    width: 32,
    height: 32,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  quickStatValue: {
    fontSize: FontSize.lg,
    fontWeight: '700',
    color: '#1E293B',
  },
  quickStatLabel: {
    fontSize: FontSize.xs,
    color: '#64748B',
    marginBottom: 4,
  },
  quickStatChip: {
    fontSize: 10,
    fontWeight: '800',
    textTransform: 'uppercase',
  },
  // Split Cards
  splitCardsRow: {
    flexDirection: 'row',
    gap: Spacing.md,
  },
  splitCardPrimary: {
    flex: 1.2,
    borderRadius: BorderRadius.xl,
    padding: Spacing.lg,
    justifyContent: 'center',
  },
  splitCardSecondary: {
    flex: 1,
    borderRadius: BorderRadius.xl,
    padding: Spacing.lg,
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#F1F5F9',
    elevation: 2,
  },
  splitCardLabel: {
    color: 'rgba(255,255,255,0.8)',
    fontSize: 10,
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: 4,
  },
  splitCardLabelLight: {
    color: '#64748B',
    fontSize: 10,
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: 4,
  },
  splitCardValue: {
    fontSize: FontSize.xl,
    fontWeight: '800',
    color: '#fff',
  },
  splitCardValueDark: {
    fontSize: FontSize.xl,
    fontWeight: '800',
    color: '#1E293B',
  },
  splitCardHint: {
    color: 'rgba(255,255,255,0.7)',
    fontSize: FontSize.xs,
    marginTop: 4,
  },
  // Sections
  sectionCard: {
    gap: Spacing.md,
  },
  sectionTitle: {
    fontSize: FontSize.md,
    fontWeight: '700',
    color: '#1E293B',
    paddingLeft: 4,
  },
  statusGrid: {
    flexDirection: 'row',
    gap: Spacing.md,
  },
  activitiesGrid: {
    flexDirection: 'row',
    gap: Spacing.md,
  },
  // Error & Actions
  actionsRow: {
    flexDirection: 'row',
    marginTop: Spacing.md,
  },
  actionChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: BorderRadius.full,
    backgroundColor: '#EEF2FF',
  },
  actionChipText: {
    fontSize: 11,
    color: '#6C63FF',
    fontWeight: '700',
  },
  errorTitle: {
    fontSize: FontSize.lg,
    fontWeight: '700',
    color: '#1E293B',
    marginTop: 16,
  },
  errorText: {
    color: '#64748B',
    textAlign: 'center',
    marginTop: 8,
    marginBottom: 24,
  },
  retryButton: {
    backgroundColor: '#6C63FF',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: BorderRadius.lg,
  },
  retryButtonText: {
    color: '#fff',
    fontWeight: '600',
  },
})