import React, { useEffect, useState, memo, useRef } from 'react'
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  RefreshControl,
  Alert,
  Image,
  TouchableOpacity,
  ImageBackground,
  LayoutAnimation,
  Platform,
  UIManager,
  Animated,
} from 'react-native'
import { LinearGradient } from 'expo-linear-gradient'
import { BlurView } from 'expo-blur'
import { MaterialIcons } from '@expo/vector-icons'
import * as Haptics from 'expo-haptics'
import { Card } from '../components/Card'
import { Button } from '../components/Button'
import { Colors, Spacing, FontSize, FontWeight, BorderRadius } from '../constants/Colors'
import { useMachinesStore } from '../store/machinesStore'
import { Machine, MachineSession } from '../types'
import * as machinesService from '../services/machines'

// Activer LayoutAnimation sur Android
if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true)
}

// ==================== TIMER COMPONENT AVEC ANIMATIONS ====================
const SessionTimer = memo(({ startTime }: { startTime: string }) => {
  const [elapsed, setElapsed] = useState(0)
  const pulseAnim = useRef(new Animated.Value(1)).current
  const rotateAnim = useRef(new Animated.Value(0)).current
  const glowAnim = useRef(new Animated.Value(0)).current

  useEffect(() => {
    const start = new Date(startTime).getTime()
    const interval = setInterval(() => {
      setElapsed(Math.floor((Date.now() - start) / 1000))
    }, 1000)

    // Animation de pulse continu
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.15,
          duration: 1000,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 1000,
          useNativeDriver: true,
        }),
      ])
    ).start()

    // Animation de rotation lente
    Animated.loop(
      Animated.timing(rotateAnim, {
        toValue: 1,
        duration: 3000,
        useNativeDriver: true,
      })
    ).start()

    // Animation de glow
    Animated.loop(
      Animated.sequence([
        Animated.timing(glowAnim, {
          toValue: 1,
          duration: 1500,
          useNativeDriver: false,
        }),
        Animated.timing(glowAnim, {
          toValue: 0,
          duration: 1500,
          useNativeDriver: false,
        }),
      ])
    ).start()

    return () => clearInterval(interval)
  }, [startTime])

  const formatTime = (seconds: number) => {
    const h = Math.floor(seconds / 3600)
    const m = Math.floor((seconds % 3600) / 60)
    const s = seconds % 60
    return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`
  }

  const spin = rotateAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  })

  const glowColor = glowAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['rgba(108, 99, 255, 0.3)', 'rgba(108, 99, 255, 0.8)'],
  })

  return (
    <Animated.View style={[styles.timerGradientContainer, { shadowColor: glowColor }]}>
      <LinearGradient colors={['#6C63FF', '#4C51BF']} style={styles.timerGradient}>
        <Animated.View style={[styles.timerPulse, { transform: [{ scale: pulseAnim }] }]}>
          <Animated.View style={{ transform: [{ rotate: spin }] }}>
            <MaterialIcons name="timer" size={28} color="#FFF" />
          </Animated.View>
        </Animated.View>
        <Text style={styles.timerText}>{formatTime(elapsed)}</Text>
        <Text style={styles.timerLabel}>Session active</Text>
      </LinearGradient>
    </Animated.View>
  )
})

// ==================== EMPTY STATE AVEC ANIMATION ====================
const EmptyState = () => {
  const floatAnim = useRef(new Animated.Value(0)).current
  const fadeAnim = useRef(new Animated.Value(0)).current

  useEffect(() => {
    // Fade in
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 800,
      useNativeDriver: true,
    }).start()

    // Float animation
    Animated.loop(
      Animated.sequence([
        Animated.timing(floatAnim, {
          toValue: -10,
          duration: 2000,
          useNativeDriver: true,
        }),
        Animated.timing(floatAnim, {
          toValue: 0,
          duration: 2000,
          useNativeDriver: true,
        }),
      ])
    ).start()
  }, [])

  return (
    <Animated.View style={[styles.emptyState, { opacity: fadeAnim }]}>
      <LinearGradient
        colors={['rgba(108, 99, 255, 0.1)', 'rgba(76, 81, 191, 0.05)']}
        style={styles.emptyGradient}
      >
        <Animated.View 
          style={[
            styles.emptyIconContainer,
            { transform: [{ translateY: floatAnim }] }
          ]}
        >
          <MaterialIcons name="fitness-center" size={64} color="#6C63FF" />
        </Animated.View>
        <Text style={styles.emptyTitle}>Aucune machine disponible</Text>
        <Text style={styles.emptySubtitle}>
          Les machines apparaîtront ici dès qu'elles seront configurées
        </Text>
        <TouchableOpacity style={styles.emptyButton}>
          <MaterialIcons name="refresh" size={20} color="#6C63FF" />
          <Text style={styles.emptyButtonText}>Actualiser</Text>
        </TouchableOpacity>
      </LinearGradient>
    </Animated.View>
  )
}

// ==================== ANIMATED MACHINE CARD ====================
const AnimatedMachineCard = memo(({ 
  item, 
  isExpanded, 
  isActive,
  onToggle,
  onStartSession,
  onEndSession,
  stats,
  history,
  activeSession,
}: any) => {
  const scaleAnim = useRef(new Animated.Value(1)).current
  const fadeAnim = useRef(new Animated.Value(0)).current
  const slideAnim = useRef(new Animated.Value(50)).current
  const liveBadgeAnim = useRef(new Animated.Value(0)).current

  useEffect(() => {
    // Fade in au montage
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 400,
        useNativeDriver: true,
      }),
      Animated.spring(slideAnim, {
        toValue: 0,
        friction: 8,
        useNativeDriver: true,
      }),
    ]).start()

    // Animation du badge LIVE
    if (isActive) {
      Animated.loop(
        Animated.sequence([
          Animated.timing(liveBadgeAnim, {
            toValue: 1,
            duration: 800,
            useNativeDriver: true,
          }),
          Animated.timing(liveBadgeAnim, {
            toValue: 0,
            duration: 800,
            useNativeDriver: true,
          }),
        ])
      ).start()
    }
  }, [isActive])

  const handlePress = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)
    
    // Animation au tap
    Animated.sequence([
      Animated.timing(scaleAnim, {
        toValue: 0.97,
        duration: 100,
        useNativeDriver: true,
      }),
      Animated.spring(scaleAnim, {
        toValue: 1,
        friction: 3,
        useNativeDriver: true,
      }),
    ]).start()

    onToggle()
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'available': return '#10B981'
      case 'in_use': return '#F59E0B'
      case 'maintenance': return '#EF4444'
      default: return '#94A3B8'
    }
  }

  const getStatusText = (status: string) => {
    switch (status) {
      case 'available': return 'Disponible'
      case 'in_use': return 'Occupée'
      case 'maintenance': return 'Maintenance'
      default: return status
    }
  }

  const liveBadgeOpacity = liveBadgeAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0.6, 1],
  })

  const recommendations = item.type === 'Cardio' 
    ? { duration: '20-30 min', sets: 'N/A', reps: 'N/A', tips: 'Maintenez un rythme constant' }
    : { duration: '15-20 min', sets: '3-4 séries', reps: '12-15 reps', tips: 'Contrôlez le mouvement' }

  return (
    <Animated.View
      style={[
        styles.cardContainer,
        {
          opacity: fadeAnim,
          transform: [
            { translateY: slideAnim },
            { scale: scaleAnim },
          ],
        },
      ]}
    >
      <BlurView intensity={80} tint="light" style={styles.glassCard}>
        <LinearGradient
          colors={isActive ? ['rgba(108,99,255,0.15)', 'rgba(76,81,191,0.05)'] : ['rgba(255,255,255,0.95)', 'rgba(255,255,255,0.85)']}
          style={styles.cardGradient}
        >
          <TouchableOpacity onPress={handlePress} activeOpacity={0.9}>
            <View style={styles.machineHeader}>
              <View style={styles.machineInfo}>
                <View style={styles.machineNameRow}>
                  <Text style={styles.machineName}>{item.name}</Text>
                  {isActive && (
                    <Animated.View style={[styles.liveBadge, { opacity: liveBadgeOpacity }]}>
                      <View style={styles.livePulse} />
                      <Text style={styles.liveText}>LIVE</Text>
                    </Animated.View>
                  )}
                </View>
                <View style={styles.machineTypeRow}>
                  <MaterialIcons 
                    name={item.type === 'Cardio' ? 'favorite' : 'fitness-center'} 
                    size={16} 
                    color="#6C63FF"
                  />
                  <Text style={styles.machineType}>{item.type}</Text>
                </View>
              </View>
              <View style={styles.headerRight}>
                <View style={[styles.statusDot, { backgroundColor: getStatusColor(item.status) }]} />
                <Animated.View style={{ transform: [{ rotate: isExpanded ? '180deg' : '0deg' }] }}>
                  <MaterialIcons name="expand-more" size={24} color="#64748B" />
                </Animated.View>
              </View>
            </View>

            {item.description && (
              <Text style={styles.machineDescription}>{item.description}</Text>
            )}
          </TouchableOpacity>

          {/* Section détails avec animation */}
          {isExpanded && (
            <View style={styles.detailsSection}>
              {item.image_url && (
                <Image source={{ uri: item.image_url }} style={styles.machineImage} />
              )}

              <View style={styles.recommendationsGrid}>
                {[
                  { icon: 'timer', label: 'Durée', value: recommendations.duration, color: '#6C63FF' },
                  { icon: 'repeat', label: 'Séries', value: recommendations.sets, color: '#10B981' },
                  { icon: 'format-list-numbered', label: 'Reps', value: recommendations.reps, color: '#F59E0B' },
                ].map((rec, idx) => (
                  <LinearGradient
                    key={idx}
                    colors={[`${rec.color}15`, `${rec.color}05`]}
                    style={styles.recommendationCard}
                  >
                    <MaterialIcons name={rec.icon as any} size={24} color={rec.color} />
                    <Text style={styles.recommendationValue}>{rec.value}</Text>
                    <Text style={styles.recommendationLabel}>{rec.label}</Text>
                  </LinearGradient>
                ))}
              </View>

              <View style={styles.tipsContainer}>
                <MaterialIcons name="lightbulb" size={18} color="#F59E0B" />
                <Text style={styles.tipsText}>{recommendations.tips}</Text>
              </View>

              {stats && stats.totalSessions > 0 && (
                <BlurView intensity={40} tint="light" style={styles.statsBlur}>
                  <View style={styles.statsSectionHeader}>
                    <MaterialIcons name="trending-up" size={20} color="#6C63FF" />
                    <Text style={styles.statsSectionTitle}>Vos stats</Text>
                    {stats.progression !== 'neutral' && (
                      <View style={[styles.progressionPill, { backgroundColor: stats.progression === 'up' ? '#D1FAE5' : '#FEE2E2' }]}>
                        <MaterialIcons 
                          name={stats.progression === 'up' ? 'trending-up' : 'trending-down'} 
                          size={14} 
                          color={stats.progression === 'up' ? '#10B981' : '#EF4444'}
                        />
                      </View>
                    )}
                  </View>
                  <View style={styles.statsGrid}>
                    {[
                      { icon: 'calendar-today', value: stats.totalSessions, label: 'Sessions', color: '#6366F1' },
                      { icon: 'fitness-center', value: `${stats.maxWeight} kg`, label: 'Max', color: '#10B981' },
                      { icon: 'show-chart', value: `${stats.avgWeight.toFixed(1)} kg`, label: 'Moy.', color: '#F59E0B' },
                    ].map((stat, idx) => (
                      <View key={idx} style={styles.statPill}>
                        <MaterialIcons name={stat.icon as any} size={18} color={stat.color} />
                        <Text style={styles.statValue}>{stat.value}</Text>
                        <Text style={styles.statLabel}>{stat.label}</Text>
                      </View>
                    ))}
                  </View>
                </BlurView>
              )}

              {history && history.length > 0 && (
                <View style={styles.historySection}>
                  <View style={styles.historySectionHeader}>
                    <MaterialIcons name="history" size={18} color="#64748B" />
                    <Text style={styles.historySectionTitle}>Historique</Text>
                  </View>
                  {history.slice(0, 3).map((session: any, index: number) => {
                    const sessionDate = new Date(session.start_time)
                    const duration = session.end_time 
                      ? Math.floor((new Date(session.end_time).getTime() - sessionDate.getTime()) / 60000)
                      : 0

                    return (
                      <View key={session.id} style={styles.historyItem}>
                        <View style={styles.historyLeft}>
                          <Text style={styles.historyDate}>
                            {sessionDate.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })}
                          </Text>
                          <Text style={styles.historyTime}>
                            {sessionDate.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
                          </Text>
                        </View>
                        <View style={styles.historyRight}>
                          {session.weight && (
                            <View style={[styles.historyPill, { backgroundColor: '#EEF2FF' }]}>
                              <MaterialIcons name="fitness-center" size={12} color="#6366F1" />
                              <Text style={styles.historyPillText}>{session.weight}kg</Text>
                            </View>
                          )}
                          <View style={[styles.historyPill, { backgroundColor: '#D1FAE5' }]}>
                            <MaterialIcons name="repeat" size={12} color="#10B981" />
                            <Text style={styles.historyPillText}>{session.sets}×{session.reps}</Text>
                          </View>
                          {duration > 0 && (
                            <View style={[styles.historyPill, { backgroundColor: '#FEF3C7' }]}>
                              <MaterialIcons name="timer" size={12} color="#F59E0B" />
                              <Text style={styles.historyPillText}>{duration}min</Text>
                            </View>
                          )}
                        </View>
                        {index === 0 && <View style={styles.latestDot} />}
                      </View>
                    )
                  })}
                </View>
              )}
            </View>
          )}

          {isActive ? (
            <>
              <SessionTimer startTime={activeSession?.start_time} />
              <Button
                title="Terminer la session"
                onPress={onEndSession}
                variant="secondary"
                size="small"
                style={styles.actionButton}
              />
            </>
          ) : (
            <Button
              title={item.status === 'available' ? 'Démarrer' : getStatusText(item.status)}
              onPress={() => onStartSession(item)}
              variant={item.status === 'available' ? 'primary' : 'secondary'}
              size="small"
              disabled={item.status !== 'available'}
              style={styles.actionButton}
            />
          )}
        </LinearGradient>
      </BlurView>
    </Animated.View>
  )
})

// ==================== MAIN COMPONENT ====================
export default function MachinesScreen() {
  const {
    machines,
    activeSession,
    fetchMachines,
    fetchActiveSession,
    startSession,
    endSession,
  } = useMachinesStore()
  
  const [refreshing, setRefreshing] = useState(false)
  const [expandedMachine, setExpandedMachine] = useState<string | null>(null)
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid')
  const [machineHistory, setMachineHistory] = useState<Record<string, MachineSession[]>>({})
  const [machineStats, setMachineStats] = useState<Record<string, any>>({})
  const [loading, setLoading] = useState(true)

  const headerAnim = useRef(new Animated.Value(0)).current

  useEffect(() => {
    loadData()
    
    // Animation du header
    Animated.timing(headerAnim, {
      toValue: 1,
      duration: 600,
      useNativeDriver: true,
    }).start()
  }, [])

  const loadData = async () => {
    try {
      setLoading(true)
      await Promise.all([fetchMachines(), fetchActiveSession()])
    } catch (error) {
      console.error('Load Error:', error)
    } finally {
      setLoading(false)
    }
  }

  const onRefresh = async () => {
    setRefreshing(true)
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium)
    await loadData()
    setRefreshing(false)
  }

  const loadMachineData = async (machineId: string) => {
    try {
      const [history, stats] = await Promise.all([
        machinesService.getMachineSessionHistory(machineId, 5),
        machinesService.getMachineStats(machineId)
      ])
      setMachineHistory(prev => ({ ...prev, [machineId]: history }))
      setMachineStats(prev => ({ ...prev, [machineId]: stats }))
    } catch (error) {
      console.error('Load Machine Data Error:', error)
    }
  }

  const toggleMachine = async (machineId: string) => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut)
    const isExpanding = expandedMachine !== machineId
    setExpandedMachine(isExpanding ? machineId : null)
    
    if (isExpanding && !machineHistory[machineId]) {
      await loadMachineData(machineId)
    }
  }

  const toggleView = (mode: 'grid' | 'list') => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut)
    setViewMode(mode)
  }

  const handleStartSession = async (machine: Machine) => {
    if (activeSession) {
      Alert.alert('Session active', 'Vous avez déjà une session en cours')
      return
    }
    if (machine.status !== 'available') {
      Alert.alert('Machine occupée', 'Cette machine n\'est pas disponible')
      return
    }

    await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success)
    try {
      await startSession(machine.id)
      Alert.alert('✨ Session démarrée', `Bon courage sur ${machine.name}!`)
    } catch (error: any) {
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error)
      Alert.alert('Erreur', error.message || 'Impossible de démarrer')
    }
  }

  const handleEndSession = async () => {
    if (!activeSession) return

    Alert.alert('Terminer la session', 'Voulez-vous terminer votre session ?', [
      { text: 'Annuler', style: 'cancel' },
      {
        text: 'Terminer',
        onPress: async () => {
          await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success)
          try {
            await endSession(activeSession.id, 3, 10)
            Alert.alert('🎉 Bien joué!', 'Session terminée avec succès')
            await loadData()
          } catch (error: any) {
            Alert.alert('Erreur', error.message)
          }
        },
      },
    ])
  }

  const renderMachineCard = ({ item, index }: { item: Machine; index: number }) => (
    <AnimatedMachineCard
      item={item}
      isExpanded={expandedMachine === item.id}
      isActive={activeSession?.machine_id === item.id}
      onToggle={() => toggleMachine(item.id)}
      onStartSession={handleStartSession}
      onEndSession={handleEndSession}
      stats={machineStats[item.id]}
      history={machineHistory[item.id]}
      activeSession={activeSession}
    />
  )

  const headerTranslate = headerAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [-50, 0],
  })

  return (
    <ImageBackground
      source={require('../assets/gym-bg.jpg')}
      style={styles.backgroundImage}
      imageStyle={{ opacity: 0.2 }}
    >
      <LinearGradient
        colors={['rgba(15,23,42,0.4)', 'rgba(15,23,42,0.1)']}
        style={StyleSheet.absoluteFill}
      />
      
      <View style={styles.container}>
        <Animated.View style={[
          styles.headerContainer,
          {
            opacity: headerAnim,
            transform: [{ translateY: headerTranslate }],
          }
        ]}>
          <BlurView intensity={95} tint="light" style={styles.header}>
          <View>
            <Text style={styles.headerTitle}>Machines</Text>
            <Text style={styles.headerSubtitle}>
              {machines.filter(m => m.status === 'available').length} disponibles · {machines.length} total
            </Text>
          </View>
          
          <View style={styles.viewToggle}>
            {['grid', 'list'].map((mode) => (
              <TouchableOpacity
                key={mode}
                style={[styles.toggleButton, viewMode === mode && styles.toggleButtonActive]}
                onPress={() => toggleView(mode as 'grid' | 'list')}
              >
                <MaterialIcons 
                  name={mode === 'grid' ? 'view-module' : 'view-list'} 
                  size={20} 
                  color={viewMode === mode ? '#FFF' : '#64748B'}
                />
              </TouchableOpacity>
            ))}
          </View>
          </BlurView>
        </Animated.View>
        <FlatList
          data={machines}
          renderItem={renderMachineCard}
          keyExtractor={(item) => item.id}
          numColumns={1}
          contentContainerStyle={viewMode === 'grid' ? styles.listContent : styles.listContentCompact}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#6C63FF" />}
          ListEmptyComponent={<EmptyState />}
          showsVerticalScrollIndicator={false}
        />
      </View>
    </ImageBackground>
  )
}

// ==================== STYLES ====================
const styles = StyleSheet.create({
  // Nouveaux styles pour animations
  cardContainer: {
    marginBottom: Spacing.md,
  },
  headerContainer: {
    // Style pour l'animation du header
  },
  timerGradientContainer: {
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 12,
    elevation: 8,
  },
  
  backgroundImage: {
    flex: 1,
    backgroundColor: '#0F172A',
  },
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.xl,
    paddingBottom: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(226, 232, 240, 0.3)',
  },
  headerTitle: {
    fontSize: FontSize.xxl,
    fontWeight: '800',
    color: '#0F172A',
    letterSpacing: -0.5,
  },
  headerSubtitle: {
    fontSize: FontSize.sm,
    color: '#64748B',
    marginTop: 2,
  },
  viewToggle: {
    flexDirection: 'row',
    backgroundColor: 'rgba(241, 245, 249, 0.8)',
    borderRadius: BorderRadius.lg,
    padding: 4,
    gap: 4,
  },
  toggleButton: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.md,
  },
  toggleButtonActive: {
    backgroundColor: '#6C63FF',
  },
  listContent: {
    padding: Spacing.lg,
    gap: Spacing.md,
  },
  listContentCompact: {
    paddingVertical: Spacing.sm,
    gap: Spacing.sm,
  },
  glassCard: {
    borderRadius: BorderRadius.xl,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.5)',
  },
  cardGradient: {
    padding: Spacing.lg,
  },
  machineHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  machineInfo: {
    flex: 1,
  },
  machineNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    marginBottom: Spacing.xs,
  },
  machineName: {
    fontSize: FontSize.lg,
    fontWeight: '700',
    color: '#0F172A',
  },
  liveBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#EF4444',
    paddingHorizontal: Spacing.sm,
    paddingVertical: 4,
    borderRadius: BorderRadius.full,
  },
  livePulse: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#FFF',
  },
  liveText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#FFF',
    letterSpacing: 0.5,
  },
  machineTypeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  machineType: {
    fontSize: FontSize.sm,
    color: '#6C63FF',
    fontWeight: '600',
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  statusDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  machineDescription: {
    fontSize: FontSize.sm,
    color: '#64748B',
    marginTop: Spacing.sm,
    lineHeight: 20,
  },
  detailsSection: {
    marginTop: Spacing.lg,
    paddingTop: Spacing.lg,
    borderTopWidth: 1,
    borderTopColor: 'rgba(226, 232, 240, 0.5)',
    gap: Spacing.md,
  },
  machineImage: {
    width: '100%',
    height: 180,
    borderRadius: BorderRadius.lg,
  },
  recommendationsGrid: {
    flexDirection: 'row',
    gap: Spacing.sm,
  },
  recommendationCard: {
    flex: 1,
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
    alignItems: 'center',
    gap: 6,
  },
  recommendationValue: {
    fontSize: FontSize.md,
    fontWeight: '700',
    color: '#0F172A',
  },
  recommendationLabel: {
    fontSize: FontSize.xs,
    color: '#64748B',
  },
  tipsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    backgroundColor: 'rgba(245, 158, 11, 0.1)',
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
    borderLeftWidth: 3,
    borderLeftColor: '#F59E0B',
  },
  tipsText: {
    flex: 1,
    fontSize: FontSize.sm,
    color: '#92400E',
    fontStyle: 'italic',
  },
  statsBlur: {
    borderRadius: BorderRadius.lg,
    overflow: 'hidden',
    padding: Spacing.md,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.3)',
  },
  statsSectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
    marginBottom: Spacing.md,
  },
  statsSectionTitle: {
    flex: 1,
    fontSize: FontSize.md,
    fontWeight: '700',
    color: '#0F172A',
  },
  progressionPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 4,
    borderRadius: BorderRadius.full,
  },
  progressionText: {
    fontSize: FontSize.xs,
    fontWeight: '700',
  },
  statsGrid: {
    flexDirection: 'row',
    gap: Spacing.sm,
  },
  statPill: {
    flex: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.5)',
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
    alignItems: 'center',
    gap: 4,
  },
  statValue: {
    fontSize: FontSize.lg,
    fontWeight: '700',
    color: '#0F172A',
  },
  statLabel: {
    fontSize: FontSize.xs,
    color: '#64748B',
  },
  historySection: {
    gap: Spacing.sm,
  },
  historySectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
    marginBottom: Spacing.xs,
  },
  historySectionTitle: {
    fontSize: FontSize.sm,
    fontWeight: '600',
    color: '#64748B',
  },
  historyItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: 'rgba(248, 250, 252, 0.6)',
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
    position: 'relative',
  },
  historyLeft: {
    gap: 2,
  },
  historyDate: {
    fontSize: FontSize.xs,
    fontWeight: '700',
    color: '#0F172A',
  },
  historyTime: {
    fontSize: FontSize.xs,
    color: '#94A3B8',
  },
  historyRight: {
    flexDirection: 'row',
    gap: Spacing.xs,
  },
  historyPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 4,
    borderRadius: BorderRadius.sm,
  },
  historyPillText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#0F172A',
  },
  latestDot: {
    position: 'absolute',
    top: Spacing.sm,
    right: Spacing.sm,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#6C63FF',
  },
  timerGradient: {
    borderRadius: BorderRadius.lg,
    padding: Spacing.lg,
    alignItems: 'center',
    marginTop: Spacing.md,
    gap: Spacing.xs,
  },
  timerPulse: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  timerText: {
    fontSize: 36,
    fontWeight: '800',
    color: '#FFF',
    letterSpacing: 1,
  },
  timerLabel: {
    fontSize: FontSize.sm,
    color: 'rgba(255, 255, 255, 0.9)',
    fontWeight: '600',
  },
  actionButton: {
    marginTop: Spacing.md,
  },
  emptyState: {
    padding: Spacing.xxl,
  },
  emptyGradient: {
    borderRadius: BorderRadius.xl,
    padding: Spacing.xxl,
    alignItems: 'center',
    gap: Spacing.md,
  },
  emptyIconContainer: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: 'rgba(108, 99, 255, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  emptyTitle: {
    fontSize: FontSize.xl,
    fontWeight: '700',
    color: '#0F172A',
  },
  emptySubtitle: {
    fontSize: FontSize.sm,
    color: '#64748B',
    textAlign: 'center',
    marginBottom: Spacing.lg,
  },
  emptyButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
    backgroundColor: 'rgba(108, 99, 255, 0.1)',
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.full,
  },
  emptyButtonText: {
    fontSize: FontSize.sm,
    fontWeight: '600',
    color: '#6C63FF',
  },
})
