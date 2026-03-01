import React, { useEffect, useState } from 'react'
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Alert,
  TouchableOpacity,
  Animated,
  Dimensions,
  Switch,
  TextInput,
  ImageBackground,
  Image,
} from 'react-native'
import * as ImagePicker from 'expo-image-picker'
import { LinearGradient } from 'expo-linear-gradient'
import { MaterialIcons } from '@expo/vector-icons'
import QRCode from 'react-native-qrcode-svg'
import { BarChart, LineChart, ProgressChart } from 'react-native-chart-kit'
import * as Haptics from 'expo-haptics'
import { Colors, Spacing, FontSize, FontWeight, GRADIENTS } from '../constants/Colors'
import { useAuthStore } from '../store/authStore'
import { useAccessStore } from '../store/accessStore'
import { useMachinesStore } from '../store/machinesStore'

const { width } = Dimensions.get('window')

type ExpandedSection = 'qr' | 'stats' | 'goals' | 'achievements' | 'settings' | 'help' | null

export default function ProfileScreen() {
  const { profile, membership, signOut, updateProfile } = useAuthStore()
  const { accessHistory, fetchAccessHistory } = useAccessStore()
  const { sessionHistory, fetchSessionHistory } = useMachinesStore()

  const [expandedSection, setExpandedSection] = useState<ExpandedSection>(null)
  const [notificationsEnabled, setNotificationsEnabled] = useState(true)
  const [darkModeEnabled, setDarkModeEnabled] = useState(false)
  const [stats, setStats] = useState<any>(null)
  const scaleAnim = new Animated.Value(1)

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    await Promise.all([
      fetchAccessHistory(),
      fetchSessionHistory(),
    ])
    calculateStats()
  }

  const calculateStats = () => {
    const last30Days = sessionHistory.slice(0, 30)

    const totalSessions = last30Days.length
    const totalMinutes = last30Days.reduce((sum, s) => {
      const duration = s.end_time
        ? (new Date(s.end_time).getTime() - new Date(s.start_time).getTime()) / 60000
        : 0
      return sum + duration
    }, 0)

    const totalSets = last30Days.reduce((sum, s) => sum + (s.sets || 0), 0)
    const calories = Math.round(totalMinutes * 5)

    // Activité hebdomadaire
    const weeklyData = Array(7).fill(0)
    last30Days.forEach(s => {
      const day = new Date(s.start_time).getDay()
      weeklyData[day]++
    })

    setStats({
      totalSessions,
      totalMinutes: Math.round(totalMinutes),
      totalSets,
      calories,
      weeklyData,
    })
  }

  const toggleSection = (section: ExpandedSection) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)
    Animated.sequence([
      Animated.timing(scaleAnim, { toValue: 0.95, duration: 100, useNativeDriver: true }),
      Animated.timing(scaleAnim, { toValue: 1, duration: 100, useNativeDriver: true }),
    ]).start()
    setExpandedSection(expandedSection === section ? null : section)
  }

  const handleSignOut = () => {
    Alert.alert(
      'Déconnexion',
      'Êtes-vous sûr de vouloir vous déconnecter ?',
      [
        { text: 'Annuler', style: 'cancel' },
        {
          text: 'Déconnexion',
          style: 'destructive',
          onPress: async () => {
            try {
              await signOut()
            } catch (error: any) {
              Alert.alert('Erreur', error.message)
            }
          },
        },
      ]
    )
  }

  const handlePickImage = async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.5,
        base64: true,
      })

      if (!result.canceled && result.assets[0].base64) {
        const base64Image = `data:image/jpeg;base64,${result.assets[0].base64}`
        await updateProfile({ avatar_url: base64Image })
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success)
      }
    } catch (error) {
      console.error(error)
      Alert.alert('Erreur', 'Impossible de charger l\'image de profil')
    }
  }

  const getMembershipConfig = (type: string) => {
    switch (type) {
      case 'vip':
        return {
          color: '#FFD700',
          gradient: ['#FFD700', '#FFA500'] as const,
          icon: 'workspace-premium',
          label: 'VIP',
        }
      case 'premium':
        return {
          color: '#6366F1',
          gradient: ['#6366F1', '#8B5CF6'] as const,
          icon: 'stars',
          label: 'PREMIUM',
        }
      default:
        return {
          color: '#FF6B35',
          gradient: GRADIENTS.primary,
          icon: 'card-membership',
          label: 'BASIC',
        }
    }
  }

  const membershipConfig = getMembershipConfig(membership?.type || 'basic')

  const getAccessStats = () => {
    const thisMonth = accessHistory.filter(log => {
      const logDate = new Date(log.timestamp)
      const now = new Date()
      return logDate.getMonth() === now.getMonth() &&
        logDate.getFullYear() === now.getFullYear()
    })
    return {
      total: thisMonth.length,
      entries: thisMonth.filter(log => log.type === 'entry').length,
    }
  }

  const accessStats = getAccessStats()

  const chartConfig = {
    backgroundGradientFrom: '#1A1F3A',
    backgroundGradientTo: '#252B4A',
    color: (opacity = 1) => `rgba(255, 107, 53, ${opacity})`,
    strokeWidth: 2,
    barPercentage: 0.7,
    decimalPlaces: 0,
  }

  const goals = [
    {
      id: '1',
      title: 'Sessions ce mois',
      target: 20,
      current: stats?.totalSessions || 0,
      unit: 'sessions',
      icon: 'fitness-center',
      color: GRADIENTS.primary,
    },
    {
      id: '2',
      title: 'Calories brûlées',
      target: 5000,
      current: stats?.calories || 0,
      unit: 'kcal',
      icon: 'local-fire-department',
      color: ['#06D6A0', '#1BE7FF'] as const,
    },
    {
      id: '3',
      title: 'Temps d\'entraînement',
      target: 600,
      current: stats?.totalMinutes || 0,
      unit: 'min',
      icon: 'schedule',
      color: ['#004E89', '#1A659E'] as const,
    },
  ]

  const achievements = [
    { id: '1', title: 'Première session', icon: 'emoji-events', color: '#FFD700', unlocked: true },
    { id: '2', title: '10 sessions', icon: 'military-tech', color: '#C0C0C0', unlocked: stats?.totalSessions >= 10 },
    { id: '3', title: '1000 calories', icon: 'local-fire-department', color: '#CD7F32', unlocked: stats?.calories >= 1000 },
    { id: '4', title: 'Semaine parfaite', icon: 'calendar-today', color: '#6366F1', unlocked: false },
  ]

  return (
    <ImageBackground
      source={require('../assets/gym-bg.jpg')}
      style={styles.container}
      resizeMode="cover"
    >
      <View style={styles.overlay}>
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.content}
          showsVerticalScrollIndicator={false}
        >
          {/* ===== HEADER CARD ===== */}
          <LinearGradient
            colors={membershipConfig.gradient}
            style={styles.headerCard}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
          >
            <View style={styles.avatarContainer}>
              <TouchableOpacity onPress={handlePickImage} activeOpacity={0.8} style={{ alignItems: 'center' }}>
                <View style={styles.avatar}>
                  {profile?.avatar_url ? (
                    <Image source={{ uri: profile.avatar_url }} style={styles.avatarImage} />
                  ) : (
                    <Text style={styles.avatarText}>
                      {String(profile?.full_name?.charAt(0)?.toUpperCase() || '?')}
                    </Text>
                  )}
                </View>
                <View style={styles.editAvatarBadge}>
                  <MaterialIcons name="edit" size={14} color="#fff" />
                </View>
              </TouchableOpacity>

              <MaterialIcons
                name={membershipConfig.icon as any}
                size={24}
                color="#fff"
                style={styles.membershipBadge}
              />
            </View>

            <Text style={styles.headerName}>{String(profile?.full_name || 'Utilisateur')}</Text>
            <Text style={styles.headerEmail}>{profile?.email}</Text>

            <View style={styles.membershipTypeContainer}>
              <MaterialIcons name="verified" size={16} color="#fff" style={{ marginRight: 4 }} />
              <Text style={styles.membershipTypeText}>{membershipConfig.label}</Text>
            </View>
          </LinearGradient>

          {/* ===== STATS RAPIDES ===== */}
          <View style={styles.quickStats}>
            <View style={styles.quickStatCard}>
              <LinearGradient colors={['#06D6A0', '#1BE7FF']} style={styles.quickStatGradient}>
                <MaterialIcons name="login" size={24} color="#fff" />
                <Text style={styles.quickStatNumber}>{String(accessStats.entries || 0)}</Text>
                <Text style={styles.quickStatLabel}>Visites</Text>
              </LinearGradient>
            </View>

            <View style={styles.quickStatCard}>
              <LinearGradient colors={GRADIENTS.primary} style={styles.quickStatGradient}>
                <MaterialIcons name="fitness-center" size={24} color="#fff" />
                <Text style={styles.quickStatNumber}>{String(stats?.totalSessions || 0)}</Text>
                <Text style={styles.quickStatLabel}>Sessions</Text>
              </LinearGradient>
            </View>

            <View style={styles.quickStatCard}>
              <LinearGradient colors={['#FFD23F', '#FFEB3B']} style={styles.quickStatGradient}>
                <MaterialIcons name="local-fire-department" size={24} color="#fff" />
                <Text style={styles.quickStatNumber}>{String(stats?.calories || 0)}</Text>
                <Text style={styles.quickStatLabel}>Calories</Text>
              </LinearGradient>
            </View>
          </View>

          {/* ===== MENU SECTIONS ===== */}

          {/* QR CODE */}
          <TouchableOpacity
            style={styles.sectionCard}
            onPress={() => toggleSection('qr')}
            activeOpacity={0.8}
          >
            <View style={styles.sectionHeader}>
              <View style={styles.sectionHeaderLeft}>
                <MaterialIcons name="qr-code-2" size={24} color="#FF6B35" />
                <Text style={styles.sectionTitle}>Mon QR Code</Text>
              </View>
              <MaterialIcons
                name={expandedSection === 'qr' ? 'expand-less' : 'expand-more'}
                size={24}
                color="#6C7A9B"
              />
            </View>

            {expandedSection === 'qr' && (
              <View style={styles.sectionContent}>
                <View style={styles.qrCodeContainer}>
                  <View style={styles.qrCodeWrapper}>
                    <QRCode
                      value={profile?.qr_code || 'NO_QR'}
                      size={200}
                      backgroundColor="white"
                      color="#FF6B35"
                    />
                  </View>
                  <View style={styles.qrCodeInfo}>
                    <MaterialIcons name="info-outline" size={16} color="#6C7A9B" />
                    <Text style={styles.qrCodeText}>
                      Scannez ce code à l'entrée/sortie
                    </Text>
                  </View>
                  <Text style={styles.qrCodeValue}>{profile?.qr_code}</Text>
                </View>
              </View>
            )}
          </TouchableOpacity>

          {/* STATISTIQUES DÉTAILLÉES */}
          <TouchableOpacity
            style={styles.sectionCard}
            onPress={() => toggleSection('stats')}
            activeOpacity={0.8}
          >
            <View style={styles.sectionHeader}>
              <View style={styles.sectionHeaderLeft}>
                <MaterialIcons name="bar-chart" size={24} color="#6366F1" />
                <Text style={styles.sectionTitle}>Statistiques détaillées</Text>
              </View>
              <MaterialIcons
                name={expandedSection === 'stats' ? 'expand-less' : 'expand-more'}
                size={24}
                color="#6C7A9B"
              />
            </View>

            {expandedSection === 'stats' && stats && (
              <View style={styles.sectionContent}>
                {/* Stats Grid */}
                <View style={styles.statsGrid}>
                  <View style={styles.miniStatCard}>
                    <Text style={styles.miniStatValue}>{String(stats.totalSessions || 0)}</Text>
                    <Text style={styles.miniStatLabel}>Sessions</Text>
                  </View>
                  <View style={styles.miniStatCard}>
                    <Text style={styles.miniStatValue}>{String(stats.totalMinutes || 0)}</Text>
                    <Text style={styles.miniStatLabel}>Minutes</Text>
                  </View>
                  <View style={styles.miniStatCard}>
                    <Text style={styles.miniStatValue}>{String(stats.totalSets || 0)}</Text>
                    <Text style={styles.miniStatLabel}>Séries</Text>
                  </View>
                  <View style={styles.miniStatCard}>
                    <Text style={styles.miniStatValue}>{String(stats.calories || 0)}</Text>
                    <Text style={styles.miniStatLabel}>Calories</Text>
                  </View>
                </View>

                {/* Chart */}
                <Text style={styles.chartTitle}>Activité hebdomadaire</Text>
                <BarChart
                  data={{
                    labels: ['D', 'L', 'M', 'M', 'J', 'V', 'S'],
                    datasets: [{ data: stats.weeklyData.length ? stats.weeklyData : [0, 0, 0, 0, 0, 0, 0] }],
                  }}
                  width={width - 64}
                  height={200}
                  chartConfig={chartConfig}
                  style={styles.chart}
                  yAxisLabel=""
                  yAxisSuffix=" min"
                  showBarTops={false}
                  fromZero={true}
                />
              </View>
            )}
          </TouchableOpacity>

          {/* MES OBJECTIFS */}
          <TouchableOpacity
            style={styles.sectionCard}
            onPress={() => toggleSection('goals')}
            activeOpacity={0.8}
          >
            <View style={styles.sectionHeader}>
              <View style={styles.sectionHeaderLeft}>
                <MaterialIcons name="flag" size={24} color="#06D6A0" />
                <Text style={styles.sectionTitle}>Mes objectifs</Text>
              </View>
              <MaterialIcons
                name={expandedSection === 'goals' ? 'expand-less' : 'expand-more'}
                size={24}
                color="#6C7A9B"
              />
            </View>

            {expandedSection === 'goals' && (
              <View style={styles.sectionContent}>
                {goals.map(goal => {
                  const progress = Math.min((goal.current / goal.target) * 100, 100)
                  return (
                    <View key={goal.id} style={styles.goalCard}>
                      <View style={styles.goalHeader}>
                        <LinearGradient colors={goal.color} style={styles.goalIcon}>
                          <MaterialIcons name={goal.icon as any} size={20} color="#fff" />
                        </LinearGradient>

                        <View style={styles.goalInfo}>
                          <Text style={styles.goalTitle}>{goal.title}</Text>
                          <Text style={styles.goalProgress}>
                            {String(goal.current)} / {String(goal.target)} {String(goal.unit)}
                          </Text>
                        </View>

                        <Text style={styles.goalPercentage}>{Math.round(progress)}%</Text>
                      </View>

                      <View style={styles.progressBarContainer}>
                        <LinearGradient
                          colors={goal.color}
                          style={[styles.progressBar, { width: `${progress}%` }]}
                        />
                      </View>
                    </View>
                  )
                })}
              </View>
            )}
          </TouchableOpacity>

          {/* BADGES & RÉALISATIONS */}
          <TouchableOpacity
            style={styles.sectionCard}
            onPress={() => toggleSection('achievements')}
            activeOpacity={0.8}
          >
            <View style={styles.sectionHeader}>
              <View style={styles.sectionHeaderLeft}>
                <MaterialIcons name="emoji-events" size={24} color="#FFD700" />
                <Text style={styles.sectionTitle}>Badges & Réalisations</Text>
              </View>
              <MaterialIcons
                name={expandedSection === 'achievements' ? 'expand-less' : 'expand-more'}
                size={24}
                color="#6C7A9B"
              />
            </View>

            {expandedSection === 'achievements' && (
              <View style={styles.sectionContent}>
                <View style={styles.achievementsGrid}>
                  {achievements.map(achievement => (
                    <View
                      key={achievement.id}
                      style={[
                        styles.achievementCard,
                        !achievement.unlocked && styles.achievementLocked
                      ]}
                    >
                      <MaterialIcons
                        name={achievement.icon as any}
                        size={40}
                        color={achievement.unlocked ? achievement.color : '#94A3B8'}
                      />
                      <Text style={[
                        styles.achievementTitle,
                        !achievement.unlocked && styles.achievementTitleLocked
                      ]}>
                        {String(achievement.title)}
                      </Text>
                      {achievement.unlocked && (
                        <View style={styles.achievementBadge}>
                          <MaterialIcons name="check-circle" size={16} color="#06D6A0" />
                        </View>
                      )}
                    </View>
                  ))}
                </View>
              </View>
            )}
          </TouchableOpacity>

          {/* PARAMÈTRES */}
          <TouchableOpacity
            style={styles.sectionCard}
            onPress={() => toggleSection('settings')}
            activeOpacity={0.8}
          >
            <View style={styles.sectionHeader}>
              <View style={styles.sectionHeaderLeft}>
                <MaterialIcons name="settings" size={24} color="#8B5CF6" />
                <Text style={styles.sectionTitle}>Paramètres</Text>
              </View>
              <MaterialIcons
                name={expandedSection === 'settings' ? 'expand-less' : 'expand-more'}
                size={24}
                color="#6C7A9B"
              />
            </View>

            {expandedSection === 'settings' && (
              <View style={styles.sectionContent}>
                <View style={styles.settingRow}>
                  <View style={styles.settingLeft}>
                    <MaterialIcons name="notifications" size={20} color="#6C7A9B" />
                    <Text style={styles.settingLabel}>Notifications</Text>
                  </View>
                  <Switch
                    value={notificationsEnabled}
                    onValueChange={setNotificationsEnabled}
                    trackColor={{ false: '#E2E8F0', true: '#FF6B35' }}
                    thumbColor="#fff"
                  />
                </View>

                <View style={styles.settingRow}>
                  <View style={styles.settingLeft}>
                    <MaterialIcons name="dark-mode" size={20} color="#6C7A9B" />
                    <Text style={styles.settingLabel}>Mode sombre</Text>
                  </View>
                  <Switch
                    value={darkModeEnabled}
                    onValueChange={setDarkModeEnabled}
                    trackColor={{ false: '#E2E8F0', true: '#FF6B35' }}
                    thumbColor="#fff"
                  />
                </View>

                <TouchableOpacity style={styles.settingRow}>
                  <View style={styles.settingLeft}>
                    <MaterialIcons name="lock" size={20} color="#6C7A9B" />
                    <Text style={styles.settingLabel}>Changer le mot de passe</Text>
                  </View>
                  <MaterialIcons name="chevron-right" size={20} color="#6C7A9B" />
                </TouchableOpacity>

                <TouchableOpacity style={styles.settingRow}>
                  <View style={styles.settingLeft}>
                    <MaterialIcons name="language" size={20} color="#6C7A9B" />
                    <Text style={styles.settingLabel}>Langue</Text>
                  </View>
                  <Text style={styles.settingValue}>Français</Text>
                </TouchableOpacity>
              </View>
            )}
          </TouchableOpacity>

          {/* AIDE & SUPPORT */}
          <TouchableOpacity
            style={styles.sectionCard}
            onPress={() => toggleSection('help')}
            activeOpacity={0.8}
          >
            <View style={styles.sectionHeader}>
              <View style={styles.sectionHeaderLeft}>
                <MaterialIcons name="help-outline" size={24} color="#0EA5E9" />
                <Text style={styles.sectionTitle}>Aide & Support</Text>
              </View>
              <MaterialIcons
                name={expandedSection === 'help' ? 'expand-less' : 'expand-more'}
                size={24}
                color="#6C7A9B"
              />
            </View>

            {expandedSection === 'help' && (
              <View style={styles.sectionContent}>
                <TouchableOpacity style={styles.helpItem}>
                  <MaterialIcons name="question-answer" size={20} color="#0EA5E9" />
                  <Text style={styles.helpText}>FAQ</Text>
                </TouchableOpacity>

                <TouchableOpacity style={styles.helpItem}>
                  <MaterialIcons name="email" size={20} color="#0EA5E9" />
                  <Text style={styles.helpText}>Contacter le support</Text>
                </TouchableOpacity>

                <TouchableOpacity style={styles.helpItem}>
                  <MaterialIcons name="policy" size={20} color="#0EA5E9" />
                  <Text style={styles.helpText}>Conditions d'utilisation</Text>
                </TouchableOpacity>

                <TouchableOpacity style={styles.helpItem}>
                  <MaterialIcons name="privacy-tip" size={20} color="#0EA5E9" />
                  <Text style={styles.helpText}>Politique de confidentialité</Text>
                </TouchableOpacity>

                <View style={styles.versionInfo}>
                  <Text style={styles.versionText}>Version 1.0.0</Text>
                </View>
              </View>
            )}
          </TouchableOpacity>

          {/* BOUTON DÉCONNEXION */}
          <TouchableOpacity onPress={handleSignOut} style={styles.signOutButton}>
            <LinearGradient
              colors={['#EF476F', '#FF6B9D']}
              style={styles.signOutGradient}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
            >
              <MaterialIcons name="logout" size={20} color="#fff" />
              <Text style={styles.signOutText}>Se déconnecter</Text>
            </LinearGradient>
          </TouchableOpacity>

          <View style={{ height: 40 }} />
        </ScrollView>
      </View>
    </ImageBackground>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(26, 31, 58, 0.85)', // Dark overlay pour la lisibilité
  },
  scrollView: {
    flex: 1,
  },
  content: {
    padding: Spacing.lg,
  },

  // Header
  headerCard: {
    borderRadius: 20,
    padding: Spacing.xl,
    alignItems: 'center',
    marginBottom: Spacing.lg,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  avatarContainer: {
    position: 'relative',
    marginBottom: Spacing.md,
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(255,255,255,0.3)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: '#fff',
    overflow: 'hidden',
  },
  avatarImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  editAvatarBadge: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    backgroundColor: '#FF6B35',
    borderRadius: 12,
    padding: 4,
    borderWidth: 2,
    borderColor: '#1A1F3A',
  },
  avatarText: {
    fontSize: 36,
    fontWeight: 'bold',
    color: '#fff',
  },
  membershipBadge: {
    position: 'absolute',
    bottom: -5,
    right: -5,
    backgroundColor: 'rgba(0,0,0,0.4)',
    borderRadius: 12,
    padding: 4,
  },
  headerName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 4,
  },
  headerEmail: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.8)',
    marginBottom: Spacing.md,
  },
  membershipTypeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.2)',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
  },
  membershipTypeText: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#fff',
    letterSpacing: 1,
  },

  // Quick Stats
  quickStats: {
    flexDirection: 'row',
    gap: Spacing.md,
    marginBottom: Spacing.lg,
  },
  quickStatCard: {
    flex: 1,
  },
  quickStatGradient: {
    borderRadius: 12,
    padding: Spacing.md,
    alignItems: 'center',
    gap: 4,
  },
  quickStatNumber: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#fff',
  },
  quickStatLabel: {
    fontSize: 11,
    color: 'rgba(255,255,255,0.9)',
  },

  // Section Cards
  sectionCard: {
    backgroundColor: '#1A1F3A',
    borderRadius: 16,
    marginBottom: Spacing.md,
    overflow: 'hidden',
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: Spacing.lg,
  },
  sectionHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    flex: 1,
  },
  sectionTitle: {
    fontSize: FontSize.md,
    fontWeight: FontWeight.semibold,
    color: '#FFFFFF',
  },
  sectionContent: {
    padding: Spacing.lg,
    paddingTop: 0,
  },

  // QR Code
  qrCodeContainer: {
    alignItems: 'center',
  },
  qrCodeWrapper: {
    padding: Spacing.lg,
    backgroundColor: '#fff',
    borderRadius: 16,
    marginBottom: Spacing.md,
  },
  qrCodeInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#252B4A',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: 8,
    marginBottom: Spacing.sm,
  },
  qrCodeText: {
    fontSize: FontSize.sm,
    color: '#B8C1EC',
  },
  qrCodeValue: {
    fontSize: FontSize.xs,
    color: '#6C7A9B',
    fontFamily: 'monospace',
  },

  // Stats
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.sm,
    marginBottom: Spacing.lg,
  },
  miniStatCard: {
    flex: 1,
    minWidth: '45%',
    backgroundColor: '#252B4A',
    padding: Spacing.md,
    borderRadius: 12,
    alignItems: 'center',
  },
  miniStatValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  miniStatLabel: {
    fontSize: 11,
    color: '#B8C1EC',
    marginTop: 4,
  },
  chartTitle: {
    fontSize: FontSize.md,
    fontWeight: FontWeight.semibold,
    color: '#FFFFFF',
    marginBottom: Spacing.md,
  },
  chart: {
    borderRadius: 12,
  },

  // Goals
  goalCard: {
    marginBottom: Spacing.md,
  },
  goalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.sm,
  },
  goalIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: Spacing.md,
  },
  goalInfo: {
    flex: 1,
  },
  goalTitle: {
    fontSize: FontSize.sm,
    fontWeight: FontWeight.semibold,
    color: '#FFFFFF',
    marginBottom: 2,
  },
  goalProgress: {
    fontSize: FontSize.xs,
    color: '#B8C1EC',
  },
  goalPercentage: {
    fontSize: FontSize.lg,
    fontWeight: 'bold',
    color: '#FF6B35',
  },
  progressBarContainer: {
    height: 6,
    backgroundColor: '#252B4A',
    borderRadius: 3,
    overflow: 'hidden',
  },
  progressBar: {
    height: '100%',
    borderRadius: 3,
  },

  // Achievements
  achievementsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.md,
  },
  achievementCard: {
    flex: 1,
    minWidth: '45%',
    backgroundColor: '#252B4A',
    padding: Spacing.lg,
    borderRadius: 12,
    alignItems: 'center',
    position: 'relative',
  },
  achievementLocked: {
    opacity: 0.5,
  },
  achievementTitle: {
    fontSize: FontSize.sm,
    color: '#FFFFFF',
    marginTop: Spacing.sm,
    textAlign: 'center',
  },
  achievementTitleLocked: {
    color: '#94A3B8',
  },
  achievementBadge: {
    position: 'absolute',
    top: 8,
    right: 8,
  },

  // Settings
  settingRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: '#252B4A',
  },
  settingLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    flex: 1,
  },
  settingLabel: {
    fontSize: FontSize.md,
    color: '#FFFFFF',
  },
  settingValue: {
    fontSize: FontSize.md,
    color: '#6C7A9B',
  },

  // Help
  helpItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    paddingVertical: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: '#252B4A',
  },
  helpText: {
    fontSize: FontSize.md,
    color: '#FFFFFF',
  },
  versionInfo: {
    alignItems: 'center',
    marginTop: Spacing.lg,
  },
  versionText: {
    fontSize: FontSize.sm,
    color: '#6C7A9B',
  },

  // Sign Out
  signOutButton: {
    marginTop: Spacing.lg,
  },
  signOutGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.sm,
    paddingVertical: Spacing.md + 2,
    borderRadius: 12,
  },
  signOutText: {
    fontSize: FontSize.md,
    fontWeight: FontWeight.semibold,
    color: '#fff',
  },
})
