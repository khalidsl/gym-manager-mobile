import React from 'react'
import { View, Text, StyleSheet } from 'react-native'
import { MaterialIcons } from '@expo/vector-icons'
import { Spacing, FontSize, BorderRadius } from '../constants/Colors'

interface ActivityTypeCardProps {
  icon: keyof typeof MaterialIcons.glyphMap
  label: string
  value: number
  color: string
  backgroundColor: string
}

export const ActivityTypeCard: React.FC<ActivityTypeCardProps> = ({
  icon,
  label,
  value,
  color,
  backgroundColor
}) => {
  return (
    <View style={[styles.activityCard, { backgroundColor }]}>
      <View style={styles.iconContainer}>
        <MaterialIcons name={icon} size={28} color={color} />
      </View>
      
      <View style={styles.textContainer}>
        <Text style={styles.activityValue}>{value}</Text>
        <Text style={styles.activityLabel}>{label}</Text>
      </View>
      
      <Text style={[styles.unit, { color }]}>séances</Text>
    </View>
  )
}

const styles = StyleSheet.create({
  activityCard: {
    flex: 1,
    borderRadius: BorderRadius.xl, // Plus arrondi pour matcher le Dashboard
    padding: Spacing.md,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 120,
    // Petite bordure subtile pour définir la forme sur fond clair
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.03)',
  },
  iconContainer: {
    marginBottom: Spacing.sm,
  },
  textContainer: {
    alignItems: 'center',
  },
  activityValue: {
    fontSize: FontSize.xl,
    fontWeight: '900',
    color: '#1E293B',
    lineHeight: FontSize.xl,
  },
  activityLabel: {
    fontSize: 10,
    color: '#64748B',
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  unit: {
    fontSize: 9,
    fontWeight: '600',
    marginTop: 2,
    opacity: 0.8,
  },
})