import React, { useState, useEffect } from 'react'
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

interface SettingItem {
  id: string
  title: string
  description: string
  icon: string
  type: 'toggle' | 'action' | 'navigation'
  value?: boolean
  action?: () => void
}

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
  const [showBackupModal, setShowBackupModal] = useState(false)

  const onRefresh = async () => {
    setRefreshing(true)
    // Simulation d'une requête API
    setTimeout(() => {
      setRefreshing(false)
    }, 1000)
  }

  const handleToggleSetting = (settingKey: string, value: boolean) => {
    setSettings(prev => ({ ...prev, [settingKey]: value }))
    
    // Actions spéciales pour certains paramètres
    if (settingKey === 'maintenanceMode') {
      Alert.alert(
        value ? 'Mode Maintenance Activé' : 'Mode Maintenance Désactivé',
        value 
          ? 'L\'application est maintenant en mode maintenance. Les membres ne pourront pas y accéder.'
          : 'L\'application est de nouveau accessible aux membres.',
        [{ text: 'OK' }]
      )
    }
  }

  const handleBackup = () => {
    Alert.alert(
      'Sauvegarde',
      'Démarrer une sauvegarde complète des données ?',
      [
        { text: 'Annuler', style: 'cancel' },
        {
          text: 'Sauvegarder',
          onPress: () => {
            setShowBackupModal(true)
            // Simulation de sauvegarde
            setTimeout(() => {
              setShowBackupModal(false)
              Alert.alert('Succès', 'Sauvegarde terminée avec succès!')
            }, 3000)
          }
        }
      ]
    )
  }

  const handleExportData = () => {
    Alert.alert(
      'Export des Données',
      'Exporter toutes les données en format CSV ?',
      [
        { text: 'Annuler', style: 'cancel' },
        { text: 'Exporter', onPress: () => Alert.alert('Export', 'Export en cours...') }
      ]
    )
  }

  const handleResetApp = () => {
    Alert.alert(
      'Réinitialiser l\'Application',
      'ATTENTION: Cette action supprimera TOUTES les données. Cette action est irréversible!',
      [
        { text: 'Annuler', style: 'cancel' },
        {
          text: 'Réinitialiser',
          style: 'destructive',
          onPress: () => {
            Alert.alert('Réinitialisation', 'Réinitialisation en cours...')
          }
        }
      ]
    )
  }

  const settingSections = [
    {
      title: 'Notifications',
      icon: 'notifications',
      items: [
        {
          id: 'notifications',
          title: 'Notifications Push',
          description: 'Recevoir des notifications sur les activités importantes',
          icon: 'notifications-active',
          type: 'toggle' as const,
          value: settings.notifications,
        },
        {
          id: 'analytics',
          title: 'Analytics',
          description: 'Collecter des données d\'utilisation anonymes',
          icon: 'analytics',
          type: 'toggle' as const,
          value: settings.analytics,
        },
      ],
    },
    {
      title: 'Système',
      icon: 'settings',
      items: [
        {
          id: 'autoBackup',
          title: 'Sauvegarde Automatique',
          description: 'Sauvegarde quotidienne automatique des données',
          icon: 'backup',
          type: 'toggle' as const,
          value: settings.autoBackup,
        },
        {
          id: 'maintenanceMode',
          title: 'Mode Maintenance',
          description: 'Désactiver l\'accès membre pour maintenance',
          icon: 'build',
          type: 'toggle' as const,
          value: settings.maintenanceMode,
        },
        {
          id: 'securityLogs',
          title: 'Logs de Sécurité',
          description: 'Enregistrer tous les accès et modifications',
          icon: 'security',
          type: 'toggle' as const,
          value: settings.securityLogs,
        },
      ],
    },
    {
      title: 'Membres',
      icon: 'people',
      items: [
        {
          id: 'memberAutoRenewal',
          title: 'Renouvellement Auto',
          description: 'Renouveler automatiquement les abonnements expirés',
          icon: 'autorenew',
          type: 'toggle' as const,
          value: settings.memberAutoRenewal,
        },
      ],
    },
    {
      title: 'Données',
      icon: 'storage',
      items: [
        {
          id: 'backup',
          title: 'Sauvegarder Maintenant',
          description: 'Créer une sauvegarde manuelle immédiate',
          icon: 'cloud-upload',
          type: 'action' as const,
          action: handleBackup,
        },
        {
          id: 'export',
          title: 'Exporter les Données',
          description: 'Exporter toutes les données en CSV',
          icon: 'download',
          type: 'action' as const,
          action: handleExportData,
        },
        {
          id: 'reset',
          title: 'Réinitialiser l\'Application',
          description: 'ATTENTION: Supprime toutes les données',
          icon: 'restore',
          type: 'action' as const,
          action: handleResetApp,
        },
      ],
    },
  ]

  const SettingItem = ({ item }: { item: SettingItem }) => (
    <TouchableOpacity
      style={styles.settingItem}
      onPress={item.action}
      activeOpacity={item.type === 'toggle' ? 1 : 0.7}
      disabled={item.type === 'toggle'}
    >
      <View style={styles.settingItemLeft}>
        <View style={[
          styles.settingIcon,
          { backgroundColor: item.id === 'reset' ? COLORS.danger + '20' : COLORS.primary + '20' }
        ]}>
          <MaterialIcons 
            name={item.icon as any} 
            size={24} 
            color={item.id === 'reset' ? COLORS.danger : COLORS.primary} 
          />
        </View>
        <View style={styles.settingInfo}>
          <Text style={[
            styles.settingTitle,
            item.id === 'reset' && { color: COLORS.danger }
          ]}>
            {String(item.title)}
          </Text>
          <Text style={styles.settingDescription}>{item.description}</Text>
        </View>
      </View>
      
      {item.type === 'toggle' && (
        <Switch
          value={item.value}
          onValueChange={(value) => handleToggleSetting(item.id, value)}
          trackColor={{ false: COLORS.surfaceLight, true: COLORS.primary + '60' }}
          thumbColor={item.value ? COLORS.primary : COLORS.textMuted}
        />
      )}
      
      {item.type === 'action' && (
        <MaterialIcons name="chevron-right" size={24} color={COLORS.textSecondary} />
      )}
    </TouchableOpacity>
  )

  const SystemInfo = () => (
    <View style={styles.systemInfoContainer}>
      <LinearGradient
        colors={[COLORS.surface, COLORS.surfaceLight]}
        style={styles.systemInfoGradient}
      >
        <Text style={styles.systemInfoTitle}>Informations Système</Text>
        <View style={styles.infoGrid}>
          <View style={styles.infoItem}>
            <Text style={styles.infoLabel}>Version</Text>
            <Text style={styles.infoValue}>v2.1.0</Text>
          </View>
          <View style={styles.infoItem}>
            <Text style={styles.infoLabel}>Base de Données</Text>
            <Text style={styles.infoValue}>PostgreSQL</Text>
          </View>
          <View style={styles.infoItem}>
            <Text style={styles.infoLabel}>Dernière Sauvegarde</Text>
            <Text style={styles.infoValue}>16/02/2024</Text>
          </View>
          <View style={styles.infoItem}>
            <Text style={styles.infoLabel}>Espace Utilisé</Text>
            <Text style={styles.infoValue}>2.4 GB</Text>
          </View>
        </View>
      </LinearGradient>
    </View>
  )

  return (
    <LinearGradient colors={[COLORS.background, COLORS.surface]} style={styles.container}>
      <ScrollView
        style={styles.scrollView}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        showsVerticalScrollIndicator={false}
      >
        {/* Informations système */}
        <SystemInfo />

        {/* Sections de paramètres */}
        {settingSections.map((section, sectionIndex) => (
          <View key={sectionIndex} style={styles.settingSection}>
            <View style={styles.sectionHeader}>
              <MaterialIcons name={section.icon as any} size={20} color={COLORS.primary} />
              <Text style={styles.sectionTitle}>{section.title}</Text>
            </View>
            
            <View style={styles.sectionContent}>
              {section.items.map((item, itemIndex) => (
                <SettingItem key={item.id} item={item} />
              ))}
            </View>
          </View>
        ))}

        {/* Modal de sauvegarde */}
        <Modal
          visible={showBackupModal}
          transparent
          animationType="fade"
        >
          <BlurView style={styles.modalOverlay} intensity={50} tint="dark">
            <View style={styles.modalContainer}>
              <LinearGradient
                colors={[COLORS.surface, COLORS.surfaceLight]}
                style={styles.modalContent}
              >
                <MaterialIcons name="backup" size={48} color={COLORS.success} />
                <Text style={styles.modalTitle}>Sauvegarde en cours...</Text>
                <Text style={styles.modalText}>
                  Veuillez patienter pendant la sauvegarde des données.
                </Text>
              </LinearGradient>
            </View>
          </BlurView>
        </Modal>

        {/* Espace supplémentaire en bas */}
        <View style={{ height: 50 }} />
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

  // Informations système
  systemInfoContainer: {
    margin: 20,
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  systemInfoGradient: {
    padding: 20,
  },
  systemInfoTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: COLORS.textPrimary,
    marginBottom: 15,
  },
  infoGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 15,
  },
  infoItem: {
    flex: 1,
    minWidth: '45%',
  },
  infoLabel: {
    fontSize: 12,
    color: COLORS.textMuted,
    marginBottom: 4,
  },
  infoValue: {
    fontSize: 16,
    color: COLORS.textPrimary,
    fontWeight: '600',
  },

  // Sections de paramètres
  settingSection: {
    marginHorizontal: 20,
    marginBottom: 25,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 15,
    gap: 10,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: COLORS.textPrimary,
  },
  sectionContent: {
    backgroundColor: COLORS.surface,
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },

  // Items de paramètres
  settingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.surfaceLight,
  },
  settingItemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  settingIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 15,
  },
  settingInfo: {
    flex: 1,
  },
  settingTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.textPrimary,
    marginBottom: 4,
  },
  settingDescription: {
    fontSize: 14,
    color: COLORS.textSecondary,
    lineHeight: 18,
  },

  // Modal
  modalOverlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContainer: {
    width: '80%',
    borderRadius: 20,
    overflow: 'hidden',
  },
  modalContent: {
    padding: 30,
    alignItems: 'center',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: COLORS.textPrimary,
    marginTop: 15,
    marginBottom: 10,
  },
  modalText: {
    fontSize: 14,
    color: COLORS.textSecondary,
    textAlign: 'center',
    lineHeight: 20,
  },
})
//   placeholderText: {
//     fontSize: 16,
//     color: COLORS.textSecondary,
//     textAlign: 'center',
//     lineHeight: 24,
//   },
// })