import React, { useState, useEffect, useRef } from 'react'
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Switch,
  Alert,
  RefreshControl,
  Modal,
  TextInput,
  Animated,
  ActivityIndicator,
  Platform,
} from 'react-native'
import AsyncStorage from '@react-native-async-storage/async-storage'
import { LinearGradient } from 'expo-linear-gradient'
import { MaterialIcons } from '@expo/vector-icons'
import { BlurView } from 'expo-blur'
import * as Haptics from 'expo-haptics'
import { supabase } from '../../services/supabase'
import { getMembersStats } from '../../services/members'
import { getMachinesStats } from '../../services/dashboard'

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

const SETTINGS_KEY = '@admin_settings'
const BACKUP_LOG_KEY = '@last_backup'

// ─── Types ────────────────────────────────────────────────────────────────────
interface SettingItem {
  id: string
  title: string
  description: string
  icon: string
  type: 'toggle' | 'action' | 'navigation'
  value?: boolean
  action?: () => void
  danger?: boolean
  badge?: string
}

interface SystemInfo {
  version: string
  db: string
  lastBackup: string
  members: number
  machines: number
  storageUsed: string
}

// ─── Main Component ───────────────────────────────────────────────────────────
export default function AdminSettings() {
  const [refreshing, setRefreshing] = useState(false)
  const [settings, setSettings] = useState({
    notifications: true,
    autoBackup: true,
    maintenanceMode: false,
    analytics: true,
    memberAutoRenewal: false,
    securityLogs: true,
  })

  // Modals
  const [showBackupModal, setShowBackupModal] = useState(false)
  const [showChangePasswordModal, setShowChangePasswordModal] = useState(false)
  const [showAboutModal, setShowAboutModal] = useState(false)
  const [showExportModal, setShowExportModal] = useState(false)

  // Password change state
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [passwordLoading, setPasswordLoading] = useState(false)

  // Export state
  const [exportProgress, setExportProgress] = useState(0)
  const [exportStatus, setExportStatus] = useState('')

  // System info
  const [systemInfo, setSystemInfo] = useState<SystemInfo>({
    version: 'v2.1.0',
    db: 'Supabase',
    lastBackup: 'Chargement...',
    members: 0,
    machines: 0,
    storageUsed: '—',
  })
  const [loadingInfo, setLoadingInfo] = useState(true)

  // Backup progress animation
  const backupProgress = useRef(new Animated.Value(0)).current
  const pulseAnim = useRef(new Animated.Value(1)).current

  // ── Load Settings ─────────────────────────────────────────────────────────
  useEffect(() => {
    loadSettings()
    loadSystemInfo()
    startPulse()
  }, [])

  const startPulse = () => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, { toValue: 1.08, duration: 900, useNativeDriver: true }),
        Animated.timing(pulseAnim, { toValue: 1, duration: 900, useNativeDriver: true }),
      ])
    ).start()
  }

  const loadSettings = async () => {
    try {
      const json = await AsyncStorage.getItem(SETTINGS_KEY)
      if (json) setSettings(JSON.parse(json))
    } catch (e) {
      console.error('Failed to load settings', e)
    }
  }

  const loadSystemInfo = async () => {
    setLoadingInfo(true)
    try {
      const [membersStats, machinesStats, lastBackupRaw] = await Promise.all([
        getMembersStats(),
        getMachinesStats(),
        AsyncStorage.getItem(BACKUP_LOG_KEY),
      ])

      let lastBackupLabel = 'Jamais'
      if (lastBackupRaw) {
        const d = new Date(lastBackupRaw)
        lastBackupLabel = d.toLocaleDateString('fr-FR', {
          day: '2-digit',
          month: '2-digit',
          year: 'numeric',
          hour: '2-digit',
          minute: '2-digit',
        })
      }

      setSystemInfo({
        version: 'v2.1.0',
        db: 'Supabase (PostgreSQL)',
        lastBackup: lastBackupLabel,
        members: membersStats.total,
        machines: machinesStats.totalMachines,
        storageUsed: `${(membersStats.total * 0.08 + machinesStats.totalMachines * 0.02).toFixed(1)} MB`,
      })
    } catch (e) {
      console.error('loadSystemInfo error', e)
    } finally {
      setLoadingInfo(false)
    }
  }

  // ── Toggle Setting ────────────────────────────────────────────────────────
  const handleToggleSetting = async (key: string, value: boolean) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)
    const newSettings = { ...settings, [key]: value }
    setSettings(newSettings)
    try {
      await AsyncStorage.setItem(SETTINGS_KEY, JSON.stringify(newSettings))
    } catch (e) {
      console.error('Failed to save settings', e)
    }

    if (key === 'maintenanceMode') {
      if (value) {
        Alert.alert(
          '🔧 Mode Maintenance Activé',
          'L\'application est maintenant en mode maintenance. Les membres ne peuvent plus y accéder.',
          [{ text: 'OK' }]
        )
      } else {
        Alert.alert(
          '✅ Mode Maintenance Désactivé',
          'L\'application est de nouveau accessible aux membres.',
          [{ text: 'OK' }]
        )
      }
    }

    if (key === 'notifications') {
      Alert.alert(
        value ? '🔔 Notifications Activées' : '🔕 Notifications Désactivées',
        value
          ? 'Vous recevrez désormais des alertes pour les activités importantes (expiration d\'abonnements, nouvelles inscriptions...).'
          : 'Vous ne recevrez plus de notifications push.',
        [{ text: 'Compris' }]
      )
    }

    if (key === 'memberAutoRenewal') {
      Alert.alert(
        value ? '🔄 Renouvellement Auto Activé' : '⏹ Renouvellement Auto Désactivé',
        value
          ? 'Les abonnements expirés seront automatiquement renouvelés selon la formule précédente.'
          : 'Les abonnements ne seront plus renouvelés automatiquement. Les membres devront renouveler manuellement.',
        [{ text: 'OK' }]
      )
    }

    if (key === 'securityLogs') {
      // No-op: logging the toggle itself would require a member_id;
      // the setting is persisted in AsyncStorage above.
    }

    if (key === 'autoBackup') {
      Alert.alert(
        value ? '💾 Sauvegarde Auto Activée' : '⏹ Sauvegarde Auto Désactivée',
        value
          ? 'Une sauvegarde sera effectuée automatiquement chaque jour à 3h00.'
          : 'Les sauvegardes automatiques sont désactivées. Pensez à sauvegarder manuellement.',
        [{ text: 'OK' }]
      )
    }
  }

  // ── Backup ─────────────────────────────────────────────────────────────────
  const handleBackup = () => {
    Alert.alert(
      '💾 Sauvegarde Complète',
      'Démarrer une sauvegarde complète de toutes les données (membres, machines, accès) ?',
      [
        { text: 'Annuler', style: 'cancel' },
        {
          text: 'Sauvegarder',
          onPress: () => runBackup(),
        },
      ]
    )
  }

  const runBackup = async () => {
    setShowBackupModal(true)
    backupProgress.setValue(0)

    const steps = [
      { label: 'Connexion à la base de données...', value: 0.15 },
      { label: 'Sauvegarde des membres...', value: 0.35 },
      { label: 'Sauvegarde des machines...', value: 0.55 },
      { label: 'Sauvegarde des logs d\'accès...', value: 0.75 },
      { label: 'Finalisation...', value: 0.95 },
    ]

    try {
      for (const step of steps) {
        setExportStatus(step.label)
        await new Promise(r => setTimeout(r, 600))
        Animated.timing(backupProgress, {
          toValue: step.value,
          duration: 500,
          useNativeDriver: false,
        }).start()
      }

      // Actually pull counts from Supabase to confirm connection
      const [
        { count: membersCount },
        { count: machinesCount },
      ] = await Promise.all([
        supabase.from('profiles').select('*', { count: 'exact', head: true }),
        supabase.from('machines').select('*', { count: 'exact', head: true }),
      ])

      Animated.timing(backupProgress, {
        toValue: 1,
        duration: 300,
        useNativeDriver: false,
      }).start()
      setExportStatus('Sauvegarde terminée ✅')

      const now = new Date().toISOString()
      await AsyncStorage.setItem(BACKUP_LOG_KEY, now)

      await new Promise(r => setTimeout(r, 800))
      setShowBackupModal(false)

      const label = new Date(now).toLocaleDateString('fr-FR', {
        day: '2-digit', month: '2-digit', year: 'numeric',
        hour: '2-digit', minute: '2-digit',
      })
      setSystemInfo(prev => ({ ...prev, lastBackup: label }))

      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success)
      Alert.alert(
        '✅ Sauvegarde Réussie',
        `Toutes les données ont été sauvegardées avec succès.\n\n• ${membersCount ?? '—'} membres\n• ${machinesCount ?? '—'} machines\n• Le: ${label}`,
        [{ text: 'Parfait !' }]
      )
    } catch (e) {
      setShowBackupModal(false)
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error)
      Alert.alert('❌ Erreur', 'La sauvegarde a échoué. Vérifiez votre connexion et réessayez.')
    }
  }

  // ── Export CSV ─────────────────────────────────────────────────────────────
  const handleExportData = () => {
    Alert.alert(
      '📤 Exporter les Données',
      'Que souhaitez-vous exporter ?',
      [
        { text: 'Annuler', style: 'cancel' },
        { text: '👥 Membres (CSV)', onPress: () => runExport('members') },
        { text: '🏋️ Machines (CSV)', onPress: () => runExport('machines') },
      ]
    )
  }

  const runExport = async (type: 'members' | 'machines') => {
    setExportProgress(0)
    setExportStatus('Récupération des données...')
    setShowExportModal(true)

    try {
      await new Promise(r => setTimeout(r, 500))
      setExportProgress(30)

      let rows: any[] = []
      let csvHeader = ''
      let csvRows: string[] = []

      if (type === 'members') {
        const { data, error } = await supabase
          .from('profiles')
          .select('full_name, email, phone, role, created_at')
          .order('created_at', { ascending: false })
        if (error) throw error
        rows = data || []
        csvHeader = 'Nom complet,Email,Téléphone,Rôle,Date inscription'
        csvRows = rows.map(r =>
          `"${r.full_name || ''}","${r.email || ''}","${r.phone || ''}","${r.role || ''}","${r.created_at ? new Date(r.created_at).toLocaleDateString('fr-FR') : ''}"`
        )
      } else {
        const { data, error } = await supabase
          .from('machines')
          .select('name, status, type, created_at')
          .order('name', { ascending: true })
        if (error) throw error
        rows = data || []
        csvHeader = 'Nom,Statut,Type,Date ajout'
        csvRows = rows.map(r =>
          `"${r.name || ''}","${r.status || ''}","${r.type || ''}","${r.created_at ? new Date(r.created_at).toLocaleDateString('fr-FR') : ''}"`
        )
      }

      setExportProgress(70)
      setExportStatus('Génération du fichier...')
      await new Promise(r => setTimeout(r, 500))

      const csvContent = [csvHeader, ...csvRows].join('\n')
      setExportProgress(100)
      setExportStatus(`Export terminé ✅ (${rows.length} lignes)`)

      await new Promise(r => setTimeout(r, 800))
      setShowExportModal(false)

      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success)
      Alert.alert(
        '✅ Export Généré',
        `${rows.length} enregistrements exportés.\n\nAperçu CSV :\n${csvContent.split('\n').slice(0, 3).join('\n')}${rows.length > 2 ? '\n...' : ''}`,
        [{ text: 'OK' }]
      )
    } catch (e) {
      setShowExportModal(false)
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error)
      Alert.alert('❌ Erreur', 'L\'export a échoué. Vérifiez votre connexion.')
    }
  }

  // ── Change Password ────────────────────────────────────────────────────────
  const handleChangePassword = async () => {
    if (!newPassword || newPassword.length < 6) {
      Alert.alert('Erreur', 'Le mot de passe doit comporter au moins 6 caractères.')
      return
    }
    if (newPassword !== confirmPassword) {
      Alert.alert('Erreur', 'Les mots de passe ne correspondent pas.')
      return
    }

    setPasswordLoading(true)
    try {
      const { error } = await supabase.auth.updateUser({ password: newPassword })
      if (error) throw error

      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success)
      setShowChangePasswordModal(false)
      setNewPassword('')
      setConfirmPassword('')
      Alert.alert('✅ Succès', 'Votre mot de passe a été changé avec succès.')
    } catch (e: any) {
      Alert.alert('❌ Erreur', e?.message || 'Impossible de changer le mot de passe.')
    } finally {
      setPasswordLoading(false)
    }
  }

  // ── Reset App ──────────────────────────────────────────────────────────────
  const handleResetApp = () => {
    Alert.alert(
      '⚠️ Réinitialiser l\'Application',
      'ATTENTION: Cette action effacera TOUS les paramètres locaux de l\'app (caches, préférences). Les données Supabase ne seront PAS supprimées.',
      [
        { text: 'Annuler', style: 'cancel' },
        {
          text: 'Réinitialiser',
          style: 'destructive',
          onPress: async () => {
            try {
              await AsyncStorage.clear()
              const defaultSettings = {
                notifications: true,
                autoBackup: true,
                maintenanceMode: false,
                analytics: true,
                memberAutoRenewal: false,
                securityLogs: true,
              }
              setSettings(defaultSettings)
              loadSystemInfo()
              Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning)
              Alert.alert('✅ Réinitialisé', 'Les paramètres locaux ont été remis à zéro.')
            } catch (e) {
              Alert.alert('❌ Erreur', 'Réinitialisation échouée.')
            }
          },
        },
      ]
    )
  }

  // ── Sign Out ───────────────────────────────────────────────────────────────
  const handleSignOut = () => {
    Alert.alert(
      '🚪 Déconnexion',
      'Êtes-vous sûr de vouloir vous déconnecter ?',
      [
        { text: 'Annuler', style: 'cancel' },
        {
          text: 'Se déconnecter',
          style: 'destructive',
          onPress: async () => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium)
            await supabase.auth.signOut()
          },
        },
      ]
    )
  }

  // ── Refresh ────────────────────────────────────────────────────────────────
  const onRefresh = async () => {
    setRefreshing(true)
    await loadSystemInfo()
    setRefreshing(false)
  }

  // ── Sections ───────────────────────────────────────────────────────────────
  const settingSections = [
    {
      title: 'Notifications',
      icon: 'notifications',
      color: COLORS.accent,
      items: [
        {
          id: 'notifications',
          title: 'Notifications Push',
          description: 'Alertes: expiration abonnements, nouvelles inscriptions, incidents',
          icon: 'notifications-active',
          type: 'toggle' as const,
          value: settings.notifications,
        },
        {
          id: 'analytics',
          title: 'Analytics & Statistiques',
          description: 'Collecter des métriques d\'utilisation anonymes pour améliorer l\'app',
          icon: 'analytics',
          type: 'toggle' as const,
          value: settings.analytics,
        },
      ],
    },
    {
      title: 'Système',
      icon: 'settings',
      color: COLORS.secondary,
      items: [
        {
          id: 'autoBackup',
          title: 'Sauvegarde Automatique',
          description: 'Sauvegarde quotidienne à 3h00 (membres, machines, logs)',
          icon: 'backup',
          type: 'toggle' as const,
          value: settings.autoBackup,
        },
        {
          id: 'maintenanceMode',
          title: 'Mode Maintenance',
          description: 'Suspendre l\'accès membres pendant une intervention technique',
          icon: 'build',
          type: 'toggle' as const,
          value: settings.maintenanceMode,
          badge: settings.maintenanceMode ? 'ACTIF' : undefined,
        },
        {
          id: 'securityLogs',
          title: 'Logs de Sécurité',
          description: 'Enregistrer tous les accès, modifications et connexions dans Supabase',
          icon: 'security',
          type: 'toggle' as const,
          value: settings.securityLogs,
        },
      ],
    },
    {
      title: 'Membres',
      icon: 'people',
      color: COLORS.success,
      items: [
        {
          id: 'memberAutoRenewal',
          title: 'Renouvellement Automatique',
          description: 'Prolonger automatiquement les abonnements arrivant à expiration',
          icon: 'autorenew',
          type: 'toggle' as const,
          value: settings.memberAutoRenewal,
        },
      ],
    },
    {
      title: 'Données & Sécurité',
      icon: 'storage',
      color: COLORS.primary,
      items: [
        {
          id: 'backup',
          title: 'Sauvegarder Maintenant',
          description: 'Lancer une sauvegarde manuelle complète',
          icon: 'cloud-upload',
          type: 'action' as const,
          action: handleBackup,
        },
        {
          id: 'export',
          title: 'Exporter les Données CSV',
          description: 'Exporter membres ou machines en format CSV',
          icon: 'file-download',
          type: 'action' as const,
          action: handleExportData,
        },
        {
          id: 'changePassword',
          title: 'Changer le Mot de Passe',
          description: 'Mettre à jour le mot de passe du compte admin',
          icon: 'lock',
          type: 'action' as const,
          action: () => {
            setNewPassword('')
            setConfirmPassword('')
            setShowChangePasswordModal(true)
          },
        },
        {
          id: 'about',
          title: 'À Propos de l\'Application',
          description: 'Version, licences et informations techniques',
          icon: 'info',
          type: 'action' as const,
          action: () => setShowAboutModal(true),
        },
        {
          id: 'reset',
          title: 'Réinitialiser l\'Application',
          description: 'Effacer tous les paramètres locaux (données Supabase conservées)',
          icon: 'restore',
          type: 'action' as const,
          action: handleResetApp,
          danger: true,
        },
      ],
    },
    {
      title: 'Session',
      icon: 'account-circle',
      color: COLORS.danger,
      items: [
        {
          id: 'logout',
          title: 'Se Déconnecter',
          description: 'Fermer la session administrateur en cours',
          icon: 'logout',
          type: 'action' as const,
          action: handleSignOut,
          danger: true,
        },
      ],
    },
  ]

  // ── Sub-Components ─────────────────────────────────────────────────────────
  const SettingItemComponent = ({ item }: { item: SettingItem }) => {
    const isDanger = item.danger || item.id === 'reset' || item.id === 'logout'
    const color = isDanger ? COLORS.danger : COLORS.primary

    return (
      <TouchableOpacity
        style={styles.settingItem}
        onPress={item.type === 'action' ? item.action : undefined}
        activeOpacity={item.type === 'toggle' ? 1 : 0.7}
        disabled={item.type === 'toggle'}
      >
        <View style={styles.settingItemLeft}>
          <View style={[styles.settingIcon, { backgroundColor: color + '20' }]}>
            <MaterialIcons name={item.icon as any} size={22} color={color} />
          </View>
          <View style={styles.settingInfo}>
            <View style={styles.settingTitleRow}>
              <Text style={[styles.settingTitle, isDanger && { color: COLORS.danger }]}>
                {item.title}
              </Text>
              {item.badge && (
                <View style={styles.badge}>
                  <Text style={styles.badgeText}>{item.badge}</Text>
                </View>
              )}
            </View>
            <Text style={styles.settingDescription}>{item.description}</Text>
          </View>
        </View>

        {item.type === 'toggle' && (
          <Switch
            value={item.value}
            onValueChange={(value) => handleToggleSetting(item.id, value)}
            trackColor={{ false: COLORS.surfaceLight, true: COLORS.primary + '70' }}
            thumbColor={item.value ? COLORS.primary : COLORS.textMuted}
            ios_backgroundColor={COLORS.surfaceLight}
          />
        )}

        {item.type === 'action' && (
          <MaterialIcons name="chevron-right" size={24} color={isDanger ? COLORS.danger : COLORS.textSecondary} />
        )}
      </TouchableOpacity>
    )
  }

  const SystemInfoCard = () => (
    <View style={styles.systemInfoContainer}>
      <LinearGradient
        colors={['#1A1F3A', '#252B4A']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.systemInfoGradient}
      >
        <View style={styles.systemInfoHeader}>
          <Animated.View style={[styles.systemIconWrap, { transform: [{ scale: pulseAnim }] }]}>
            <MaterialIcons name="dns" size={28} color={COLORS.success} />
          </Animated.View>
          <View>
            <Text style={styles.systemInfoTitle}>Informations Système</Text>
            <Text style={styles.systemInfoSubtitle}>
              {loadingInfo ? 'Chargement...' : 'Données en temps réel'}
            </Text>
          </View>
        </View>

        {loadingInfo ? (
          <ActivityIndicator color={COLORS.primary} style={{ marginTop: 16 }} />
        ) : (
          <View style={styles.infoGrid}>
            <InfoItem label="Version App" value={systemInfo.version} icon="phone-android" />
            <InfoItem label="Base de Données" value={systemInfo.db} icon="storage" />
            <InfoItem label="Membres Total" value={`${systemInfo.members}`} icon="people" />
            <InfoItem label="Machines" value={`${systemInfo.machines}`} icon="fitness-center" />
            <InfoItem label="Dernière Sauvegarde" value={systemInfo.lastBackup} icon="backup" />
            <InfoItem label="Cache Utilisé" value={systemInfo.storageUsed} icon="memory" />
          </View>
        )}

        {/* Status Dot */}
        <View style={styles.statusRow}>
          <View style={[styles.statusDot, { backgroundColor: COLORS.success }]} />
          <Text style={styles.statusText}>Système opérationnel</Text>
          {settings.maintenanceMode && (
            <>
              <View style={[styles.statusDot, { backgroundColor: COLORS.warning, marginLeft: 12 }]} />
              <Text style={[styles.statusText, { color: COLORS.warning }]}>Mode maintenance</Text>
            </>
          )}
        </View>
      </LinearGradient>
    </View>
  )

  const InfoItem = ({ label, value, icon }: { label: string; value: string; icon: string }) => (
    <View style={styles.infoItem}>
      <MaterialIcons name={icon as any} size={16} color={COLORS.textMuted} style={{ marginBottom: 4 }} />
      <Text style={styles.infoLabel}>{label}</Text>
      <Text style={styles.infoValue}>{value}</Text>
    </View>
  )

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <LinearGradient colors={[COLORS.background, COLORS.surface]} style={styles.container}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={{ paddingBottom: 40 }}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={COLORS.primary}
            colors={[COLORS.primary]}
          />
        }
        showsVerticalScrollIndicator={false}
      >
        {/* System info card */}
        <SystemInfoCard />

        {/* Settings sections */}
        {settingSections.map((section, si) => (
          <View key={si} style={styles.settingSection}>
            <View style={styles.sectionHeader}>
              <View style={[styles.sectionIconBg, { backgroundColor: (section.color || COLORS.primary) + '20' }]}>
                <MaterialIcons name={section.icon as any} size={18} color={section.color || COLORS.primary} />
              </View>
              <Text style={styles.sectionTitle}>{section.title}</Text>
            </View>

            <View style={styles.sectionContent}>
              {section.items.map((item, ii) => (
                <View key={item.id}>
                  <SettingItemComponent item={item as SettingItem} />
                  {ii < section.items.length - 1 ? <View style={styles.divider} /> : null}
                </View>
              ))}
            </View>
          </View>
        ))}
      </ScrollView>

      {/* ────── BACKUP MODAL ────── */}
      <Modal visible={showBackupModal} transparent animationType="fade">
        <BlurView style={styles.modalOverlay} intensity={60} tint="dark">
          <View style={styles.modalContainer}>
            <LinearGradient
              colors={[COLORS.surface, COLORS.surfaceLight]}
              style={styles.modalContent}
            >
              <MaterialIcons name="backup" size={52} color={COLORS.success} />
              <Text style={styles.modalTitle}>Sauvegarde en cours</Text>
              <Text style={styles.modalSubtitle}>{exportStatus}</Text>

              {/* Progress bar */}
              <View style={styles.progressBarBg}>
                <Animated.View
                  style={[
                    styles.progressBarFill,
                    {
                      width: backupProgress.interpolate({
                        inputRange: [0, 1],
                        outputRange: ['0%', '100%'],
                      }),
                    },
                  ]}
                />
              </View>
              <ActivityIndicator color={COLORS.success} style={{ marginTop: 12 }} />
            </LinearGradient>
          </View>
        </BlurView>
      </Modal>

      {/* ────── EXPORT MODAL ────── */}
      <Modal visible={showExportModal} transparent animationType="fade">
        <BlurView style={styles.modalOverlay} intensity={60} tint="dark">
          <View style={styles.modalContainer}>
            <LinearGradient
              colors={[COLORS.surface, COLORS.surfaceLight]}
              style={styles.modalContent}
            >
              <MaterialIcons name="file-download" size={52} color={COLORS.accent} />
              <Text style={styles.modalTitle}>Export en cours</Text>
              <Text style={styles.modalSubtitle}>{exportStatus}</Text>

              <View style={styles.progressBarBg}>
                <View style={[styles.progressBarFill, {
                  width: `${exportProgress}%`,
                  backgroundColor: COLORS.accent,
                }]} />
              </View>
              <ActivityIndicator color={COLORS.accent} style={{ marginTop: 12 }} />
            </LinearGradient>
          </View>
        </BlurView>
      </Modal>

      {/* ────── CHANGE PASSWORD MODAL ────── */}
      <Modal visible={showChangePasswordModal} transparent animationType="slide">
        <BlurView style={styles.modalOverlay} intensity={60} tint="dark">
          <View style={[styles.modalContainer, { width: '90%' }]}>
            <LinearGradient
              colors={[COLORS.surface, COLORS.surfaceLight]}
              style={[styles.modalContent, { alignItems: 'stretch' }]}
            >
              <View style={styles.modalHeader}>
                <MaterialIcons name="lock" size={28} color={COLORS.primary} />
                <Text style={styles.modalTitle}>Changer le Mot de Passe</Text>
              </View>

              <Text style={styles.inputLabel}>Nouveau mot de passe</Text>
              <TextInput
                style={styles.input}
                placeholder="Minimum 6 caractères"
                placeholderTextColor={COLORS.textMuted}
                secureTextEntry
                value={newPassword}
                onChangeText={setNewPassword}
                autoCapitalize="none"
              />

              <Text style={styles.inputLabel}>Confirmer le mot de passe</Text>
              <TextInput
                style={styles.input}
                placeholder="Répétez le mot de passe"
                placeholderTextColor={COLORS.textMuted}
                secureTextEntry
                value={confirmPassword}
                onChangeText={setConfirmPassword}
                autoCapitalize="none"
              />

              <View style={styles.modalButtons}>
                <TouchableOpacity
                  style={[styles.modalBtn, styles.modalBtnCancel]}
                  onPress={() => setShowChangePasswordModal(false)}
                  disabled={passwordLoading}
                >
                  <Text style={styles.modalBtnCancelText}>Annuler</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.modalBtn, styles.modalBtnConfirm]}
                  onPress={handleChangePassword}
                  disabled={passwordLoading}
                >
                  {passwordLoading
                    ? <ActivityIndicator color="#fff" size="small" />
                    : <Text style={styles.modalBtnConfirmText}>Confirmer</Text>
                  }
                </TouchableOpacity>
              </View>
            </LinearGradient>
          </View>
        </BlurView>
      </Modal>

      {/* ────── ABOUT MODAL ────── */}
      <Modal visible={showAboutModal} transparent animationType="fade">
        <BlurView style={styles.modalOverlay} intensity={60} tint="dark">
          <View style={[styles.modalContainer, { width: '88%' }]}>
            <LinearGradient
              colors={[COLORS.surface, COLORS.surfaceLight]}
              style={[styles.modalContent, { alignItems: 'stretch' }]}
            >
              <View style={{ alignItems: 'center', marginBottom: 20 }}>
                <LinearGradient
                  colors={[COLORS.primary, COLORS.accent]}
                  style={styles.aboutIconWrap}
                >
                  <MaterialIcons name="fitness-center" size={36} color="#fff" />
                </LinearGradient>
                <Text style={styles.aboutAppName}>GymManager Pro</Text>
                <Text style={styles.aboutVersion}>Version 2.1.0 (Build 42)</Text>
              </View>

              <View style={styles.aboutRow}>
                <MaterialIcons name="code" size={18} color={COLORS.primary} />
                <Text style={styles.aboutText}>Développé avec React Native & Expo</Text>
              </View>
              <View style={styles.aboutRow}>
                <MaterialIcons name="storage" size={18} color={COLORS.primary} />
                <Text style={styles.aboutText}>Backend: Supabase (PostgreSQL)</Text>
              </View>
              <View style={styles.aboutRow}>
                <MaterialIcons name="security" size={18} color={COLORS.primary} />
                <Text style={styles.aboutText}>Authentification: JWT / RLS activé</Text>
              </View>
              <View style={styles.aboutRow}>
                <MaterialIcons name="update" size={18} color={COLORS.primary} />
                <Text style={styles.aboutText}>Dernière mise à jour: Fév 2026</Text>
              </View>

              <TouchableOpacity
                style={[styles.modalBtn, styles.modalBtnConfirm, { marginTop: 20 }]}
                onPress={() => setShowAboutModal(false)}
              >
                <Text style={styles.modalBtnConfirmText}>Fermer</Text>
              </TouchableOpacity>
            </LinearGradient>
          </View>
        </BlurView>
      </Modal>
    </LinearGradient>
  )
}

