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
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withTiming,
  withSpring,
  withDelay,
  FadeIn,
  SlideInRight,
  SlideInLeft,
  ZoomIn,
  runOnJS,
} from 'react-native-reanimated'
import * as Haptics from 'expo-haptics'

// Components
import { DashboardHeader } from '../components/DashboardHeader'
import { WeeklyActivityCard } from '../components/WeeklyActivityCard'
import { ActivityTypeCard } from '../components/ActivityTypeCard'
import { StatusCard } from '../components/StatusCard'
import { ActiveSessionBanner } from '../components/ActiveSessionBanner'
import { MembershipCard } from '../components/MembershipCard'
import { AnimatedButton } from '../components/AnimatedButton'

// Context & Constants
import { useThemeContext } from '../contexts/ThemeContext'
import { Spacing, FontSize, BorderRadius } from '../constants/Colors'
import { useAuthStore } from '../store/authStore'
import { useAccessStore } from '../store/accessStore'
import { useMachinesStore } from '../store/machinesStore'
import * as machinesService from '../services/machines'

// Composants animés
const AnimatedView = Animated.createAnimatedComponent(View)
const AnimatedTouchable = Animated.createAnimatedComponent(TouchableOpacity)

export default function DashboardScreen() {
  const { colors, isDark } = useThemeContext()
  const { profile, membership } = useAuthStore()
  const { currentVisitors, isInGym, fetchCurrentVisitors, checkIfInGym } = useAccessStore()
  const { activeSession, fetchActiveSession, machines, fetchMachines, sessionHistory, fetchSessionHistory } = useMachinesStore()
  
  const [refreshing, setRefreshing] = useState(false)
  const [weeklyStats, setWeeklyStats] = useState<any>(null)
  const [activityData, setActivityData] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Animation values
  const heroOpacity = useSharedValue(0)
  const heroScale = useSharedValue(0.8)
  const statsTranslateY = useSharedValue(50)
  const cardsOpacity = useSharedValue(0)
  const floatingScale = useSharedValue(1)
  const headerOpacity = useSharedValue(0)
  const headerTranslateY = useSharedValue(-30)

  useEffect(() => {
    loadData()
  }, [])

  useEffect(() => {
    // Démarrer les animations après le chargement des données
    if (!loading) {
      startAnimations()
    }
  }, [loading])

  const startAnimations = () => {
    // Animation header avec delay initial
    headerOpacity.value = withTiming(1, { duration: 600 })
    headerTranslateY.value = withDelay(100, withSpring(0, { damping: 20 }))
    
    // Animation hero avec spring
    heroOpacity.value = withTiming(1, { duration: 800 })
    heroScale.value = withSpring(1, { damping: 15 })
    
    // Animation stats avec delay
    statsTranslateY.value = withDelay(200, withSpring(0, { damping: 20 }))
    
    // Animation cards
    cardsOpacity.value = withDelay(400, withTiming(1, { duration: 600 }))

    // Animation floating subtile continue
    const startFloating = () => {
      floatingScale.value = withTiming(1.02, { duration: 2000 }, () => {
        floatingScale.value = withTiming(1, { duration: 2000 }, () => {
          runOnJS(startFloating)()
        })
      })
    }
    startFloating()
  }

  const loadData = async () => {
    try {
      setLoading(true)
      setError(null)
      
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
      
      const sessionsThisWeek = sessions.filter(s => new Date(s.start_time) > weekAgo)

      let totalMinutes = 0
      let totalSets = 0
      let totalWeight = 0
      let sessionsWithWeight = 0

      sessionsThisWeek.forEach(s => {
        const start = new Date(s.start_time).getTime()
        const end = s.end_time ? new Date(s.end_time).getTime() : new Date().getTime()
        totalMinutes += (end - start) / 60000
        totalSets += (s.sets || 0)
        if (s.weight_kg) {
          totalWeight += s.weight_kg
          sessionsWithWeight++
        }
      })

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
        calories: Math.round(totalMinutes * 5),
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
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)
    await loadData()
    setRefreshing(false)
  }

  const handleStatPress = (statKey: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium)
    // Navigation vers détails ou action spécifique
  }

  // Valeurs calculées mémoïsées
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
    { 
      key: 'session', 
      icon: 'monitor-heart', 
      label: 'Session', 
      value: activeSession ? 'En cours' : 'Repos', 
      accent: colors.primary, 
      chip: activeSession ? 'Live' : 'Libre' 
    },
    { 
      key: 'visitors', 
      icon: 'group', 
      label: 'Visiteurs', 
      value: String(currentVisitors.length), 
      accent: colors.info, 
      chip: 'Dans le club' 
    },
    { 
      key: 'machines', 
      icon: 'fitness-center', 
      label: 'Machines', 
      value: `${machineStats.available}/${machineStats.total}`, 
      accent: colors.success, 
      chip: 'Dispos' 
    },
    { 
      key: 'duration', 
      icon: 'schedule', 
      label: 'Durée moy.', 
      value: `${avgSessionLength} min`, 
      accent: colors.warning, 
      chip: '/ séance' 
    },
  ], [activeSession, currentVisitors.length, machineStats, avgSessionLength, colors])

  // Styles animés
  const heroStyle = useAnimatedStyle(() => ({
    opacity: heroOpacity.value,
    transform: [{ scale: heroScale.value }],
  }))

  const statsStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: statsTranslateY.value }],
  }))

  const cardsStyle = useAnimatedStyle(() => ({
    opacity: cardsOpacity.value,
  }))

  const floatingStyle = useAnimatedStyle(() => ({
    transform: [{ scale: floatingScale.value }],
  }))

  const headerStyle = useAnimatedStyle(() => ({
    opacity: headerOpacity.value,
    transform: [{ translateY: headerTranslateY.value }],
  }))

  if (loading && !refreshing) {
    return (
      <View style={[styles.centerContainer, { backgroundColor: colors.background }]}>
        <Animated.View entering={ZoomIn}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={[styles.loadingText, { color: colors.textSecondary }]}>
            Chargement...
          </Text>
        </Animated.View>
      </View>
    )
  }

  if (error) {
    return (
      <View style={[styles.centerContainer, { backgroundColor: colors.background }]}>
        <AnimatedView entering={FadeIn}>
          <MaterialIcons name="cloud-off" size={64} color={colors.textTertiary} />
          <Text style={[styles.errorTitle, { color: colors.text }]}>Oups !</Text>
          <Text style={[styles.errorText, { color: colors.textSecondary }]}>{error}</Text>
          <AnimatedButton
            title="Réessayer"
            onPress={loadData}
            variant="primary"
            style={styles.retryButton}
          />
        </AnimatedView>
      </View>
    )
  }

  return (
    <ImageBackground
      source={require('../assets/gym-bg.jpg')}
      style={[styles.backgroundImage, { backgroundColor: colors.background }]}
      imageStyle={{ opacity: isDark ? 0.05 : 0.1 }}
    >
      {/* Overlay pour dark mode */}
      {isDark && (
        <View style={[StyleSheet.absoluteFill, { backgroundColor: 'rgba(0,0,0,0.7)' }]} />
      )}

      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.content}
        refreshControl={
          <RefreshControl 
            refreshing={refreshing} 
            onRefresh={onRefresh} 
            tintColor={colors.primary}
            colors={[colors.primary]}
          />
        }
        showsVerticalScrollIndicator={false}
      >
        <AnimatedView style={headerStyle}>
          <DashboardHeader 
            userName={profile?.full_name || 'Membre'}
            membershipType={membership?.type || 'basic'}
          />
        </AnimatedView>

        {/* Hero Card with Animation */}
        <AnimatedView style={[heroStyle, floatingStyle]}>
          <LinearGradient 
            colors={isDark ? colors.gradient : ['#6C63FF', '#4C51BF']} 
            style={[styles.heroCard, { backgroundColor: colors.card }]}
          >
            <View style={styles.heroRow}>
              <View>
                <Text style={styles.heroGreeting}>
                  Bonjour, {String(profile?.full_name?.split(' ')[0] || 'athlète')}
                </Text>
                <Text style={styles.heroSub}>Continuez sur votre lancée ✨</Text>
              </View>
              <Animated.View entering={ZoomIn.delay(600)} style={styles.heroBadge}>
                <MaterialIcons name="bolt" size={18} color="#fff" />
                <Text style={styles.heroBadgeText}>{String(weeklyStats?.sessions || 0)} séances</Text>
              </Animated.View>
            </View>
            <View style={styles.heroStats}>
              <Animated.View entering={SlideInLeft.delay(400)} style={styles.heroStatPill}>
                <Text style={styles.heroStatValue}>{String(weeklyStats?.minutes || 0)} min</Text>
                <Text style={styles.heroStatLabel}>Cette semaine</Text>
              </Animated.View>
              <Animated.View entering={SlideInRight.delay(500)} style={styles.heroStatPill}>
                <Text style={styles.heroStatValue}>{String(weeklyStats?.calories || 0)} kcal</Text>
                <Text style={styles.heroStatLabel}>Estimées</Text>
              </Animated.View>
            </View>
          </LinearGradient>
        </AnimatedView>

        {/* Grid de stats rapides avec animations */}
        <AnimatedView style={statsStyle}>
          <View style={styles.quickStatsGrid}>
            {quickStats.map((stat, index) => (
              <AnimatedTouchable
                key={stat.key}
                entering={FadeIn.delay(200 + (index * 100))}
                style={[styles.quickStatCard, { backgroundColor: colors.card }]}
                onPress={() => handleStatPress(stat.key)}
                activeOpacity={0.8}
              >
                <View style={[styles.quickStatIcon, { backgroundColor: `${stat.accent}15` }]}>
                  <MaterialIcons name={stat.icon as any} size={20} color={stat.accent} />
                </View>
                <Text style={[styles.quickStatValue, { color: colors.text }]}>{stat.value}</Text>
                <Text style={[styles.quickStatLabel, { color: colors.textSecondary }]}>{stat.label}</Text>
                <Text style={[styles.quickStatChip, { color: stat.accent }]}>{stat.chip}</Text>
              </AnimatedTouchable>
            ))}
          </View>
        </AnimatedView>

        {/* Section Analyse avec animations */}
        <AnimatedView entering={SlideInLeft.delay(800)} style={cardsStyle}>
          <View style={styles.splitCardsRow}>
            <LinearGradient 
              colors={isDark ? [colors.primary, colors.secondary] : ['#0EA5E9', '#6366F1']} 
              style={styles.splitCardPrimary}
            >
              <Text style={styles.splitCardLabel}>Jour de pic</Text>
              <Text style={styles.splitCardValue}>{String(peakDay?.day || '—')}</Text>
              <Text style={styles.splitCardHint}>
                {peakDay?.value ? `${peakDay.value} min d'effort` : 'En attente de données'}
              </Text>
            </LinearGradient>

            <View style={[styles.splitCardSecondary, { backgroundColor: colors.card }]}>
              <Text style={[styles.splitCardLabelLight, { color: colors.textSecondary }]}>Moyenne</Text>
              <Text style={[styles.splitCardValueDark, { color: colors.text }]}>{avgSessionLength} min</Text>
              <View style={styles.actionsRow}>
                <TouchableOpacity style={[styles.actionChip, { backgroundColor: `${colors.primary}15` }]}>
                  <MaterialIcons name="timeline" size={14} color={colors.primary} />
                  <Text style={[styles.actionChipText, { color: colors.primary }]}>Stats</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </AnimatedView>

        {/* Graphique hebdomadaire */}
        <AnimatedView entering={FadeIn.delay(1000)}>
          <View style={[styles.sectionCard, { backgroundColor: colors.card }]}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>Activité récente</Text>
            <WeeklyActivityCard
              sessions={weeklyStats?.sessions || 0}
              calories={weeklyStats?.calories || 0}
              minutes={weeklyStats?.minutes || 0}
              sets={weeklyStats?.sets || 0}
              activityData={activityData}
            />
          </View>
        </AnimatedView>

        {/* Types d'activités */}
        <AnimatedView entering={SlideInRight.delay(1200)}>
          <View style={[styles.sectionCard, { backgroundColor: colors.card }]}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>Focus de la semaine</Text>
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
        </AnimatedView>

        {/* Statut du Club */}
        <AnimatedView entering={FadeIn.delay(1400)}>
          <View style={[styles.sectionCard, { backgroundColor: colors.card }]}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>Club en direct</Text>
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
        </AnimatedView>

        {activeSession && (
          <AnimatedView entering={ZoomIn.delay(1600)}>
            <ActiveSessionBanner startTime={activeSession.start_time} />
          </AnimatedView>
        )}

        {membership && (
          <AnimatedView entering={FadeIn.delay(1800)}>
            <MembershipCard
              type={membership.type}
              status={membership.status}
              endDate={membership.end_date}
            />
          </AnimatedView>
        )}
      </ScrollView>
    </ImageBackground>
  )
}

