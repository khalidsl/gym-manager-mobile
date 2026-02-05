import React, { useEffect } from 'react'
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Alert,
} from 'react-native'
import QRCode from 'react-native-qrcode-svg'
import { Card } from '../components/Card'
import { Button } from '../components/Button'
import { Colors, Spacing, FontSize, FontWeight } from '../constants/Colors'
import { useAuthStore } from '../store/authStore'
import { useAccessStore } from '../store/accessStore'

export default function ProfileScreen() {
  const { profile, membership, signOut } = useAuthStore()
  const { accessHistory, fetchAccessHistory } = useAccessStore()

  useEffect(() => {
    fetchAccessHistory()
  }, [])

  const handleSignOut = () => {
    Alert.alert(
      'Déconnexion',
      'Êtes-vous sûr de vouloir vous déconnecter ?',
      [
        { text: 'Annuler', style: 'cancel' },
        {
          text: 'Déconnexion',
          style: 'destructive',
          onPress: async () => {
            try {
              await signOut()
            } catch (error: any) {
              Alert.alert('Erreur', error.message)
            }
          },
        },
      ]
    )
  }

  const getMembershipColor = (type: string) => {
    switch (type) {
      case 'vip':
        return '#FFD700'
      case 'premium':
        return Colors.light.secondary
      default:
        return Colors.light.primary
    }
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {/* QR Code Card */}
      <Card style={styles.qrCard}>
        <Text style={styles.qrTitle}>Mon QR Code</Text>
        <Text style={styles.qrSubtitle}>À scanner à l'entrée/sortie</Text>
        
        {profile?.qr_code && (
          <View style={styles.qrCodeContainer}>
            <QRCode
              value={profile.qr_code}
              size={200}
              backgroundColor="white"
              color={Colors.light.primary}
            />
          </View>
        )}
        
        <Text style={styles.qrCode}>{profile?.qr_code}</Text>
      </Card>

      {/* Profile Info Card */}
      <Card style={styles.infoCard}>
        <Text style={styles.sectionTitle}>Informations</Text>
        
        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>Nom</Text>
          <Text style={styles.infoValue}>{profile?.full_name}</Text>
        </View>
        
        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>Email</Text>
          <Text style={styles.infoValue}>{profile?.email}</Text>
        </View>
        
        {profile?.phone && (
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Téléphone</Text>
            <Text style={styles.infoValue}>{profile.phone}</Text>
          </View>
        )}
      </Card>

      {/* Membership Card */}
      <Card style={styles.membershipCard}>
        <Text style={styles.sectionTitle}>Abonnement</Text>
        
        <View style={[
          styles.membershipBadge,
          { backgroundColor: getMembershipColor(membership?.type || 'basic') }
        ]}>
          <Text style={styles.membershipType}>
            {membership?.type?.toUpperCase() || 'BASIC'}
          </Text>
        </View>
        
        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>Statut</Text>
          <Text style={[
            styles.infoValue,
            { color: membership?.status === 'active' ? Colors.light.success : Colors.light.error }
          ]}>
            {membership?.status === 'active' ? 'Actif' : 'Expiré'}
          </Text>
        </View>
        
        {membership && (
          <>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Début</Text>
              <Text style={styles.infoValue}>
                {new Date(membership.start_date).toLocaleDateString('fr-FR')}
              </Text>
            </View>
            
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Expiration</Text>
              <Text style={styles.infoValue}>
                {new Date(membership.end_date).toLocaleDateString('fr-FR')}
              </Text>
            </View>
          </>
        )}
      </Card>

      {/* Recent Access History */}
      <Card style={styles.historyCard}>
        <Text style={styles.sectionTitle}>Historique récent</Text>
        
        {accessHistory.slice(0, 5).map((log) => (
          <View key={log.id} style={styles.historyItem}>
            <View style={[
              styles.historyDot,
              { backgroundColor: log.type === 'entry' ? Colors.light.success : Colors.light.error }
            ]} />
            <View style={styles.historyInfo}>
              <Text style={styles.historyType}>
                {log.type === 'entry' ? 'Entrée' : 'Sortie'}
              </Text>
              <Text style={styles.historyTime}>
                {new Date(log.timestamp).toLocaleString('fr-FR')}
              </Text>
            </View>
          </View>
        ))}
        
        {accessHistory.length === 0 && (
          <Text style={styles.emptyText}>Aucun historique disponible</Text>
        )}
      </Card>

      {/* Sign Out Button */}
      <Button
        title="Se déconnecter"
        onPress={handleSignOut}
        variant="outline"
        fullWidth
        style={styles.signOutButton}
      />
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
  qrCard: {
    alignItems: 'center',
    marginBottom: Spacing.lg,
  },
  qrTitle: {
    fontSize: FontSize.xl,
    fontWeight: FontWeight.bold,
    color: Colors.light.text,
    marginBottom: Spacing.xs,
  },
  qrSubtitle: {
    fontSize: FontSize.sm,
    color: Colors.light.textSecondary,
    marginBottom: Spacing.lg,
  },
  qrCodeContainer: {
    padding: Spacing.lg,
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    marginBottom: Spacing.md,
  },
  qrCode: {
    fontSize: FontSize.sm,
    color: Colors.light.textSecondary,
    fontFamily: 'monospace',
  },
  infoCard: {
    marginBottom: Spacing.lg,
  },
  sectionTitle: {
    fontSize: FontSize.lg,
    fontWeight: FontWeight.semibold,
    color: Colors.light.text,
    marginBottom: Spacing.md,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: Spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: Colors.light.border,
  },
  infoLabel: {
    fontSize: FontSize.md,
    color: Colors.light.textSecondary,
  },
  infoValue: {
    fontSize: FontSize.md,
    fontWeight: FontWeight.medium,
    color: Colors.light.text,
  },
  membershipCard: {
    marginBottom: Spacing.lg,
  },
  membershipBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.sm,
    borderRadius: 8,
    marginBottom: Spacing.md,
  },
  membershipType: {
    fontSize: FontSize.lg,
    fontWeight: FontWeight.bold,
    color: '#FFFFFF',
  },
  historyCard: {
    marginBottom: Spacing.lg,
  },
  historyItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: Spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: Colors.light.border,
  },
  historyDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginRight: Spacing.md,
  },
  historyInfo: {
    flex: 1,
  },
  historyType: {
    fontSize: FontSize.md,
    fontWeight: FontWeight.medium,
    color: Colors.light.text,
  },
  historyTime: {
    fontSize: FontSize.sm,
    color: Colors.light.textSecondary,
    marginTop: 2,
  },
  emptyText: {
    fontSize: FontSize.sm,
    color: Colors.light.textSecondary,
    textAlign: 'center',
    paddingVertical: Spacing.lg,
  },
  signOutButton: {
    marginBottom: Spacing.xl,
  },
})