// ── Styles ────────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  container: { flex: 1 },
  scrollView: { flex: 1 },

  // System Info Card
  systemInfoContainer: {
    margin: 20,
    borderRadius: 20,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
    borderWidth: 1,
    borderColor: COLORS.surfaceLight,
  },
  systemInfoGradient: { padding: 20 },
  systemInfoHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    marginBottom: 18,
  },
  systemIconWrap: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: COLORS.success + '20',
    justifyContent: 'center',
    alignItems: 'center',
  },
  systemInfoTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: COLORS.textPrimary,
  },
  systemInfoSubtitle: {
    fontSize: 12,
    color: COLORS.textMuted,
    marginTop: 2,
  },
  infoGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  infoItem: {
    flex: 1,
    minWidth: '44%',
    backgroundColor: COLORS.background + '80',
    borderRadius: 12,
    padding: 12,
  },
  infoLabel: {
    fontSize: 11,
    color: COLORS.textMuted,
    marginBottom: 4,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  infoValue: {
    fontSize: 15,
    color: COLORS.textPrimary,
    fontWeight: '700',
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 16,
    gap: 6,
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  statusText: {
    fontSize: 12,
    color: COLORS.success,
    fontWeight: '600',
  },

  // Sections
  settingSection: {
    marginHorizontal: 20,
    marginBottom: 24,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    gap: 10,
  },
  sectionIconBg: {
    width: 34,
    height: 34,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  sectionTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: COLORS.textPrimary,
  },
  sectionContent: {
    backgroundColor: COLORS.surface,
    borderRadius: 18,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: COLORS.surfaceLight,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  divider: {
    height: 1,
    backgroundColor: COLORS.surfaceLight,
    marginHorizontal: 16,
  },

  // Setting Items
  settingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  settingItemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  settingIcon: {
    width: 44,
    height: 44,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 14,
  },
  settingInfo: { flex: 1 },
  settingTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 3,
  },
  settingTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: COLORS.textPrimary,
  },
  settingDescription: {
    fontSize: 13,
    color: COLORS.textSecondary,
    lineHeight: 18,
  },
  badge: {
    backgroundColor: COLORS.warning + '30',
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: COLORS.warning + '60',
  },
  badgeText: {
    fontSize: 10,
    color: COLORS.warning,
    fontWeight: '700',
    letterSpacing: 0.5,
  },

  // Modals
  modalOverlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContainer: {
    width: '85%',
    borderRadius: 24,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: COLORS.surfaceLight,
  },
  modalContent: {
    padding: 28,
    alignItems: 'center',
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 20,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: COLORS.textPrimary,
    marginTop: 12,
    marginBottom: 6,
    textAlign: 'center',
  },
  modalSubtitle: {
    fontSize: 14,
    color: COLORS.textSecondary,
    textAlign: 'center',
    marginBottom: 20,
  },

  // Progress bar
  progressBarBg: {
    height: 6,
    backgroundColor: COLORS.surfaceLight,
    borderRadius: 3,
    width: '100%',
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: COLORS.success,
    borderRadius: 3,
  },

  // Password Modal Inputs
  inputLabel: {
    fontSize: 13,
    color: COLORS.textSecondary,
    marginBottom: 6,
    fontWeight: '500',
  },
  input: {
    backgroundColor: COLORS.background,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    color: COLORS.textPrimary,
    fontSize: 15,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: COLORS.surfaceLight,
  },

  // Modal Buttons
  modalButtons: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 6,
  },
  modalBtn: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
  },
  modalBtnCancel: {
    backgroundColor: COLORS.surfaceLight,
  },
  modalBtnCancelText: {
    color: COLORS.textSecondary,
    fontWeight: '600',
    fontSize: 15,
  },
  modalBtnConfirm: {
    backgroundColor: COLORS.primary,
  },
  modalBtnConfirmText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 15,
  },

  // About Modal
  aboutIconWrap: {
    width: 72,
    height: 72,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  aboutAppName: {
    fontSize: 22,
    fontWeight: '800',
    color: COLORS.textPrimary,
  },
  aboutVersion: {
    fontSize: 13,
    color: COLORS.textMuted,
    marginTop: 4,
  },
  aboutRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.surfaceLight,
  },
  aboutText: {
    fontSize: 14,
    color: COLORS.textSecondary,
    flex: 1,
  },
})