const styles = StyleSheet.create({
  backgroundImage: {
    flex: 1,
  },
  container: {
    flex: 1,
    backgroundColor: 'transparent',
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  loadingText: {
    marginTop: Spacing.md,
    fontSize: FontSize.md,
    textAlign: 'center',
  },
  content: {
    padding: Spacing.lg,
    paddingTop: Spacing.lg, // Padding normal sans header
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
  },
  quickStatLabel: {
    fontSize: FontSize.xs,
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
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.05)',
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
  },
  splitCardHint: {
    color: 'rgba(255,255,255,0.7)',
    fontSize: FontSize.xs,
    marginTop: 4,
  },
  // Sections
  sectionCard: {
    gap: Spacing.md,
    padding: Spacing.lg,
    borderRadius: BorderRadius.xl,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
  },
  sectionTitle: {
    fontSize: FontSize.md,
    fontWeight: '700',
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
  // Actions
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
  },
  actionChipText: {
    fontSize: 11,
    fontWeight: '700',
  },
  // Error
  errorTitle: {
    fontSize: FontSize.lg,
    fontWeight: '700',
    marginTop: 16,
    textAlign: 'center',
  },
  errorText: {
    textAlign: 'center',
    marginTop: 8,
    marginBottom: 24,
  },
  retryButton: {
    marginTop: Spacing.md,
  },
})