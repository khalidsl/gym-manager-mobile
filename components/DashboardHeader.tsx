import React from 'react'
import { View, Text, StyleSheet, Platform } from 'react-native'
import { Spacing, FontSize, BorderRadius } from '../constants/Colors'

interface DashboardHeaderProps {
  userName: string
  membershipType: string // On reste flexible sur le type pour l'affichage
}

export const DashboardHeader: React.FC<DashboardHeaderProps> = ({
  userName,
  membershipType
}) => {
  
  // Petit helper pour dynamiser la couleur du badge
  const getBadgeColor = () => {
    switch (membershipType.toLowerCase()) {
      case 'vip': return '#F59E0B'; // Or / Ambre
      case 'premium': return '#0EA5E9'; // Bleu ciel
      default: return '#6C63FF'; // Violet standard
    }
  }

  return (
    <View style={styles.headerContainer}>
      <View style={styles.content}>
        <View>
          <Text style={styles.greeting}>Tableau de bord</Text>
          <Text style={styles.name}>{userName}</Text>
        </View>
        
        <View style={[styles.badge, { backgroundColor: getBadgeColor() }]}>
          <Text style={styles.badgeText}>
            {membershipType.toUpperCase()}
          </Text>
        </View>
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  headerContainer: {
    // Si vous l'utilisez sur une ImageBackground, on retire le fond sombre
    paddingTop: Platform.OS === 'ios' ? 20 : 10, // Ajustement léger pour le notch
    marginBottom: Spacing.sm,
  },
  content: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end', // Alignement sur la ligne de base du nom
  },
  greeting: {
    fontSize: FontSize.sm,
    color: '#64748B',
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: 2,
  },
  name: {
    fontSize: FontSize.xxl,
    fontWeight: '800',
    color: '#1E293B', // On utilise un gris très foncé pour la lisibilité
  },
  badge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: BorderRadius.full, // Badge plus arrondi pour un look moderne
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  badgeText: {
    color: '#FFF',
    fontSize: 10,
    fontWeight: '900',
  },
})