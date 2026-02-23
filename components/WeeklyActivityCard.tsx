import React from 'react'
import { View, Text, StyleSheet, Dimensions } from 'react-native'
import { MaterialIcons } from '@expo/vector-icons'
import { LinearGradient } from 'expo-linear-gradient'
import { Spacing, FontSize, BorderRadius } from '../constants/Colors'

interface WeeklyActivityCardProps {
  sessions: number
  calories: number
  minutes: number
  sets: number
  activityData: Array<{ day: string; value: number; sessions: number }>
}

export const WeeklyActivityCard: React.FC<WeeklyActivityCardProps> = ({
  sessions,
  calories,
  minutes,
  sets,
  activityData
}) => {
  const maxActivity = Math.max(...activityData.map(d => d.value), 1)
  const chartHeight = 100

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View>
          <Text style={styles.title}>Activité</Text>
          <Text style={styles.subtitle}>Cumul des 7 derniers jours</Text>
        </View>
        <View style={styles.sessionBadge}>
          <Text style={styles.sessionCount}>{sessions}</Text>
          <Text style={styles.sessionLabel}>SÉANCES</Text>
        </View>
      </View>

      {/* Graphique */}
      <View style={styles.chartArea}>
        {activityData.map((item, index) => {
          const barHeight = (item.value / maxActivity) * chartHeight
          const isActive = item.value > 0

          return (
            <View key={index} style={styles.barContainer}>
              <View style={styles.barBackground}>
                <LinearGradient
                  colors={isActive ? ['#6C63FF', '#8B5CF6'] : ['#F1F5F9', '#F1F5F9']}
                  style={[styles.barFill, { height: Math.max(barHeight, isActive ? 8 : 4) }]}
                />
              </View>
              <Text style={[styles.dayLabel, isActive && styles.dayLabelActive]}>
                {String(item.day)}
              </Text>
            </View>
          )
        })}
      </View>

      {/* Metrics */}
      <View style={styles.metricsRow}>
        <MetricItem 
          icon="local-fire-department" 
          value={calories} 
          label="kcal" 
          color="#FF6B6B" 
        />
        <View style={styles.divider} />
        <MetricItem 
          icon="schedule" 
          value={minutes} 
          label="min" 
          color="#6C63FF" 
        />
        <View style={styles.divider} />
        <MetricItem 
          icon="fitness-center" 
          value={sets} 
          label="séries" 
          color="#10B981" 
        />
      </View>
    </View>
  )
}

// Petit sous-composant interne pour la lisibilité
const MetricItem = ({ icon, value, label, color }: any) => (
  <View style={styles.metric}>
    <View style={[styles.iconCircle, { backgroundColor: `${color}15` }]}>
      <MaterialIcons name={icon} size={16} color={color} />
    </View>
    <View>
      <Text style={styles.metricValue}>{value}</Text>
      <Text style={styles.metricLabel}>{label}</Text>
    </View>
  </View>
)

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#FFF',
    borderRadius: BorderRadius.xl,
    padding: Spacing.lg,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 12,
    elevation: 3,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.xl,
  },
  title: {
    fontSize: FontSize.lg,
    fontWeight: '800',
    color: '#1E293B',
  },
  subtitle: {
    fontSize: FontSize.xs,
    color: '#94A3B8',
    fontWeight: '600',
  },
  sessionBadge: {
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    borderColor: '#F1F5F9',
  },
  sessionCount: {
    fontSize: FontSize.lg,
    fontWeight: '800',
    color: '#6C63FF',
  },
  sessionLabel: {
    fontSize: 8,
    fontWeight: '700',
    color: '#94A3B8',
  },
  chartArea: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    height: 130,
    marginBottom: Spacing.lg,
  },
  barContainer: {
    alignItems: 'center',
    flex: 1,
  },
  barBackground: {
    width: 12,
    height: 100,
    backgroundColor: '#F8FAFC',
    borderRadius: 6,
    justifyContent: 'flex-end',
    overflow: 'hidden',
  },
  barFill: {
    width: '100%',
    borderRadius: 6,
  },
  dayLabel: {
    fontSize: 10,
    color: '#94A3B8',
    marginTop: 8,
    fontWeight: '700',
  },
  dayLabelActive: {
    color: '#1E293B',
  },
  metricsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: Spacing.lg,
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
  },
  metric: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  iconCircle: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  metricValue: {
    fontSize: FontSize.md,
    fontWeight: '800',
    color: '#1E293B',
  },
  metricLabel: {
    fontSize: 10,
    color: '#94A3B8',
    fontWeight: '600',
  },
  divider: {
    width: 1,
    height: 20,
    backgroundColor: '#F1F5F9',
  }
})