import React from 'react'
import { View, Text, StyleSheet } from 'react-native'
import { MaterialIcons } from '@expo/vector-icons'
import { Spacing, FontSize, BorderRadius } from '../constants/Colors'

interface StatusCardProps {
  icon: keyof typeof MaterialIcons.glyphMap
  value: string | number
  label: string
  color: string
  backgroundColor: string
}

export const StatusCard: React.FC<StatusCardProps> = ({
  icon,
  value,
  label,
  color,
  backgroundColor
}) => {
  return (
    <View style={styles.container}>
      {/* Cercle d'icône stylisé */}
      <View style={[styles.iconCircle, { backgroundColor }]}>
        <MaterialIcons name={icon} size={22} color={color} />
      </View>
      
      <View style={styles.content}>
        <Text style={styles.statusValue}>{value}</Text>
        <Text style={styles.statusLabel}>{label}</Text>
      </View>
      
      {/* Indicateur visuel discret */}
      <View style={[styles.indicator, { backgroundColor: color }]} />
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF',
    padding: Spacing.md,
    borderRadius: BorderRadius.xl,
    gap: Spacing.md,
    // Ombre subtile pour le relief
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
    position: 'relative',
    overflow: 'hidden',
  },
  iconCircle: {
    width: 44,
    height: 44,
    borderRadius: 12, // Carré arrondi pour un look moderne
    alignItems: 'center',
    justifyContent: 'center',
  },
  content: {
    flex: 1,
    justifyContent: 'center',
  },
  statusValue: {
    fontSize: FontSize.lg,
    fontWeight: '800',
    color: '#1E293B',
    lineHeight: FontSize.lg,
  },
  statusLabel: {
    fontSize: 10,
    color: '#94A3B8',
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginTop: 2,
  },
  indicator: {
    position: 'absolute',
    right: 0,
    top: '30%',
    bottom: '30%',
    width: 3,
    borderTopLeftRadius: 4,
    borderBottomLeftRadius: 4,
    opacity: 0.6,
  },
})