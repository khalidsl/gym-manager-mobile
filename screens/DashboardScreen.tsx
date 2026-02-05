import React, { useEffect } from 'react'
import { View, Text, StyleSheet, ScrollView, RefreshControl } from 'react-native'
import { Card } from '../components/Card'
import { Colors, Spacing, FontSize, FontWeight } from '../constants/Colors'
import { useAuthStore } from '../store/authStore'
import { useAccessStore } from '../store/accessStore'
import { useMachinesStore } from '../store/machinesStore'

export default function DashboardScreen() {
  const { profile, membership } = useAuthStore()
  const { currentVisitors, isInGym, fetchCurrentVisitors, checkIfInGym } = useAccessStore()
  const { activeSession, fetchActiveSession, machines, fetchMachines } = useMachinesStore()
  
  const [refreshing, setRefreshing] = React.useState(false)

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    try {
      await Promise.all([
        fetchCurrentVisitors(),
        checkIfInGym(),
        fetchActiveSession(),
        fetchMachines(),
      ])
    } catch (error) {
      console.error('Load Dashboard Data Error:', error)
    }
  }

  const onRefresh = async () => {
    setRefreshing(true)
    await loadData()
    setRefreshing(false)
  }

  const availableMachines = machines.filter(m => m.status === 'available').length
  const inUseMachines = machines.filter(m => m.status === 'in_use').length

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
      }
    >
      <View style={styles.header}>
        <Text style={styles.greeting}>Bonjour,</Text>
        <Text style={styles.name}>{profile?.full_name || 'Membre'}</Text>
      </View>

      <Card style={styles.membershipCard}>
        <Text style={styles.cardTitle}>Votre Abonnement</Text>
        <View style={styles.membershipInfo}>
          <View style={styles.membershipBadge}>
            <Text style={styles.membershipType}>
              {membership?.type?.toUpperCase() || 'BASIC'}
            </Text>
          </View>
          <View style={styles.membershipDetails}>
            <Text style={styles.membershipLabel}>Statut</Text>
            <Text style={[
              styles.membershipStatus,
              { color: membership?.status === 'active' ? Colors.light.success : Colors.light.error }
            ]}>
              {membership?.status === 'active' ? 'Actif' : 'Expiré'}
            </Text>
          </View>
        </View>
        {membership && (
          <Text style={styles.membershipExpiry}>
            Expire le {new Date(membership.end_date).toLocaleDateString('fr-FR')}
          </Text>
        )}
      </Card>

      <View style={styles.statsRow}>
        <Card style={styles.statCard}>
          <Text style={styles.statValue}>{currentVisitors.length}</Text>
          <Text style={styles.statLabel}>Visiteurs actuels</Text>
        </Card>

        <Card style={styles.statCard}>
          <Text style={[
            styles.statValue,
            { color: isInGym ? Colors.light.success : Colors.light.textSecondary }
          ]}>
            {isInGym ? 'Présent' : 'Absent'}
          </Text>
          <Text style={styles.statLabel}>Votre statut</Text>
        </Card>
      </View>

      <View style={styles.statsRow}>
        <Card style={styles.statCard}>
          <Text style={styles.statValue}>{availableMachines}</Text>
          <Text style={styles.statLabel}>Machines libres</Text>
        </Card>

        <Card style={styles.statCard}>
          <Text style={styles.statValue}>{inUseMachines}</Text>
          <Text style={styles.statLabel}>En utilisation</Text>
        </Card>
      </View>

      {activeSession && (
        <Card style={styles.activeSessionCard}>
          <Text style={styles.cardTitle}>Session Active</Text>
          <Text style={styles.sessionText}>
            Vous êtes actuellement sur une machine
          </Text>
          <Text style={styles.sessionTime}>
            Depuis {new Date(activeSession.start_time).toLocaleTimeString('fr-FR')}
          </Text>
        </Card>
      )}
    </ScrollView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.light.background,
  },
  content: {
    padding: Spacing.lg,
  },
  header: {
    marginBottom: Spacing.xl,
  },
  greeting: {
    fontSize: FontSize.lg,
    color: Colors.light.textSecondary,
  },
  name: {
    fontSize: FontSize.xxl,
    fontWeight: FontWeight.bold,
    color: Colors.light.text,
  },
  membershipCard: {
    marginBottom: Spacing.lg,
  },
  cardTitle: {
    fontSize: FontSize.lg,
    fontWeight: FontWeight.semibold,
    color: Colors.light.text,
    marginBottom: Spacing.md,
  },
  membershipInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.sm,
  },
  membershipBadge: {
    backgroundColor: Colors.light.primary,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: 8,
    marginRight: Spacing.md,
  },
  membershipType: {
    color: '#f5f5f5',
    fontSize: FontSize.md,
    fontWeight: FontWeight.bold,
  },
  membershipDetails: {
    flex: 1,
  },
  membershipLabel: {
    fontSize: FontSize.sm,
    color: Colors.light.textSecondary,
  },
  membershipStatus: {
    fontSize: FontSize.md,
    fontWeight: FontWeight.semibold,
  },
  membershipExpiry: {
    fontSize: FontSize.sm,
    color: Colors.light.textSecondary,
    marginTop: Spacing.sm,
  },
  statsRow: {
    flexDirection: 'row',
    marginBottom: Spacing.lg,
    gap: Spacing.md,
  },
  statCard: {
    flex: 1,
    alignItems: 'center',
  },
  statValue: {
    fontSize: FontSize.xxl,
    fontWeight: FontWeight.bold,
    color: Colors.light.primary,
    marginBottom: Spacing.xs,
  },
  statLabel: {
    fontSize: FontSize.sm,
    color: Colors.light.textSecondary,
    textAlign: 'center',
  },
  activeSessionCard: {
    backgroundColor: Colors.light.accent + '20',
    borderColor: Colors.light.accent,
    borderWidth: 1,
  },
  sessionText: {
    fontSize: FontSize.md,
    color: Colors.light.text,
    marginBottom: Spacing.xs,
  },
  sessionTime: {
    fontSize: FontSize.sm,
    color: Colors.light.textSecondary,
  },
})
