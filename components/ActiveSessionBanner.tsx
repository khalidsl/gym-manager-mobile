import React, { useEffect, useState } from 'react'
import { View, Text, StyleSheet, Animated } from 'react-native'
import { MaterialIcons } from '@expo/vector-icons'
import { Spacing, FontSize, BorderRadius } from '../constants/Colors'

interface ActiveSessionBannerProps {
  startTime: string
}

export const ActiveSessionBanner: React.FC<ActiveSessionBannerProps> = ({ startTime }) => {
  const [elapsedTime, setElapsedTime] = useState('')
  const pulseAnim = new Animated.Value(1)

  // Effet de pulsation pour l'icône "Live"
  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, { toValue: 1.2, duration: 1000, useNativeDriver: true }),
        Animated.timing(pulseAnim, { toValue: 1, duration: 1000, useNativeDriver: true }),
      ])
    ).start()
  }, [])

  // Calcul de la durée écoulée
  useEffect(() => {
    const calculateElapsed = () => {
      const start = new Date(startTime).getTime()
      const now = new Date().getTime()
      const diffInMinutes = Math.floor((now - start) / 60000)
      
      if (diffInMinutes < 60) {
        setElapsedTime(`${diffInMinutes} min`)
      } else {
        const hours = Math.floor(diffInMinutes / 60)
        const mins = diffInMinutes % 60
        setElapsedTime(`${hours}h ${mins > 0 ? `${mins}m` : ''}`)
      }
    }

    calculateElapsed()
    const timer = setInterval(calculateElapsed, 60000) // Update chaque minute
    return () => clearInterval(timer)
  }, [startTime])

  return (
    <View style={styles.bannerContainer}>
      <View style={styles.content}>
        <View style={styles.leftSection}>
          <Animated.View style={{ transform: [{ scale: pulseAnim }] }}>
            <MaterialIcons name="fiber-manual-record" size={16} color="#EF4444" />
          </Animated.View>
          <View>
            <Text style={styles.title}>Entraînement en cours</Text>
            <Text style={styles.subtitle}>Depuis {new Date(startTime).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}</Text>
          </View>
        </View>

        <View style={styles.timerBadge}>
          <Text style={styles.timerText}>{elapsedTime}</Text>
        </View>
      </View>
      
      {/* Barre de progression décorative */}
      <View style={styles.progressBarBackground}>
        <View style={styles.progressBarFill} />
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  bannerContainer: {
    backgroundColor: '#FFF',
    borderRadius: BorderRadius.xl,
    padding: Spacing.md,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    shadowColor: '#6C63FF',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 4,
    overflow: 'hidden',
  },
  content: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.sm,
  },
  leftSection: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
  },
  title: {
    fontSize: FontSize.md,
    fontWeight: '800',
    color: '#1E293B',
  },
  subtitle: {
    fontSize: 11,
    color: '#64748B',
    fontWeight: '600',
  },
  timerBadge: {
    backgroundColor: '#EEF2FF',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    borderColor: '#C7D2FE',
  },
  timerText: {
    fontSize: FontSize.md,
    fontWeight: '700',
    color: '#6C63FF',
  },
  progressBarBackground: {
    height: 4,
    backgroundColor: '#F1F5F9',
    borderRadius: 2,
    marginTop: Spacing.xs,
  },
  progressBarFill: {
    height: '100%',
    width: '30%', // On pourrait lier ça à un objectif de durée
    backgroundColor: '#6C63FF',
    borderRadius: 2,
  }
})