import React from 'react'
import { View, Text, StyleSheet, ImageBackground } from 'react-native'
import { MaterialIcons } from '@expo/vector-icons'
import { LinearGradient } from 'expo-linear-gradient'
import { Spacing, FontSize, BorderRadius } from '../constants/Colors'

interface MembershipCardProps {
  type: 'basic' | 'premium' | 'vip'
  status: 'active' | 'expired' | 'suspended'
  endDate: string
}

export const MembershipCard: React.FC<MembershipCardProps> = ({
  type,
  status,
  endDate
}) => {
  // Configuration visuelle selon le type
  const cardConfig = {
    vip: {
      colors: ['#F59E0B', '#B45309'] as const,
      icon: 'stars',
      label: 'Membre VIP'
    },
    premium: {
      colors: ['#8B5CF6', '#4C51BF'] as const,
      icon: 'workspace-premium',
      label: 'Membre Premium'
    },
    basic: {
      colors: ['#64748B', '#1E293B'] as const,
      icon: 'fitness-center',
      label: 'Membre Standard'
    }
  }

  const config = cardConfig[type] || cardConfig.basic

  return (
    <LinearGradient 
      colors={config.colors} 
      start={{ x: 0, y: 0 }} 
      end={{ x: 1, y: 1 }} 
      style={styles.card}
    >
      {/* Éléments décoratifs en arrière-plan */}
      <View style={styles.circleDecorator} />
      
      <View style={styles.header}>
        <View style={styles.typeContainer}>
          <MaterialIcons name={config.icon as any} size={20} color="#FFF" />
          <Text style={styles.typeText}>{config.label}</Text>
        </View>
        <View style={[
          styles.statusBadge, 
          { backgroundColor: status === 'active' ? 'rgba(16, 185, 129, 0.2)' : 'rgba(239, 68, 68, 0.2)' }
        ]}>
          <View style={[
            styles.statusDot, 
            { backgroundColor: status === 'active' ? '#10B981' : '#EF4444' }
          ]} />
          <Text style={styles.statusText}>
            {status === 'active' ? 'ACTIF' : 'INACTIF'}
          </Text>
        </View>
      </View>

      <View style={styles.footer}>
        <View>
          <Text style={styles.label}>VALIDE JUSQU'AU</Text>
          <Text style={styles.date}>
            {new Date(endDate).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })}
          </Text>
        </View>
        <MaterialIcons name="qr-code-2" size={40} color="rgba(255,255,255,0.8)" />
      </View>
    </LinearGradient>
  )
}

const styles = StyleSheet.create({
  card: {
    borderRadius: BorderRadius.xl,
    padding: Spacing.lg,
    height: 160,
    justifyContent: 'space-between',
    overflow: 'hidden',
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.2,
    shadowRadius: 15,
  },
  circleDecorator: {
    position: 'absolute',
    right: -20,
    top: -20,
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: 'rgba(255,255,255,0.1)',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  typeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  typeText: {
    color: '#FFF',
    fontSize: FontSize.md,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: BorderRadius.full,
    gap: 6,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  statusText: {
    color: '#FFF',
    fontSize: 10,
    fontWeight: '800',
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
  },
  label: {
    color: 'rgba(255,255,255,0.6)',
    fontSize: 9,
    fontWeight: '700',
    letterSpacing: 1,
    marginBottom: 4,
  },
  date: {
    color: '#FFF',
    fontSize: FontSize.md,
    fontWeight: '700',
  },
})