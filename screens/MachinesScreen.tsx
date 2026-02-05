import React, { useEffect, useState } from 'react'
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  RefreshControl,
  Alert,
} from 'react-native'
import { Card } from '../components/Card'
import { Button } from '../components/Button'
import { Colors, Spacing, FontSize, FontWeight, BorderRadius } from '../constants/Colors'
import { useMachinesStore } from '../store/machinesStore'
import { Machine } from '../types'

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

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    try {
      await Promise.all([
        fetchMachines(),
        fetchActiveSession(),
      ])
    } catch (error) {
      console.error('Load Machines Error:', error)
    }
  }

  const onRefresh = async () => {
    setRefreshing(true)
    await loadData()
    setRefreshing(false)
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

    try {
      await startSession(machine.id)
      Alert.alert('Session démarrée', `Bonne séance sur ${machine.name}!`)
    } catch (error: any) {
      Alert.alert('Erreur', error.message || 'Impossible de démarrer la session')
    }
  }

  const handleEndSession = () => {
    if (!activeSession) return

    Alert.prompt(
      'Terminer la session',
      'Entrez le nombre de séries effectuées',
      [
        { text: 'Annuler', style: 'cancel' },
        {
          text: 'Terminer',
          onPress: async (sets: string | undefined) => {
            try {
              await endSession(
                activeSession.id,
                parseInt(sets || '0'),
                0
              )
              Alert.alert('Session terminée', 'Bon travail!')
            } catch (error: any) {
              Alert.alert('Erreur', error.message)
            }
          },
        },
      ],
      'plain-text',
      '',
      'numeric'
    )
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'available':
        return Colors.light.success
      case 'in_use':
        return Colors.light.warning
      case 'maintenance':
        return Colors.light.error
      default:
        return Colors.light.textSecondary
    }
  }

  const getStatusText = (status: string) => {
    switch (status) {
      case 'available':
        return 'Disponible'
      case 'in_use':
        return 'Occupée'
      case 'maintenance':
        return 'Maintenance'
      default:
        return status
    }
  }

  const renderMachine = ({ item }: { item: Machine }) => (
    <Card style={styles.machineCard}>
      <View style={styles.machineHeader}>
        <View style={styles.machineInfo}>
          <Text style={styles.machineName}>{item.name}</Text>
          <Text style={styles.machineType}>{item.type}</Text>
        </View>
        <View style={[styles.statusBadge, { backgroundColor: getStatusColor(item.status) }]}>
          <Text style={styles.statusText}>{getStatusText(item.status)}</Text>
        </View>
      </View>

      {item.description && (
        <Text style={styles.machineDescription}>{item.description}</Text>
      )}

      {activeSession?.machine_id === item.id ? (
        <Button
          title="Terminer la session"
          onPress={handleEndSession}
          variant="secondary"
          size="small"
          style={styles.actionButton}
        />
      ) : (
        <Button
          title="Démarrer"
          onPress={() => handleStartSession(item)}
          variant="primary"
          size="small"
          disabled={item.status !== 'available'}
          style={styles.actionButton}
        />
      )}
    </Card>
  )

  return (
    <View style={styles.container}>
      {activeSession && (
        <Card style={styles.activeSessionBanner}>
          <Text style={styles.bannerText}>Session active en cours</Text>
          <Button
            title="Terminer"
            onPress={handleEndSession}
            variant="secondary"
            size="small"
          />
        </Card>
      )}

      <FlatList
        data={machines}
        renderItem={renderMachine}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>Aucune machine disponible</Text>
          </View>
        }
      />
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.light.background,
  },
  listContent: {
    padding: Spacing.lg,
  },
  activeSessionBanner: {
    margin: Spacing.lg,
    marginBottom: 0,
    backgroundColor: Colors.light.warning + '20',
    borderColor: Colors.light.warning,
    borderWidth: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  bannerText: {
    fontSize: FontSize.md,
    fontWeight: FontWeight.semibold,
    color: Colors.light.text,
  },
  machineCard: {
    marginBottom: Spacing.md,
  },
  machineHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: Spacing.sm,
  },
  machineInfo: {
    flex: 1,
  },
  machineName: {
    fontSize: FontSize.lg,
    fontWeight: FontWeight.semibold,
    color: Colors.light.text,
    marginBottom: Spacing.xs,
  },
  machineType: {
    fontSize: FontSize.sm,
    color: Colors.light.textSecondary,
  },
  statusBadge: {
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.xs,
    borderRadius: BorderRadius.sm,
  },
  statusText: {
    fontSize: FontSize.xs,
    color: '#FFFFFF',
    fontWeight: FontWeight.semibold,
  },
  machineDescription: {
    fontSize: FontSize.sm,
    color: Colors.light.textSecondary,
    marginBottom: Spacing.md,
  },
  actionButton: {
    marginTop: Spacing.sm,
  },
  emptyContainer: {
    padding: Spacing.xxl,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: FontSize.md,
    color: Colors.light.textSecondary,
  },
})
