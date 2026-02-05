import React from 'react'
import { View, Text, StyleSheet, ScrollView } from 'react-native'
import { Card } from '../components/Card'
import { Colors, Spacing, FontSize, FontWeight } from '../constants/Colors'

export default function ScheduleScreen() {
  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Card style={styles.comingSoonCard}>
        <Text style={styles.comingSoonTitle}>Planning des cours</Text>
        <Text style={styles.comingSoonText}>
          Cette fonctionnalité sera bientôt disponible
        </Text>
        <Text style={styles.description}>
          Vous pourrez ici consulter le planning des cours collectifs et réserver vos sessions avec les coachs.
        </Text>
      </Card>
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
  comingSoonCard: {
    alignItems: 'center',
    padding: Spacing.xl,
  },
  comingSoonTitle: {
    fontSize: FontSize.xl,
    fontWeight: FontWeight.bold,
    color: Colors.light.text,
    marginBottom: Spacing.md,
  },
  comingSoonText: {
    fontSize: FontSize.md,
    color: Colors.light.primary,
    marginBottom: Spacing.md,
  },
  description: {
    fontSize: FontSize.sm,
    color: Colors.light.textSecondary,
    textAlign: 'center',
  },
})
